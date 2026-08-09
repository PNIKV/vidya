/*
  ============================================================
   GUARDIAN — Wearable Fall Detection Firmware
   Board   : ESP8266 (NodeMCU / Wemos D1 Mini)
   Sensor  : MPU6050 (accelerometer + gyroscope, I2C)
   Output  : Streams live JSON telemetry over WebSocket (port 81)
             to the dashboard, and raises {"fall": true} the
             moment a fall is confirmed.
  ============================================================

  WIRING (I2C):
    MPU6050 VCC -> 3V3
    MPU6050 GND -> GND
    MPU6050 SCL -> D1 (GPIO5)
    MPU6050 SDA -> D2 (GPIO4)

  LIBRARIES (install via Library Manager):
    - Adafruit MPU6050
    - Adafruit Unified Sensor
    - ArduinoJson (v6)
    - WebSockets by Markus Sattler  (arduinoWebSockets)

  HOW IT WORKS — the classic 3-stage fall signature:
    1. FREE FALL  -> accel magnitude drops near 0 g (device is airborne)
    2. IMPACT     -> accel magnitude spikes sharply (device hits ground/floor)
    3. STILLNESS  -> accel magnitude settles near 1 g and stays there
                      (person is down and not moving)
    All three must happen in sequence, within the time windows below,
    or the state resets — this avoids false alarms from normal
    walking, sitting down, or setting the device on a table.
  ============================================================
*/

#include <ESP8266WiFi.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h>
#include <WebSocketsServer.h>

// ---------- WiFi credentials ----------
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// ---------- Objects ----------
Adafruit_MPU6050 mpu;
WebSocketsServer webSocket(81);   // dashboard connects to ws://<device-ip>:81

// ---------- Fall-detection tuning (edit to calibrate) ----------
const float FREEFALL_G        = 0.4;   // below this  = free fall (airborne)
const float IMPACT_G          = 2.5;   // above this  = impact (hit something)
const unsigned long FALL_WINDOW_MS  = 1000;  // impact must follow free-fall within this window
const unsigned long STILL_CHECK_MS  = 1500;  // must stay still this long after impact to confirm

// ---------- Fall state machine ----------
enum FallState { NORMAL, FREEFALL, IMPACT_DETECTED, CONFIRMED_FALL };
FallState state = NORMAL;
unsigned long freefallTime = 0;
unsigned long impactTime   = 0;

void setup() {
  Serial.begin(9600);
  Wire.begin(4, 5);   // SDA, SCL

  if (!mpu.begin()) {
    Serial.println("MPU6050 not found — check wiring!");
    while (1) delay(10);
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected! Point the dashboard at ws://");
  Serial.print(WiFi.localIP());
  Serial.println(":81");

  webSocket.begin();
}

void loop() {
  webSocket.loop();

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Convert m/s^2 -> g
  float ax = a.acceleration.x / 9.81;
  float ay = a.acceleration.y / 9.81;
  float az = a.acceleration.z / 9.81;
  float magnitude = sqrt(ax * ax + ay * ay + az * az);

  bool fallEvent = detectFall(magnitude);

  // Build and broadcast telemetry packet
  StaticJsonDocument<256> doc;
  doc["ax"] = ax;
  doc["ay"] = ay;
  doc["az"] = az;
  doc["magnitude"] = magnitude;
  doc["gx"] = g.gyro.x;
  doc["gy"] = g.gyro.y;
  doc["gz"] = g.gyro.z;
  doc["state"] = state;      // 0=NORMAL 1=FREEFALL 2=IMPACT_DETECTED 3=CONFIRMED_FALL
  doc["fall"] = fallEvent;   // true only on the exact packet that confirms a fall

  String payload;
  serializeJson(doc, payload);
  webSocket.broadcastTXT(payload);

  delay(50);   // ~20 samples/second
}

bool detectFall(float magnitude) {
  unsigned long now = millis();
  bool fallConfirmed = false;

  switch (state) {

    case NORMAL:
      if (magnitude < FREEFALL_G) {
        state = FREEFALL;
        freefallTime = now;
      }
      break;

    case FREEFALL:
      if (now - freefallTime > FALL_WINDOW_MS) {
        state = NORMAL;                 // free-fall dip wasn't followed by impact -> ignore
      } else if (magnitude > IMPACT_G) {
        state = IMPACT_DETECTED;
        impactTime = now;
      }
      break;

    case IMPACT_DETECTED:
      if (now - impactTime > STILL_CHECK_MS) {
        if (magnitude > 0.8 && magnitude < 1.2) {   // resting near 1 g = lying still
          state = CONFIRMED_FALL;
          fallConfirmed = true;
        } else {
          state = NORMAL;               // moved around after impact -> probably not a fall
        }
      }
      break;

    case CONFIRMED_FALL:
      // Latched until the wearer gets up (or the dashboard sends a reset)
      if (magnitude < 0.9 || magnitude > 1.1) {
        state = NORMAL;                 // motion resumed -> person stood back up
      }
      break;
  }

  return fallConfirmed;
}
