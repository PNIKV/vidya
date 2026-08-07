#ifndef MOUSE_CONTROLLER_H
#define MOUSE_CONTROLLER_H

#include "Config.h"
#include "IMUSensor.h"
#include "ButtonManager.h"

class MouseController {
public:
  MouseController();

  void begin();

  // Process IMU motion & button inputs, calculate mouse delta X/Y
  void process(const IMUData &imuData, const ButtonManager &btnManager, bool imuCalibrated);

  // Configuration options
  void setSensitivity(float sens) { _sensitivity = (sens > 0.0f) ? sens : 1.0f; }
  float getSensitivity() const { return _sensitivity; }

  void toggleMotion() { _motionEnabled = !_motionEnabled; }
  void setMotionEnabled(bool enabled) { _motionEnabled = enabled; }
  bool isMotionEnabled() const { return _motionEnabled; }

  // BLE HID Mouse Stubs (Ready for NimBLE / BleMouse integration)
  void setBleConnected(bool connected) { _bleConnected = connected; }
  bool isBleConnected() const { return _bleConnected; }

private:
  float _sensitivity;
  bool _motionEnabled;
  bool _bleConnected;

  float _filteredGx;
  float _filteredGy;
  float _filteredGz;

  void transmitJSONTelemetry(const IMUData &data, const ButtonManager &btnManager, bool calibrated, int8_t mouseX, int8_t mouseY);
  void dispatchBleMouse(int8_t dx, int8_t dy, const ButtonManager &btnManager);
};

#endif // MOUSE_CONTROLLER_H
