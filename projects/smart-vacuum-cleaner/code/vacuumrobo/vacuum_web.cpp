// Smart Vacuum Cleaner Robot - Web Server Routing & API Implementation

#include "vacuum_web.h"
#include "vacuum_config.h"
#include "vacuum_motors.h"
#include "vacuum_sensors.h"
#include "vacuum_wifi.h"

// Initialize HTTP server routes
void initWebServer() {
    server.on("/", HTTP_GET, []() {
        server.send(200, "text/html", INDEX_HTML);
    });

    server.on("/control", HTTP_GET, []() {
        // Air Pump Suction Relay Argument
        if (server.hasArg("vacuum")) {
            String val = server.arg("vacuum");
            bool enable = (val == "1" || val == "on" || val == "true");
            setVacuumPump(enable);
        }

        // Proportional 2D Joystick Vector Control (x, y, speed)
        if (server.hasArg("x") && server.hasArg("y")) {
            int x = server.arg("x").toInt();
            int y = server.arg("y").toInt();
            int speed = server.hasArg("speed") ? server.arg("speed").toInt() : currentSpeed;
            driveDifferential(x, y, speed);
        }
        // Legacy Directional Control
        else if (server.hasArg("dir")) {
            String dir = server.arg("dir");
            driveDirection(dir);
        }

        // Manual Speed Slider Override
        if (server.hasArg("speed") && !server.hasArg("x")) {
            currentSpeed = constrain(server.arg("speed").toInt(), 0, MAX_PWM);
            if (currentAction != "JOYSTICK") {
                driveDirection(currentAction);
            }
        }

        server.send(200, "text/plain", "OK");
    });

    server.on("/status", HTTP_GET, []() {
        String json = "{";
        json += "\"wifi_mode\":\"" + wifiStatusStr + "\",";
        json += "\"ssid\":\"" + connectedSSID + "\",";
        json += "\"ip\":\"" + (WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString()) + "\",";
        json += "\"mdns\":\"" + String(mdns_hostname) + ".local\",";
        json += "\"rssi\":" + String(WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : 0) + ",";
        json += "\"vacuum_relay\":" + String(vacuumRelayState ? "true" : "false") + ",";
        json += "\"vacuum_status\":\"" + String(vacuumRelayState ? "PUMP ACTIVE" : "PUMP OFF") + "\",";
        json += "\"speed\":" + String(currentSpeed) + ",";
        json += "\"speed_percentage\":" + String(map(currentSpeed, 0, 255, 0, 100)) + ",";
        json += "\"left_motor_pwm\":" + String(leftMotorPWM) + ",";
        json += "\"right_motor_pwm\":" + String(rightMotorPWM) + ",";
        json += "\"current_action\":\"" + currentAction + "\",";
        json += "\"joystick_x\":" + String(joystickX) + ",";
        json += "\"joystick_y\":" + String(joystickY) + ",";
        json += "\"reset_reason\":\"" + resetReasonStr + "\",";
        json += "\"reset_info\":\"" + resetInfoStr + "\",";
        json += "\"uptime\":" + String(millis() / 1000) + ",";
        json += "\"free_heap\":" + String(ESP.getFreeHeap()) + ",";
        json += "\"sensor1_connected\":" + String(isSensor1Connected ? "true" : "false") + ",";
        json += "\"sensor1_dist_cm\":" + String(sensor1DistCm) + ",";
        json += "\"sensor2_connected\":" + String(isSensor2Connected ? "true" : "false") + ",";
        json += "\"sensor2_dist_cm\":" + String(sensor2DistCm) + ",";
        json += "\"obstacle_detected\":" + String(obstacleDetected ? "true" : "false") + ",";
        json += "\"chassis\":\"" + String(CHASSIS_MODEL) + "\"";
        json += "}";
        server.send(200, "application/json", json);
    });

    server.begin();
    Serial.println("[HTTP SERVER] Server started on port 80.");
}

void updateWebServer() {
    server.handleClient();
}
