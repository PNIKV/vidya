/*
  ============================================================================
  WAYSIDE — Roadside Energy & Traffic Monitor
  Firmware for Arduino Uno
  ============================================================================

  Reads five sensors on a roadside VAWT (Vertical Axis Wind Turbine) energy
  harvesting rig and streams structured lines over serial (9600 baud) to the
  Wayside web dashboard (physics.js listens for these exact line formats).

  Sensors:
    1. Voltage divider on A0      -> generator output voltage
    2. ACS712 current sensor A1   -> generator output current
    3. DHT11 on pin 2             -> ambient temperature & humidity
    4. Hall-effect sensor on pin 3-> rotor magnet passes (RPM is derived
                                     browser-side from the time between pulses)
    5. Digital LDR module on pin 10 -> ambient light level, auto-drives a
                                        streetlight LED on pin 11

  PIN MAP (unchanged from original build — do not renumber):
    A0  - Voltage divider midpoint
    A1  - ACS712 output
    D2  - DHT11 data
    D3  - Hall-effect sensor output
    D10 - LDR digital output
    D11 - Streetlight LED (driven by LDR)
    D13 - Hall-detect indicator LED

  Serial line formats (consumed by the dashboard's parser):
    "Input Voltage = 12.34"
    "Current: 1.234 A"
    "Humidity: 45.00%  Temperature: 24.00°C"
    "Magnet Detected!"
    "Ambient Light: DARK - Streetlight ON"
    "Ambient Light: BRIGHT - Streetlight OFF"
  ============================================================================
*/

#include <DHT.h>

// ---------------------------------------------------------------------------
// Section 1: Voltage divider (generator output voltage)
// ---------------------------------------------------------------------------
namespace VoltageSensor {
  const int PIN = A0;
  const float R1 = 30000.0;   // ohms, top resistor
  const float R2 = 7500.0;    // ohms, bottom resistor
  const unsigned long INTERVAL_MS = 500;
  unsigned long lastRead = 0;

  // Vin = Vout / (R2 / (R1 + R2)), where Vout is what the ADC actually sees
  void readAndReport() {
    int raw = analogRead(PIN);
    float vout = (raw * 5.0) / 1024.0;
    float vin = vout / (R2 / (R1 + R2));

    Serial.print("Input Voltage = ");
    Serial.println(vin);
  }

  void update(unsigned long now) {
    if (now - lastRead >= INTERVAL_MS) {
      lastRead = now;
      readAndReport();
    }
  }
}

// ---------------------------------------------------------------------------
// Section 2: ACS712 current sensor (generator output current)
// ---------------------------------------------------------------------------
namespace CurrentSensor {
  const int PIN = A1;
  // Sensitivity in V/A. Use 0.185 for the 5A module, 0.100 for 20A, 0.066 for 30A.
  const double SENSITIVITY = 0.185;
  const unsigned long INTERVAL_MS = 1000;
  unsigned long lastRead = 0;

  // The ACS712's output sits at ~2.5V (mid-supply) at zero current, so we
  // measure the deviation from that midpoint and convert it via sensitivity.
  void readAndReport() {
    int raw = analogRead(PIN);
    double voltage = (raw / 1023.0) * 5.0;
    double amps = (voltage - 2.5) / SENSITIVITY;

    Serial.print("Current: ");
    Serial.print(amps, 3);
    Serial.println(" A");
  }

  void update(unsigned long now) {
    if (now - lastRead >= INTERVAL_MS) {
      lastRead = now;
      readAndReport();
    }
  }
}

// ---------------------------------------------------------------------------
// Section 3: DHT11 environment sensor (temperature & humidity)
// ---------------------------------------------------------------------------
namespace EnvironmentSensor {
  const int PIN = 2;
  const unsigned long INTERVAL_MS = 2000;
  unsigned long lastRead = 0;
  DHT dht(PIN, DHT11);

  void begin() {
    dht.begin();
  }

  void readAndReport() {
    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (isnan(h) || isnan(t)) {
      Serial.println(F("Failed to read from DHT sensor!"));
      return;
    }

    Serial.print(F("Humidity: "));
    Serial.print(h);
    Serial.print(F("%  Temperature: "));
    Serial.print(t);
    Serial.println(F("\xC2\xB0" "C"));  // deg symbol + C, UTF-8 safe
  }

  void update(unsigned long now) {
    if (now - lastRead >= INTERVAL_MS) {
      lastRead = now;
      readAndReport();
    }
  }
}

// ---------------------------------------------------------------------------
// Section 4: Hall-effect sensor (rotor magnet pass detection)
// ---------------------------------------------------------------------------
namespace HallSensor {
  const int SENSOR_PIN = 3;
  const int INDICATOR_LED_PIN = 13;

  void begin() {
    pinMode(SENSOR_PIN, INPUT);
    pinMode(INDICATOR_LED_PIN, OUTPUT);
  }

  // Checked every loop (no interval gate) so pulse timing stays accurate.
  // The dashboard derives RPM itself by timing the gap between prints,
  // and debounces repeated prints from a single magnet pass — that is
  // why this intentionally prints on every LOW read rather than only
  // on the falling edge.
  void update() {
    bool magnetPresent = (digitalRead(SENSOR_PIN) == LOW);
    digitalWrite(INDICATOR_LED_PIN, magnetPresent ? HIGH : LOW);
    if (magnetPresent) {
      Serial.println("Magnet Detected!");
    }
  }
}

// ---------------------------------------------------------------------------
// Section 5: LDR ambient-light sensor (drives the streetlight LED)
// ---------------------------------------------------------------------------
namespace LightSensor {
  const int LDR_PIN = 10;
  const int STREETLIGHT_PIN = 11;
  bool lastIsDark = false;
  bool firstRead = true;

  void begin() {
    pinMode(LDR_PIN, INPUT);
    pinMode(STREETLIGHT_PIN, OUTPUT);
  }

  // Most digital LDR comparator modules pull the output HIGH when it's dark.
  // The streetlight LED mirrors that automatically. We only print a line
  // when the state actually changes, so the serial feed stays clean instead
  // of flooding once per loop.
  void update() {
    bool isDark = (digitalRead(LDR_PIN) == HIGH);
    digitalWrite(STREETLIGHT_PIN, isDark ? HIGH : LOW);

    if (firstRead || isDark != lastIsDark) {
      Serial.print("Ambient Light: ");
      Serial.print(isDark ? "DARK" : "BRIGHT");
      Serial.print(" - Streetlight ");
      Serial.println(isDark ? "ON" : "OFF");
      lastIsDark = isDark;
      firstRead = false;
    }
  }
}

// ---------------------------------------------------------------------------
// Setup & main loop
// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(9600);

  HallSensor::begin();
  LightSensor::begin();
  EnvironmentSensor::begin();

  Serial.println("Wayside multi-sensor monitor started");
}

void loop() {
  unsigned long now = millis();

  VoltageSensor::update(now);
  CurrentSensor::update(now);
  EnvironmentSensor::update(now);

  // These two are read every loop — no interval gate — since pulse timing
  // (hall sensor) and streetlight response (LDR) both need to react
  // immediately rather than on a fixed schedule.
  HallSensor::update();
  LightSensor::update();
}
