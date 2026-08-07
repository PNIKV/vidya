#ifndef BUTTON_MANAGER_H
#define BUTTON_MANAGER_H

#include "Config.h"

struct ButtonState {
  bool isPressed;
  bool justPressed;
  bool justReleased;
};

struct MouseButtons {
  ButtonState left;
  ButtonState right;
  ButtonState middle;
  ButtonState calibrate;
  ButtonState toggleMotion;
};

class ButtonManager {
public:
  ButtonManager();

  // Initialize hardware GPIO pins with INPUT_PULLUP
  void begin();

  // Non-blocking update loop (call every loop iteration)
  void update();

  // Query state structures
  const MouseButtons& getButtons() const { return _buttons; }

  // Quick state helpers
  bool isLeftPressed() const { return _buttons.left.isPressed; }
  bool isRightPressed() const { return _buttons.right.isPressed; }
  bool isMiddlePressed() const { return _buttons.middle.isPressed; }
  bool isCalibrateClicked() const { return _buttons.calibrate.justPressed; }
  bool isToggleMotionClicked() const { return _buttons.toggleMotion.justPressed; }

  // Bitfield byte representing current button press states for compact telemetry:
  // Bit 0: Left, Bit 1: Right, Bit 2: Middle, Bit 3: Calibrate, Bit 4: Toggle
  uint8_t getButtonBitmask() const;

private:
  struct PinTracker {
    uint8_t pin;
    bool rawState;
    bool lastDebouncedState;
    unsigned long lastDebounceTime;
  };

  PinTracker _trackers[5];
  MouseButtons _buttons;

  void updateSingleTracker(PinTracker &tracker, ButtonState &state);
};

#endif // BUTTON_MANAGER_H
