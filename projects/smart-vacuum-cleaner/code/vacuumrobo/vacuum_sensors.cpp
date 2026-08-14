// Smart Vacuum Cleaner Robot - Dual Ultrasonic Sensor Implementation & Auto-Detection

#include "vacuum_sensors.h"

static unsigned long lastSensorReadTime = 0;
static int sensor1Failures = 0;
static int sensor2Failures = 0;
const int MAX_FAILURES_BEFORE_DISCONNECT = 4;
const unsigned long SENSOR_INTERVAL_MS = 100; // Poll sensors every 100ms

void initSensors() {
    pinMode(TRIG1_PIN, OUTPUT);
    digitalWrite(TRIG1_PIN, LOW);
    pinMode(ECHO1_PIN, INPUT);

    if (TRIG2_PIN != TRIG1_PIN) {
        pinMode(TRIG2_PIN, OUTPUT);
        digitalWrite(TRIG2_PIN, LOW);
    }
    pinMode(ECHO2_PIN, INPUT);

    sensor1DistCm = -1;
    sensor2DistCm = -1;
    isSensor1Connected = false;
    isSensor2Connected = false;
    obstacleDetected = false;

    Serial.println("[ULTRASONIC SENSORS] Driver Initialized (Dual HC-SR04 Auto-Detect).");
}

int measureDistanceCm(int trigPin, int echoPin, bool &isConnectedState, int &failCounter) {
    // Send 10us high pulse to Trigger pin
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    // Read high echo pulse duration with a 15ms timeout (~2.5 meters max range)
    unsigned long duration = pulseIn(echoPin, HIGH, 15000);

    if (duration == 0 || duration < 100) {
        // Echo timed out or invalid signal
        failCounter++;
        if (failCounter >= MAX_FAILURES_BEFORE_DISCONNECT) {
            isConnectedState = false;
            return -1;
        }
        return isConnectedState ? -1 : -1;
    }

    // Valid echo received
    failCounter = 0;
    isConnectedState = true;

    // Convert microseconds to cm (Speed of sound = 343 m/s -> 29.1 us/cm -> divide roundtrip by 58.2)
    int distance = duration / 58.2;
    if (distance > 300) return -1; // Ignore extreme out-of-range artifacts
    return distance;
}

void updateSensors() {
    unsigned long now = millis();
    if (now - lastSensorReadTime < SENSOR_INTERVAL_MS) {
        return; // Non-blocking rate limiter
    }
    lastSensorReadTime = now;

    // Measure Sensor 1 (Front Left)
    sensor1DistCm = measureDistanceCm(TRIG1_PIN, ECHO1_PIN, isSensor1Connected, sensor1Failures);

    // Short delay to avoid acoustic cross-talk
    delayMicroseconds(200);

    // Measure Sensor 2 (Front Right)
    sensor2DistCm = measureDistanceCm(TRIG2_PIN, ECHO2_PIN, isSensor2Connected, sensor2Failures);

    // Obstacle Evaluation: check if any connected sensor reads < MIN_OBSTACLE_DISTANCE
    bool obs1 = (isSensor1Connected && sensor1DistCm > 0 && sensor1DistCm <= MIN_OBSTACLE_DISTANCE);
    bool obs2 = (isSensor2Connected && sensor2DistCm > 0 && sensor2DistCm <= MIN_OBSTACLE_DISTANCE);

    obstacleDetected = (obs1 || obs2);
}
