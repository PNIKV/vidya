/*
  ============================================================================
  Smart Distance Tracker
  By Usha Muneppa & Prem Sharma
  Wemos D1 Mini (ESP8266) + VL53L0X + KY-008 Laser + 1.3" SH1106 OLED
  ============================================================================
  WHAT THIS DOES
  - Reads distance from a VL53L0X ToF sensor
  - Laser turns ON only while:
        (a) the physical button is held down, OR
        (b) the "Hold to Measure" button on the web dashboard is held
  - While active, it measures continuously and streams the live value
    to a self-hosted web dashboard (works on phone/laptop, same WiFi)
  - Shows live distance, laser status, and IP on a 1.3" OLED display
  - Laser auto-shuts-off if the web page disappears (crashed tab, closed
    browser, etc.) so it can never get stuck on.

  COMPONENTS
  - ESP8266 D1 Mini
  - VL53L0X Time-of-Flight sensor module
  - KY-008 650nm laser module
  - Push button
  - 1.3" SH1106 OLED display (I2C, address 0x3C)

  LIBRARIES REQUIRED (Arduino Library Manager)
  - "Adafruit VL53L0X"   (installs "Adafruit BusIO" as a dependency)
  - "U8g2"               (for SH1106 OLED display)
  - ESP8266 board core (adds ESP8266WiFi / ESP8266WebServer / ESP8266mDNS)

  WIRING (Wemos D1 Mini)
  - VL53L0X   VCC -> 3V3      GND -> G
              SDA -> D2       SCL -> D1
  - SH1106    VCC -> 3V3      GND -> G
    OLED      SDA -> D2       SCL -> D1   (shares I2C bus with VL53L0X)
  - Button:   one leg -> D6   other leg -> G   (internal pull-up, no resistor
  needed)
  - Laser:    D7 -> transistor/MOSFET driver -> KY-008 laser module
              (DO NOT wire a laser diode module straight to the GPIO pin if it
               draws more than ~12 mA. Use an NPN transistor, e.g. 2N2222 /
               S8050, or a logic-level MOSFET: D7 -> 1k resistor -> base/gate,
               emitter/source -> GND, laser -> collector/drain, laser+ ->
  3V3/5V. If your module truly is a low-current (<15mA) laser diode with its own
  resistor built in, direct-drive from D7 is fine.)

  SET YOUR WIFI CREDENTIALS BELOW, then flash and open Serial Monitor @115200
  to see the dashboard URL (also reachable at http://distsensor.local).
  ============================================================================
*/

#include "Adafruit_VL53L0X.h"
#include <ESP8266WebServer.h>
#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <U8g2lib.h>
#include <Wire.h>

// ---------------------------------------------------------------------------
// Pin mapping (Wemos D1 Mini silkscreen labels)
// ---------------------------------------------------------------------------
#define BUTTON_PIN D6 // GPIO12 - physical push button (active LOW)
#define LASER_PIN D7  // GPIO13 - laser control (through transistor/MOSFET)
#define SDA_PIN D2    // GPIO4  - I2C SDA
#define SCL_PIN D1    // GPIO5  - I2C SCL

// ---------------------------------------------------------------------------
// WiFi credentials  --  EDIT THESE
// ---------------------------------------------------------------------------
const char *WIFI_SSID = "STEM";
const char *WIFI_PASSWORD = "STEM@123";

// If WiFi connect fails, device falls back to its own Access Point so the
// dashboard is still reachable:
const char *AP_SSID = "DistSensor-Setup";
const char *AP_PASS = "12345678";

// ---------------------------------------------------------------------------
// Globals
// ---------------------------------------------------------------------------
Adafruit_VL53L0X lox = Adafruit_VL53L0X();
ESP8266WebServer server(80);

// 1.3" SH1106 OLED (I2C, same bus as VL53L0X, address 0x3C)
U8G2_SH1106_128X64_NONAME_F_HW_I2C oled(U8G2_R0, /* reset=*/ U8X8_PIN_NONE);

bool sensorOnline = false;
bool laserOn = false;
bool buttonPressed = false; // debounced physical button state
uint16_t distanceMM = 0;
bool distanceValid = false;

unsigned long lastMeasureMs = 0;
const unsigned long MEASURE_INTERVAL_MS = 100; // ~10 readings/sec while active

// Physical button debounce
bool lastRawButtonState = HIGH;
bool stableButtonState = HIGH;
unsigned long lastDebounceMs = 0;
const unsigned long DEBOUNCE_MS = 40;

// Web dashboard "hold to measure" state (with heartbeat safety timeout)
bool webHold = false;
unsigned long lastWebHoldMs = 0;
const unsigned long WEB_HOLD_TIMEOUT_MS = 1000; // auto-release if no heartbeat

// ===========================================================================
// Dashboard HTML (self-contained, stored in flash, no external dependencies)
// ===========================================================================
const char DASHBOARD_HTML[] PROGMEM = R"HTMLPAGE(
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>Distance Sensor Dashboard</title>
<style>
  :root{
    --bg:#0b0f14; --card:#131a22; --border:#212b36;
    --text:#e8edf2; --muted:#7c8b9b;
    --green:#38d996; --red:#ff5d5d; --amber:#ffb84d; --blue:#4da3ff;
  }
  *{box-sizing:border-box;}
  body{
    margin:0; min-height:100vh; background:radial-gradient(circle at 50% -10%, #1a2530, var(--bg) 60%);
    color:var(--text); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
    display:flex; flex-direction:column; align-items:center; padding:24px 16px 48px;
  }
  h1{font-size:18px; font-weight:600; letter-spacing:.3px; margin:0 0 4px; color:var(--text);}
  .sub{color:var(--muted); font-size:13px; margin-bottom:24px;}

  .status-row{display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-bottom:22px;}
  .pill{
    display:flex; align-items:center; gap:7px; background:var(--card); border:1px solid var(--border);
    padding:7px 13px; border-radius:999px; font-size:12.5px; color:var(--muted);
  }
  .dot{width:8px; height:8px; border-radius:50%; background:var(--muted); flex:none;}
  .dot.on{background:var(--green); box-shadow:0 0 8px var(--green);}
  .dot.off{background:#3a4552;}
  .dot.bad{background:var(--red); box-shadow:0 0 8px var(--red);}

  .card{
    width:100%; max-width:380px; background:var(--card); border:1px solid var(--border);
    border-radius:20px; padding:32px 24px; text-align:center; margin-bottom:18px;
    box-shadow:0 10px 40px rgba(0,0,0,.35);
  }
  .distance-label{color:var(--muted); font-size:13px; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px;}
  .distance-value{
    font-size:64px; font-weight:700; line-height:1; font-variant-numeric:tabular-nums;
    transition:color .15s ease;
  }
  .distance-unit{font-size:20px; color:var(--muted); margin-left:6px; font-weight:500;}
  .distance-cm{color:var(--muted); font-size:15px; margin-top:8px; font-variant-numeric:tabular-nums;}

  .laser-badge{
    display:inline-flex; align-items:center; gap:8px; margin-top:18px; padding:6px 16px;
    border-radius:999px; font-size:12.5px; font-weight:600; letter-spacing:.4px;
    background:#1a222c; color:var(--muted); border:1px solid var(--border);
  }
  .laser-badge.active{color:#0b0f14; background:var(--red); border-color:var(--red);
    box-shadow:0 0 18px rgba(255,93,93,.55);}

  #holdBtn{
    width:100%; max-width:380px; padding:20px; border-radius:18px; border:none;
    background:linear-gradient(180deg,#1c68e0,#1653b3); color:#fff; font-size:16px; font-weight:700;
    letter-spacing:.4px; cursor:pointer; user-select:none; -webkit-user-select:none;
    box-shadow:0 8px 24px rgba(29,104,224,.35); transition:transform .08s ease, box-shadow .08s ease;
    touch-action:none;
  }
  #holdBtn:active, #holdBtn.pressed{
    transform:scale(.97); box-shadow:0 4px 14px rgba(29,104,224,.25);
    background:linear-gradient(180deg,#154fac,#0f3d86);
  }
  .hint{color:var(--muted); font-size:12px; margin-top:10px; text-align:center; max-width:380px; line-height:1.5;}
  .footer{color:#48566a; font-size:11.5px; margin-top:26px;}
</style>
</head>
<body>

  <h1>Distance Sensor Dashboard</h1>
  <div class="sub">VL53L0X &middot; Wemos D1 Mini</div>

  <div class="status-row">
    <div class="pill"><span class="dot on"></span>Server</div>
    <div class="pill"><span id="dotSensor" class="dot off"></span><span id="sensorText">Sensor</span></div>
    <div class="pill"><span id="dotButton" class="dot off"></span><span id="buttonText">Button</span></div>
    <div class="pill" id="uptimePill">Uptime --</div>
  </div>

  <div class="card">
    <div class="distance-label">Live Distance</div>
    <div>
      <span id="distValue" class="distance-value">--</span><span class="distance-unit">mm</span>
    </div>
    <div id="distCm" class="distance-cm">-- cm</div>
    <div id="laserBadge" class="laser-badge">LASER OFF</div>
  </div>

  <button id="holdBtn">HOLD TO MEASURE</button>
  <div class="hint">Press &amp; hold the physical button on the device, or hold this
    button on screen. The laser fires and the reading updates live only while held.</div>

  <div class="footer">Reachable at http://distsensor.local</div>

<script>
  const distValue   = document.getElementById('distValue');
  const distCm      = document.getElementById('distCm');
  const laserBadge  = document.getElementById('laserBadge');
  const dotSensor   = document.getElementById('dotSensor');
  const sensorText  = document.getElementById('sensorText');
  const dotButton   = document.getElementById('dotButton');
  const buttonText  = document.getElementById('buttonText');
  const uptimePill  = document.getElementById('uptimePill');
  const holdBtn     = document.getElementById('holdBtn');

  function fmtUptime(s){
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    return (h?h+"h ":"") + (m?m+"m ":"") + sec + "s";
  }

  async function poll(){
    try{
      const res = await fetch('/api/status', {cache:'no-store'});
      const d = await res.json();

      dotSensor.className = 'dot ' + (d.sensor_online ? 'on' : 'bad');
      sensorText.textContent = d.sensor_online ? 'Sensor OK' : 'Sensor Offline';

      dotButton.className = 'dot ' + (d.button_pressed ? 'on' : 'off');
      buttonText.textContent = d.button_pressed ? 'Button Held' : 'Button';

      uptimePill.textContent = 'Uptime ' + fmtUptime(d.uptime_s);

      if(d.laser_on){
        laserBadge.textContent = 'LASER ON \u2022 MEASURING';
        laserBadge.classList.add('active');
      } else {
        laserBadge.textContent = 'LASER OFF';
        laserBadge.classList.remove('active');
      }

      if(d.laser_on && d.distance_valid){
        distValue.textContent = d.distance_mm;
        distValue.style.color = d.distance_mm < 100 ? 'var(--red)'
                               : d.distance_mm < 400 ? 'var(--amber)'
                               : 'var(--green)';
        distCm.textContent = (d.distance_mm/10).toFixed(1) + ' cm';
      } else if (d.laser_on && !d.distance_valid){
        distValue.textContent = 'OOR';
        distValue.style.color = 'var(--muted)';
        distCm.textContent = 'out of range';
      } else {
        distValue.textContent = '--';
        distValue.style.color = 'var(--text)';
        distCm.textContent = '-- cm';
      }
    }catch(e){
      dotSensor.className = 'dot bad';
      sensorText.textContent = 'Connection lost';
    }
  }
  setInterval(poll, 250);
  poll();

  // Hold-to-measure button: sends state=1 as a heartbeat every 300ms while
  // held, and state=0 the moment it's released. Device auto-releases after
  // 1s without a heartbeat, so a dropped connection can't leave laser stuck on.
  let holdTimer = null;
  function sendHold(state){
    fetch('/api/trigger?state=' + (state ? '1':'0'), {method:'POST'}).catch(()=>{});
  }
  function startHold(e){
    e.preventDefault();
    holdBtn.classList.add('pressed');
    sendHold(1);
    if(holdTimer) clearInterval(holdTimer);
    holdTimer = setInterval(()=>sendHold(1), 300);
  }
  function endHold(e){
    if(e) e.preventDefault();
    holdBtn.classList.remove('pressed');
    if(holdTimer){ clearInterval(holdTimer); holdTimer = null; }
    sendHold(0);
  }
  holdBtn.addEventListener('pointerdown', startHold);
  holdBtn.addEventListener('pointerup', endHold);
  holdBtn.addEventListener('pointerleave', endHold);
  holdBtn.addEventListener('pointercancel', endHold);
  window.addEventListener('blur', endHold);
</script>
</body>
</html>
)HTMLPAGE";

// ===========================================================================
// WiFi
// ===========================================================================
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print(F("Connecting to WiFi"));

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(300);
    Serial.print(F("."));
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print(F("Connected. Dashboard: http://"));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println(F("WiFi connect failed -> starting fallback Access Point"));
    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASS);
    Serial.print(F("Connect to WiFi \""));
    Serial.print(AP_SSID);
    Serial.print(F("\" (password: "));
    Serial.print(AP_PASS);
    Serial.print(F(") then open http://"));
    Serial.println(WiFi.softAPIP());
  }
}

// ===========================================================================
// Web server handlers
// ===========================================================================
void handleRoot() { server.send_P(200, "text/html", DASHBOARD_HTML); }

void handleStatus() {
  String json = "{";
  json += "\"distance_mm\":" + String(distanceMM) + ",";
  json +=
      "\"distance_valid\":" + String(distanceValid ? "true" : "false") + ",";
  json += "\"laser_on\":" + String(laserOn ? "true" : "false") + ",";
  json +=
      "\"button_pressed\":" + String(buttonPressed ? "true" : "false") + ",";
  json += "\"sensor_online\":" + String(sensorOnline ? "true" : "false") + ",";
  json += "\"uptime_s\":" + String(millis() / 1000);
  json += "}";
  server.sendHeader("Cache-Control", "no-store");
  server.send(200, "application/json", json);
}

void handleTrigger() {
  if (!server.hasArg("state")) {
    server.send(400, "text/plain", "missing 'state' arg");
    return;
  }
  webHold = server.arg("state") == "1";
  lastWebHoldMs = millis();
  server.send(200, "text/plain", "OK");
}

void handleNotFound() { server.send(404, "text/plain", "Not found"); }

// ===========================================================================
// Sensor / button / laser logic
// ===========================================================================
void handleButton() {
  bool raw = digitalRead(BUTTON_PIN); // LOW = pressed (pull-up wiring)

  if (raw != lastRawButtonState) {
    lastDebounceMs = millis();
    lastRawButtonState = raw;
  }
  if (millis() - lastDebounceMs > DEBOUNCE_MS) {
    stableButtonState = raw;
  }
  buttonPressed = (stableButtonState == LOW);
}

void takeMeasurement() {
  if (!sensorOnline) {
    distanceValid = false;
    return;
  }
  VL53L0X_RangingMeasurementData_t measure;
  lox.rangingTest(&measure, false);
  if (measure.RangeStatus != 4) { // 4 == out of range / phase fail
    distanceMM = measure.RangeMilliMeter;
    distanceValid = true;
  } else {
    distanceValid = false;
  }
}

void handleMeasurement() {
  // Safety: auto-release web hold if heartbeat stopped
  if (webHold && millis() - lastWebHoldMs > WEB_HOLD_TIMEOUT_MS) {
    webHold = false;
  }

  bool active = buttonPressed || webHold;

  if (active) {
    if (!laserOn) {
      laserOn = true;
      digitalWrite(LASER_PIN, HIGH);
    }
    if (millis() - lastMeasureMs >= MEASURE_INTERVAL_MS) {
      lastMeasureMs = millis();
      takeMeasurement();
    }
  } else {
    if (laserOn) {
      laserOn = false;
      digitalWrite(LASER_PIN, LOW);
    }
  }
}

// ===========================================================================
// OLED display update
// ===========================================================================
void updateDisplay() {
  oled.clearBuffer();

  // Title bar
  oled.setFont(u8g2_font_7x13B_tr);
  oled.drawStr(4, 12, "DIST TRACKER");

  // Laser status indicator (top-right)
  if (laserOn) {
    oled.drawStr(98, 12, "[ON]");
  } else {
    oled.drawStr(93, 12, "[OFF]");
  }

  // Divider line
  oled.drawHLine(0, 15, 128);

  if (laserOn && distanceValid) {
    // Large distance value in mm
    char buf[16];
    snprintf(buf, sizeof(buf), "%u mm", distanceMM);
    oled.setFont(u8g2_font_logisoso20_tr);
    // Center the text
    int w = oled.getStrWidth(buf);
    oled.drawStr((128 - w) / 2, 42, buf);

    // Distance in cm below
    char cmBuf[16];
    float cm = distanceMM / 10.0;
    dtostrf(cm, 4, 1, cmBuf);
    strcat(cmBuf, " cm");
    oled.setFont(u8g2_font_7x13_tr);
    w = oled.getStrWidth(cmBuf);
    oled.drawStr((128 - w) / 2, 57, cmBuf);
  } else if (laserOn && !distanceValid) {
    oled.setFont(u8g2_font_logisoso20_tr);
    oled.drawStr(16, 42, "OOR");
    oled.setFont(u8g2_font_7x13_tr);
    oled.drawStr(20, 57, "Out of range");
  } else {
    oled.setFont(u8g2_font_7x13_tr);
    oled.drawStr(12, 38, "Press button");
    oled.drawStr(20, 52, "to measure");
  }

  // Bottom bar: IP address
  oled.drawHLine(0, 55, 128);
  oled.setFont(u8g2_font_5x8_tr);
  String ip = WiFi.status() == WL_CONNECTED
    ? WiFi.localIP().toString()
    : WiFi.softAPIP().toString();
  String ipLine = "IP: " + ip;
  oled.drawStr(2, 64, ipLine.c_str());

  oled.sendBuffer();
}

// ===========================================================================
// Setup / Loop
// ===========================================================================
void setup() {
  Serial.begin(115200);
  delay(50);
  Serial.println();
  Serial.println(F("=== Distance Sensor Dashboard ==="));

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LASER_PIN, OUTPUT);
  digitalWrite(LASER_PIN, LOW);

  Wire.begin(SDA_PIN, SCL_PIN);

  // Initialize OLED display
  oled.begin();
  oled.setContrast(200);
  oled.clearBuffer();
  oled.setFont(u8g2_font_7x13B_tr);
  oled.drawStr(10, 28, "Smart Distance");
  oled.drawStr(30, 44, "Tracker");
  oled.setFont(u8g2_font_5x8_tr);
  oled.drawStr(14, 60, "Usha M. & Prem S.");
  oled.sendBuffer();
  delay(1500);

  Serial.print(F("Initializing VL53L0X... "));
  if (lox.begin()) {
    sensorOnline = true;
    Serial.println(F("OK"));
  } else {
    sensorOnline = false;
    Serial.println(F("FAILED - check wiring / power. Retrying in background."));
  }

  connectWiFi();

  if (MDNS.begin("distsensor")) {
    Serial.println(F("mDNS started: http://distsensor.local"));
  }

  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/trigger", HTTP_POST, handleTrigger);
  server.onNotFound(handleNotFound);
  server.begin();
  Serial.println(F("HTTP server started"));
}

void loop() {
  server.handleClient();
  MDNS.update();

  handleButton();
  handleMeasurement();
  updateDisplay();

  // If the sensor failed to init at boot, retry occasionally without
  // blocking the rest of the loop.
  static unsigned long lastRetryMs = 0;
  if (!sensorOnline && millis() - lastRetryMs > 5000) {
    lastRetryMs = millis();
    if (lox.begin()) {
      sensorOnline = true;
      Serial.println(F("VL53L0X came online"));
    }
  }
}
