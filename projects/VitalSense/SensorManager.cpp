#include "SensorManager.h"
#include "spo2_algorithm.h"
#include <Arduino.h>

bool SensorManager::begin() {
    Wire.begin(PIN_SDA, PIN_SCL);
    Wire.setClock(400000);   // 400kHz fast mode — reduces I2C stall time

    if (!_sensor.begin(Wire, I2C_SPEED_FAST)) {
        Serial.println("[Sensor] MAX30102 not found. Check wiring (SDA=D2, SCL=D1)");
        return false;
    }

    byte rev = _sensor.getRevisionID();
    byte part = _sensor.readPartID();
    Serial.printf("[Sensor] Found: Part=0x%02X Rev=0x%02X\n", part, rev);

    _sensor.setup(
        SENSOR_LED_BRIGHT,
        SENSOR_SAMPLE_AVG,
        SENSOR_LED_MODE,
        SENSOR_SAMPLE_RATE,
        SENSOR_PULSE_WIDTH,
        SENSOR_ADC_RANGE
    );

    // Extra: boost IR LED for better finger detection
    _sensor.setPulseAmplitudeRed(0x0A);
    _sensor.setPulseAmplitudeGreen(0);   // turn off green, not needed

    Serial.println("[Sensor] MAX30102 ready");
    return true;
}

void SensorManager::update() {
    _sensor.check();
    if (!_sensor.available()) return;

    uint32_t ir  = _sensor.getIR();
    uint32_t red = _sensor.getRed();
    _sensor.nextSample();

    // ── Finger detection ─────────────────────────────────────────────────────
    bool finger = (ir > IR_FINGER_THRESHOLD);
    DataStore::vitals.fingerOn = finger;

    if (!finger) {
        _idx = 0;
        _invalidStreak = 0;
        DataStore::vitals.hrValid    = false;
        DataStore::vitals.spo2Valid  = false;
        DataStore::vitals.heartRate  = 0;
        DataStore::vitals.spo2       = 0;
        DataStore::vitals.confidence = 0;
        return;
    }

    // ── Fill buffer ──────────────────────────────────────────────────────────
    _irBuf[_idx]  = ir;
    _redBuf[_idx] = red;
    _idx++;

    if (_idx >= SENSOR_BUFFER_SIZE) {
        _idx = 0;
        _runAlgorithm();
    }
}

void SensorManager::_runAlgorithm() {
    int32_t hr, spo2;
    int8_t  hrValid, spo2Valid;

    maxim_heart_rate_and_oxygen_saturation(
        _irBuf,  SENSOR_BUFFER_SIZE,
        _redBuf,
        &spo2,   &spo2Valid,
        &hr,     &hrValid
    );

    VitalData& v = DataStore::vitals;

    bool hrOk   = (hrValid   == 1) && (hr   >= 40) && (hr   <= 200);
    bool spo2Ok = (spo2Valid == 1) && (spo2 >= 80) && (spo2 <= 100);

    if (hrOk) {
        v.heartRate = hr;
        v.hrValid   = true;
        _invalidStreak = 0;
    } else {
        _invalidStreak++;
        if (_invalidStreak >= 6) {
            v.hrValid   = false;
            v.spo2Valid = false;
        }
    }

    if (spo2Ok) {
        v.spo2      = spo2;
        v.spo2Valid = true;
    }

    v.confidence = _calcConfidence(hr, spo2, hrOk, spo2Ok);
    v.timestamp  = millis();

    // Throttled serial output — every 3 seconds
    if (millis() - _lastPrint >= 3000) {
        _lastPrint = millis();
        Serial.printf("[Sensor] HR: %d (%s)  SpO2: %d (%s)  IR: %lu  Streak: %d\n",
            (int)v.heartRate,  v.hrValid   ? "ok"  : "inv",
            (int)v.spo2,       v.spo2Valid ? "ok"  : "inv",
            _irBuf[0],
            (int)_invalidStreak
        );
    }
}

uint8_t SensorManager::_calcConfidence(int32_t hr, int32_t spo2, bool hrOk, bool spo2Ok) {
    if (!hrOk && !spo2Ok) return 0;
    uint8_t score = 0;
    if (hrOk)              score += 50;
    if (spo2Ok)            score += 30;
    if (hr  >= 55 && hr  <= 100) score += 10;   // typical resting range
    if (spo2 >= 95)              score += 10;
    return score;
}