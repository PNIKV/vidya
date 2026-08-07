#include "Config.h"
#include "IMUSensor.h"
#include "ButtonManager.h"
#include "MouseController.h"

// Instantiate Core Subsystems
IMUSensor imu;
ButtonManager buttons;
MouseController mouse;

bool imuReady = false;
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 10; // 100Hz loop rate

void printHelp() {
  Serial.println("{\"status\":\"help\",\"commands\":[\"calibrate\",\"scan\",\"scan_pins\",\"reset_bus\",\"toggle_motion\",\"mode:sim\",\"mode:hw\",\"sensitivity:X.X\"]}");
}

void handleSerialCommands() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command.equals("calibrate")) {
      imu.performCalibration();
    } 
    else if (command.equals("scan")) {
      imu.scanI2CBus();
    }
    else if (command.equals("scan_pins")) {
      imuReady = imu.scanAllPinPairs();
      if (imuReady) imu.performCalibration();
    }
    else if (command.equals("reset_bus")) {
      imu.recoverI2CBus();
      imuReady = imu.begin();
    }
    else if (command.equals("mode:sim")) {
      imu.setSimulationMode(true);
      imuReady = true;
      Serial.println("{\"status\":\"config\",\"message\":\"Enabled Diagnostic Simulation Mode\"}");
    }
    else if (command.equals("mode:hw")) {
      imu.setSimulationMode(false);
      imuReady = imu.begin();
      if (!imuReady) imuReady = imu.scanAllPinPairs();
    }
    else if (command.equals("toggle_motion")) {
      mouse.toggleMotion();
      Serial.print("{\"status\":\"config\",\"message\":\"Motion toggled\",\"motionActive\":");
      Serial.print(mouse.isMotionEnabled() ? "true" : "false");
      Serial.println("}");
    }
    else if (command.startsWith("sensitivity:")) {
      float newSens = command.substring(12).toFloat();
      if (newSens > 0.0f) {
        mouse.setSensitivity(newSens);
        Serial.print("{\"status\":\"config\",\"message\":\"Sensitivity updated\",\"value\":");
        Serial.print(mouse.getSensitivity());
        Serial.println("}");
      }
    }
    else if (command.equals("help")) {
      printHelp();
    }
  }
}

void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  while (!Serial && millis() < 2500); // Allow USB Serial bridge to stabilize

  Serial.println("{\"status\":\"booting\",\"message\":\"ESP32 Air Mouse Firmware v2.2 Starting...\"}");

  // Initialize Hardware Push Buttons
  buttons.begin();

  // Initialize Mouse Controller
  mouse.begin();

  // Step 1: Probe default SDA=21, SCL=22
  imuReady = imu.begin();

  // Step 2: If default pins yield 0 devices, run auto-pin pair scanner across safe candidate headers
  if (!imuReady) {
    Serial.println("{\"status\":\"warning\",\"message\":\"Default SDA=21/SCL=22 found 0 ACK devices. Probing alternate safe pin headers...\"}");
    imuReady = imu.scanAllPinPairs();
  }

  // Step 3: If hardware still not ACKed, fallback to Diagnostic Simulation Mode for Web UI testing & guidance
  if (imuReady) {
    Serial.println("{\"status\":\"ready\",\"message\":\"IMU Hardware initialized. Starting calibration...\"}");
    imu.performCalibration();
  } else {
    Serial.println("{\"status\":\"diagnostic\",\"message\":\"No physical IMU detected. Activating Diagnostic Simulation Mode for Dashboard testing. Check wiring guide in AIR.html.\"}");
    imu.setSimulationMode(true);
    imuReady = true;
  }
}

void loop() {
  // Feed ESP32 Task Watchdog Timer
  yield();

  // 1. Process Serial Commands from Web Interface
  handleSerialCommands();

  // 2. Poll Hardware Push Buttons
  buttons.update();

  // 3. Handle Physical Button Actions (Recalibrate & Toggle Motion)
  if (buttons.isCalibrateClicked()) {
    imu.performCalibration();
  }

  if (buttons.isToggleMotionClicked()) {
    mouse.toggleMotion();
    Serial.print("{\"status\":\"config\",\"message\":\"Hardware button toggled motion\",\"motionActive\":");
    Serial.print(mouse.isMotionEnabled() ? "true" : "false");
    Serial.println("}");
  }

  // 4. High-rate Telemetry & Motion Processing Loop (~100Hz / 10ms)
  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = millis();

    IMUData sample;
    if (imu.readSensorData(sample)) {
      mouse.process(sample, buttons, imu.isCalibrated());
    }
  }
}
