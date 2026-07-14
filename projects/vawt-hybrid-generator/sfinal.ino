#include <DHT.h>

// ---------- Voltage Divider ----------
#define VOLTAGE_PIN A0
float vout = 0.0;
float vin = 0.0;
const float R1 = 30000.0; // 30k ohm resistor
const float R2 = 7500.0;  // 7.5k ohm resistor

// ---------- ACS712 Current Sensor ----------
const int currentPin = A1;
int adcValue = 0;
double currentVoltage = 0;
double current = 0;
// Use 0.185 for 5A module, 0.100 for 20A, 0.066 for 30A
const double sensitivity = 0.185;

// ---------- DHT11 Sensor ----------
#define DHTPIN 2
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ---------- Hall Effect Sensor ----------
const int hallPin = 3;
const int ledPin = 13;

// ---------- Timing (non-blocking) ----------
unsigned long lastVoltageRead = 0;
unsigned long lastCurrentRead = 0;
unsigned long lastDHTRead = 0;

const unsigned long VOLTAGE_INTERVAL = 500;
const unsigned long CURRENT_INTERVAL = 1000;
const unsigned long DHT_INTERVAL = 2000;

void setup() {
  Serial.begin(9600);
  pinMode(hallPin, INPUT);
  pinMode(ledPin, OUTPUT);
  dht.begin();
  Serial.println("Multi-sensor monitor started");
}

void loop() {
  unsigned long currentMillis = millis();

  // ---- Voltage divider reading ----
  if (currentMillis - lastVoltageRead >= VOLTAGE_INTERVAL) {
    lastVoltageRead = currentMillis;

    int value = analogRead(VOLTAGE_PIN);
    vout = (value * 5.0) / 1024.0;
    vin = vout / (R2 / (R1 + R2));

    Serial.print("Input Voltage = ");
    Serial.println(vin);
  }

  // ---- Current sensor reading ----
  if (currentMillis - lastCurrentRead >= CURRENT_INTERVAL) {
    lastCurrentRead = currentMillis;

    adcValue = analogRead(currentPin);
    currentVoltage = (adcValue / 1023.0) * 5.0;
    current = (currentVoltage - 2.5) / sensitivity;

    Serial.print("Current: ");
    Serial.print(current, 3);
    Serial.println(" A");
  }

  // ---- DHT11 reading ----
  if (currentMillis - lastDHTRead >= DHT_INTERVAL) {
    lastDHTRead = currentMillis;

    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (isnan(h) || isnan(t)) {
      Serial.println(F("Failed to read from DHT sensor!"));
    } else {
      Serial.print(F("Humidity: "));
      Serial.print(h);
      Serial.print(F("%  Temperature: "));
      Serial.print(t);
      Serial.println(F("°C"));
    }
  }

  // ---- Hall effect sensor (checked every loop, no delay needed) ----
  int sensorState = digitalRead(hallPin);
  if (sensorState == LOW) {
    digitalWrite(ledPin, HIGH);
    Serial.println("Magnet Detected!");
  } else {
    digitalWrite(ledPin, LOW);
  }
}
