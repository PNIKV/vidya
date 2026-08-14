/*
  Rain-Triggered Dual Servo Control  (v2)
  ----------------------------------------
  Hardware:
    - Arduino Uno
    - Rain sensor module   (AO -> A0, VCC -> 5V, GND -> GND)
    - Servo 1 signal       -> Pin 9
    - Servo 2 signal       -> Pin 10
    - Servos powered from an external 5V supply, GND shared with Arduino

  Behaviour (AUTO mode):
    - Rain sensor analog output: HIGH (~700-1023) = dry, LOW = wet.
    - Reading drops below `threshold`            -> WET  -> servos move to wetAngle.
    - Reading rises above `threshold + hysteresis`-> DRY  -> servos move to dryAngle.
      (the gap between the two trip points stops the servo chattering back
      and forth when the reading sits right on the edge)
    - Each servo can be independently included in / excluded from the
      automatic trigger (servo1Enabled / servo2Enabled).

  MANUAL mode:
    - Auto-triggering is suspended. Each servo can be driven directly to
      any angle from the dashboard.

  All settings (threshold, hysteresis, wet/dry angle, enabled flags) are
  editable live from the dashboard and can be saved to EEPROM so they
  survive a power cycle.

  ---------------------------------------------------------------------
  Serial Protocol (9600 baud)

  Arduino -> PC, every 200 ms, one line:
    DATA,<rain>,<angle1>,<angle2>,<status>,<threshold>,<hysteresis>,
         <wetAngle>,<dryAngle>,<mode>,<en1>,<en2>

    status  : WET | DRY
    mode    : AUTO | MANUAL
    en1/en2 : 1 (enabled) | 0 (disabled)

  PC -> Arduino commands (each ends with \n):
    THRESH,<0-1023>          set the wet trip point
    HYST,<0-500>             set the hysteresis margin
    WETANGLE,<0-180>         angle used when wet is detected
    DRYANGLE,<0-180>         resting angle when dry
    MODE,AUTO                switch to automatic sensor-driven control
    MODE,MANUAL              switch to manual control
    ENABLE,1,<0|1>           include/exclude servo 1 from auto trigger
    ENABLE,2,<0|1>           include/exclude servo 2 from auto trigger
    SERVO,1,<0-180>          manually set servo 1 (applied any time; auto
                              loop will override it next cycle unless in
                              MANUAL mode or that servo is disabled)
    SERVO,2,<0-180>          manually set servo 2
    SAVE                      write current settings to EEPROM
    RESET                     restore factory defaults (not saved until SAVE)
  ---------------------------------------------------------------------
*/

#include <Servo.h>
#include <EEPROM.h>

const uint8_t RAIN_PIN   = A0;
const uint8_t SERVO1_PIN = 9;
const uint8_t SERVO2_PIN = 10;

const unsigned long SEND_INTERVAL_MS = 200;
const int EEPROM_MAGIC = 0xC0DE;   // marks that valid settings are stored
const int EEPROM_ADDR  = 0;

struct Settings {
  int   magic;
  int   threshold;
  int   hysteresis;
  uint8_t wetAngle;
  uint8_t dryAngle;
  bool  servo1Enabled;
  bool  servo2Enabled;
};

Settings cfg;

const Settings DEFAULTS = {
  EEPROM_MAGIC,
  100,   // threshold
  50,    // hysteresis
  90,    // wetAngle
  0,     // dryAngle
  true,  // servo1Enabled
  true   // servo2Enabled
};

Servo servo1;
Servo servo2;

bool autoMode   = true;
bool isWet      = false;
int  rainValue  = 0;
int  s1Angle    = 0;
int  s2Angle    = 0;

unsigned long lastSendTime = 0;
String serialBuffer = "";

void setup() {
  Serial.begin(9600);
  pinMode(RAIN_PIN, INPUT);

  loadSettings();

  servo1.attach(SERVO1_PIN);
  servo2.attach(SERVO2_PIN);

  s1Angle = cfg.dryAngle;
  s2Angle = cfg.dryAngle;
  servo1.write(s1Angle);
  servo2.write(s2Angle);
}

void loop() {
  readSerialCommands();

  rainValue = analogRead(RAIN_PIN);

  if (autoMode) {
    runAutoLogic();
  }

  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;
    sendData();
  }
}

void runAutoLogic() {
  // Two trip points create the hysteresis gap:
  //   go WET  when reading < threshold
  //   go DRY  when reading > threshold + hysteresis
  if (!isWet && rainValue < cfg.threshold) {
    isWet = true;
  } else if (isWet && rainValue > cfg.threshold + cfg.hysteresis) {
    isWet = false;
  }

  int target = isWet ? cfg.wetAngle : cfg.dryAngle;

  if (cfg.servo1Enabled && s1Angle != target) {
    s1Angle = target;
    servo1.write(s1Angle);
  }
  if (cfg.servo2Enabled && s2Angle != target) {
    s2Angle = target;
    servo2.write(s2Angle);
  }
}

void sendData() {
  Serial.print("DATA,");
  Serial.print(rainValue);            Serial.print(",");
  Serial.print(s1Angle);              Serial.print(",");
  Serial.print(s2Angle);              Serial.print(",");
  Serial.print(isWet ? "WET" : "DRY");Serial.print(",");
  Serial.print(cfg.threshold);        Serial.print(",");
  Serial.print(cfg.hysteresis);       Serial.print(",");
  Serial.print(cfg.wetAngle);         Serial.print(",");
  Serial.print(cfg.dryAngle);         Serial.print(",");
  Serial.print(autoMode ? "AUTO" : "MANUAL"); Serial.print(",");
  Serial.print(cfg.servo1Enabled ? 1 : 0);    Serial.print(",");
  Serial.println(cfg.servo2Enabled ? 1 : 0);
}

void readSerialCommands() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n') {
      handleCommand(serialBuffer);
      serialBuffer = "";
    } else if (c != '\r') {
      serialBuffer += c;
    }
  }
}

void handleCommand(String cmd) {
  cmd.trim();
  if (cmd.length() == 0) return;

  int firstComma = cmd.indexOf(',');
  String key = firstComma == -1 ? cmd : cmd.substring(0, firstComma);
  String rest = firstComma == -1 ? "" : cmd.substring(firstComma + 1);

  if (key == "THRESH") {
    int v = rest.toInt();
    if (v >= 0 && v <= 1023) cfg.threshold = v;
  }
  else if (key == "HYST") {
    int v = rest.toInt();
    if (v >= 0 && v <= 500) cfg.hysteresis = v;
  }
  else if (key == "WETANGLE") {
    int v = rest.toInt();
    if (v >= 0 && v <= 180) cfg.wetAngle = v;
  }
  else if (key == "DRYANGLE") {
    int v = rest.toInt();
    if (v >= 0 && v <= 180) cfg.dryAngle = v;
  }
  else if (key == "MODE") {
    if (rest == "AUTO") autoMode = true;
    else if (rest == "MANUAL") autoMode = false;
  }
  else if (key == "ENABLE") {
    int comma = rest.indexOf(',');
    if (comma != -1) {
      int servoNum = rest.substring(0, comma).toInt();
      int val = rest.substring(comma + 1).toInt();
      if (servoNum == 1) cfg.servo1Enabled = (val != 0);
      if (servoNum == 2) cfg.servo2Enabled = (val != 0);
    }
  }
  else if (key == "SERVO") {
    int comma = rest.indexOf(',');
    if (comma != -1) {
      int servoNum = rest.substring(0, comma).toInt();
      int angle = rest.substring(comma + 1).toInt();
      angle = constrain(angle, 0, 180);
      if (servoNum == 1) { s1Angle = angle; servo1.write(s1Angle); }
      if (servoNum == 2) { s2Angle = angle; servo2.write(s2Angle); }
    }
  }
  else if (key == "SAVE") {
    saveSettings();
  }
  else if (key == "RESET") {
    cfg = DEFAULTS;
  }
}

void loadSettings() {
  EEPROM.get(EEPROM_ADDR, cfg);
  if (cfg.magic != EEPROM_MAGIC) {
    cfg = DEFAULTS;   // nothing valid stored yet, use factory defaults
  }
}

void saveSettings() {
  cfg.magic = EEPROM_MAGIC;
  EEPROM.put(EEPROM_ADDR, cfg);
}
