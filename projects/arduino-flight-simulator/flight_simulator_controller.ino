//   FLIGHT SIM CONTROLLER — Arduino Uno + 2x Analog Joysticks
//   ------------------------------------------------------------
//   Wiring:
//   Joystick 1 (PITCH / ROLL):
//     VRx -> A0   (roll)
//     VRy -> A1   (pitch)
//     +5V -> 5V
//     GND -> GND

//   Joystick 2 (THROTTLE / YAW):
//     VRx -> A2   (yaw)
//     VRy -> A3   (throttle)
//     +5V -> 5V
//     GND -> GND
//

const int PIN_ROLL = A0;
const int PIN_PITCH = A1;
const int PIN_YAW = A2;
const int PIN_THROTTLE = A3;

// We send data at 115200 baud to eliminate UI lag
const unsigned long SEND_INTERVAL_MS = 20;
unsigned long lastSend = 0;

void setup() { Serial.begin(115200); }

void loop() {
  unsigned long now = millis();
  if (now - lastSend >= SEND_INTERVAL_MS) {
    lastSend = now;

    int roll = analogRead(PIN_ROLL);
    int pitch = analogRead(PIN_PITCH);
    int yaw = analogRead(PIN_YAW);
    int throttle = analogRead(PIN_THROTTLE);

    Serial.print(roll);
    Serial.print(",");
    Serial.print(pitch);
    Serial.print(",");
    Serial.print(yaw);
    Serial.print(",");
    Serial.println(throttle);
  }
}