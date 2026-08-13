// Smart vacuum Cleaner Robot - System Configuration & Global Definitions
// Chassis Reference: Thingiverse 5116129 (Marcus Lanzoni 3D vacuum Chassis)

#ifndef VACUUM_CONFIG_H
#define VACUUM_CONFIG_H

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>

// --- THINGIVERSE CHASSIS & PROJECT INFO ---
#define CHASSIS_MODEL "Thingiverse 5116129 (Marcus Lanzoni)"
#define DEVICE_NAME "Smart vacuum Cleaner Bot"

// --- MULTI-WIFI CREDENTIALS CONFIGURATION (Up to 3 Primary Networks + AP Fallback) ---
struct WiFiCredential {
    const char* ssid;
    const char* password;
};

extern const WiFiCredential PRIMARY_WIFI_NETWORKS[];
extern const int PRIMARY_WIFI_COUNT;

extern const char* ap_ssid;
extern const char* ap_password;
extern const char* mdns_hostname;

// --- RELAY PIN DEFINITION FOR VACUUM AIR PUMP ---
const int RELAY_PIN = 2;              // D4 (GPIO2) on NodeMCU ESP8266
const bool RELAY_ACTIVE_LOW = true;   // Set true if relay activates on LOW signal

// --- L298N / L293D MOTOR DRIVER PINS ---
const int ENA = 14; // D5 (GPIO14) - PWM Speed Motor A (Left Motor)
const int IN1 = 5;  // D1 (GPIO5)  - Direction Motor A
const int IN2 = 4;  // D2 (GPIO4)  - Direction Motor A
const int IN3 = 12; // D6 (GPIO12) - Direction Motor B (Right Motor)
const int IN4 = 13; // D7 (GPIO13) - Direction Motor B
const int ENB = 15; // D8 (GPIO15) - PWM Speed Motor B

// --- DUAL ULTRASONIC SENSOR PINS (HC-SR04) ---
// Sensor 1 (Front-Left / Primary)
const int TRIG1_PIN = 16; // D0 (GPIO16)
const int ECHO1_PIN = 0;  // D3 (GPIO0)

// Sensor 2 (Front-Right / Secondary)
const int TRIG2_PIN = 16; // D0 (GPIO16 - Shared Trigger)
const int ECHO2_PIN = 3;  // RX (GPIO3 - Dedicated Echo)

// Ultrasonic distance threshold for obstacle guard (in cm)
const int MIN_OBSTACLE_DISTANCE = 15;

// --- MOTOR TUNING & SAFETY PARAMETERS ---
const int MIN_PWM = 50;                     // Minimum PWM to overcome mechanical motor deadzone
const int MAX_PWM = 255;                    // Maximum PWM limit
const int JOYSTICK_DEADZONE = 10;           // Vector percentage deadzone
const unsigned long DIRECTION_DEADTIME_MS = 60; // Cutoff pause (ms) on direction flip to stop back-EMF resets
const unsigned long WATCHDOG_TIMEOUT_MS = 200;  // Auto-stop motors if no joystick packet received (ms)

// --- GLOBAL STATE VARIABLES DECLARATION ---
extern ESP8266WebServer server;

extern int currentSpeed;          // Requested speed parameter (0-255)
extern int leftMotorPWM;          // Active PWM output applied to Motor A (Left)
extern int rightMotorPWM;         // Active PWM output applied to Motor B (Right)
extern bool vacuumRelayState;     // vacuum air pump relay state (true = ON, false = OFF)
extern String currentAction;      // Current drive state string (STOP, FWD, BWD, JOYSTICK, OBSTACLE_STOP, etc.)
extern String wifiStatusStr;      // Active WiFi connection mode description
extern String connectedSSID;      // Connected SSID name
extern String resetReasonStr;     // HW Reset reason (e.g. Software WDT, Power On)
extern String resetInfoStr;       // Detailed reset info string
extern int joystickX;             // Joystick X displacement (-100 to +100)
extern int joystickY;             // Joystick Y displacement (-100 to +100)
extern unsigned long lastControlTime; // Timestamp of last joystick input packet

// Ultrasonic Sensor Telemetry
extern int sensor1DistCm;         // Distance reading for Sensor 1 (cm)
extern int sensor2DistCm;         // Distance reading for Sensor 2 (cm)
extern bool isSensor1Connected;   // Auto-detected connection status of Sensor 1
extern bool isSensor2Connected;   // Auto-detected connection status of Sensor 2
extern bool obstacleDetected;     // Safety flag indicating obstacle < MIN_OBSTACLE_DISTANCE

#endif // VACUUM_CONFIG_H
