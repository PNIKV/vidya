#pragma once
#include <stdint.h>

struct VitalData {
    int32_t  heartRate  = 0;
    int32_t  spo2       = 0;
    bool     hrValid    = false;
    bool     spo2Valid  = false;
    bool     fingerOn   = false;
    uint32_t timestamp  = 0;
    uint8_t  confidence = 0;   // 0-100 rough quality score
    uint32_t ir         = 0;   // ← add this
};

class DataStore {
public:
    static VitalData vitals;
};