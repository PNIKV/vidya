#include <Arduino.h>
#include <ESP8266WiFi.h>
#include "Config.h"
#include "DataStore.h"
#include "SensorManager.h"
#include "WebManager.h"

SensorManager sensor;
WebManager    web;

void connectWiFi() {
    Serial.printf("\n[WiFi] Connecting to %s", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    uint8_t tries = 0;
    while (WiFi.status() != WL_CONNECTED && tries < 40) {
        delay(500); Serial.print('.'); tries++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WiFi] Connected. IP: %s\n", WiFi.localIP().toString().c_str());
    } else {
        Serial.println("\n[WiFi] Failed — restarting"); ESP.restart();
    }
}

void setup() {
    Serial.begin(115200);
    delay(500);
    connectWiFi();
    if (!sensor.begin()) { Serial.println("[Main] Sensor init failed"); while(1) delay(1000); }
    web.begin();
    Serial.println("[Main] Ready → http://" + WiFi.localIP().toString());
}

void loop() {
    sensor.update();
    web.update();
    delay(200);
    if (WiFi.status() != WL_CONNECTED) connectWiFi();
    yield();
}