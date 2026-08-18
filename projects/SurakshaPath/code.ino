/*
==========================================
        SurakshaPath V1
 Smart Open Manhole Detection System
==========================================

Board : ESP8266 NodeMCU

Connections

HC-SR04
VCC  -> VU
GND  -> GND
TRIG -> D5
ECHO -> D6

Green LED -> D3
Red LED   -> D7

Buzzer -> D0
==========================================
*/

#define TRIG_PIN D5
#define ECHO_PIN D6

#define GREEN_LED D3
#define RED_LED D7

#define BUZZER D0

long duration;
float distance;

void setup() {

  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  digitalWrite(GREEN_LED, HIGH);
  digitalWrite(RED_LED, LOW);
  digitalWrite(BUZZER, LOW);

  Serial.println("SurakshaPath Started");
}

void loop() {

  // Trigger Pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);

  digitalWrite(TRIG_PIN, LOW);

  // Read Echo
  duration = pulseIn(ECHO_PIN, HIGH);

  // Calculate Distance
  distance = duration * 0.034 / 2;

  Serial.print("Distance : ");
  Serial.print(distance);
  Serial.println(" cm");

  // ---------- Detection ----------

  if (distance > 15) {

    Serial.println("OPEN MANHOLE DETECTED");

    digitalWrite(RED_LED, HIGH);
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(BUZZER, HIGH);

  }
  else {

    Serial.println("SAFE");

    digitalWrite(RED_LED, LOW);
    digitalWrite(GREEN_LED, HIGH);
    digitalWrite(BUZZER, LOW);

  }

  delay(500);
}