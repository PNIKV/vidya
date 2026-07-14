#include <ESP8266WiFi.h>
#include <Wire.h>
#include <math.h>


#define MPU_ADDR 0x68

// Pins
#define BUZZER D5
#define BUTTON D6

// WiFi
const char *ssid = "OnePlus Nord 5 3E0C";
const char *password = "shreekalp";

// MPU6050 Data
int16_t ax, ay, az;
int16_t gx, gy, gz;

bool accidentDetected = false;

// Increase or decrease after testing
const long IMPACT_THRESHOLD = 45000;

void setup() {

  Serial.begin(115200);

  pinMode(BUZZER, OUTPUT);
  pinMode(BUTTON, INPUT_PULLUP);

  digitalWrite(BUZZER, LOW);

  Wire.begin(D2, D1);

  // Wake up MPU6050
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission();

  Serial.println("Sensor Ready");

  // Connect WiFi
  WiFi.begin(ssid, password);

  Serial.print("Connecting WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi Connected");
  Serial.print("IP Address : ");
  Serial.println(WiFi.localIP());
}

void loop() {

  readSensor();

  double impact = sqrt((double)ax * ax + (double)ay * ay + (double)az * az);

  Serial.print("Impact: ");
  Serial.println(impact);

  if (impact > IMPACT_THRESHOLD && !accidentDetected) {

    accidentDetected = true;

    Serial.println();
    Serial.println("***************");
    Serial.println("ACCIDENT DETECTED");
    Serial.println("***************");

    for (int i = 15; i > 0; i--) {

      digitalWrite(BUZZER, HIGH);
      delay(250);
      digitalWrite(BUZZER, LOW);
      delay(250);

      Serial.print("Alert in ");
      Serial.print(i);
      Serial.println(" seconds");

      // Button Cancel
      if (digitalRead(BUTTON) == LOW) {

        delay(50);

        if (digitalRead(BUTTON) == LOW) {

          Serial.println("Alert Cancelled");

          digitalWrite(BUZZER, LOW);

          while (digitalRead(BUTTON) == LOW)
            ;

          accidentDetected = false;

          delay(200);

          return;
        }
      }
    }

    sendAlert();

    accidentDetected = false;
  }

  delay(100);
}

void readSensor() {

  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);

  Wire.requestFrom((uint8_t)MPU_ADDR, (size_t)14, true);

  ax = Wire.read() << 8 | Wire.read();
  ay = Wire.read() << 8 | Wire.read();
  az = Wire.read() << 8 | Wire.read();

  Wire.read();
  Wire.read();

  gx = Wire.read() << 8 | Wire.read();
  gy = Wire.read() << 8 | Wire.read();
  gz = Wire.read() << 8 | Wire.read();
}

void sendAlert() {

  Serial.println();
  Serial.println("==============================");
  Serial.println("ACCIDENT ALERT SENT");
  Serial.println("Vehicle ID : V001");
  Serial.println("Status     : Accident Detected");
  Serial.println("==============================");

  // Add Telegram/Blynk/Firebase code here
}