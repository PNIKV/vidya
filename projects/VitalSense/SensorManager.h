#pragma once
#include <Wire.h>
#include "MAX30105.h"
#include "Config.h"
#include "DataStore.h"

class SensorManager {
public:
    bool begin();
    void update();

private:
    MAX30105 _sensor;

    uint32_t _irBuf[SENSOR_BUFFER_SIZE];
    uint32_t _redBuf[SENSOR_BUFFER_SIZE];
    uint8_t  _idx           = 0;
    uint8_t  _invalidStreak = 0;
    uint32_t _lastPrint     = 0;

    void _runAlgorithm();
    uint8_t _calcConfidence(int32_t hr, int32_t spo2, bool hrOk, bool spo2Ok);
};