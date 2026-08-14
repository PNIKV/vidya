// Smart Vacuum Cleaner Robot - Multi-WiFi Connection Manager Implementation

#include "vacuum_wifi.h"

void initWiFi() {
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();
    delay(100);

    bool connected = false;

    Serial.println("\n-------------------------------------------");
    Serial.println("[WIFI MANAGER] Scanning and attempting primary networks...");
    Serial.println("-------------------------------------------");

    for (int i = 0; i < PRIMARY_WIFI_COUNT; i++) {
        const char* ssid = PRIMARY_WIFI_NETWORKS[i].ssid;
        const char* pass = PRIMARY_WIFI_NETWORKS[i].password;

        if (strlen(ssid) == 0) continue;

        Serial.print("[WIFI] Attempting Network #");
        Serial.print(i + 1);
        Serial.print(": ");
        Serial.println(ssid);

        WiFi.begin(ssid, pass);

        int attempts = 0;
        while (WiFi.status() != WL_CONNECTED && attempts < 12) { // 6 Seconds timeout per network
            delay(500);
            Serial.print(".");
            attempts++;
        }

        if (WiFi.status() == WL_CONNECTED) {
            connected = true;
            connectedSSID = String(ssid);
            wifiStatusStr = "STA Mode (" + connectedSSID + ")";
            Serial.println("\n[SUCCESS] Connected to WiFi Network!");
            Serial.print("[IP ADDRESS] ");
            Serial.println(WiFi.localIP());
            break;
        } else {
            Serial.println("\n[FAILED] Could not connect to " + String(ssid));
            WiFi.disconnect();
            delay(100);
        }
    }

    if (!connected) {
        Serial.println("\n[WARNING] All primary WiFi networks failed. Starting Access Point mode...");
        WiFi.mode(WIFI_AP);
        WiFi.softAP(ap_ssid, ap_password);
        connectedSSID = String(ap_ssid);
        wifiStatusStr = "AP Mode (" + connectedSSID + ")";
        Serial.print("[AP IP ADDRESS] ");
        Serial.println(WiFi.softAPIP());
    }

    // Setup mDNS Service (http://vacuum.local/)
    if (MDNS.begin(mdns_hostname)) {
        Serial.print("[mDNS] Domain Active: http://");
        Serial.print(mdns_hostname);
        Serial.println(".local/");
        MDNS.addService("http", "tcp", 80);
    } else {
        Serial.println("[mDNS] Error initializing mDNS responder!");
    }
}

void updateWiFi() {
    MDNS.update();
}
