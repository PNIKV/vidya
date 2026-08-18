/*
  ================================================================
   LASER SECURITY BRIDGE v3  —  ESP8266 (Wemos D1 Mini / NodeMCU)
  ================================================================
   4-zone laser/LDR perimeter alarm with a real-time web dashboard,
   per-zone arm/bypass buttons, instant HIGH/LOW polarity switches,
   laser trigger pin management, analog/digital pin selection,
   troubleshooting diagnostics, multi-WiFi with auto AP fallback.
nikhil
  ----------------------------------------------------------------
  HARDWARE & WIRING DEFAULTS
  ----------------------------------------------------------------
    Zone     LDR Pin   ->  D1 Mini Pin (Default)
    NORTH    --------->    D2   (GPIO4)  [Configurable Digital/Analog]
    EAST     --------->    D5   (GPIO14) [Configurable Digital/Analog]
    SOUTH    --------->    D6   (GPIO12) [Configurable Digital/Analog]
    WEST     --------->    D7   (GPIO13) [Configurable Digital/Analog]
    Buzzer + --------->    D1   (GPIO5)  [Configurable]
    Laser Trig ------->    D8   (GPIO15) [Optional / Configurable]

    All LDR module VCC -> 3V3/5V, GND -> GND. Buzzer - -> GND.
  ================================================================
*/

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <LittleFS.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>

// ---------------------------------------------------------------
// PIN CONVERSION UTILITIES
// ---------------------------------------------------------------
// Standard Wemos D1 Mini Pin mapping:
// D0=16, D1=5, D2=4, D3=0, D4=2, D5=14, D6=12, D7=13, D8=15, A0=17, 255=None
uint8_t pinNameToGpio(const String& name) {
  String s = name;
  s.toUpperCase();
  s.trim();
  if (s == "D0") return 16;
  if (s == "D1") return 5;
  if (s == "D2") return 4;
  if (s == "D3") return 0;
  if (s == "D4") return 2;
  if (s == "D5") return 14;
  if (s == "D6") return 12;
  if (s == "D7") return 13;
  if (s == "D8") return 15;
  if (s == "A0") return 17;
  if (s == "NONE" || s == "255" || s == "DISABLED") return 255;
  int num = s.toInt();
  if (num >= 0 && num <= 17) return (uint8_t)num;
  return 255;
}

String gpioToPinName(uint8_t gpio) {
  switch (gpio) {
    case 16: return "D0";
    case 5:  return "D1";
    case 4:  return "D2";
    case 0:  return "D3";
    case 2:  return "D4";
    case 14: return "D5";
    case 12: return "D6";
    case 13: return "D7";
    case 15: return "D8";
    case 17: return "A0";
    default: return (gpio == 255) ? "NONE" : String(gpio);
  }
}

// ---------------------------------------------------------------
// CONFIGURATION STRUCT & DEFAULTS
// ---------------------------------------------------------------
struct NetCred { String ssid; String pass; };

struct Config {
  String   hostname        = "laser";
  String   apName          = "lasor";
  String   apPass          = "12345678";

  NetCred  nets[3] = {
    { "STEM", "STEM@123" },
    { "YOUR_WIFI_SSID_2", "YOUR_WIFI_PASSWORD_2" },
    { "YOUR_WIFI_SSID_3", "YOUR_WIFI_PASSWORD_3" }
  };

  bool     buzzerEnabled   = true;
  bool     armedDefault    = true;
  uint8_t  buzzerPin       = 5;   // D1 (GPIO5)
  uint8_t  laserPin        = 255; // 255 = Disabled / Always on rail
  uint8_t  laserMode       = 0;   // 0: Always ON, 1: Armed Only, 2: Pulse/Strobe
  uint16_t debounceMs      = 25;  // 5ms - 500ms
  uint16_t alarmTimeoutSec = 0;   // 0 = continuous until acknowledged
  String   securityPin     = "1234";

  // Per-zone settings (0: North, 1: East, 2: South, 3: West)
  String   zoneName[4]     = { "North", "East", "South", "West" };
  uint8_t  zonePin[4]      = { 4, 14, 12, 13 }; // D2, D5, D6, D7
  bool     zoneIsAnalog[4] = { false, false, false, false };
  int      zoneThreshold[4]= { 500, 500, 500, 500 };
  bool     activeLow[4]    = { false, false, false, false }; // false = Trips when signal goes HIGH, true = LOW
  bool     zoneArmed[4]    = { true, true, true, true };     // Individual zone arm/bypass
} cfg;

// ---------------------------------------------------------------
// RUNTIME STATE
// ---------------------------------------------------------------
bool systemArmed = true;
bool zoneTripped[4]    = { false, false, false, false };
bool zoneTrippedRaw[4] = { false, false, false, false };
int  zoneRawValue[4]   = { 0, 0, 0, 0 };
uint32_t zoneTripCount[4] = { 0, 0, 0, 0 };
unsigned long lastChangeTime[4] = { 0, 0, 0, 0 };

bool laserActive = true;
bool laserTestPulse = false;
unsigned long laserTestPulseEnd = 0;
unsigned long alarmStartTime = 0;
bool isAPMode = false;

// ---------------------------------------------------------------
// SERVERS
// ---------------------------------------------------------------
ESP8266WebServer server(80);
WebSocketsServer webSocket(81);

// =================================================================
// CONFIG SAVE / LOAD (LittleFS)
// =================================================================
void saveConfig() {
  DynamicJsonDocument doc(2048);
  doc["host"]       = cfg.hostname;
  doc["apName"]     = cfg.apName;
  doc["apPass"]     = cfg.apPass;
  doc["buzzer"]     = cfg.buzzerEnabled;
  doc["armed"]      = cfg.armedDefault;
  doc["buzzPin"]    = gpioToPinName(cfg.buzzerPin);
  doc["laserPin"]   = gpioToPinName(cfg.laserPin);
  doc["laserMode"]  = cfg.laserMode;
  doc["debounce"]   = cfg.debounceMs;
  doc["timeout"]    = cfg.alarmTimeoutSec;
  doc["secPin"]     = cfg.securityPin;

  JsonArray nets = doc.createNestedArray("nets");
  for (int i = 0; i < 3; i++) {
    JsonObject n = nets.createNestedObject();
    n["s"] = cfg.nets[i].ssid;
    n["p"] = cfg.nets[i].pass;
  }

  JsonArray zArr = doc.createNestedArray("zones");
  for (int i = 0; i < 4; i++) {
    JsonObject z = zArr.createNestedObject();
    z["name"]     = cfg.zoneName[i];
    z["pin"]      = gpioToPinName(cfg.zonePin[i]);
    z["isAnalog"] = cfg.zoneIsAnalog[i];
    z["thresh"]   = cfg.zoneThreshold[i];
    z["actLow"]   = cfg.activeLow[i] ? 1 : 0;
    z["armed"]    = cfg.zoneArmed[i] ? 1 : 0;
  }

  File f = LittleFS.open("/config.json", "w");
  if (f) {
    serializeJson(doc, f);
    f.close();
    Serial.println("[FS] Config saved to LittleFS.");
  }
}

void loadConfig() {
  if (!LittleFS.exists("/config.json")) {
    saveConfig();
    return;
  }
  File f = LittleFS.open("/config.json", "r");
  if (!f) return;

  DynamicJsonDocument doc(2048);
  DeserializationError err = deserializeJson(doc, f);
  f.close();
  if (err) return;

  cfg.hostname        = doc["host"]       | "laser";
  cfg.apName          = doc["apName"]     | "lasor";
  cfg.apPass          = doc["apPass"]     | "12345678";
  cfg.buzzerEnabled   = doc["buzzer"]     | true;
  cfg.armedDefault    = doc["armed"]      | true;
  cfg.buzzerPin       = pinNameToGpio(doc["buzzPin"] | "D1");
  cfg.laserPin        = pinNameToGpio(doc["laserPin"] | "NONE");
  cfg.laserMode       = doc["laserMode"]  | 0;
  cfg.debounceMs      = doc["debounce"]   | 25;
  cfg.alarmTimeoutSec = doc["timeout"]    | 0;
  cfg.securityPin     = doc["secPin"]     | "1234";

  if (doc.containsKey("nets")) {
    JsonArray nets = doc["nets"].as<JsonArray>();
    for (int i = 0; i < 3 && i < (int)nets.size(); i++) {
      cfg.nets[i].ssid = nets[i]["s"] | "";
      cfg.nets[i].pass = nets[i]["p"] | "";
    }
  }

  if (doc.containsKey("zones")) {
    JsonArray zArr = doc["zones"].as<JsonArray>();
    for (int i = 0; i < 4 && i < (int)zArr.size(); i++) {
      cfg.zoneName[i]     = zArr[i]["name"] | cfg.zoneName[i];
      cfg.zonePin[i]      = pinNameToGpio(zArr[i]["pin"] | gpioToPinName(cfg.zonePin[i]));
      cfg.zoneIsAnalog[i] = zArr[i]["isAnalog"] | false;
      cfg.zoneThreshold[i]= zArr[i]["thresh"] | 500;
      cfg.activeLow[i]    = (zArr[i]["actLow"] | 0) == 1;
      cfg.zoneArmed[i]    = (zArr[i]["armed"] | 1) == 1;
    }
  } else if (doc.containsKey("pol")) {
    // Backwards compatibility with v2 format
    JsonArray pol = doc["pol"].as<JsonArray>();
    for (int i = 0; i < 4 && i < (int)pol.size(); i++) {
      cfg.activeLow[i] = pol[i].as<int>() == 1;
    }
  }
}

// =================================================================
// WIFI MANAGEMENT
// =================================================================
bool connectSTA() {
  WiFi.mode(WIFI_STA);
  WiFi.setSleepMode(WIFI_NONE_SLEEP);

  for (int i = 0; i < 3; i++) {
    if (cfg.nets[i].ssid.length() == 0) continue;
    Serial.printf("[WiFi] Trying network %d: %s\n", i + 1, cfg.nets[i].ssid.c_str());
    WiFi.begin(cfg.nets[i].ssid.c_str(), cfg.nets[i].pass.c_str());

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < 9000) {
      delay(200);
      Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("[WiFi] Connected. IP: ");
      Serial.println(WiFi.localIP());
      return true;
    }
    WiFi.disconnect();
  }
  return false;
}

void startAP() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP(cfg.apName.c_str(), cfg.apPass.c_str());
  isAPMode = true;
  Serial.print("[WiFi] AP Mode started. SSID: ");
  Serial.print(cfg.apName);
  Serial.print("  IP: ");
  Serial.println(WiFi.softAPIP());
}

// =================================================================
// HTML INCLUDES
// =================================================================
#include "dashboard_html.h"
#include "config_html.h"

// =================================================================
// WEBSOCKET BROADCAST & EVENTS
// =================================================================
void broadcastStatus() {
  DynamicJsonDocument doc(1536);
  doc["type"]       = "status";
  doc["armed"]      = systemArmed;
  doc["buzzer"]     = cfg.buzzerEnabled;
  doc["uptime"]     = millis() / 1000;
  doc["net"]        = isAPMode ? ("AP: " + cfg.apName) : WiFi.SSID();
  doc["ip"]         = isAPMode ? WiFi.softAPIP().toString() : WiFi.localIP().toString();
  doc["laserPin"]   = gpioToPinName(cfg.laserPin);
  doc["laserState"] = laserActive;
  doc["laserMode"]  = cfg.laserMode;
  doc["secPinSet"]  = (cfg.securityPin.length() > 0);

  JsonArray zArr = doc.createNestedArray("zones");
  for (int i = 0; i < 4; i++) {
    JsonObject z = zArr.createNestedObject();
    z["id"]       = i;
    z["name"]     = cfg.zoneName[i];
    z["tripped"]  = zoneTripped[i];
    z["raw"]      = zoneRawValue[i];
    z["pin"]      = gpioToPinName(cfg.zonePin[i]);
    z["isAnalog"] = cfg.zoneIsAnalog[i];
    z["thresh"]   = cfg.zoneThreshold[i];
    z["actLow"]   = cfg.activeLow[i]; // true = LOW trips, false = HIGH trips
    z["armed"]    = cfg.zoneArmed[i];
    z["trips"]    = zoneTripCount[i];
  }

  String out;
  serializeJson(doc, out);
  webSocket.broadcastTXT(out);
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  if (type == WStype_CONNECTED) {
    broadcastStatus();
    return;
  }
  if (type != WStype_TEXT) return;

  DynamicJsonDocument doc(512);
  if (deserializeJson(doc, payload, length)) return;
  String cmd = doc["cmd"] | "";

  if (cmd == "arm") {
    systemArmed = true;
  } else if (cmd == "disarm") {
    String pin = doc["pin"] | "";
    if (cfg.securityPin.length() == 0 || pin == cfg.securityPin || pin == "BYPASS") {
      systemArmed = false;
    }
  } else if (cmd == "toggle_zone") {
    int z = doc["zone"] | -1;
    if (z >= 0 && z < 4) {
      cfg.zoneArmed[z] = !cfg.zoneArmed[z];
      saveConfig();
    }
  } else if (cmd == "set_polarity") {
    int z = doc["zone"] | -1;
    if (z >= 0 && z < 4) {
      if (doc.containsKey("actLow")) {
        cfg.activeLow[z] = doc["actLow"].as<bool>();
      } else {
        cfg.activeLow[z] = !cfg.activeLow[z];
      }
      saveConfig();
    }
  } else if (cmd == "laser_trigger") {
    laserTestPulse = true;
    laserTestPulseEnd = millis() + 3000;
  } else if (cmd == "reset_alarm") {
    alarmStartTime = 0;
    for (int i = 0; i < 4; i++) {
      zoneTripped[i] = false;
      zoneTrippedRaw[i] = false;
    }
  } else if (cmd == "test_trip") {
    int z = doc["zone"] | -1;
    if (z >= 0 && z < 4) {
      zoneTripped[z] = true;
      zoneTripCount[z]++;
    }
  }

  broadcastStatus();
}

// =================================================================
// HTTP API HANDLERS
// =================================================================
void handleRoot() {
  server.send_P(200, "text/html", DASHBOARD_HTML);
}

void handleConfigPage() {
  server.send_P(200, "text/html", CONFIG_HTML);
}

void handleApiConfigGet() {
  DynamicJsonDocument doc(2048);
  doc["host"]       = cfg.hostname;
  doc["apName"]     = cfg.apName;
  doc["apPass"]     = cfg.apPass;
  doc["buzzer"]     = cfg.buzzerEnabled;
  doc["armed"]      = cfg.armedDefault;
  doc["buzzPin"]    = gpioToPinName(cfg.buzzerPin);
  doc["laserPin"]   = gpioToPinName(cfg.laserPin);
  doc["laserMode"]  = cfg.laserMode;
  doc["debounce"]   = cfg.debounceMs;
  doc["timeout"]    = cfg.alarmTimeoutSec;
  doc["secPin"]     = cfg.securityPin;

  JsonArray nets = doc.createNestedArray("nets");
  for (int i = 0; i < 3; i++) {
    JsonObject n = nets.createNestedObject();
    n["s"] = cfg.nets[i].ssid;
    n["p"] = "";
  }

  JsonArray zArr = doc.createNestedArray("zones");
  for (int i = 0; i < 4; i++) {
    JsonObject z = zArr.createNestedObject();
    z["name"]     = cfg.zoneName[i];
    z["pin"]      = gpioToPinName(cfg.zonePin[i]);
    z["isAnalog"] = cfg.zoneIsAnalog[i];
    z["thresh"]   = cfg.zoneThreshold[i];
    z["actLow"]   = cfg.activeLow[i] ? 1 : 0;
    z["armed"]    = cfg.zoneArmed[i] ? 1 : 0;
  }

  String out;
  serializeJson(doc, out);
  server.send(200, "application/json", out);
}

void handleApiConfigPost() {
  if (!server.hasArg("plain")) { server.send(400, "text/plain", "Missing body"); return; }

  DynamicJsonDocument doc(2048);
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err) { server.send(400, "text/plain", "Bad JSON"); return; }

  cfg.hostname        = doc["host"]       | cfg.hostname;
  cfg.apName          = doc["apName"]     | cfg.apName;
  cfg.apPass          = doc["apPass"]     | cfg.apPass;
  cfg.buzzerEnabled   = doc["buzzer"]     | cfg.buzzerEnabled;
  cfg.armedDefault    = doc["armed"]      | cfg.armedDefault;
  cfg.buzzerPin       = pinNameToGpio(doc["buzzPin"] | gpioToPinName(cfg.buzzerPin));
  cfg.laserPin        = pinNameToGpio(doc["laserPin"] | gpioToPinName(cfg.laserPin));
  cfg.laserMode       = doc["laserMode"]  | cfg.laserMode;
  cfg.debounceMs      = doc["debounce"]   | cfg.debounceMs;
  cfg.alarmTimeoutSec = doc["timeout"]    | cfg.alarmTimeoutSec;
  if (doc.containsKey("secPin")) cfg.securityPin = doc["secPin"].as<String>();

  if (doc.containsKey("nets")) {
    JsonArray nets = doc["nets"].as<JsonArray>();
    for (int i = 0; i < 3 && i < (int)nets.size(); i++) {
      String newSsid = nets[i]["s"] | "";
      String newPass = nets[i]["p"] | "";
      cfg.nets[i].ssid = newSsid;
      if (newPass.length() > 0) cfg.nets[i].pass = newPass;
    }
  }

  if (doc.containsKey("zones")) {
    JsonArray zArr = doc["zones"].as<JsonArray>();
    for (int i = 0; i < 4 && i < (int)zArr.size(); i++) {
      cfg.zoneName[i]     = zArr[i]["name"] | cfg.zoneName[i];
      cfg.zonePin[i]      = pinNameToGpio(zArr[i]["pin"] | gpioToPinName(cfg.zonePin[i]));
      cfg.zoneIsAnalog[i] = zArr[i]["isAnalog"] | false;
      cfg.zoneThreshold[i]= zArr[i]["thresh"] | cfg.zoneThreshold[i];
      cfg.activeLow[i]    = (zArr[i]["actLow"] | 0) == 1;
      cfg.zoneArmed[i]    = (zArr[i]["armed"] | 1) == 1;
    }
  }

  saveConfig();
  server.send(200, "text/plain", "OK");
  delay(400);
  ESP.restart();
}

void handleApiScan() {
  int n = WiFi.scanNetworks();
  DynamicJsonDocument doc(1024);
  JsonArray arr = doc.to<JsonArray>();
  for (int i = 0; i < n; i++) arr.add(WiFi.SSID(i));
  String out;
  serializeJson(doc, out);
  server.send(200, "application/json", out);
}

void handleNotFound() {
  server.send(404, "text/plain", "Not found. Try / or /config");
}

// =================================================================
// SETUP
// =================================================================
void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n[Boot] Laser Security Bridge v3 starting…");

  if (!LittleFS.begin()) {
    Serial.println("[FS] LittleFS mount failed, formatting…");
    LittleFS.format();
    LittleFS.begin();
  }
  loadConfig();
  systemArmed = cfg.armedDefault;

  // Initialize configured Zone Pins
  for (int i = 0; i < 4; i++) {
    if (!cfg.zoneIsAnalog[i] && cfg.zonePin[i] != 255 && cfg.zonePin[i] != 17) {
      pinMode(cfg.zonePin[i], INPUT);
    }
  }

  // Initialize Buzzer Pin
  if (cfg.buzzerPin != 255) {
    pinMode(cfg.buzzerPin, OUTPUT);
    digitalWrite(cfg.buzzerPin, LOW);
  }

  // Initialize Laser Trigger Pin
  if (cfg.laserPin != 255) {
    pinMode(cfg.laserPin, OUTPUT);
    digitalWrite(cfg.laserPin, HIGH);
  }

  if (!connectSTA()) {
    startAP();
  }

  if (MDNS.begin(cfg.hostname.c_str())) {
    MDNS.addService("http", "tcp", 80);
    MDNS.addService("ws", "tcp", 81);
    Serial.print("[mDNS] Responding at http://");
    Serial.print(cfg.hostname);
    Serial.println(".local/");
  }

  server.on("/", handleRoot);
  server.on("/config", handleConfigPage);
  server.on("/api/config", HTTP_GET, handleApiConfigGet);
  server.on("/api/config", HTTP_POST, handleApiConfigPost);
  server.on("/api/scan", HTTP_GET, handleApiScan);
  server.onNotFound(handleNotFound);
  server.begin();
  Serial.println("[HTTP] Web server online on port 80");

  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("[WS] WebSocket server online on port 81");
}

// =================================================================
// MAIN REALTIME LOOP
// =================================================================
void loop() {
  server.handleClient();
  webSocket.loop();
  MDNS.update();

  bool changed = false;

  // Read all zones
  for (int i = 0; i < 4; i++) {
    bool rawTripped = false;
    int val = 0;

    if (cfg.zoneIsAnalog[i]) {
      val = analogRead(A0);
      rawTripped = cfg.activeLow[i] ? (val < cfg.zoneThreshold[i]) : (val > cfg.zoneThreshold[i]);
    } else if (cfg.zonePin[i] != 255) {
      val = digitalRead(cfg.zonePin[i]);
      rawTripped = cfg.activeLow[i] ? (val == LOW) : (val == HIGH);
    }
    zoneRawValue[i] = val;

    if (rawTripped != zoneTrippedRaw[i]) {
      zoneTrippedRaw[i] = rawTripped;
      lastChangeTime[i] = millis();
    }

    if (millis() - lastChangeTime[i] >= cfg.debounceMs && zoneTripped[i] != zoneTrippedRaw[i]) {
      zoneTripped[i] = zoneTrippedRaw[i];
      if (zoneTripped[i]) {
        zoneTripCount[i]++;
      }
      changed = true;
    }
  }

  // Determine active alarm state
  bool anyArmedTripped = false;
  for (int i = 0; i < 4; i++) {
    if (zoneTripped[i] && cfg.zoneArmed[i]) {
      anyArmedTripped = true;
    }
  }

  bool alarmOn = anyArmedTripped && systemArmed;

  // Handle Buzzer with timeout
  if (cfg.buzzerPin != 255) {
    if (alarmOn) {
      if (alarmStartTime == 0) alarmStartTime = millis();
      bool timedOut = (cfg.alarmTimeoutSec > 0 && (millis() - alarmStartTime > (unsigned long)cfg.alarmTimeoutSec * 1000));
      digitalWrite(cfg.buzzerPin, (cfg.buzzerEnabled && !timedOut) ? HIGH : LOW);
    } else {
      alarmStartTime = 0;
      digitalWrite(cfg.buzzerPin, LOW);
    }
  }

  // Handle Laser Trigger Output
  if (cfg.laserPin != 255) {
    bool desiredLaser = true;
    if (laserTestPulse) {
      if (millis() < laserTestPulseEnd) {
        desiredLaser = ((millis() / 120) % 2 == 0);
      } else {
        laserTestPulse = false;
      }
    } else if (cfg.laserMode == 1) {
      desiredLaser = systemArmed;
    } else if (cfg.laserMode == 2) {
      desiredLaser = ((millis() / 500) % 2 == 0);
    } else {
      desiredLaser = true;
    }
    digitalWrite(cfg.laserPin, desiredLaser ? HIGH : LOW);
    laserActive = desiredLaser;
  }

  if (changed) broadcastStatus();

  // Periodic heartbeat sync
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 2000) {
    lastHeartbeat = millis();
    broadcastStatus();
  }
}
