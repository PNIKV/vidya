// comment for this is vacum robot car code
#ifndef VACUUM_CONFIG_H
#define VACUUM_CONFIG_H

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>

// --- THINGIVERSE CHASSIS & PROJECT INFO ---
// 3D Model Reference: Thingiverse 5116129 by Marcus Lanzoni
// Smart Vacuum Cleaner Robot with Relay Pump & ESP8266 WiFi Joystick

// --- WIFI CONFIGURATION ---
const char* primary_ssid     = "STEM";
const char* primary_password = "STEM@123";

const char* ap_ssid          = "VaccumBot-AP";
const char* ap_password      = "12345678"; // Min 8 chars
const char* mdns_hostname    = "vaccum";   // http://vaccum.local/

// --- RELAY PIN DEFINITION FOR VACUUM CLEANING AIR PUMP ---
const int RELAY_PIN = 2; // D4 (GPIO2) on NodeMCU ESP8266
const bool RELAY_ACTIVE_LOW = true; // Set to true if relay triggers on LOW signal

// --- L298N / L293D MOTOR DRIVER PINS ---
const int ENA = 14; // D5 (GPIO14) - PWM Speed Motor A
const int IN1 = 5;  // D1 (GPIO5)  - Direction Motor A
const int IN2 = 4;  // D2 (GPIO4)  - Direction Motor A
const int IN3 = 12; // D6 (GPIO12) - Direction Motor B
const int IN4 = 13; // D7 (GPIO13) - Direction Motor B
const int ENB = 15; // D8 (GPIO15) - PWM Speed Motor B

// --- GLOBAL STATE VARIABLES ---
extern ESP8266WebServer server;
extern int currentSpeed;       // Overall PWM base speed (0-255)
extern int leftMotorPWM;       // Left Motor Calculated PWM (0-255)
extern int rightMotorPWM;      // Right Motor Calculated PWM (0-255)
extern bool vacuumRelayState;  // Vacuum air pump relay state (true = ON, false = OFF)
extern String currentAction;   // Current direction or state (STOP, FWD, BWD, JOYSTICK, etc.)
extern String wifiStatusStr;   // WiFi mode description
extern String resetReasonStr;  // HW Reset reason
extern int joystickX;          // Joystick X displacement (-100 to 100)
extern int joystickY;          // Joystick Y displacement (-100 to 100)

#endif // VACUUM_CONFIG_H
