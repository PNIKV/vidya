// Smart Vacuum Cleaner Robot Car - Main Application Sketch
// Chassis Reference: Thingiverse 5116129 (Marcus Lanzoni 3D Model)

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include "vacuum_config.h"
#include "vacuum_motors.h"
#include "vacuum_sensors.h"
#include "vacuum_wifi.h"
#include "vacuum_web.h"

// --- WIFI CREDENTIALS & NETWORK DEFINITIONS ---
const WiFiCredential PRIMARY_WIFI_NETWORKS[] = {
    {"STEM",       "STEM@123"},                 // Primary WiFi 1
    {"Narshimha",  "Hare_Krishna@4181923"},     // Primary WiFi 2
    {"RobotNet",   "Robot@1234"}                // Primary WiFi 3
};
const int PRIMARY_WIFI_COUNT = sizeof(PRIMARY_WIFI_NETWORKS) / sizeof(PRIMARY_WIFI_NETWORKS[0]);

const char* ap_ssid          = "vacuumBot-AP";
const char* ap_password      = "12345678"; // Minimum 8 characters
const char* mdns_hostname    = "vacuum";   // Accessible at http://vacuum.local/

// --- GLOBAL VARIABLES DEFINITION ---
ESP8266WebServer server(80);

int currentSpeed          = 200;    // Default base PWM Speed (0-255)
int leftMotorPWM          = 0;      // Active PWM applied to Motor A (Left)
int rightMotorPWM         = 0;      // Active PWM applied to Motor B (Right)
bool vacuumRelayState     = false;  // False = Relay OFF, True = Relay ON
String currentAction      = "STOP";
String wifiStatusStr      = "Initializing...";
String connectedSSID      = "";
String resetReasonStr     = "";
String resetInfoStr       = "";
int joystickX             = 0;
int joystickY             = 0;
unsigned long lastControlTime = 0;

// Ultrasonic Sensor Telemetry
int sensor1DistCm         = -1;
int sensor2DistCm         = -1;
bool isSensor1Connected   = false;
bool isSensor2Connected   = false;
bool obstacleDetected     = false;

// --- SETUP AND INITIALIZATION ---
void setup() {
    Serial.begin(115200);
    delay(500);

    // Read ESP8266 Hardware Reset Reason for diagnostics
    resetReasonStr = ESP.getResetReason();
    resetInfoStr   = ESP.getResetInfo();

    Serial.println("\n===========================================");
    Serial.println(" SMART VACUUM CLEANER ROBOT INITIALIZING");
    Serial.println(" Chassis Model: " CHASSIS_MODEL);
    Serial.print(" System Reset Reason: ");
    Serial.println(resetReasonStr);
    Serial.print(" Reset Detail: ");
    Serial.println(resetInfoStr);
    Serial.println("===========================================");

    // Initialize Subsystems
    initMotors();   // Setup L298N pins, relay pin, and PWM ranges
    initSensors();  // Setup Dual Ultrasonic pins (HC-SR04) with auto-detect
    initWiFi();     // Connect to primary WiFi networks or launch AP fallback
    initWebServer();// Setup HTTP server routes and JSON telemetry API

    Serial.println("[SYSTEM BOOT COMPLETE] Vacuum Robot Ready for Operations.");
}

// --- MAIN EXECUTION LOOP ---
void loop() {
    updateWebServer();    // Process incoming client HTTP requests
    updateWiFi();         // Process mDNS service responder
    updateSensors();      // Non-blocking ultrasonic measurement & auto-detect
    checkMotorWatchdog(); // Auto-stop motors if control connection drops
}