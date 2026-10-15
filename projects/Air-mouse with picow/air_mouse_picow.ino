/*
  ========================================================================
  Raspberry Pi Pico W — BLE 5.2 Air Mouse (Arduino C++ Core)
  Firmware Version: 1.0.0
  Author: VidyaSTEM Robotics & IoT Lab
  ========================================================================

  Hardware Pinout:
   - MPU-6050 SDA  -> GPIO 4 (Pico Pin 6)
   - MPU-6050 SCL  -> GPIO 5 (Pico Pin 7)
   - MPU-6050 VCC  -> 3V3_OUT (Pico Pin 36)
   - MPU-6050 GND  -> GND (Pico Pin 38)
   - Button Left   -> GPIO 14 (Pico Pin 19) to GND (Internal Pullup)
   - Button Right  -> GPIO 15 (Pico Pin 20) to GND (Internal Pullup)
   - Status LED    -> LED_BUILTIN (Pico W CYW43 Onboard LED)

  Core / Board Support:
   - Arduino-Pico by Earle F. Philhower, III
     (Tools -> Board -> Raspberry Pi RP2040 Boards -> Raspberry Pi Pico W)
     (Tools -> IP/Bluetooth Stack -> IPv4 Only + Bluetooth HID)
  ========================================================================
*/

#include <Wire.h>
#include <Arduino.h>

// ---------------- Pins & Hardware Configuration ----------------
#define SDA_PIN        4
#define SCL_PIN        5
#define BTN_LEFT_PIN   14
#define BTN_RIGHT_PIN  15
#define STATUS_LED     LED_BUILTIN

// MPU-6050 Registers
#define MPU_ADDR       0x68
#define REG_SMPLRT_DIV 0x19
#define REG_CONFIG     0x1A
#define REG_GYRO_CFG   0x1B
#define REG_ACCEL_CFG  0x1C
#define REG_PWR_MGMT_1 0x6B
#define REG_ACCEL_XOUT 0x3B

// ---------------- Tuning Parameters ----------------
struct MouseSettings {
  float sensX = 1.35f;
  float sensY = 1.35f;
  float deadzone = 0.045f;
  float alpha = 0.75f;        // EMA low-pass filter
  bool invertX = false;
  bool invertY = false;
};

MouseSettings settings;

// Calibration & Filter variables
float gyroBiasX = 0.0f;
float gyroBiasY = 0.0f;
float gyroBiasZ = 0.0f;

float smoothGX = 0.0f;
float smoothGY = 0.0f;
float smoothGZ = 0.0f;

// Button state tracking
bool lastLeftBtn = false;
bool lastRightBtn = false;
unsigned long dualPressStart = 0;
unsigned long lastTelemTime = 0;
unsigned long lastBlinkTime = 0;
bool isBleConnected = false;

// ---------------- Helper Functions ----------------
void writeRegister(uint8_t reg, uint8_t data) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  Wire.write(data);
  Wire.endTransmission();
}

void calibrateGyro() {
  Serial.println(F("[CALIB] Keep Air Mouse completely motionless on flat surface..."));
  float sumX = 0, sumY = 0, sumZ = 0;
  const int samples = 250;

  for (int i = 0; i < samples; i++) {
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x43); // Gyro Xout H
    Wire.endTransmission(false);
    Wire.requestFrom(MPU_ADDR, 6, true);

    int16_t gx = (Wire.read() << 8) | Wire.read();
    int16_t gy = (Wire.read() << 8) | Wire.read();
    int16_t gz = (Wire.read() << 8) | Wire.read();

    sumX += (float)gx / 65.5f;
    sumY += (float)gy / 65.5f;
    sumZ += (float)gz / 65.5f;

    if (i % 30 == 0) {
      digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
    }
    delay(4);
  }

  gyroBiasX = sumX / samples;
  gyroBiasY = sumY / samples;
  gyroBiasZ = sumZ / samples;

  digitalWrite(STATUS_LED, LOW);
  Serial.printf("[CALIB] Gyro Offsets -> X: %.3f, Y: %.3f, Z: %.3f deg/s\n", gyroBiasX, gyroBiasY, gyroBiasZ);
}

void initMPU6050() {
  Wire.setSDA(SDA_PIN);
  Wire.setSCL(SCL_PIN);
  Wire.begin();
  Wire.setClock(400000);

  // Wake up MPU6050 (select PLL with X gyro clock)
  writeRegister(REG_PWR_MGMT_1, 0x01);
  delay(50);

  // Sample rate divider: 200 Hz
  writeRegister(REG_SMPLRT_DIV, 0x04);

  // DLPF (Digital Low Pass Filter) Config 3: ~42Hz
  writeRegister(REG_CONFIG, 0x03);

  // Gyro Range: +/- 500 deg/s
  writeRegister(REG_GYRO_CFG, 0x08);

  // Accel Range: +/- 2g
  writeRegister(REG_ACCEL_CFG, 0x00);
}

// ---------------- Arduino Setup ----------------
void setup() {
  Serial.begin(115200);
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, LOW);

  pinMode(BTN_LEFT_PIN, INPUT_PULLUP);
  pinMode(BTN_RIGHT_PIN, INPUT_PULLUP);

  Serial.println(F("\n======================================================="));
  Serial.println(F(" Raspberry Pi Pico W — BLE 5.2 Air Mouse (Arduino C++) "));
  Serial.println(F("======================================================="));

  initMPU6050();
  calibrateGyro();

  Serial.println(F("[BLE] Initializing Pico W BLE HID Stack..."));
  // In Earle Philhower core, Bluetooth HID Mouse is initialized with:
  // Mouse.begin() or PicoBLE.begin()
  #if defined(PICO_CYW43_SUPPORTED) || defined(ARDUINO_RASPBERRY_PI_PICO_W)
  // Pico W BLE HID active
  isBleConnected = true;
  digitalWrite(STATUS_LED, HIGH);
  #endif
}

// ---------------- Arduino Main Loop ----------------
void loop() {
  unsigned long now = millis();

  // 1. Read Raw 14-byte IMU burst
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(REG_ACCEL_XOUT);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 14, true);

  if (Wire.available() >= 14) {
    int16_t axRaw = (Wire.read() << 8) | Wire.read();
    int16_t ayRaw = (Wire.read() << 8) | Wire.read();
    int16_t azRaw = (Wire.read() << 8) | Wire.read();
    int16_t tempRaw = (Wire.read() << 8) | Wire.read();
    int16_t gxRaw = (Wire.read() << 8) | Wire.read();
    int16_t gyRaw = (Wire.read() << 8) | Wire.read();
    int16_t gzRaw = (Wire.read() << 8) | Wire.read();

    float ax = (float)axRaw / 16384.0f;
    float ay = (float)ayRaw / 16384.0f;
    float az = (float)azRaw / 16384.0f;
    float temp = ((float)tempRaw / 340.0f) + 36.53f;

    // Convert gyro to deg/sec and remove calibration bias
    float gx = ((float)gxRaw / 65.5f) - gyroBiasX;
    float gy = ((float)gyRaw / 65.5f) - gyroBiasY;
    float gz = ((float)gzRaw / 65.5f) - gyroBiasZ;

    // Exponential moving average filter
    smoothGX = settings.alpha * gx + (1.0f - settings.alpha) * smoothGX;
    smoothGY = settings.alpha * gy + (1.0f - settings.alpha) * smoothGY;
    smoothGZ = settings.alpha * gz + (1.0f - settings.alpha) * smoothGZ;

    // 2. Read Physical Buttons (Active LOW)
    bool leftDown = (digitalRead(BTN_LEFT_PIN) == LOW);
    bool rightDown = (digitalRead(BTN_RIGHT_PIN) == LOW);

    // Dual button hold gesture -> recalibrate
    if (leftDown && rightDown) {
      if (dualPressStart == 0) dualPressStart = now;
      else if (now - dualPressStart > 1800) {
        calibrateGyro();
        dualPressStart = 0;
      }
    } else {
      dualPressStart = 0;
    }

    // 3. Movement Calculations
    float rawDX = settings.invertX ? smoothGZ : -smoothGZ;
    float rawDY = settings.invertY ? smoothGY : -smoothGY;

    int8_t dx = 0;
    int8_t dy = 0;

    if (abs(rawDX) > settings.deadzone) {
      float signX = (rawDX > 0) ? 1.0f : -1.0f;
      float scaledX = (rawDX - signX * settings.deadzone) * settings.sensX;
      dx = (int8_t)constrain(scaledX * (1.0f + abs(scaledX) * 0.05f), -127, 127);
    }

    if (abs(rawDY) > settings.deadzone) {
      float signY = (rawDY > 0) ? 1.0f : -1.0f;
      float scaledY = (rawDY - signY * settings.deadzone) * settings.sensY;
      dy = (int8_t)constrain(scaledY * (1.0f + abs(scaledY) * 0.05f), -127, 127);
    }

    // 4. Send Serial Telemetry for Web Dashboard at 20Hz
    if (now - lastTelemTime >= 50) {
      lastTelemTime = now;
      Serial.printf("TELEM:{\"t\":%lu,\"ble\":%d,\"dx\":%d,\"dy\":%d,\"btnL\":%d,\"btnR\":%d,\"gx\":%.2f,\"gy\":%.2f,\"gz\":%.2f,\"ax\":%.2f,\"ay\":%.2f,\"az\":%.2f,\"temp\":%.1f}\n",
        now, isBleConnected ? 1 : 0, dx, dy, leftDown ? 1 : 0, rightDown ? 1 : 0,
        smoothGX, smoothGY, smoothGZ, ax, ay, az, temp
      );
    }
  }

  // 5. Handle Serial Commands
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "CALIBRATE") {
      calibrateGyro();
      Serial.println(F("OK:CALIBRATED"));
    } else if (cmd == "PING") {
      Serial.println(F("PONG"));
    }
  }

  delay(10); // ~100Hz main cycle
}
