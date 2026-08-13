// comment for this is vacum robot car code
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include "vacuum_config.h"
#include "vacuum_web.h"

// --- GLOBAL VARIABLES DEFINITION ---
ESP8266WebServer server(80);
int currentSpeed      = 200;    // Default base PWM Speed (0-255)
int leftMotorPWM      = 0;      // Active PWM applied to Motor A
int rightMotorPWM     = 0;      // Active PWM applied to Motor B
bool vacuumRelayState = false;  // False = Relay OFF, True = Relay ON
String currentAction  = "STOP";
String wifiStatusStr  = "Initializing...";
String resetReasonStr = "";
int joystickX         = 0;
int joystickY         = 0;

// --- VACUUM AIR PUMP RELAY CONTROL ---
void setVacuumPump(bool enable) {
  vacuumRelayState = enable;
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(RELAY_PIN, enable ? LOW : HIGH);
  } else {
    digitalWrite(RELAY_PIN, enable ? HIGH : LOW);
  }
  Serial.print("[VACUUM PUMP RELAY] State updated -> ");
  Serial.println(enable ? "ACTIVE (ON)" : "STANDBY (OFF)");
}

// --- MOTOR DRIVER HELPER FUNCTIONS ---
void applyMotorDriver(int in1, int in2, int in3, int in4, int speedA, int speedB) {
  leftMotorPWM  = constrain(speedA, 0, 255);
  rightMotorPWM = constrain(speedB, 0, 255);

  digitalWrite(IN1, in1);
  digitalWrite(IN2, in2);
  digitalWrite(IN3, in3);
  digitalWrite(IN4, in4);
  
  analogWrite(ENA, leftMotorPWM);
  analogWrite(ENB, rightMotorPWM);
}

// Differential steering based on 2D Joystick X, Y displacement vectors
void driveDifferential(int x, int y, int speed) {
  joystickX = x;
  joystickY = y;
  currentSpeed = speed;

  if (x == 0 && y == 0) {
    currentAction = "STOP";
    applyMotorDriver(LOW, LOW, LOW, LOW, 0, 0);
    return;
  }

  currentAction = "JOYSTICK";

  // Calculate left and right motor proportional mix
  // y is forward (+100) / backward (-100)
  // x is right (+100) / left (-100)
  int leftMotor  = y + x;
  int rightMotor = y - x;

  leftMotor  = constrain(leftMotor, -100, 100);
  rightMotor = constrain(rightMotor, -100, 100);

  // Map to PWM scale using overall speed displacement
  int leftPWM  = map(abs(leftMotor), 0, 100, 0, speed);
  int rightPWM = map(abs(rightMotor), 0, 100, 0, speed);

  int in1 = (leftMotor >= 0)  ? HIGH : LOW;
  int in2 = (leftMotor >= 0)  ? LOW  : HIGH;
  int in3 = (rightMotor >= 0) ? HIGH : LOW;
  int in4 = (rightMotor >= 0) ? LOW  : HIGH;

  applyMotorDriver(in1, in2, in3, in4, leftPWM, rightPWM);
}

// Legacy directional controls (for fallback backwards-compatibility)
void driveDirection(String dir) {
  currentAction = dir;
  joystickX = 0;
  joystickY = 0;

  if (dir == "FWD") {
    applyMotorDriver(HIGH, LOW, HIGH, LOW, currentSpeed, currentSpeed);
  } else if (dir == "BWD") {
    applyMotorDriver(LOW, HIGH, LOW, HIGH, currentSpeed, currentSpeed);
  } else if (dir == "LEFT") {
    applyMotorDriver(LOW, HIGH, HIGH, LOW, currentSpeed, currentSpeed); // Spin left
  } else if (dir == "RIGHT") {
    applyMotorDriver(HIGH, LOW, LOW, HIGH, currentSpeed, currentSpeed); // Spin right
  } else { // STOP
    applyMotorDriver(LOW, LOW, LOW, LOW, 0, 0);
  }
}

// --- WEB ROUTE HANDLERS ---
void handleRoot() {
  server.send(200, "text/html", INDEX_HTML);
}

void handleControl() {
  // Handle Vacuum Air Pump Relay Argument
  if (server.hasArg("vacuum")) {
    String val = server.arg("vacuum");
    bool enable = (val == "1" || val == "on" || val == "true");
    setVacuumPump(enable);
  }

  // Handle Proportional Joystick Control Vector (x, y, speed)
  if (server.hasArg("x") && server.hasArg("y")) {
    int x = server.arg("x").toInt();
    int y = server.arg("y").toInt();
    int speed = server.hasArg("speed") ? server.arg("speed").toInt() : currentSpeed;
    driveDifferential(x, y, speed);
  } 
  // Handle Legacy Direction Argument
  else if (server.hasArg("dir")) {
    String dir = server.arg("dir");
    driveDirection(dir);
  }

  // Handle Manual Speed Slider Override
  if (server.hasArg("speed") && !server.hasArg("x")) {
    currentSpeed = constrain(server.arg("speed").toInt(), 0, 255);
    if (currentAction != "JOYSTICK") {
      driveDirection(currentAction);
    }
  }

  server.send(200, "text/plain", "OK");
}

void handleStatus() {
  String json = "{";
  json += "\"wifi_mode\":\"" + wifiStatusStr + "\",";
  json += "\"ssid\":\"" + String(WiFi.status() == WL_CONNECTED ? primary_ssid : ap_ssid) + "\",";
  json += "\"ip\":\"" + (WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString()) + "\",";
  json += "\"ap_ip\":\"" + WiFi.softAPIP().toString() + "\",";
  json += "\"mdns\":\"" + String(mdns_hostname) + ".local\",";
  json += "\"rssi\":" + String(WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : 0) + ",";
  json += "\"vacuum_relay\":" + String(vacuumRelayState ? "true" : "false") + ",";
  json += "\"vacuum_status\":\"" + String(vacuumRelayState ? "PUMP ACTIVE" : "PUMP OFF") + "\",";
  json += "\"speed\":" + String(currentSpeed) + ",";
  json += "\"speed_percentage\":" + String(map(currentSpeed, 0, 255, 0, 100)) + ",";
  json += "\"current_action\":\"" + currentAction + "\",";
  json += "\"joystick_x\":" + String(joystickX) + ",";
  json += "\"joystick_y\":" + String(joystickY) + ",";
  json += "\"reset_reason\":\"" + resetReasonStr + "\",";
  json += "\"uptime\":" + String(millis() / 1000) + ",";
  json += "\"free_heap\":" + String(ESP.getFreeHeap()) + ",";
  json += "\"chip_id\":\"0x" + String(ESP.getChipId(), HEX) + "\",";
  json += "\"body_model\":\"Thingiverse 5116129 (Marcus Lanzoni 3D Vacuum)\"";
  json += "}";
  server.send(200, "application/json", json);
}

// --- SETUP AND INITIALIZATION ---
void setup() {
  Serial.begin(115200);
  delay(500);

  // Initialize Relay Pin
  pinMode(RELAY_PIN, OUTPUT);
  setVacuumPump(false); // Default Relay to OFF on startup

  // Set Motor Pins as Output
  pinMode(ENA, OUTPUT);
  pinMode(ENB, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  // Set ESP8266 PWM range to 0-255
  analogWriteRange(255);
  driveDirection("STOP");

  // Read ESP8266 Reset Reason
  resetReasonStr = ESP.getResetReason();
  Serial.println("\n-------------------------------------------");
  Serial.println("SYSTEM BOOTING - SMART VACUUM ROBOT");
  Serial.println("BODY CHASSIS: Thingiverse 5116129 (Marcus Lanzoni)");
  Serial.print("SYSTEM RESET REASON: ");
  Serial.println(resetReasonStr);
  Serial.println("-------------------------------------------");

  // Attempt WiFi Connection (STA Mode)
  WiFi.mode(WIFI_STA);
  WiFi.begin(primary_ssid, primary_password);
  Serial.print("Connecting to primary WiFi: ");
  Serial.println(primary_ssid);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) { // 10s Timeout
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiStatusStr = "STA Mode (" + String(primary_ssid) + ")";
    Serial.println("\n[SUCCESS] Connected to WiFi!");
    Serial.print("[IP ADDRESS] ");
    Serial.println(WiFi.localIP());
  } else {
    // Fallback to Access Point (AP Mode)
    Serial.println("\n[WARNING] WiFi Connection Failed! Starting Access Point...");
    WiFi.mode(WIFI_AP);
    WiFi.softAP(ap_ssid, ap_password);
    wifiStatusStr = "AP Mode (" + String(ap_ssid) + ")";
    Serial.print("[AP IP ADDRESS] ");
    Serial.println(WiFi.softAPIP());
  }

  // Setup mDNS Service (vacuum.local)
  if (MDNS.begin(mdns_hostname)) {
    Serial.print("[mDNS] Started: http://");
    Serial.print(mdns_hostname);
    Serial.println(".local/");
    MDNS.addService("http", "tcp", 80);
  } else {
    Serial.println("[mDNS] Error setting up mDNS responder!");
  }

  // Configure Server Routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/control", HTTP_GET, handleControl);
  server.on("/status", HTTP_GET, handleStatus);

  server.begin();
  Serial.println("[HTTP SERVER] Started successfully.");
}

void loop() {
  server.handleClient();
  MDNS.update();
}