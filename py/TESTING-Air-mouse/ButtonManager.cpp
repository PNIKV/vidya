#include "ButtonManager.h"

ButtonManager::ButtonManager() {
  _trackers[0] = { BTN_LEFT_PIN, HIGH, HIGH, 0 };
  _trackers[1] = { BTN_RIGHT_PIN, HIGH, HIGH, 0 };
  _trackers[2] = { BTN_MIDDLE_PIN, HIGH, HIGH, 0 };
  _trackers[3] = { BTN_CALIB_PIN, HIGH, HIGH, 0 };
  _trackers[4] = { BTN_TOGGLE_PIN, HIGH, HIGH, 0 };

  _buttons = { {false, false, false}, {false, false, false}, {false, false, false}, {false, false, false}, {false, false, false} };
}

void ButtonManager::begin() {
  for (int i = 0; i < 5; i++) {
    pinMode(_trackers[i].pin, INPUT_PULLUP);
    _trackers[i].rawState = digitalRead(_trackers[i].pin);
    _trackers[i].lastDebouncedState = _trackers[i].rawState;
  }
}

void ButtonManager::updateSingleTracker(PinTracker &tracker, ButtonState &state) {
  bool currentRaw = digitalRead(tracker.pin);
  state.justPressed = false;
  state.justReleased = false;

  if (currentRaw != tracker.rawState) {
    tracker.lastDebounceTime = millis();
    tracker.rawState = currentRaw;
  }

  if ((millis() - tracker.lastDebounceTime) > BUTTON_DEBOUNCE_MS) {
    // Check if debounced state changed
    if (currentRaw != tracker.lastDebouncedState) {
      tracker.lastDebouncedState = currentRaw;
      
      // Active LOW logic: LOW = pressed, HIGH = released
      if (tracker.lastDebouncedState == LOW) {
        state.isPressed = true;
        state.justPressed = true;
      } else {
        state.isPressed = false;
        state.justReleased = true;
      }
    }
  }
}

void ButtonManager::update() {
  updateSingleTracker(_trackers[0], _buttons.left);
  updateSingleTracker(_trackers[1], _buttons.right);
  updateSingleTracker(_trackers[2], _buttons.middle);
  updateSingleTracker(_trackers[3], _buttons.calibrate);
  updateSingleTracker(_trackers[4], _buttons.toggleMotion);
}

uint8_t ButtonManager::getButtonBitmask() const {
  uint8_t mask = 0;
  if (_buttons.left.isPressed)         mask |= (1 << 0);
  if (_buttons.right.isPressed)        mask |= (1 << 1);
  if (_buttons.middle.isPressed)       mask |= (1 << 2);
  if (_buttons.calibrate.isPressed)    mask |= (1 << 3);
  if (_buttons.toggleMotion.isPressed) mask |= (1 << 4);
  return mask;
}

