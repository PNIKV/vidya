#include "IMUSensor.h"

IMUSensor::IMUSensor() 
  : _activeAddress(MPU_ADDR_PRIMARY), 
    _activeSDA(I2C_SDA_PIN),
    _activeSCL(I2C_SCL_PIN),
    _whoAmI(0x00), 
    _smState(SM_BOOTING),
    _chipName("Unknown"), 
    _calibrated(false),
    _simulationMode(false) {}

void IMUSensor::setSimulationMode(bool sim) {
  _simulationMode = sim;
  if (sim) {
    _smState = SM_SIMULATION_ACTIVE;
  } else if (_whoAmI != 0x00) {
    _smState = SM_HARDWARE_OK;
  }
}

const char* IMUSensor::getDiagnosticMessage() const {
  switch (_smState) {
    case SM_HARDWARE_OK:
      return "IMU Hardware Connected & Communication OK.";
    case SM_FAULT_NO_ACK:
      return "BUG DETECTED: 0 ACK devices on I2C bus. Sensor in SPI mode or unpowered.";
    case SM_FAULT_WRONG_WHOAMI:
      return "BUG DETECTED: Device ACKed on I2C, but WHO_AM_I check failed (read 0x00).";
    case SM_SIMULATION_ACTIVE:
      return "Diagnostic Simulation Mode active for Dashboard testing.";
    default:
      return "System booting / initializing I2C bus...";
  }
}

const char* IMUSensor::getDiagnosticInstructions() const {
  switch (_smState) {
    case SM_FAULT_NO_ACK:
      return "1. Connect GY-6500/9250 CS/NCS pin to 3.3V (forces I2C mode!). 2. Verify VCC is connected to 3.3V and GND is secure. 3. Click 'Scan I2C Pins'.";
    case SM_FAULT_WRONG_WHOAMI:
      return "1. Check SDA and SCL jumper wires for loose connection. 2. Ensure AD0 pin is connected to GND (0x68) or 3.3V (0x69). 3. Click 'Reset Bus'.";
    case SM_SIMULATION_ACTIVE:
      return "Connect physical sensor wires according to Wiring Guide, then click 'Switch to Hardware Mode'.";
    default:
      return "All systems operational.";
  }
}

void IMUSensor::recoverI2CBus(uint8_t sdaPin, uint8_t sclPin) {
  // Feed Task Watchdog Timer
  yield();

  // Drive CS pin HIGH to force I2C mode on GY-6500 / GY-9250 modules
  pinMode(MPU_CS_PIN, OUTPUT);
  digitalWrite(MPU_CS_PIN, HIGH);

  // If testing pins happen to include CS pin, bypass GPIO toggling for that pin
  if (sdaPin == MPU_CS_PIN || sclPin == MPU_CS_PIN) return;

  // Drive SCL high/low 9 times to release any slave holding SDA LOW
  pinMode(sdaPin, INPUT_PULLUP);
  pinMode(sclPin, OUTPUT);
  
  for (int i = 0; i < 10; i++) {
    digitalWrite(sclPin, LOW);
    delayMicroseconds(10);
    digitalWrite(sclPin, HIGH);
    delayMicroseconds(10);
  }

  // Generate I2C STOP condition
  pinMode(sdaPin, OUTPUT);
  digitalWrite(sdaPin, LOW);
  delayMicroseconds(10);
  digitalWrite(sclPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(sdaPin, HIGH);
  delayMicroseconds(10);

  // Restore GPIO pins for Hardware Wire driver
  pinMode(sdaPin, INPUT_PULLUP);
  pinMode(sclPin, INPUT_PULLUP);
}

uint8_t IMUSensor::scanI2CBus() {
  Serial.print("{\"status\":\"scan_start\",\"message\":\"Scanning I2C bus on SDA=");
  Serial.print(_activeSDA);
  Serial.print(", SCL=");
  Serial.print(_activeSCL);
  Serial.println("...\"}");
  
  uint8_t count = 0;
  
  for (uint8_t addr = 0x08; addr <= 0x77; addr++) {
    if (addr % 16 == 0) yield(); // Feed task watchdog timer

    Wire.beginTransmission(addr);
    uint8_t error = Wire.endTransmission();
    
    if (error == 0) {
      count++;
      Serial.print("{\"status\":\"device_found\",\"address\":\"0x");
      if (addr < 16) Serial.print("0");
      Serial.print(addr, HEX);
      Serial.println("\"}");
    }
  }
  
  Serial.print("{\"status\":\"scan_complete\",\"count\":");
  Serial.print(count);
  Serial.print(",\"sda\":"); Serial.print(_activeSDA);
  Serial.print(",\"scl\":"); Serial.print(_activeSCL);
  Serial.println("}");
  
  return count;
}

bool IMUSensor::scanAllPinPairs() {
  Serial.println("{\"status\":\"pin_scan_start\",\"message\":\"Starting multi-pin auto-scan across safe ESP32 SDA/SCL pairs...\"}");

  for (uint8_t i = 0; i < NUM_CANDIDATE_PIN_PAIRS; i++) {
    uint8_t sda = CANDIDATE_I2C_PINS[i].sda;
    uint8_t scl = CANDIDATE_I2C_PINS[i].scl;
    const char* label = CANDIDATE_I2C_PINS[i].label;

    // Feed task watchdog and pause briefly
    yield();
    delay(10);

    Serial.print("{\"status\":\"probing_pins\",\"sda\":");
    Serial.print(sda);
    Serial.print(",\"scl\":");
    Serial.print(scl);
    Serial.print(",\"label\":\"");
    Serial.print(label);
    Serial.println("\"}");

    recoverI2CBus(sda, scl);
    Wire.end();
    Wire.begin(sda, scl, I2C_FREQ_INIT);
    Wire.setTimeOut(20); // Short 20ms timeout to prevent WDT lockup

    uint8_t addrs[] = {MPU_ADDR_PRIMARY, MPU_ADDR_SECONDARY};
    for (uint8_t addr : addrs) {
      _activeAddress = addr;
      _activeSDA = sda;
      _activeSCL = scl;

      _whoAmI = readRegister(REG_WHO_AM_I);
      if (_whoAmI != 0x00) {
        Serial.print("{\"status\":\"pin_scan_success\",\"message\":\"IMU ACK Found!\",\"sda\":");
        Serial.print(sda);
        Serial.print(",\"scl\":");
        Serial.print(scl);
        Serial.print(",\"address\":\"0x");
        Serial.print(addr, HEX);
        Serial.print("\",\"who_am_i\":\"0x");
        Serial.print(_whoAmI, HEX);
        Serial.println("\"}");

        return begin();
      }
    }
  }

  _smState = SM_FAULT_NO_ACK;
  Serial.println("{\"status\":\"pin_scan_failed\",\"message\":\"No responsive I2C IMU found on any candidate pin pairs.\"}");
  return false;
}

bool IMUSensor::writeRegister(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(_activeAddress);
  Wire.write(reg);
  Wire.write(value);
  return (Wire.endTransmission() == 0);
}

uint8_t IMUSensor::readRegister(uint8_t reg) {
  Wire.beginTransmission(_activeAddress);
  Wire.write(reg);
  // Send Repeated Start (false) instead of STOP to prevent I2C bus release/failure
  if (Wire.endTransmission(false) != 0) {
    return 0x00;
  }

  uint8_t bytesRead = Wire.requestFrom((int)_activeAddress, 1, (int)true);
  if (bytesRead > 0 && Wire.available()) {
    return Wire.read();
  }
  return 0x00;
}

bool IMUSensor::readRegisters(uint8_t reg, uint8_t *buffer, uint8_t length) {
  Wire.beginTransmission(_activeAddress);
  Wire.write(reg);
  // Send Repeated Start (false) instead of STOP
  if (Wire.endTransmission(false) != 0) {
    return false;
  }

  uint8_t bytesRead = Wire.requestFrom((int)_activeAddress, (int)length, (int)true);
  if (bytesRead == length) {
    for (uint8_t i = 0; i < length; i++) {
      if (Wire.available()) {
        buffer[i] = Wire.read();
      } else {
        return false;
      }
    }
    return true;
  }
  return false;
}

bool IMUSensor::begin() {
  _simulationMode = false;
  yield();

  Serial.print("{\"status\":\"initializing\",\"message\":\"Initializing I2C bus on SDA=");
  Serial.print(_activeSDA);
  Serial.print(", SCL=");
  Serial.print(_activeSCL);
  Serial.println("...\"}");
  
  // Step 1: Bus Recovery & CS pull-up
  recoverI2CBus(_activeSDA, _activeSCL);

  // Step 2: Wire initialization with pull-ups enabled
  Wire.begin(_activeSDA, _activeSCL, I2C_FREQ_INIT);
  Wire.setTimeOut(20);

  // Step 3: Run Bus Scan on active pins
  uint8_t foundCount = scanI2CBus();

  // Step 4: Probing candidate I2C addresses (0x68 and 0x69)
  uint8_t candidateAddresses[] = {MPU_ADDR_PRIMARY, MPU_ADDR_SECONDARY};
  bool sensorFound = false;

  for (uint8_t addr : candidateAddresses) {
    _activeAddress = addr;
    _whoAmI = readRegister(REG_WHO_AM_I);

    Serial.print("{\"status\":\"info\",\"message\":\"Probing address 0x");
    Serial.print(addr, HEX);
    Serial.print(" WHO_AM_I: 0x");
    Serial.print(_whoAmI, HEX);
    Serial.println("\"}");

    if (_whoAmI != 0x00) {
      switch (_whoAmI) {
        case WHO_AM_I_MPU6500:
          _chipName = "MPU6500";
          sensorFound = true;
          break;
        case WHO_AM_I_MPU9250:
          _chipName = "MPU9250";
          sensorFound = true;
          break;
        case WHO_AM_I_MPU6050:
          _chipName = "MPU6050";
          sensorFound = true;
          break;
        case WHO_AM_I_ICM20602:
          _chipName = "ICM20602";
          sensorFound = true;
          break;
        case WHO_AM_I_ICM20689:
          _chipName = "ICM20689";
          sensorFound = true;
          break;
        default:
          _chipName = "Generic MPU/ICM";
          sensorFound = true;
          break;
      }

      if (sensorFound) break;
    }
  }

  if (!sensorFound) {
    if (foundCount == 0) {
      _smState = SM_FAULT_NO_ACK;
      Serial.println("{\"status\":\"warning\",\"message\":\"0 devices found on current SDA/SCL. Running auto-pin pair scanner...\"}");
    } else {
      _smState = SM_FAULT_WRONG_WHOAMI;
      Serial.println("{\"status\":\"warning\",\"message\":\"I2C ACK received, but WHO_AM_I returned 0x00.\"}");
    }
    return false;
  }

  _smState = SM_HARDWARE_OK;

  // Switch I2C to Operational Fast Mode (400kHz)
  Wire.setClock(I2C_FREQ_FAST);

  Serial.print("{\"status\":\"success\",\"message\":\"IMU Hardware Detected: ");
  Serial.print(_chipName);
  Serial.print(" at address 0x");
  Serial.print(_activeAddress, HEX);
  Serial.print(" (SDA=");
  Serial.print(_activeSDA);
  Serial.print(", SCL=");
  Serial.print(_activeSCL);
  Serial.print(", WHO_AM_I: 0x");
  Serial.print(_whoAmI, HEX);
  Serial.println(")\"}");

  return configureSensor();
}

bool IMUSensor::configureSensor() {
  if (!writeRegister(REG_PWR_MGMT_1, 0x80)) {
    delay(100);
  }
  delay(50);

  if (!writeRegister(REG_PWR_MGMT_1, 0x01)) return false;
  delay(10);

  if (!writeRegister(REG_GYRO_CONFIG, 0x08)) return false;
  if (!writeRegister(REG_ACCEL_CONFIG, 0x00)) return false;
  writeRegister(REG_CONFIG, 0x03);

  delay(20);
  return true;
}

void IMUSensor::performCalibration() {
  if (_simulationMode) {
    _offsets = {0, 0, 0, 0, 0, 0};
    _calibrated = true;
    Serial.println("{\"status\":\"ready\",\"message\":\"Simulation mode calibrated (Zero offsets)\"}");
    return;
  }

  Serial.println("{\"status\":\"calibrating\",\"message\":\"Keep IMU stationary on a flat surface...\"}");

  long ax_sum = 0, ay_sum = 0, az_sum = 0;
  long gx_sum = 0, gy_sum = 0, gz_sum = 0;
  const int samples = 200;
  int validSamples = 0;

  for (int i = 0; i < samples; i++) {
    uint8_t buf[14];
    if (readRegisters(REG_ACCEL_XOUT_H, buf, 14)) {
      int16_t ax = (buf[0] << 8) | buf[1];
      int16_t ay = (buf[2] << 8) | buf[3];
      int16_t az = (buf[4] << 8) | buf[5];

      int16_t gx = (buf[8] << 8) | buf[9];
      int16_t gy = (buf[10] << 8) | buf[11];
      int16_t gz = (buf[12] << 8) | buf[13];

      ax_sum += ax;
      ay_sum += ay;
      az_sum += (az - 16384);

      gx_sum += gx;
      gy_sum += gy;
      gz_sum += gz;
      validSamples++;
    }
    delay(5);
  }

  if (validSamples > 50) {
    _offsets.ax = (float)ax_sum / validSamples;
    _offsets.ay = (float)ay_sum / validSamples;
    _offsets.az = (float)az_sum / validSamples;

    _offsets.gx = (float)gx_sum / validSamples;
    _offsets.gy = (float)gy_sum / validSamples;
    _offsets.gz = (float)gz_sum / validSamples;

    _calibrated = true;

    Serial.print("{\"status\":\"ready\",\"message\":\"Hardware Calibration complete\",\"offsets\":{");
    Serial.print("\"ax\":"); Serial.print(_offsets.ax, 1);
    Serial.print(",\"ay\":"); Serial.print(_offsets.ay, 1);
    Serial.print(",\"az\":"); Serial.print(_offsets.az, 1);
    Serial.print(",\"gx\":"); Serial.print(_offsets.gx, 1);
    Serial.print(",\"gy\":"); Serial.print(_offsets.gy, 1);
    Serial.print(",\"gz\":"); Serial.print(_offsets.gz, 1);
    Serial.println("}}");
  } else {
    Serial.println("{\"status\":\"error\",\"message\":\"Calibration failed: insufficient sensor samples\"}");
  }
}

void IMUSensor::generateSimulatedData(IMUData &data) {
  float t = millis() / 1000.0f;

  data.ax = 0.05f * sinf(t * 1.5f);
  data.ay = 0.05f * cosf(t * 1.2f);
  data.az = 1.00f + 0.02f * sinf(t * 0.8f);

  data.gx = 12.0f * sinf(t * 2.0f);
  data.gy = 10.0f * cosf(t * 1.8f);
  data.gz = 15.0f * sinf(t * 1.0f);

  data.temperature = 26.5f + 0.5f * sinf(t * 0.1f);
  data.valid = true;
  data.simulated = true;
}

bool IMUSensor::readSensorData(IMUData &data) {
  if (_simulationMode) {
    generateSimulatedData(data);
    return true;
  }

  uint8_t buf[14];
  if (!readRegisters(REG_ACCEL_XOUT_H, buf, 14)) {
    data.valid = false;
    data.simulated = false;
    return false;
  }

  int16_t raw_ax   = (buf[0] << 8) | buf[1];
  int16_t raw_ay   = (buf[2] << 8) | buf[3];
  int16_t raw_az   = (buf[4] << 8) | buf[5];
  int16_t raw_temp = (buf[6] << 8) | buf[7];
  int16_t raw_gx   = (buf[8] << 8) | buf[9];
  int16_t raw_gy   = (buf[10] << 8) | buf[11];
  int16_t raw_gz   = (buf[12] << 8) | buf[13];

  float cal_ax = raw_ax - _offsets.ax;
  float cal_ay = raw_ay - _offsets.ay;
  float cal_az = raw_az - _offsets.az;

  float cal_gx = raw_gx - _offsets.gx;
  float cal_gy = raw_gy - _offsets.gy;
  float cal_gz = raw_gz - _offsets.gz;

  data.ax = cal_ax / 16384.0f;
  data.ay = cal_ay / 16384.0f;
  data.az = cal_az / 16384.0f;

  data.gx = cal_gx / 65.5f;
  data.gy = cal_gy / 65.5f;
  data.gz = cal_gz / 65.5f;

  data.temperature = (raw_temp / 333.87f) + 21.0f;
  data.valid = true;
  data.simulated = false;

  return true;
}
