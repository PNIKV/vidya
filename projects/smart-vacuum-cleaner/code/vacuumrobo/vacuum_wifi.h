// Smart Vacuum Cleaner Robot - Multi-WiFi Connection Manager Header

#ifndef VACUUM_WIFI_H
#define VACUUM_WIFI_H

#include <Arduino.h>
#include "vacuum_config.h"

// Scan and attempt connection to primary WiFi networks (3 APs), falling back to AP mode if unreachable
void initWiFi();

// Periodic mDNS and network maintainer
void updateWiFi();

#endif // VACUUM_WIFI_H
