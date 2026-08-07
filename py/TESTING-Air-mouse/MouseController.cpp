#include "MouseController.h"

MouseController::MouseController() 
  : _sensitivity(DEFAULT_SENSITIVITY),
    _motionEnabled(true),
    _bleConnected(false),
    _filteredGx(0.0f),
    _filteredGy(0.0f),
    _filteredGz(0.0f) {}

void MouseController::begin() {
  // Stub for BLE HID initialization if BleMouse library is included
  // BleMouse.begin();
}

void MouseController::process(const IMUData &imuData, const ButtonManager &btnManager, bool imuCalibrated) {
  if (!imuData.valid) return;

  // Apply Exponential Moving Average (EMA) Low-Pass Filter
  _filteredGx = (EMA_ALPHA * imuData.gx) + ((1.0f - EMA_ALPHA) * _filteredGx);
  _filteredGy = (EMA_ALPHA * imuData.gy) + ((1.0f - EMA_ALPHA) * _filteredGy);
  _filteredGz = (EMA_ALPHA * imuData.gz) + ((1.0f - EMA_ALPHA) * _filteredGz);

  // Apply Deadzone Noise Floor Suppressor
  float gz_dead = (fabs(_filteredGz) > GYRO_DEADZONE) ? _filteredGz : 0.0f;
  float gy_dead = (fabs(_filteredGy) > GYRO_DEADZONE) ? _filteredGy : 0.0f;

  int8_t mouseX = 0;
  int8_t mouseY = 0;

  if (_motionEnabled) {
    float rawDeltaX = -gz_dead * _sensitivity * 0.45f;
    float rawDeltaY = -gy_dead * _sensitivity * 0.45f;

    mouseX = (int8_t)constrain(rawDeltaX, -127, 127);
    mouseY = (int8_t)constrain(rawDeltaY, -127, 127);
  }

  dispatchBleMouse(mouseX, mouseY, btnManager);
  transmitJSONTelemetry(imuData, btnManager, imuCalibrated, mouseX, mouseY);
}

void MouseController::dispatchBleMouse(int8_t dx, int8_t dy, const ButtonManager &btnManager) {
  if (!_bleConnected) return;

  // BleMouse implementation hooks:
  // if (dx != 0 || dy != 0) {
  //   bleMouse.move(dx, dy);
  // }
}

void MouseController::transmitJSONTelemetry(const IMUData &data, const ButtonManager &btnManager, bool calibrated, int8_t mouseX, int8_t mouseY) {
  const MouseButtons &btns = btnManager.getButtons();

  Serial.print("{\"a\":[");
  Serial.print(data.ax, 3); Serial.print(",");
  Serial.print(data.ay, 3); Serial.print(",");
  Serial.print(data.az, 3);
  Serial.print("],\"g\":[");
  Serial.print(data.gx, 2); Serial.print(",");
  Serial.print(data.gy, 2); Serial.print(",");
  Serial.print(data.gz, 2);
  Serial.print("],\"temp\":");
  Serial.print(data.temperature, 1);
  Serial.print(",\"calibrated\":");
  Serial.print(calibrated ? "true" : "false");
  Serial.print(",\"motionActive\":");
  Serial.print(_motionEnabled ? "true" : "false");
  Serial.print(",\"sim\":");
  Serial.print(data.simulated ? "true" : "false");
  Serial.print(",\"m\":[");
  Serial.print(mouseX); Serial.print(",");
  Serial.print(mouseY);
  Serial.print("],\"btn\":{");
  Serial.print("\"L\":"); Serial.print(btns.left.isPressed ? 1 : 0);
  Serial.print(",\"R\":"); Serial.print(btns.right.isPressed ? 1 : 0);
  Serial.print(",\"M\":"); Serial.print(btns.middle.isPressed ? 1 : 0);
  Serial.print(",\"C\":"); Serial.print(btns.calibrate.isPressed ? 1 : 0);
  Serial.print(",\"T\":"); Serial.print(btns.toggleMotion.isPressed ? 1 : 0);
  Serial.println("}}");
}
