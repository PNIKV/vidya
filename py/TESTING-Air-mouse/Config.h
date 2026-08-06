#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ==========================================
// Serial & Debug Configuration
// ==========================================
#define SERIAL_BAUD_RATE       115200

// ==========================================
// I2C & Sensor Configuration
// ==========================================
#define I2C_SDA_PIN            21        // Default ESP32 DevKit SDA
#define I2C_SCL_PIN            22        // Default ESP32 DevKit SCL
#define MPU_CS_PIN             5         // Drive HIGH to force I2C mode on GY-6500/9250

#define I2C_FREQ_INIT          100000    // Initial safe 100kHz for discovery
#define I2C_FREQ_FAST          400000    // Operational 400kHz fast mode

// Standard MPU / ICM I2C Addresses
#define MPU_ADDR_PRIMARY       0x68      // AD0 = GND
#define MPU_ADDR_SECONDARY     0x69      // AD0 = VCC

// MPU6500 / MPU9250 / MPU6050 Hardware Register Map
#define REG_WHO_AM_I           0x75
#define REG_PWR_MGMT_1         0x6B
#define REG_PWR_MGMT_2         0x6C
#define REG_CONFIG             0x1A
#define REG_GYRO_CONFIG        0x1B
#define REG_ACCEL_CONFIG       0x1C
#define REG_ACCEL_XOUT_H       0x3B
#define REG_TEMP_OUT_H         0x41
#define REG_GYRO_XOUT_H        0x43

// Recognized WHO_AM_I Device Signatures
#define WHO_AM_I_MPU6500       0x70
#define WHO_AM_I_MPU9250       0x71
#define WHO_AM_I_MPU6050       0x68
#define WHO_AM_I_ICM20602      0x12
#define WHO_AM_I_ICM20689      0x98

// Diagnostic State Machine (SM) Codes
#define SM_BOOTING             0
#define SM_HARDWARE_OK         1
#define SM_FAULT_NO_ACK        2
#define SM_FAULT_WRONG_WHOAMI  3
#define SM_SIMULATION_ACTIVE   4

// Structure for I2C Pin Pair Auto-Scanner
struct I2CPinPair {
  uint8_t sda;
  uint8_t scl;
  const char* label;
};

// Safe Candidate I2C Pin Pairs for ESP32 (Excluding Flash pins 6-11 and CS pin 5)
const I2CPinPair CANDIDATE_I2C_PINS[] = {
  { 21, 22, "Standard ESP32 DevKit (SDA=21, SCL=22)" },
  { 18, 19, "VSPI Header (SDA=18, SCL=19)" },
  { 32, 33, "ESP32 Bottom Right (SDA=32, SCL=33)" },
  { 16, 17, "ESP32 UART2 Header (SDA=16, SCL=17)" },
  { 13, 14, "ESP32 HSPI Header (SDA=13, SCL=14)" },
  { 4,  15, "ESP32 Aux Pair (SDA=4, SCL=15)" }
};
const uint8_t NUM_CANDIDATE_PIN_PAIRS = sizeof(CANDIDATE_I2C_PINS) / sizeof(CANDIDATE_I2C_PINS[0]);

// ==========================================
// Hardware Push Button Pins (ESP32 DevKit V1)
// Active LOW using internal Pull-Up resistors
// ==========================================
#define BTN_LEFT_PIN           12        // Left Mouse Click
#define BTN_RIGHT_PIN          14        // Right Mouse Click
#define BTN_MIDDLE_PIN         27        // Middle Click / Scroll Drag
#define BTN_CALIB_PIN          26        // Hardware Recalibrate Button
#define BTN_TOGGLE_PIN         25        // Motion Enable / Disable Toggle

#define BUTTON_DEBOUNCE_MS     50        // Debounce threshold in milliseconds

// ==========================================
// Air Mouse Motion Parameters
// ==========================================
#define DEFAULT_SENSITIVITY    1.0f
#define GYRO_DEADZONE          0.15f     // deg/s noise floor filtering
#define EMA_ALPHA              0.4f      // Low-pass exponential moving average coefficient (0.0 - 1.0)

#endif // CONFIG_H
