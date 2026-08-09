// Interfacing a Single Common Cathode 7-Segment Display
// Arduino Uno

const int segmentPins[8] = {2, 3, 4, 5, 6, 7, 8, 9};
// a, b, c, d, e, f, g, dp

// Digit patterns (Common Cathode)
// Format: a,b,c,d,e,f,g
const byte digits[10][7] = {
  {1,1,1,1,1,1,0}, // 0
  {0,1,1,0,0,0,0}, // 1
  {1,1,0,1,1,0,1}, // 2
  {1,1,1,1,0,0,1}, // 3
  {0,1,1,0,0,1,1}, // 4
  {1,0,1,1,0,1,1}, // 5
  {1,0,1,1,1,1,1}, // 6
  {1,1,1,0,0,0,0}, // 7
  {1,1,1,1,1,1,1}, // 8
  {1,1,1,1,0,1,1}  // 9
};

void setup() {
  for (int i = 0; i < 8; i++) {
    pinMode(segmentPins[i], OUTPUT);
  }

  // Decimal Point always ON
  digitalWrite(segmentPins[7], HIGH);
}

void displayDigit(int num) {
  for (int i = 0; i < 7; i++) {
    digitalWrite(segmentPins[i], digits[num][i]);
  }

  // Keep Decimal Point ON
  digitalWrite(segmentPins[7], HIGH);
}

void loop() {
  for (int i = 0; i <= 9; i++) {
    displayDigit(i);
    delay(1000);
  }
}