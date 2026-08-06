#ifndef IMU_SENSOR_H
#define IMU_SENSOR_H

#include "Config.h"
#include <Wire.h>

struct IMUData {
  float ax, ay, az;      // Accelerometer in g
  float gx, gy, gz;      // Gyroscope in deg/s
  float temperature;     // Sensor temperature in Celsius
  bool valid;
  bool simulated;        // Flag indicating synthetic demo telemetry
};

struct IMUOffsets {
  float ax = 0.0f, ay = 0.0f, az = 0.0f;
  float gx = 0.0f, gy = 0.0f, gz = 0.0f;
};

class IMUSensor {
public:
  IMUSensor();

  // Initialize I2C, recover bus, scan devices, and setup IMU
  bool begin();

  // Force I2C bus clearing sequence & drive CS high (forces I2C mode on GY-6500/9250)
  void recoverI2CBus(uint8_t sdaPin = I2C_SDA_PIN, uint8_t sclPin = I2C_SCL_PIN);

  // Scan single I2C bus address space (0x08 to 0x77)
  uint8_t scanI2CBus();

  // Auto-scan all candidate ESP32 SDA/SCL pin pairs
  bool scanAllPinPairs();

  // Calibrate gyro and accel zero-g / zero-dps offsets
  void performCalibration();

  // Read latest 6-DOF sensor sample (Hardware or Synthetic Simulation)
  bool readSensorData(IMUData &data);

  // Simulation mode toggles
  void setSimulationMode(bool sim);
  bool isSimulationMode() const { return _simulationMode; }

  // State Machine Diagnostic getters
  uint8_t getDiagnosticState() const { return _smState; }
  const char* getDiagnosticMessage() const;
  const char* getDiagnosticInstructions() const;

  // Getter methods
  uint8_t getI2CAddress() const { return _activeAddress; }
  uint8_t getWhoAmI() const { return _whoAmI; }
  uint8_t getSDAPin() const { return _activeSDA; }
  uint8_t getSCLPin() const { return _activeSCL; }
  const char* getChipName() const { return _chipName; }
  bool isCalibrated() const { return _calibrated; }
  const IMUOffsets& getOffsets() const { return _offsets; }

  // Hardware register access with I2C Repeated Start (Wire.endTransmission(false))
  bool writeRegister(uint8_t reg, uint8_t value);
  uint8_t readRegister(uint8_t reg);
  bool readRegisters(uint8_t reg, uint8_t *buffer, uint8_t length);

private:
  uint8_t _activeAddress;
  uint8_t _activeSDA;
  uint8_t _activeSCL;
  uint8_t _whoAmI;
  uint8_t _smState;
  const char* _chipName;
  bool _calibrated;
  bool _simulationMode;
  IMUOffsets _offsets;

  bool configureSensor();
  void generateSimulatedData(IMUData &data);
};

#endif // IMU_SENSOR_H
