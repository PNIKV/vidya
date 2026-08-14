/*
  ========================================================================
  ESP32 + MPU6050  ->  Wireless BLE Air Mouse  +  Configurable Dashboard
  ========================================================================

  Features added on top of the base build:
   - Startup gyro calibration (device must be still for ~2s at power-on)
   - Continuous "still" detection that quietly re-calibrates gyro bias
     and stops cursor drift when the mouse is resting on a surface
   - Exponential low-pass filtering on raw accel/gyro to cut sensor noise
   - Runtime-configurable via serial commands sent from the dashboard:
       - BLE device name          (saved to flash, requires reboot to apply)
       - Sensitivity X / Y
       - Deadzone
       - Left / Right click button pins
       - Status LED pin
   - All settings persisted in NVS (Preferences) and reloaded at boot
   - Status LED: OFF while calibrating, slow blink while advertising/
     waiting for a BLE host, solid ON once a host is connected
   - Physical left/right click buttons (debounced) mapped to BLE clicks
   - Every setting resets to firmware defaults on "resetDefaults" command

  Libraries needed (Library Manager):
   - Adafruit MPU6050
   - Adafruit Unified Sensor
   - ESP32-BLE-Mouse (T-vK/ESP32-BLE-Mouse)
   - ArduinoJson (>= 6.x)
  ========================================================================
*/

#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <BleMouse.h>
#include <Preferences.h>
#include <ArduinoJson.h>

Adafruit_MPU6050 mpu;
Preferences prefs;
BleMouse* bleMouse = nullptr;

// ------------------------------------------------------------------
// Config struct (this is what the dashboard can read / write)
// ------------------------------------------------------------------
struct Config {
  char  name[32];
  float sensX;
  float sensY;
  float deadzone;
  int   leftPin;
  int   rightPin;
  int   ledPin;
};

Config cfg;

const char* NVS_NAMESPACE = "airmouse";

// Hard firmware defaults - used on first boot and on "resetDefaults"
void loadDefaults(Config &c) {
  strncpy(c.name, "ESP32 Air Mouse", sizeof(c.name));
  c.sensX    = 2.5;
  c.sensY    = 2.5;
  c.deadzone = 0.5;
  c.leftPin  = 25;
  c.rightPin = 26;
  c.ledPin   = 2;
}

void saveConfig(const Config &c) {
  prefs.begin(NVS_NAMESPACE, false);
  prefs.putString("name",     c.name);
  prefs.putFloat("sensX",     c.sensX);
  prefs.putFloat("sensY",     c.sensY);
  prefs.putFloat("deadzone",  c.deadzone);
  prefs.putInt("leftPin",     c.leftPin);
  prefs.putInt("rightPin",    c.rightPin);
  prefs.putInt("ledPin",      c.ledPin);
  prefs.end();
}

void loadConfig(Config &c) {
  loadDefaults(c); // fill safe defaults first
  prefs.begin(NVS_NAMESPACE, true);
  String n = prefs.getString("name", c.name);
  n.toCharArray(c.name, sizeof(c.name));
  c.sensX    = prefs.getFloat("sensX",    c.sensX);
  c.sensY    = prefs.getFloat("sensY",    c.sensY);
  c.deadzone = prefs.getFloat("deadzone", c.deadzone);
  c.leftPin  = prefs.getInt("leftPin",    c.leftPin);
  c.rightPin = prefs.getInt("rightPin",   c.rightPin);
  c.ledPin   = prefs.getInt("ledPin",     c.ledPin);
  prefs.end();
}

// ------------------------------------------------------------------
// Orientation state
// ------------------------------------------------------------------
float pitch = 0, roll = 0, yaw = 0;
unsigned long lastTime = 0;

// Filtered (low-pass) raw sensor values, used to cut jitter/noise
float fAx = 0, fAy = 0, fAz = 9.8;
float fGx = 0, fGy = 0, fGz = 0;
const float LPF_ALPHA = 0.35; // 0..1, higher = less smoothing

// Gyro bias, found at calibration time, refined while still
float gxBias = 0, gyBias = 0, gzBias = 0;

// Still / drift detection
bool  isStill = false;
unsigned long stillSince = 0;
const unsigned long STILL_HOLD_MS   = 700;   // must be still this long to count as "still"
const float STILL_GYRO_THRESH       = 1.2;   // deg/s
const float STILL_ACCEL_THRESH      = 0.25;  // g deviation from 1g magnitude
const float BIAS_ADAPT_RATE         = 0.02;  // how fast bias re-learns while still

// Button debounce
bool leftPressed = false, rightPressed = false;
unsigned long leftLastChange = 0, rightLastChange = 0;
const unsigned long DEBOUNCE_MS = 25;

// LED heartbeat
unsigned long lastLedToggle = 0;
bool ledState = false;

// ------------------------------------------------------------------
// Calibration
// ------------------------------------------------------------------
void calibrateGyro() {
  const int SAMPLES = 400;
  double sx = 0, sy = 0, sz = 0;

  // Fast blink while calibrating so the user knows to keep it still
  for (int i = 0; i < SAMPLES; i++) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    sx += g.gyro.x * 180.0 / PI;
    sy += g.gyro.y * 180.0 / PI;
    sz += g.gyro.z * 180.0 / PI;

    if (i % 20 == 0) digitalWrite(cfg.ledPin, !digitalRead(cfg.ledPin));
    delay(4);
  }

  gxBias = sx / SAMPLES;
  gyBias = sy / SAMPLES;
  gzBias = sz / SAMPLES;

  pitch = 0;
  roll  = 0;
  yaw   = 0;

  digitalWrite(cfg.ledPin, LOW);
  Serial.println("{\"type\":\"calibrated\"}");
}

// ------------------------------------------------------------------
// Serial command handling (JSON in, from the dashboard)
// ------------------------------------------------------------------
void applyButtonPins() {
  pinMode(cfg.leftPin, INPUT_PULLUP);
  pinMode(cfg.rightPin, INPUT_PULLUP);
}

void sendConfig() {
  StaticJsonDocument<256> doc;
  doc["type"]      = "config";
  doc["name"]      = cfg.name;
  doc["sensX"]     = cfg.sensX;
  doc["sensY"]     = cfg.sensY;
  doc["deadzone"]  = cfg.deadzone;
  doc["leftPin"]   = cfg.leftPin;
  doc["rightPin"]  = cfg.rightPin;
  doc["ledPin"]    = cfg.ledPin;
  serializeJson(doc, Serial);
  Serial.println();
}

void handleCommand(const String &line) {
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, line);
  if (err) return;

  const char* cmd = doc["cmd"];
  if (!cmd) return;

  if (strcmp(cmd, "getConfig") == 0) {
    sendConfig();

  } else if (strcmp(cmd, "setSensitivity") == 0) {
    if (doc.containsKey("x")) cfg.sensX = doc["x"];
    if (doc.containsKey("y")) cfg.sensY = doc["y"];
    saveConfig(cfg);
    sendConfig();

  } else if (strcmp(cmd, "setDeadzone") == 0) {
    if (doc.containsKey("value")) cfg.deadzone = doc["value"];
    saveConfig(cfg);
    sendConfig();

  } else if (strcmp(cmd, "setButtons") == 0) {
    if (doc.containsKey("left"))  cfg.leftPin  = doc["left"];
    if (doc.containsKey("right")) cfg.rightPin = doc["right"];
    saveConfig(cfg);
    applyButtonPins();
    sendConfig();

  } else if (strcmp(cmd, "setLed") == 0) {
    if (doc.containsKey("pin")) {
      pinMode(cfg.ledPin, INPUT); // release old pin
      cfg.ledPin = doc["pin"];
      pinMode(cfg.ledPin, OUTPUT);
    }
    saveConfig(cfg);
    sendConfig();

  } else if (strcmp(cmd, "setName") == 0) {
    if (doc.containsKey("value")) {
      const char* newName = doc["value"];
      strncpy(cfg.name, newName, sizeof(cfg.name) - 1);
      cfg.name[sizeof(cfg.name) - 1] = '\0';
      saveConfig(cfg);
      Serial.println("{\"type\":\"restarting\"}");
      delay(200);
      ESP.restart(); // BLE device name can only be set at construction time
    }

  } else if (strcmp(cmd, "calibrate") == 0) {
    calibrateGyro();

  } else if (strcmp(cmd, "resetDefaults") == 0) {
    loadDefaults(cfg);
    saveConfig(cfg);
    Serial.println("{\"type\":\"restarting\"}");
    delay(200);
    ESP.restart();
  }
}

String serialBuffer;

void pollSerialCommands() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n') {
      serialBuffer.trim();
      if (serialBuffer.length() > 0 && serialBuffer[0] == '{') {
        handleCommand(serialBuffer);
      }
      serialBuffer = "";
    } else {
      serialBuffer += c;
    }
  }
}

// ------------------------------------------------------------------
// Setup
// ------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(300);

  loadConfig(cfg);

  pinMode(cfg.ledPin, OUTPUT);
  digitalWrite(cfg.ledPin, LOW);
  applyButtonPins();

  Wire.begin(21, 22);

  if (!mpu.begin()) {
    Serial.println("{\"type\":\"error\",\"message\":\"MPU6050 not found\"}");
    while (1) delay(10);
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  bleMouse = new BleMouse((std::string)cfg.name, (std::string)"Maker", 100);
  bleMouse->begin();

  Serial.println("{\"type\":\"ready\"}");
  calibrateGyro(); // keep the mouse still for ~2s while this runs
  lastTime = millis();
}

// ------------------------------------------------------------------
// Main loop
// ------------------------------------------------------------------
void loop() {
  pollSerialCommands();

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  unsigned long now = millis();
  float dt = (now - lastTime) / 1000.0;
  lastTime = now;
  if (dt <= 0.0) dt = 0.001;

  // ---- low-pass filter raw readings to cut sensor/motion noise ----
  fAx = fAx + LPF_ALPHA * (a.acceleration.x - fAx);
  fAy = fAy + LPF_ALPHA * (a.acceleration.y - fAy);
  fAz = fAz + LPF_ALPHA * (a.acceleration.z - fAz);

  float gxRaw = g.gyro.x * 180.0 / PI;
  float gyRaw = g.gyro.y * 180.0 / PI;
  float gzRaw = g.gyro.z * 180.0 / PI;
  fGx = fGx + LPF_ALPHA * (gxRaw - fGx);
  fGy = fGy + LPF_ALPHA * (gyRaw - fGy);
  fGz = fGz + LPF_ALPHA * (gzRaw - fGz);

  // ---- remove learned bias ----
  float gx = fGx - gxBias;
  float gy = fGy - gyBias;
  float gz = fGz - gzBias;

  // ---- still / drift detection ----
  float accelMag  = sqrt(fAx * fAx + fAy * fAy + fAz * fAz) / 9.8; // in g
  float gyroMag   = fabs(gx) + fabs(gy) + fabs(gz);
  bool  lookssStill = (gyroMag < STILL_GYRO_THRESH) && (fabs(accelMag - 1.0) < STILL_ACCEL_THRESH);

  if (lookssStill) {
    if (stillSince == 0) stillSince = now;
    if (now - stillSince > STILL_HOLD_MS) {
      isStill = true;
      // slowly re-learn gyro bias so long-term drift cancels itself out
      gxBias += BIAS_ADAPT_RATE * (fGx - gxBias);
      gyBias += BIAS_ADAPT_RATE * (fGy - gyBias);
      gzBias += BIAS_ADAPT_RATE * (fGz - gzBias);
    }
  } else {
    stillSince = 0;
    isStill = false;
  }

  // ---- complementary filter for pitch/roll, integrate yaw ----
  float accPitch = atan2(fAy, fAz) * 180.0 / PI;
  float accRoll  = atan2(-fAx, fAz) * 180.0 / PI;

  pitch = 0.96 * (pitch + gx * dt) + 0.04 * accPitch;
  roll  = 0.96 * (roll  + gy * dt) + 0.04 * accRoll;
  if (!isStill) {
    yaw += gz * dt;
  }
  // if still, freeze yaw entirely instead of letting residual noise drift it

  // ---- buttons (debounced) ----
  bool leftRaw  = (digitalRead(cfg.leftPin)  == LOW);
  bool rightRaw = (digitalRead(cfg.rightPin) == LOW);

  if (leftRaw != leftPressed && (now - leftLastChange) > DEBOUNCE_MS) {
    leftPressed = leftRaw;
    leftLastChange = now;
    if (bleMouse->isConnected()) {
      if (leftPressed) bleMouse->press(MOUSE_LEFT);
      else bleMouse->release(MOUSE_LEFT);
    }
  }
  if (rightRaw != rightPressed && (now - rightLastChange) > DEBOUNCE_MS) {
    rightPressed = rightRaw;
    rightLastChange = now;
    if (bleMouse->isConnected()) {
      if (rightPressed) bleMouse->press(MOUSE_RIGHT);
      else bleMouse->release(MOUSE_RIGHT);
    }
  }

  // ---- cursor movement ----
  if (bleMouse->isConnected() && !isStill) {
    int moveX = 0, moveY = 0;
    if (fabs(gz) > cfg.deadzone) moveX = (int)(-gz * cfg.sensX);
    if (fabs(gx) > cfg.deadzone) moveY = (int)(-gx * cfg.sensY);
    if (moveX != 0 || moveY != 0) bleMouse->move(moveX, moveY);
  }

  // ---- status LED ----
  bool connected = bleMouse->isConnected();
  if (connected) {
    digitalWrite(cfg.ledPin, HIGH);
  } else {
    // slow heartbeat blink while waiting for a host
    if (now - lastLedToggle > 500) {
      ledState = !ledState;
      digitalWrite(cfg.ledPin, ledState);
      lastLedToggle = now;
    }
  }

  // ---- telemetry for the dashboard ----
  StaticJsonDocument<256> t;
  t["pitch"]     = round(pitch * 100) / 100.0;
  t["roll"]      = round(roll  * 100) / 100.0;
  t["yaw"]       = round(yaw   * 100) / 100.0;
  t["ax"]        = round((fAx / 9.8) * 100) / 100.0;
  t["ay"]        = round((fAy / 9.8) * 100) / 100.0;
  t["az"]        = round((fAz / 9.8) * 100) / 100.0;
  t["connected"] = connected ? 1 : 0;
  t["still"]     = isStill ? 1 : 0;
  t["leftBtn"]   = leftPressed ? 1 : 0;
  t["rightBtn"]  = rightPressed ? 1 : 0;
  serializeJson(t, Serial);
  Serial.println();

  delay(20);
}
