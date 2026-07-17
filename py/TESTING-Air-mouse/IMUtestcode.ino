#include <Wire.h>

// MPU6500 I2C Configuration
#define MPU6500_DEFAULT_ADDRESS 0x68
#define MPU6500_ALT_ADDRESS     0x69
#define WHO_AM_I_REG            0x75
#define PWR_MGMT_1_REG          0x6B
#define ACCEL_CONFIG_REG        0x1C
#define GYRO_CONFIG_REG         0x1B
#define ACCEL_XOUT_H_REG        0x3B
#define GYRO_XOUT_H_REG         0x43

// Expected WHO_AM_I value as specified by user
#define EXPECTED_WHO_AM_I       0x70

// Pin Definitions for ESP32 DevKit V1
#define I2C_SDA                 21
#define I2C_SCL                 22

// Global Variables
uint8_t mpuAddress = MPU6500_DEFAULT_ADDRESS;
bool imuInitialized = false;

// Calibration Offsets
float accelOffsetX = 0, accelOffsetY = 0, accelOffsetZ = 0;
float gyroOffsetX = 0, gyroOffsetY = 0, gyroOffsetZ = 0;
bool isCalibrated = false;

// Sensitivity multiplier for future BLE HID mouse mode (can be modified over serial)
float sensitivity = 1.0f;

// Bluetooth HID Stubs (Ready for integration)
bool bleMouseConnected = false;
void initBluetoothHID() {
  // Stub for BLE HID initialization
  // e.g. bleMouse.begin();
}

void sendBluetoothClick(uint8_t button) {
  if (bleMouseConnected) {
    // Stub: bleMouse.click(button);
  }
}

void sendBluetoothMouseMove(int8_t x, int8_t y) {
  if (bleMouseConnected) {
    // Stub: bleMouse.move(x, y);
  }
}

// Write a byte to a register
bool writeRegister(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(mpuAddress);
  Wire.write(reg);
  Wire.write(value);
  return (Wire.endTransmission() == 0);
}

// Read a single byte from a register
uint8_t readRegister(uint8_t reg) {
  Wire.beginTransmission(mpuAddress);
  Wire.write(reg);
  if (Wire.endTransmission() != 0) return 0;
  
  Wire.requestFrom(mpuAddress, (uint8_t)1);
  if (Wire.available()) {
    return Wire.read();
  }
  return 0;
}

// Read multiple bytes
bool readRegisters(uint8_t reg, uint8_t* buffer, uint8_t length) {
  Wire.beginTransmission(mpuAddress);
  Wire.write(reg);
  if (Wire.endTransmission() != 0) return false;
  
  Wire.requestFrom(mpuAddress, length);
  uint8_t i = 0;
  while (Wire.available() && i < length) {
    buffer[i++] = Wire.read();
  }
  return (i == length);
}

// Perform Gyro and Accel Calibration
void performCalibration() {
  Serial.println("{\"status\":\"calibrating\",\"message\":\"Keep sensor flat and still\"}");
  
  long ax_sum = 0, ay_sum = 0, az_sum = 0;
  long gx_sum = 0, gy_sum = 0, gz_sum = 0;
  const int samples = 200;
  int validSamples = 0;
  
  for (int i = 0; i < samples; i++) {
    uint8_t buf[14];
    if (readRegisters(ACCEL_XOUT_H_REG, buf, 14)) {
      int16_t ax = (buf[0] << 8) | buf[1];
      int16_t ay = (buf[2] << 8) | buf[3];
      int16_t az = (buf[4] << 8) | buf[5];
      
      int16_t gx = (buf[8] << 8) | buf[9];
      int16_t gy = (buf[10] << 8) | buf[11];
      int16_t gz = (buf[12] << 8) | buf[13];
      
      ax_sum += ax;
      ay_sum += ay;
      az_sum += (az - 16384); // Assume 1g on Z axis during calibration (16384 LSB/g at +/-2g)
      
      gx_sum += gx;
      gy_sum += gy;
      gz_sum += gz;
      validSamples++;
    }
    delay(5);
  }
  
  if (validSamples > 0) {
    accelOffsetX = (float)ax_sum / validSamples;
    accelOffsetY = (float)ay_sum / validSamples;
    accelOffsetZ = (float)az_sum / validSamples;
    
    gyroOffsetX = (float)gx_sum / validSamples;
    gyroOffsetY = (float)gy_sum / validSamples;
    gyroOffsetZ = (float)gz_sum / validSamples;
    
    isCalibrated = true;
    Serial.print("{\"status\":\"ready\",\"message\":\"Calibration complete\",\"offsets\":{");
    Serial.print("\"ax\":"); Serial.print(accelOffsetX);
    Serial.print(",\"ay\":"); Serial.print(accelOffsetY);
    Serial.print(",\"az\":"); Serial.print(accelOffsetZ);
    Serial.print(",\"gx\":"); Serial.print(gyroOffsetX);
    Serial.print(",\"gy\":"); Serial.print(gyroOffsetY);
    Serial.print(",\"gz\":"); Serial.print(gyroOffsetZ);
    Serial.println("}}");
  } else {
    Serial.println("{\"status\":\"error\",\"message\":\"Calibration failed: no sensor data\"}");
  }
}

// Search and initialize MPU6500
bool initIMU() {
  Wire.begin(I2C_SDA, I2C_SCL, 400000); // 400kHz fast I2C
  
  // Detect Address
  uint8_t addrs[] = {MPU6500_DEFAULT_ADDRESS, MPU6500_ALT_ADDRESS};
  bool found = false;
  for (uint8_t addr : addrs) {
    mpuAddress = addr;
    uint8_t who = readRegister(WHO_AM_I_REG);
    Serial.print("WHO_AM_I = 0x");
    Serial.println(who, HEX);
    if (who != 0) {
      found = true;
      break;
    }
  }
  
  if (!found) {
    // Try forcing one and printing actual WHO_AM_I for debugging
    mpuAddress = MPU6500_DEFAULT_ADDRESS;
    uint8_t who = readRegister(WHO_AM_I_REG);
    Serial.print("{\"status\":\"error\",\"message\":\"IMU WHO_AM_I check failed. Found: 0x");
    Serial.print(who, HEX);
    Serial.print(", Expected: 0x");
    Serial.print(EXPECTED_WHO_AM_I, HEX);
    Serial.println("\"}");
    return false;
  }
  
  // Wake up MPU6500
  writeRegister(PWR_MGMT_1_REG, 0x01); // Clock source Auto Select
  delay(10);
  
  // Configure Gyro Full Scale (+/- 500 deg/s)
  writeRegister(GYRO_CONFIG_REG, 0x08);
  
  // Configure Accel Full Scale (+/- 2g)
  writeRegister(ACCEL_CONFIG_REG, 0x00);
  
  delay(10);
  return true;
}

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 2000);
  
  Serial.println("{\"status\":\"initializing\",\"message\":\"ESP32 Air Mouse booting...\"}");
  
  imuInitialized = initIMU();
  if (imuInitialized) {
    Serial.println("{\"status\":\"ready\",\"message\":\"MPU6500 initialized successfully\"}");
    performCalibration();
  }
  
  initBluetoothHID();
}

void loop() {
  // Check for incoming serial commands
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.equals("calibrate")) {
      performCalibration();
    } else if (input.startsWith("sensitivity:")) {
      float newSensitivity = input.substring(12).toFloat();
      if (newSensitivity > 0.0f) {
        sensitivity = newSensitivity;
        Serial.print("{\"status\":\"config\",\"message\":\"Sensitivity updated\",\"value\":");
        Serial.print(sensitivity);
        Serial.println("}");
      }
    }
  }
  
  if (!imuInitialized) {
    // Retry initialization every 2 seconds
    delay(2000);
    imuInitialized = initIMU();
    return;
  }
  
  uint8_t buf[14];
  if (readRegisters(ACCEL_XOUT_H_REG, buf, 14)) {
    // Parse Accel
    int16_t raw_ax = (buf[0] << 8) | buf[1];
    int16_t raw_ay = (buf[2] << 8) | buf[3];
    int16_t raw_az = (buf[4] << 8) | buf[5];
    
    // Parse Temp
    int16_t raw_temp = (buf[6] << 8) | buf[7];
    
    // Parse Gyro
    int16_t raw_gx = (buf[8] << 8) | buf[9];
    int16_t raw_gy = (buf[10] << 8) | buf[11];
    int16_t raw_gz = (buf[12] << 8) | buf[13];
    
    // Apply calibration offsets
    float ax = raw_ax - accelOffsetX;
    float ay = raw_ay - accelOffsetY;
    float az = raw_az - accelOffsetZ;
    
    float gx = raw_gx - gyroOffsetX;
    float gy = raw_gy - gyroOffsetY;
    float gz = raw_gz - gyroOffsetZ;
    
    // Convert to standard units
    // Accel scale: +/- 2g -> 16384 LSB/g
    float ax_g = ax / 16384.0f;
    float ay_g = ay / 16384.0f;
    float az_g = az / 16384.0f;
    
    // Gyro scale: +/- 500 deg/s -> 65.5 LSB/(deg/s)
    float gx_ds = gx / 65.5f;
    float gy_ds = gy / 65.5f;
    float gz_ds = gz / 65.5f;
    
    float temp_c = (raw_temp / 333.87f) + 21.0f;
    
    // Print JSON output for the Web Serial dashboard
    Serial.print("{\"a\":[");
    Serial.print(ax_g, 3); Serial.print(",");
    Serial.print(ay_g, 3); Serial.print(",");
    Serial.print(az_g, 3);
    Serial.print("],\"g\":[");
    Serial.print(gx_ds, 2); Serial.print(",");
    Serial.print(gy_ds, 2); Serial.print(",");
    Serial.print(gz_ds, 2);
    Serial.print("],\"temp\":");
    Serial.print(temp_c, 1);
    Serial.print(",\"calibrated\":");
    Serial.print(isCalibrated ? "true" : "false");
    Serial.println("}");
    
    // Stub logic for future BLE HID Mouse movements
    // We map gyro Z to horizontal mouse movement, and gyro Y (or X depending on orientation) to vertical.
    // Apply sensitivity.
    int8_t mouseX = (int8_t)(-gz_ds * sensitivity * 0.1f);
    int8_t mouseY = (int8_t)(-gy_ds * sensitivity * 0.1f);
    
    sendBluetoothMouseMove(mouseX, mouseY);
  }
  
  // Control update rate to ~100Hz (10ms)
  delay(10);
}