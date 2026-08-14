// Smart Vacuum Cleaner Robot - Dual Ultrasonic Sensor Driver Header

#ifndef VACUUM_SENSORS_H
#define VACUUM_SENSORS_H

#include <Arduino.h>
#include "vacuum_config.h"

// Initialize ultrasonic sensor GPIO pins
void initSensors();

// Asynchronous periodic sensor reading & connection auto-detection (runs in loop)
void updateSensors();

// Read ultrasonic sensor distance in cm (returns -1 if disconnected or invalid)
int measureDistanceCm(int trigPin, int echoPin, bool &isConnectedState, int &failCounter);

#endif // VACUUM_SENSORS_H
