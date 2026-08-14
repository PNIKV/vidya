/*
 * Crab Robot 8-Servo Wi-Fi Controller & Interactive Web Dashboard
 * Fully compatible with Arduino UNO R4 WiFi, ESP32, and ESP8266!
 *
 * Hardware:
 *   - Arduino UNO R4 WiFi (or ESP32 / ESP8266)
 *   - PCA9685 16-Channel PWM Servo Driver (I2C Address: 0x40)
 *   - 8 x Servos connected to Channels 0 - 7
 *     Channel 0: Front-Left Hip    (FL-Hip)
 *     Channel 1: Front-Left Knee   (FL-Knee)
 *     Channel 2: Front-Right Hip   (FR-Hip)
 *     Channel 3: Front-Right Knee  (FR-Knee)
 *     Channel 4: Rear-Left Hip     (RL-Hip)
 *     Channel 5: Rear-Left Knee    (RL-Knee)
 *     Channel 6: Rear-Right Hip    (RR-Hip)
 *     Channel 7: Rear-Right Knee   (RR-Knee)
 *
 * Wi-Fi Credentials:
 *   SSID:     STEM
 *   Password: STEM@123
 *
 * mDNS Hostname:
 *   http://crabrobot.local
 */

#include <Adafruit_PWMServoDriver.h>
#include <Wire.h>


// --- Board Architecture & Wi-Fi Library Detection ---
#if defined(ARDUINO_UNOR4_WIFI) || __has_include(<WiFiS3.h>)
#include <WiFiS3.h>
#elif defined(ESP32) || __has_include(<WiFi.h>)
#include <WiFi.h>
#elif defined(ESP8266) || __has_include(<ESP8266WiFi.h>)
#include <ESP8266WiFi.h>
#else
#error                                                                         \
    "Board selection mismatch! In Arduino IDE, go to Tools > Board > Arduino UNO R4 Boards and select 'Arduino UNO R4 WiFi'."
#endif

#if __has_include(<ESPmDNS.h>)
#include <ESPmDNS.h>
#define HAS_MDNS 1
#elif __has_include(<ESP8266mDNS.h>)
#include <ESP8266mDNS.h>
#define HAS_MDNS 1
#else
#define HAS_MDNS 0
#endif

// --- Network Configuration ---
const char *ssid = "STEM";
const char *password = "STEM@123";
const char *mdnsHost = "crabrobot"; // http://crabrobot.local

// Universal WiFiServer on port 80
WiFiServer server(80);

// --- PCA9685 Servo Driver Setup ---
Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver(0x40);

#define SERVOMIN 150  // Minimum pulse length count (0 degrees)
#define SERVOMAX 600  // Maximum pulse length count (180 degrees)
#define SERVO_FREQ 50 // Standard 50Hz for analog/digital RC servos

// --- Servo State Management ---
int currentAngles[8] = {90, 90, 90, 90, 90, 90, 90, 90};
int trimOffsets[8] = {0, 0, 0, 0, 0, 0, 0, 0};

// Helper: Convert degrees (0-180) to PCA9685 PWM pulse length count
uint16_t angleToPulse(int angle, int trim = 0) {
  int finalAngle = constrain(angle + trim, 0, 180);
  return map(finalAngle, 0, 180, SERVOMIN, SERVOMAX);
}

// Low-level function to drive single servo by channel
void setServoAngle(int ch, int angle) {
  if (ch < 0 || ch > 7)
    return;
  angle = constrain(angle, 0, 180);
  currentAngles[ch] = angle;
  uint16_t pulse = angleToPulse(angle, trimOffsets[ch]);
  pwm.setPWM(ch, 0, pulse);
}

// Smoothly interpolate all 8 servos from current positions to target positions
void smoothMoveAll(int targets[8], int stepDelayMs = 12) {
  bool moving = true;
  while (moving) {
    moving = false;
    for (int i = 0; i < 8; i++) {
      if (currentAngles[i] < targets[i]) {
        currentAngles[i]++;
        setServoAngle(i, currentAngles[i]);
        moving = true;
      } else if (currentAngles[i] > targets[i]) {
        currentAngles[i]--;
        setServoAngle(i, currentAngles[i]);
        moving = true;
      }
    }
    delay(stepDelayMs);
  }
}

// Direct jump all servos
void setAllAngles(int angles[8]) {
  for (int i = 0; i < 8; i++) {
    setServoAngle(i, angles[i]);
  }
}

// --- Robot Stances & Gaits ---
void presetStand() {
  int target[8] = {90, 60, 90, 60, 90, 60, 90, 60};
  smoothMoveAll(target);
}

void presetSit() {
  int target[8] = {90, 140, 90, 140, 90, 140, 90, 140};
  smoothMoveAll(target);
}

void presetCalibrate() {
  int target[8] = {90, 90, 90, 90, 90, 90, 90, 90};
  smoothMoveAll(target);
}

void presetWave() {
  int target1[8] = {90, 60, 130, 30, 90, 60, 90, 60};
  smoothMoveAll(target1, 10);
  for (int i = 0; i < 3; i++) {
    setServoAngle(3, 80);
    delay(150);
    setServoAngle(3, 20);
    delay(150);
  }
  presetStand();
}

void presetBow() {
  int bowPose[8] = {90, 130, 90, 130, 90, 40, 90, 40};
  smoothMoveAll(bowPose, 15);
  delay(1000);
  presetStand();
}

void presetDance() {
  for (int r = 0; r < 2; r++) {
    int pose1[8] = {120, 40, 60, 80, 60, 80, 120, 40};
    smoothMoveAll(pose1, 8);
    int pose2[8] = {60, 80, 120, 40, 120, 40, 60, 80};
    smoothMoveAll(pose2, 8);
  }
  presetStand();
}

// --- Gaits ---
void gaitForward(int steps = 1) {
  for (int s = 0; s < steps; s++) {
    setServoAngle(1, 100);
    setServoAngle(7, 100);
    delay(80);
    setServoAngle(0, 120);
    setServoAngle(6, 60);
    delay(80);
    setServoAngle(1, 60);
    setServoAngle(7, 60);
    delay(80);

    setServoAngle(3, 100);
    setServoAngle(5, 100);
    delay(80);
    setServoAngle(0, 60);
    setServoAngle(6, 120);
    setServoAngle(2, 60);
    setServoAngle(4, 120);
    delay(80);
    setServoAngle(3, 60);
    setServoAngle(5, 60);
    delay(80);

    setServoAngle(2, 120);
    setServoAngle(4, 60);
    delay(80);
  }
  presetStand();
}

void gaitBackward(int steps = 1) {
  for (int s = 0; s < steps; s++) {
    setServoAngle(1, 100);
    setServoAngle(7, 100);
    delay(80);
    setServoAngle(0, 60);
    setServoAngle(6, 120);
    delay(80);
    setServoAngle(1, 60);
    setServoAngle(7, 60);
    delay(80);

    setServoAngle(3, 100);
    setServoAngle(5, 100);
    delay(80);
    setServoAngle(0, 120);
    setServoAngle(6, 60);
    setServoAngle(2, 120);
    setServoAngle(4, 60);
    delay(80);
    setServoAngle(3, 60);
    setServoAngle(5, 60);
    delay(80);

    setServoAngle(2, 60);
    setServoAngle(4, 120);
    delay(80);
  }
  presetStand();
}

void gaitCrabLeft(int steps = 1) {
  for (int s = 0; s < steps; s++) {
    setServoAngle(1, 110);
    setServoAngle(5, 110);
    delay(100);
    setServoAngle(0, 130);
    setServoAngle(4, 50);
    delay(100);
    setServoAngle(1, 60);
    setServoAngle(5, 60);
    delay(100);

    setServoAngle(3, 110);
    setServoAngle(7, 110);
    delay(100);
    setServoAngle(0, 90);
    setServoAngle(4, 90);
    setServoAngle(2, 130);
    setServoAngle(6, 50);
    delay(100);
    setServoAngle(3, 60);
    setServoAngle(7, 60);
    delay(100);
    setServoAngle(2, 90);
    setServoAngle(6, 90);
    delay(80);
  }
  presetStand();
}

void gaitCrabRight(int steps = 1) {
  for (int s = 0; s < steps; s++) {
    setServoAngle(3, 110);
    setServoAngle(7, 110);
    delay(100);
    setServoAngle(2, 50);
    setServoAngle(6, 130);
    delay(100);
    setServoAngle(3, 60);
    setServoAngle(7, 60);
    delay(100);

    setServoAngle(1, 110);
    setServoAngle(5, 110);
    delay(100);
    setServoAngle(2, 90);
    setServoAngle(6, 90);
    setServoAngle(0, 50);
    setServoAngle(4, 130);
    delay(100);
    setServoAngle(1, 60);
    setServoAngle(5, 60);
    delay(100);
    setServoAngle(0, 90);
    setServoAngle(4, 90);
    delay(80);
  }
  presetStand();
}

void gaitTurnLeft(int steps = 1) {
  for (int s = 0; s < steps; s++) {
    setServoAngle(1, 100);
    setServoAngle(7, 100);
    delay(80);
    setServoAngle(0, 60);
    setServoAngle(6, 60);
    delay(80);
    setServoAngle(1, 60);
    setServoAngle(7, 60);
    delay(80);

    setServoAngle(3, 100);
    setServoAngle(5, 100);
    delay(80);
    setServoAngle(0, 90);
    setServoAngle(6, 90);
    setServoAngle(2, 60);
    setServoAngle(4, 60);
    delay(80);
    setServoAngle(3, 60);
    setServoAngle(5, 60);
    delay(80);

    setServoAngle(2, 90);
    setServoAngle(4, 90);
    delay(80);
  }
  presetStand();
}

void gaitTurnRight(int steps = 1) {
  for (int s = 0; s < steps; s++) {
    setServoAngle(1, 100);
    setServoAngle(7, 100);
    delay(80);
    setServoAngle(0, 120);
    setServoAngle(6, 120);
    delay(80);
    setServoAngle(1, 60);
    setServoAngle(7, 60);
    delay(80);

    setServoAngle(3, 100);
    setServoAngle(5, 100);
    delay(80);
    setServoAngle(0, 90);
    setServoAngle(6, 90);
    setServoAngle(2, 120);
    setServoAngle(4, 120);
    delay(80);
    setServoAngle(3, 60);
    setServoAngle(5, 60);
    delay(80);

    setServoAngle(2, 90);
    setServoAngle(4, 90);
    delay(80);
  }
  presetStand();
}

// --- Embedded Web Dashboard Source (HTML / CSS / JS) ---
const char DASHBOARD_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CrabRobot Core UI/UX Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #080c14;
      --card-bg: rgba(15, 23, 42, 0.75);
      --card-border: rgba(56, 189, 248, 0.15);
      --accent-cyan: #00f2fe;
      --accent-blue: #4facfe;
      --accent-neon: #00f5a0;
      --accent-magenta: #ff007f;
      --accent-amber: #ffb703;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    body {
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(at 10% 10%, rgba(0, 242, 254, 0.08) 0px, transparent 50%),
        radial-gradient(at 90% 90%, rgba(255, 0, 127, 0.08) 0px, transparent 50%),
        radial-gradient(at 50% 50%, rgba(0, 245, 160, 0.04) 0px, transparent 60%);
      color: var(--text-main);
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
      padding: 1.5rem;
    }

    .dashboard-container {
      max-width: 1320px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Header */
    header {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(16px);
      border-radius: 20px;
      padding: 1.25rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .robot-icon {
      width: 46px;
      height: 46px;
      background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue));
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 0 20px rgba(0, 242, 254, 0.4);
    }

    .brand-text h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      background: linear-gradient(90deg, #ffffff, var(--accent-cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-text p {
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .status-bar {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .badge {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      padding: 0.4rem 0.9rem;
      border-radius: 30px;
      font-size: 0.82rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent-neon);
      box-shadow: 0 0 10px var(--accent-neon);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* Main Grid */
    .grid-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.5rem;
    }

    @media (max-width: 1024px) {
      .grid-layout {
        grid-template-columns: 1fr;
      }
    }

    .panel {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(16px);
      border-radius: 20px;
      padding: 1.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .panel-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--text-main);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding-bottom: 0.75rem;
    }

    /* Preset Toolbar */
    .preset-toolbar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .btn {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-main);
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
    }

    .btn:hover {
      background: rgba(56, 189, 248, 0.2);
      border-color: var(--accent-cyan);
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 242, 254, 0.2);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn-icon {
      font-size: 1.3rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue));
      color: #000;
      border: none;
      font-weight: 700;
      box-shadow: 0 4px 15px rgba(0, 242, 254, 0.3);
    }

    .btn-primary:hover {
      filter: brightness(1.1);
      box-shadow: 0 6px 20px rgba(0, 242, 254, 0.5);
    }

    /* Servo Grid */
    .servo-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }

    @media (max-width: 640px) {
      .servo-grid {
        grid-template-columns: 1fr;
      }
    }

    .leg-card {
      background: rgba(10, 15, 26, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .leg-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--accent-cyan);
    }

    .joint-control {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .joint-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
    }

    .joint-name {
      color: var(--text-muted);
    }

    .degree-val {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      color: var(--accent-neon);
      background: rgba(0, 245, 160, 0.1);
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }

    .slider-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .step-btn {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.1);
      color: var(--text-main);
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: 0.15s;
    }

    .step-btn:hover {
      background: var(--accent-cyan);
      color: #000;
    }

    input[type="range"] {
      flex: 1;
      accent-color: var(--accent-cyan);
      height: 6px;
      background: rgba(255,255,255,0.1);
      border-radius: 3px;
      cursor: pointer;
    }

    /* Right Column: D-Pad & Kinematics */
    .right-col {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* D-Pad Controller */
    .dpad-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 0.6rem;
      width: 260px;
      height: 260px;
      margin: 0 auto;
    }

    .dpad-btn {
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 16px;
      color: var(--text-main);
      font-size: 1.4rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }

    .dpad-btn:hover {
      background: var(--accent-cyan);
      color: #000;
      box-shadow: 0 0 20px rgba(0, 242, 254, 0.4);
      transform: scale(1.05);
    }

    .dpad-btn:active {
      transform: scale(0.95);
    }

    .dpad-stop {
      background: rgba(255, 0, 127, 0.2);
      border-color: rgba(255, 0, 127, 0.5);
      color: var(--accent-magenta);
      font-size: 0.9rem;
      font-weight: 800;
    }

    .dpad-stop:hover {
      background: var(--accent-magenta);
      color: #fff;
      box-shadow: 0 0 20px rgba(255, 0, 127, 0.5);
    }

    /* Kinematic Visualizer Canvas */
    .visualizer-card {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    #crabCanvas {
      width: 100%;
      height: 220px;
      background: rgba(8, 12, 20, 0.8);
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    /* Footer */
    footer {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
      padding-top: 1rem;
    }
  </style>
</head>
<body>

<div class="dashboard-container">
  <!-- Header -->
  <header>
    <div class="brand">
      <div class="robot-icon">🦀</div>
      <div class="brand-text">
        <h1>CrabRobot Core</h1>
        <p>Arduino UNO R4 WiFi / ESP Quadruped Controller</p>
      </div>
    </div>
    <div class="status-bar">
      <div class="badge">
        <div class="status-dot"></div>
        <span>mDNS: <strong>crabrobot.local</strong></span>
      </div>
      <div class="badge">
        <span>Wi-Fi: <strong id="wifiSsid">STEM</strong></span>
      </div>
    </div>
  </header>

  <!-- Main Content Grid -->
  <div class="grid-layout">
    <!-- Left Column: Sliders & Presets -->
    <div class="panel">
      <!-- Stance & Motion Presets -->
      <div class="panel-title">
        <span>Stance & Motion Presets</span>
        <span style="font-size:0.8rem; font-weight:400; color:var(--text-muted);">Quick Execution</span>
      </div>
      <div class="preset-toolbar">
        <button class="btn btn-primary" onclick="triggerPreset('stand')">
          <span class="btn-icon">🧍</span> Stand
        </button>
        <button class="btn" onclick="triggerPreset('sit')">
          <span class="btn-icon">🧎</span> Sit / Rest
        </button>
        <button class="btn" onclick="triggerPreset('calibrate')">
          <span class="btn-icon">🎯</span> Calibrate 90°
        </button>
        <button class="btn" onclick="triggerPreset('wave')">
          <span class="btn-icon">👋</span> Wave
        </button>
        <button class="btn" onclick="triggerPreset('bow')">
          <span class="btn-icon">🙇</span> Bow
        </button>
        <button class="btn" onclick="triggerPreset('dance')">
          <span class="btn-icon">🕺</span> Dance
        </button>
      </div>

      <!-- 8-Servo Controls -->
      <div class="panel-title">
        <span>8-Servo Joint Angle Control System</span>
        <button class="btn btn-primary" style="padding:0.4rem 0.8rem; font-size:0.8rem;" onclick="applyAllSliders()">
          Apply All Degrees
        </button>
      </div>

      <div class="servo-grid">
        <!-- Front Left Leg -->
        <div class="leg-card">
          <div class="leg-header">
            <span>Front Left (FL) Leg</span>
            <span style="font-size:0.8rem;">Ch 0, 1</span>
          </div>
          <div class="joint-control">
            <div class="joint-info">
              <span class="joint-name">FL Hip (Ch 0)</span>
              <span class="degree-val" id="val0">90°</span>
            </div>
            <div class="slider-row">
              <button class="step-btn" onclick="adjustServo(0, -5)">-</button>
              <input type="range" id="srv0" min="0" max="180" value="90" oninput="onSliderChange(0, this.value)">
              <button class="step-btn" onclick="adjustServo(0, 5)">+</button>
            </div>
          </div>
          <div class="joint-control">
            <div class="joint-info">
              <span class="joint-name">FL Knee (Ch 1)</span>
              <span class="degree-val" id="val1">90°</span>
            </div>
            <div class="slider-row">
              <button class="step-btn" onclick="adjustServo(1, -5)">-</button>
              <input type="range" id="srv1" min="0" max="180" value="90" oninput="onSliderChange(1, this.value)">
              <button class="step-btn" onclick="adjustServo(1, 5)">+</button>
            </div>
          </div>
        </div>

        <!-- Front Right Leg -->
        <div class="leg-card">
          <div class="leg-header">
            <span>Front Right (FR) Leg</span>
            <span style="font-size:0.8rem;">Ch 2, 3</span>
          </div>
          <div class="joint-control">
            <div class="joint-info">
              <span class="joint-name">FR Hip (Ch 2)</span>
              <span class="degree-val" id="val2">90°</span>
            </div>
            <div class="slider-row">
              <button class="step-btn" onclick="adjustServo(2, -5)">-</button>
              <input type="range" id="srv2" min="0" max="180" value="90" oninput="onSliderChange(2, this.value)">
              <button class="step-btn" onclick="adjustServo(2, 5)">+</button>
            </div>
          </div>
          <div class="joint-control">
            <div class="joint-info">
              <span class="joint-name">FR Knee (Ch 3)</span>
              <span class="degree-val" id="val3">90°</span>
            </div>
            <div class="slider-row">
              <button class="step-btn" onclick="adjustServo(3, -5)">-</button>
              <input type="range" id="srv3" min="0" max="180" value="90" oninput="onSliderChange(3, this.value)">
              <button class="step-btn" onclick="adjustServo(3, 5)">+</button>
            </div>
          </div>
        </div>

        <!-- Rear Left Leg -->
        <div class="leg-card">
          <div class="leg-header">
            <span>Rear Left (RL) Leg</span>
            <span style="font-size:0.8rem;">Ch 4, 5</span>
          </div>
          <div class="joint-control">
            <div class="joint-info">
              <span class="joint-name">RL Hip (Ch 4)</span>
              <span class="degree-val" id="val4">90°</span>
            </div>
            <div class="slider-row">
              <button class="step-btn" onclick="adjustServo(4, -5)">-</button>
              <input type="range" id="srv4" min="0" max="180" value="90" oninput="onSliderChange(4, this.value)">
              <button class="step-btn" onclick="adjustServo(4, 5)">+</button>
            </div>
          </div>
          <div class="joint-control">
            <div class="joint-info">
              <span class="joint-name">RL Knee (Ch 5)</span>
              <span class="degree-val" id="val5">90°</span>
            </div>
            <div class="slider-row">
              <button class="step-btn" onclick="adjustServo(5, -5)">-</button>
              <input type="range" id="srv5" min="0" max="180" value="90" oninput="onSliderChange(5, this.value)">
              <button class="step-btn" onclick="adjustServo(5, 5)">+</button>
            </div>
          </div>
        </div>

        <!-- Rear Right Leg -->
        <div class="leg-card">
          <div class="leg-header">
            <span>Rear Right (RR) Leg</span>
            <span style="font-size:0.8rem;">Ch 6, 7</span>
          </div>
          <div class="joint-control">
            <div class="joint-info">
              <span class="joint-name">RR Hip (Ch 6)</span>
              <span class="degree-val" id="val6">90°</span>
            </div>
            <div class="slider-row">
              <button class="step-btn" onclick="adjustServo(6, -5)">-</button>
              <input type="range" id="srv6" min="0" max="180" value="90" oninput="onSliderChange(6, this.value)">
              <button class="step-btn" onclick="adjustServo(6, 5)">+</button>
            </div>
          </div>
          <div class="joint-control">
            <div class="joint-info">
              <span class="joint-name">RR Knee (Ch 7)</span>
              <span class="degree-val" id="val7">90°</span>
            </div>
            <div class="slider-row">
              <button class="step-btn" onclick="adjustServo(7, -5)">-</button>
              <input type="range" id="srv7" min="0" max="180" value="90" oninput="onSliderChange(7, this.value)">
              <button class="step-btn" onclick="adjustServo(7, 5)">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Navigation D-Pad & Kinematics -->
    <div class="right-col">
      <!-- D-Pad Control Panel -->
      <div class="panel">
        <div class="panel-title">
          <span>Directional Motion D-Pad</span>
        </div>
        <div class="dpad-container">
          <button class="dpad-btn" title="Turn Left" onclick="triggerGait('turn_left')">↺</button>
          <button class="dpad-btn" title="Forward" onclick="triggerGait('forward')">▲</button>
          <button class="dpad-btn" title="Turn Right" onclick="triggerGait('turn_right')">↻</button>
          
          <button class="dpad-btn" title="Crab Walk Left" onclick="triggerGait('crab_left')">◄</button>
          <button class="dpad-btn dpad-stop" title="Stand/Stop" onclick="triggerPreset('stand')">STOP</button>
          <button class="dpad-btn" title="Crab Walk Right" onclick="triggerGait('crab_right')">►</button>
          
          <div></div>
          <button class="dpad-btn" title="Backward" onclick="triggerGait('backward')">▼</button>
          <div></div>
        </div>
      </div>

      <!-- Live 2D Kinematics Schematic -->
      <div class="panel visualizer-card">
        <div class="panel-title" style="width:100%;">
          <span>Live Leg Pose Visualizer</span>
        </div>
        <canvas id="crabCanvas"></canvas>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer>
    CrabRobot PCA9685 Control System &bull; Host: <code>crabrobot.local</code> &bull; Wi-Fi: <code>STEM</code>
  </footer>
</div>

<script>
  let servoAngles = [90, 90, 90, 90, 90, 90, 90, 90];
  let sendTimeout = null;

  function onSliderChange(id, val) {
    val = parseInt(val);
    servoAngles[id] = val;
    document.getElementById('val' + id).innerText = val + '°';
    drawCrabSchematic();

    if (sendTimeout) clearTimeout(sendTimeout);
    sendTimeout = setTimeout(() => {
      sendServoDegree(id, val);
    }, 40);
  }

  function adjustServo(id, step) {
    let slider = document.getElementById('srv' + id);
    let newVal = Math.max(0, Math.min(180, parseInt(slider.value) + step));
    slider.value = newVal;
    onSliderChange(id, newVal);
  }

  function sendServoDegree(id, angle) {
    fetch('/api/servo?id=' + id + '&angle=' + angle)
      .catch(err => console.error('Error setting servo:', err));
  }

  function applyAllSliders() {
    for (let i = 0; i < 8; i++) {
      sendServoDegree(i, servoAngles[i]);
    }
  }

  function triggerPreset(name) {
    fetch('/api/preset?name=' + name)
      .then(res => res.json())
      .then(data => {
        if (data.servos) updateUIWithAngles(data.servos);
      })
      .catch(err => console.error('Preset error:', err));
  }

  function triggerGait(dir) {
    fetch('/api/move?dir=' + dir)
      .catch(err => console.error('Gait error:', err));
  }

  function updateUIWithAngles(angles) {
    for (let i = 0; i < 8; i++) {
      servoAngles[i] = angles[i];
      let slider = document.getElementById('srv' + i);
      if (slider) slider.value = angles[i];
      let label = document.getElementById('val' + i);
      if (label) label.innerText = angles[i] + '°';
    }
    drawCrabSchematic();
  }

  function drawCrabSchematic() {
    const canvas = document.getElementById('crabCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - 35, cy - 45, 70, 90, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 12px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText('CRAB', cx, cy - 5);
    ctx.fillStyle = '#00f5a0';
    ctx.fillText('BODY', cx, cy + 12);

    const legRoots = [
      { x: cx - 35, y: cy - 35, name: 'FL', hipIdx: 0, kneeIdx: 1, baseAngle: 135 },
      { x: cx + 35, y: cy - 35, name: 'FR', hipIdx: 2, kneeIdx: 3, baseAngle: 45 },
      { x: cx - 35, y: cy + 35, name: 'RL', hipIdx: 4, kneeIdx: 5, baseAngle: 225 },
      { x: cx + 35, y: cy + 35, name: 'RR', hipIdx: 6, kneeIdx: 7, baseAngle: 315 }
    ];

    const hipLength = 35;
    const kneeLength = 40;

    legRoots.forEach(leg => {
      let hipAngleDeg = (leg.baseAngle + (servoAngles[leg.hipIdx] - 90)) * (Math.PI / 180);
      let kneeAngleDeg = (leg.baseAngle + (servoAngles[leg.hipIdx] - 90) + (servoAngles[leg.kneeIdx] - 90)) * (Math.PI / 180);

      let kneeX = leg.x + Math.cos(hipAngleDeg) * hipLength;
      let kneeY = leg.y + Math.sin(hipAngleDeg) * hipLength;

      let footX = kneeX + Math.cos(kneeAngleDeg) * kneeLength;
      let footY = kneeY + Math.sin(kneeAngleDeg) * kneeLength;

      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(leg.x, leg.y);
      ctx.lineTo(kneeX, kneeY);
      ctx.stroke();

      ctx.strokeStyle = '#00f5a0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(kneeX, kneeY);
      ctx.lineTo(footX, footY);
      ctx.stroke();

      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.arc(kneeX, kneeY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(footX, footY, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  window.addEventListener('load', () => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.servos) updateUIWithAngles(data.servos);
        if (data.wifi) document.getElementById('wifiSsid').innerText = data.wifi;
      })
      .catch(() => drawCrabSchematic());
  });
</script>
</body>
</html>
)rawliteral";

// Helper: Extract query parameter value from HTTP request line
String getQueryParam(const String &req, const String &param) {
  String target = param + "=";
  int idx = req.indexOf(target);
  if (idx == -1)
    return "";
  int start = idx + target.length();
  int end = req.indexOf('&', start);
  if (end == -1)
    end = req.indexOf(' ', start);
  if (end == -1)
    end = req.length();
  return req.substring(start, end);
}

// Universal HTTP Client Request Dispatcher
void handleWebClients() {
  WiFiClient client = server.available();
  if (!client)
    return;

  String req = "";
  unsigned long startMs = millis();
  while (client.connected() && (millis() - startMs < 1000)) {
    if (client.available()) {
      char c = client.read();
      if (c == '\n')
        break;
      if (c != '\r')
        req += c;
    }
  }

  // Clear remaining incoming buffer
  while (client.available()) {
    client.read();
  }

  // Router Dispatch
  if (req.startsWith("GET / ") || req.startsWith("GET /index.html")) {
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/html");
    client.println("Connection: close");
    client.println();
    client.print(DASHBOARD_HTML);
  } else if (req.indexOf("GET /api/status") != -1) {
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: application/json");
    client.println("Connection: close");
    client.println();

    String json = "{\"status\":\"online\",\"wifi\":\"" + String(ssid) +
                  "\",\"ip\":\"" + WiFi.localIP().toString() +
                  "\",\"servos\":[";
    for (int i = 0; i < 8; i++) {
      json += String(currentAngles[i]);
      if (i < 7)
        json += ",";
    }
    json += "]}";
    client.print(json);
  } else if (req.indexOf("GET /api/servo") != -1) {
    String idStr = getQueryParam(req, "id");
    String angleStr = getQueryParam(req, "angle");
    if (idStr.length() > 0 && angleStr.length() > 0) {
      int id = idStr.toInt();
      int angle = angleStr.toInt();
      setServoAngle(id, angle);

      client.println("HTTP/1.1 200 OK");
      client.println("Content-Type: application/json");
      client.println("Connection: close");
      client.println();
      client.print("{\"success\":true,\"id\":" + String(id) +
                   ",\"angle\":" + String(angle) + "}");
    } else {
      client.println("HTTP/1.1 400 Bad Request");
      client.println("Connection: close");
      client.println();
    }
  } else if (req.indexOf("GET /api/preset") != -1) {
    String name = getQueryParam(req, "name");
    if (name == "stand")
      presetStand();
    else if (name == "sit")
      presetSit();
    else if (name == "calibrate")
      presetCalibrate();
    else if (name == "wave")
      presetWave();
    else if (name == "bow")
      presetBow();
    else if (name == "dance")
      presetDance();

    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: application/json");
    client.println("Connection: close");
    client.println();

    String json = "{\"success\":true,\"preset\":\"" + name + "\",\"servos\":[";
    for (int i = 0; i < 8; i++) {
      json += String(currentAngles[i]);
      if (i < 7)
        json += ",";
    }
    json += "]}";
    client.print(json);
  } else if (req.indexOf("GET /api/move") != -1) {
    String dir = getQueryParam(req, "dir");
    String stepsStr = getQueryParam(req, "steps");
    int steps = stepsStr.length() > 0 ? stepsStr.toInt() : 1;

    if (dir == "forward")
      gaitForward(steps);
    else if (dir == "backward")
      gaitBackward(steps);
    else if (dir == "crab_left")
      gaitCrabLeft(steps);
    else if (dir == "crab_right")
      gaitCrabRight(steps);
    else if (dir == "turn_left")
      gaitTurnLeft(steps);
    else if (dir == "turn_right")
      gaitTurnRight(steps);

    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: application/json");
    client.println("Connection: close");
    client.println();
    client.print("{\"success\":true,\"dir\":\"" + dir + "\"}");
  } else {
    client.println("HTTP/1.1 404 Not Found");
    client.println("Content-Type: text/plain");
    client.println("Connection: close");
    client.println();
    client.println("404 Not Found");
  }

  delay(1);
  client.stop();
}

// Setup & Initialization
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n==========================================");
  Serial.println(" CrabRobot UNO R4 WiFi / ESP Servo Controller ");
  Serial.println("==========================================");

  // Initialize I2C and PCA9685 Servo Driver
  Wire.begin();
  pwm.begin();
  pwm.setPWMFreq(SERVO_FREQ);
  delay(100);

  // Set default initial pose (Stand)
  presetStand();
  Serial.println("[PCA9685] Driver initialized at 50Hz. Initial pose: STAND.");

// Configure Wi-Fi Hostname for UNO R4 WiFi
#if defined(ARDUINO_UNOR4_WIFI) || __has_include(<WiFiS3.h>)
  WiFi.setHostname(mdnsHost);
#endif

  // Connect to Wi-Fi
  Serial.print("[Wi-Fi] Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected successfully!");
    Serial.print("[Wi-Fi] IP Address: ");
    Serial.println(WiFi.localIP());

#if HAS_MDNS
    if (MDNS.begin(mdnsHost)) {
      Serial.print("[mDNS] Responder started at: http://");
      Serial.print(mdnsHost);
      Serial.println(".local");
    }
#else
    Serial.print("[mDNS/Hostname] Access robot dashboard at: http://");
    Serial.print(mdnsHost);
    Serial.println(".local (or via IP)");
#endif
  } else {
    Serial.println(
        "\n[Wi-Fi] Connection timeout! Check Wi-Fi SSID and password.");
  }

  // Start HTTP Server
  server.begin();
  Serial.println("[WebServer] Universal HTTP Server started on port 80.");
}

void loop() {
  handleWebClients();
#if HAS_MDNS && defined(ESP8266)
  MDNS.update();
#endif
}