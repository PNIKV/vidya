/*
  ============================================================================
  VAWT ROADSIDE KINETIC ENERGY HARVESTER — MONITOR & STREETLIGHT CONTROLLER
  (MODIFIED VERSION — LDR removed, light is now driven purely by generated
   voltage from the 3 dynamo motors)
  ============================================================================
  Project idea:
    A Vertical Axis Wind Turbine (VAWT) sits on the road divider. Airflow
    (waste kinetic energy) pushed out by passing vehicles spins the turbine.
    The turbine shaft turns 3 small DC dynamo/generator motors. The power
    generated charges a battery bank, which is used to run highway lights
    / small loads.

  What changed in this version:
    - LDR sensor and all ambient-light logic have been REMOVED.
    - The streetlight LED now turns on purely based on whether the 3
      combined dynamo motors are actually generating voltage. As soon as
      you rotate the motor shaft, the voltage sensor sees a rise in
      voltage, and the LED blinks / lights up — no darkness required.

  What this sketch does now (bench-demo logic):
    1. Reads generator output through an ACS712 current sensor and a
       voltage-divider voltage sensor -> computes instantaneous power.
    2. Reads shaft speed with a hall-effect sensor -> computes RPM
       (kept purely for telemetry / dashboard display, not for the
       light decision anymore).
    3. Reads temperature/humidity with a DHT11 for environmental logging.
    4. Streetlight (LED / relay) logic — now voltage-driven:
         - If generated voltage is BELOW threshold -> light OFF
           (motor isn't spinning / not generating enough)
         - The MOMENT voltage crosses the threshold (motor just started
           spinning) -> blink a few times (visual proof for evaluators
           that "rotation = generation = light")
         - While voltage STAYS above threshold -> light ON steady
         - If voltage drops back below threshold -> light OFF
    5. Streams all readings once a second as one JSON line over Serial,
       which the companion dashboard.html reads live via the Web Serial
       API (Chrome/Edge) and turns into gauges + a live chart.

  Hardware used:
    - ACS712 current sensor        -> A0
    - Voltage sensor module        -> A1   (this now drives the light logic)
    - DHT11 temperature/humidity   -> D2
    - Hall effect sensor (RPM)     -> D3   (telemetry only, no wiring change)
    - Streetlight LED / relay IN   -> D9   (PWM capable, used for blinking)
    - Status LED (optional)        -> D13  (onboard LED mirrors light state)

  NOTE ON THE "3 DYNAMO MOTORS":
    The 3 generator motors are wired together (in parallel, after individual
    rectifier diodes/bridge rectifiers so they don't fight each other) into
    ONE combined DC output. THAT combined output is what feeds the ACS712 /
    voltage sensor / battery. You do not wire 3 separate sensors — you
    combine the generators first, then measure the combined result. This
    is standard practice for multi-generator harvesting setups.

  Libraries needed (Arduino IDE -> Library Manager):
    - "DHT sensor library" by Adafruit  (+ "Adafruit Unified Sensor")
  ============================================================================
*/

#include <DHT.h>

// ---------------------------- PIN DEFINITIONS ------------------------------
#define DHT_PIN            2
#define DHT_TYPE           DHT11
#define HALL_PIN           3      // interrupt-capable pin (D2/D3 on Uno)
#define ACS712_PIN         A0
#define VOLTAGE_PIN        A1
#define STREETLIGHT_PIN    9      // PWM pin -> LED (through resistor) or relay
#define STATUS_LED_PIN     13     // onboard LED mirrors streetlight state

// ---------------------------- CALIBRATION ----------------------------------
// ACS712 variant sensitivity: 5A model = 185 mV/A, 20A = 100 mV/A, 30A = 66 mV/A
#define ACS712_MV_PER_AMP     185.0
#define ACS712_ZERO_VOLTAGE   2.500   // sensor output at 0 A (measure yours, ~2.5V typical)

// Voltage sensor module divider ratio. Common cheap module: (R1+R2)/R2 = 5.0
// Recalibrate: measure real motor voltage with a multimeter, compare to
// raw reading, and adjust this constant until they match.
#define VOLTAGE_DIVIDER_RATIO 5.0

#define ARDUINO_VREF           5.0
#define ADC_RESOLUTION         1023.0

// Hall sensor: how many magnet pulses per one full shaft revolution
#define PULSES_PER_REV         1

// ---- STREETLIGHT TRIGGER (now based on generated voltage, not RPM/LDR) ----
// Minimum combined dynamo voltage that counts as "motor is generating /
// shaft is being rotated". Hand-spun small DC motors used as generators
// typically put out a couple of volts even at slow hand-crank speeds, so
// start with a low value and raise it once you've measured your own motors.
#define VOLTAGE_SPIN_THRESHOLD   1.0    // volts

// How many quick blinks to show when generated voltage crosses the threshold
#define STARTUP_BLINK_COUNT    4
#define STARTUP_BLINK_MS       150

// How often we push a JSON reading to Serial (ms)
#define REPORT_INTERVAL_MS     1000
// How often we recompute RPM from pulse count (ms)
#define RPM_WINDOW_MS           1000

// ---------------------------- GLOBAL STATE ----------------------------------
DHT dht(DHT_PIN, DHT_TYPE);

volatile unsigned long pulseCount = 0;
unsigned long lastRpmCalcTime = 0;
float currentRPM = 0;

unsigned long lastReportTime = 0;

bool wasGenerating = false;
bool streetlightOn = false;

// ---------------------------- ISR --------------------------------------
void hallISR() {
  pulseCount++;
}

// ---------------------------- SETUP --------------------------------------
void setup() {
  Serial.begin(9600);

  pinMode(HALL_PIN, INPUT_PULLUP);
  pinMode(STREETLIGHT_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);

  attachInterrupt(digitalPinToInterrupt(HALL_PIN), hallISR, FALLING);

  dht.begin();

  digitalWrite(STREETLIGHT_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, LOW);

  lastRpmCalcTime = millis();
  lastReportTime = millis();

  Serial.println(F("{\"status\":\"VAWT Monitor booted (voltage-triggered light)\"}"));
}

// ---------------------------- HELPERS --------------------------------------

float readCurrentAmps() {
  int raw = analogRead(ACS712_PIN);
  float voltage = (raw / ADC_RESOLUTION) * ARDUINO_VREF;
  float amps = (voltage - ACS712_ZERO_VOLTAGE) / (ACS712_MV_PER_AMP / 1000.0);
  if (abs(amps) < 0.05) amps = 0.0;   // small dead-band to hide sensor noise
  return amps;
}

float readVoltage() {
  int raw = analogRead(VOLTAGE_PIN);
  float voltage = (raw / ADC_RESOLUTION) * ARDUINO_VREF * VOLTAGE_DIVIDER_RATIO;
  return voltage;
}

void updateRPM() {
  unsigned long now = millis();
  if (now - lastRpmCalcTime >= RPM_WINDOW_MS) {
    noInterrupts();
    unsigned long pulses = pulseCount;
    pulseCount = 0;
    interrupts();

    float minutes = (now - lastRpmCalcTime) / 60000.0;
    currentRPM = (pulses / (float)PULSES_PER_REV) / minutes;

    lastRpmCalcTime = now;
  }
}

// Blocking startup blink sequence — proves "rotation just began -> light reacts"
void playStartupBlink() {
  for (int i = 0; i < STARTUP_BLINK_COUNT; i++) {
    digitalWrite(STREETLIGHT_PIN, HIGH);
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(STARTUP_BLINK_MS);
    digitalWrite(STREETLIGHT_PIN, LOW);
    digitalWrite(STATUS_LED_PIN, LOW);
    delay(STARTUP_BLINK_MS);
  }
}

// Core decision logic — light now reacts purely to generated voltage
void updateStreetlight(float volts) {
  bool generating = volts > VOLTAGE_SPIN_THRESHOLD;

  if (generating && !wasGenerating) {
    // Voltage just crossed the threshold -> motor just started spinning
    playStartupBlink();
  }
  wasGenerating = generating;

  streetlightOn = generating;

  digitalWrite(STREETLIGHT_PIN, streetlightOn ? HIGH : LOW);
  digitalWrite(STATUS_LED_PIN, streetlightOn ? HIGH : LOW);
}

// ---------------------------- MAIN LOOP --------------------------------------
void loop() {
  updateRPM();

  float amps  = readCurrentAmps();
  float volts = readVoltage();

  updateStreetlight(volts);   // checked every loop, not just once a second, for a snappy response

  unsigned long now = millis();
  if (now - lastReportTime >= REPORT_INTERVAL_MS) {
    lastReportTime = now;

    float watts = amps * volts;
    float temp  = dht.readTemperature();
    float hum   = dht.readHumidity();

    // Guard against DHT11 read failures (common, non-fatal)
    if (isnan(temp)) temp = 0;
    if (isnan(hum))  hum = 0;

    // Single-line JSON -> easy for the HTML dashboard to parse
    Serial.print(F("{"));
    Serial.print(F("\"rpm\":"));       Serial.print(currentRPM, 1);
    Serial.print(F(",\"voltage\":"));  Serial.print(volts, 2);
    Serial.print(F(",\"current\":"));  Serial.print(amps, 3);
    Serial.print(F(",\"power\":"));    Serial.print(watts, 2);
    Serial.print(F(",\"temp\":"));     Serial.print(temp, 1);
    Serial.print(F(",\"humidity\":"));Serial.print(hum, 1);
    Serial.print(F(",\"light\":\""));  Serial.print(streetlightOn ? "ON" : "OFF"); Serial.print(F("\""));
    Serial.println(F("}"));
  }
}

