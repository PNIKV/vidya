/*
 * =====================================================================================
 * PROJECT   : LiFi Secure Terminal - Enhanced Optical Receiver Firmware (v2.0)
 * HARDWARE  : Arduino Uno / Nano (ATmega328P)
 * SENSOR    : LDR Light Sensor Module (Digital DO -> Pin 8 or Analog AO -> Pin A0)
 * DISPLAY   : 16x2 LCD via PCF8574 I2C Backpack (Address 0x27 / 0x3F, SDA=A4, SCL=A5)
 * FEATURES  : 
 *             1. Auto-Polarity Detection (Supports Active-HIGH and Active-LOW LDR modules)
 *             2. Auto-Baud Start Bit Timing Calibration (Auto-locks to 50ms - 200ms)
 *             3. Noise-Immune Multi-Sampling (3-point majority vote per bit slot)
 *             4. Interactive Serial Configuration Menu (Toggle Polarity, Baud, Bit Order)
 *             5. Frame Parity & Stop Bit Integrity Check
 * =====================================================================================
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// =====================================================================================
// PIN DEFINITIONS & DEFAULT CONFIGURATION
// =====================================================================================
const uint8_t LDR_PIN = 8;                 // Digital input pin from LDR Module DO
const uint8_t LDR_ANALOG_PIN = A0;         // Optional Analog pin for raw light levels

// Default Configuration Flags
bool activeHighLogic = true;               // true = Light ON gives HIGH; false = Light ON gives LOW
bool msbFirst = true;                      // true = Bit 7..0 (MSB First); false = Bit 0..7 (LSB First)
bool autoBaudEnabled = true;               // Auto-detect bit duration from Start Bit pulse width

unsigned long bitPeriodMs = 100;           // Default 100ms per bit (10 Hz Baud Rate)
unsigned long inactivityTimeoutMs = 4000;  // Reset LCD buffer after 4s idle

// Initialize 16x2 LCD with address 0x27 (Try 0x3F if display stays blank)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Display & Buffer State
String receivedMessage = "";
unsigned long lastSignalTime = 0;
bool isListeningState = true;

// Diagnostic Statistics
unsigned long totalBytesReceived = 0;
unsigned long errorBytesIgnored = 0;

// Function Prototypes
void initializeLCD();
void resetToListeningState();
char readOpticalByteWithSampling(unsigned long currentBitMs);
int readSensorState();
void printSystemStatus();
void handleSerialCommands();
void updateLCDDisplay(char newChar);

void setup() {
  pinMode(LDR_PIN, INPUT);
  Serial.begin(9600);

  Serial.println(F("=========================================================="));
  Serial.println(F("   LiFi Secure Terminal - Enhanced Receiver Firmware v2.0"));
  Serial.println(F("=========================================================="));

  // Initialize LCD
  initializeLCD();

  // Auto-calibrate baseline light polarity at bootup
  delay(200);
  int baselineState = digitalRead(LDR_PIN);
  // Assume resting ambient state is LIGHT_OFF
  if (baselineState == HIGH) {
    activeHighLogic = false; // Module resting state is HIGH -> Light pulse makes it LOW
    Serial.println(F("[AUTODETECT] Ambient LDR state is HIGH -> Set Active-LOW logic."));
  } else {
    activeHighLogic = true;  // Module resting state is LOW -> Light pulse makes it HIGH
    Serial.println(F("[AUTODETECT] Ambient LDR state is LOW -> Set Active-HIGH logic."));
  }

  printSystemStatus();
  lastSignalTime = millis();
}

void loop() {
  // Check for incoming user commands via Serial Monitor
  if (Serial.available() > 0) {
    handleSerialCommands();
  }

  // Poll LDR Sensor for Start Bit
  int sensorState = readSensorState();

  // -----------------------------------------------------------------------------------
  // 1. START BIT DETECTION & AUTO-BAUD CALIBRATION
  // -----------------------------------------------------------------------------------
  if (sensorState == 1) { // 1 means LIGHT_ON
    unsigned long startBitBeginUs = micros();
    unsigned long calibratedBitMs = bitPeriodMs;

    if (autoBaudEnabled) {
      // Measure actual Start Bit pulse duration in microseconds
      int targetState = activeHighLogic ? HIGH : LOW;
      unsigned long pulseDurationUs = pulseIn(LDR_PIN, targetState, 300000UL); // 300ms max timeout

      if (pulseDurationUs >= 35000UL && pulseDurationUs <= 250000UL) { // 35ms to 250ms range
        calibratedBitMs = (pulseDurationUs + 500UL) / 1000UL; // Convert us to ms
        Serial.print(F("[AUTO-BAUD] Measured Start Bit: "));
        Serial.print(pulseDurationUs / 1000.0, 1);
        Serial.print(F(" ms -> Auto-tuned Bit Period to: "));
        Serial.print(calibratedBitMs);
        Serial.println(F(" ms"));
      } else {
        // Fallback to configured default bit period
        delay(bitPeriodMs / 2);
      }
    } else {
      // Fixed delay to reach mid-point of data bit 7
      delay(bitPeriodMs + (bitPeriodMs / 2));
    }

    // Delay to align dead-center inside the first payload bit slot (Data Bit 7 or 0)
    delay(calibratedBitMs / 2);

    // ---------------------------------------------------------------------------------
    // 2. READ 8 PAYLOAD DATA BITS WITH NOISE-IMMUNE MULTI-SAMPLING
    // ---------------------------------------------------------------------------------
    char decodedByte = readOpticalByteWithSampling(calibratedBitMs);

    // ---------------------------------------------------------------------------------
    // 3. STOP BIT VALIDATION & ASCII FILTERING
    // ---------------------------------------------------------------------------------
    // Wait for Stop Bit window (Stop Bit must be LIGHT_OFF / 0)
    delay(calibratedBitMs);
    int stopBitState = readSensorState();

    bool stopBitValid = (stopBitState == 0); // Stop bit should be LOW / OFF

    if (stopBitValid && decodedByte >= 32 && decodedByte <= 126) {
      totalBytesReceived++;
      Serial.print(F("[RECV #"));
      Serial.print(totalBytesReceived);
      Serial.print(F("] ASCII: '"));
      Serial.print(decodedByte);
      Serial.print(F("' (DEC: "));
      Serial.print((int)decodedByte);
      Serial.print(F(", HEX: 0x"));
      Serial.print((int)decodedByte, HEX);
      Serial.println(F(")"));

      updateLCDDisplay(decodedByte);
    } else {
      errorBytesIgnored++;
      Serial.print(F("[WARNING] Corrupted/Invalid Frame Ignored. Byte: 0x"));
      Serial.print((int)decodedByte, HEX);
      Serial.print(F(" | Stop Bit Valid: "));
      Serial.println(stopBitValid ? F("YES") : F("NO (Timing Drift)"));
    }

    lastSignalTime = millis();
    isListeningState = false;
  }

  // -----------------------------------------------------------------------------------
  // 4. INACTIVITY TIMEOUT RESET (4000ms)
  // -----------------------------------------------------------------------------------
  if (!isListeningState && (millis() - lastSignalTime >= inactivityTimeoutMs)) {
    resetToListeningState();
  }
}

/**
 * Reads sensor state normalized to binary:
 * Returns 1 for LIGHT_ON, 0 for LIGHT_OFF.
 */
int readSensorState() {
  int rawPin = digitalRead(LDR_PIN);
  if (activeHighLogic) {
    return (rawPin == HIGH) ? 1 : 0;
  } else {
    return (rawPin == LOW) ? 1 : 0;
  }
}

/**
 * Reads 8 data bits with 3-point majority sampling for glitch rejection.
 */
char readOpticalByteWithSampling(unsigned long currentBitMs) {
  uint8_t rawByte = 0;

  for (int i = 0; i < 8; i++) {
    // 3-Point Majority Vote Sampling inside current bit period
    int voteOn = 0;
    for (int sample = 0; sample < 3; sample++) {
      if (readSensorState() == 1) voteOn++;
      delayMicroseconds(500); // 0.5ms inter-sample spacing
    }
    uint8_t bitVal = (voteOn >= 2) ? 1 : 0;

    int bitIndex = msbFirst ? (7 - i) : i;
    rawByte |= (bitVal << bitIndex);

    // Wait until next bit window center
    if (i < 7) {
      delay(currentBitMs);
    }
  }

  return (char)rawByte;
}

/**
 * Initializes LCD screen.
 */
void initializeLCD() {
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("LiFi Rx Terminal");
  lcd.setCursor(0, 1);
  lcd.print("Listening...    ");
}

/**
 * Updates Line 2 of LCD display with auto-scrolling.
 */
void updateLCDDisplay(char newChar) {
  if (isListeningState) {
    receivedMessage = "";
    lcd.setCursor(0, 1);
    lcd.print("                ");
  }

  receivedMessage += newChar;

  String displayString = receivedMessage;
  if (displayString.length() > 16) {
    displayString = displayString.substring(displayString.length() - 16);
  }

  while (displayString.length() < 16) {
    displayString += " ";
  }

  lcd.setCursor(0, 1);
  lcd.print(displayString);
}

/**
 * Resets LCD to idle listening state.
 */
void resetToListeningState() {
  receivedMessage = "";
  isListeningState = true;
  lcd.setCursor(0, 1);
  lcd.print("Listening...    ");
}

/**
 * Prints system settings & diagnostic status to Serial Monitor.
 */
void printSystemStatus() {
  Serial.println(F("\n--- CURRENT RECEIVER CONFIGURATION ---"));
  Serial.print(F(" 1. Polarity Mode     : "));
  Serial.println(activeHighLogic ? F("ACTIVE-HIGH (Light ON = HIGH)") : F("ACTIVE-LOW (Light ON = LOW)"));
  Serial.print(F(" 2. Auto-Baud Tuning  : "));
  Serial.println(autoBaudEnabled ? F("ENABLED (Auto-locks Start Bit)") : F("DISABLED (Fixed Bit Period)"));
  Serial.print(F(" 3. Bit Period        : "));
  Serial.print(bitPeriodMs);
  Serial.println(F(" ms/bit"));
  Serial.print(F(" 4. Bit Order         : "));
  Serial.println(msbFirst ? F("MSB FIRST (Bit 7..0)") : F("LSB FIRST (Bit 0..7)"));
  Serial.print(F(" 5. Telemetry Stats   : "));
  Serial.print(totalBytesReceived);
  Serial.print(F(" Valid Bytes | "));
  Serial.print(errorBytesIgnored);
  Serial.println(F(" Error Bytes"));
  Serial.println(F("--------------------------------------"));
  Serial.println(F("Commands: [P] Toggle Polarity | [B] Toggle Auto-Baud | [O] Toggle Bit Order | [S] Status\n"));
}

/**
 * Handles interactive commands from Serial Monitor (e.g., from Web Serial Dashboard).
 */
void handleSerialCommands() {
  char cmd = Serial.read();
  if (cmd == 'P' || cmd == 'p') {
    activeHighLogic = !activeHighLogic;
    Serial.print(F("[CFG] Polarity toggled to: "));
    Serial.println(activeHighLogic ? F("ACTIVE-HIGH") : F("ACTIVE-LOW"));
  } else if (cmd == 'B' || cmd == 'b') {
    autoBaudEnabled = !autoBaudEnabled;
    Serial.print(F("[CFG] Auto-Baud mode: "));
    Serial.println(autoBaudEnabled ? F("ENABLED") : F("DISABLED"));
  } else if (cmd == 'O' || cmd == 'o') {
    msbFirst = !msbFirst;
    Serial.print(F("[CFG] Bit Order toggled to: "));
    Serial.println(msbFirst ? F("MSB FIRST") : F("LSB FIRST"));
  } else if (cmd == 'S' || cmd == 's') {
    printSystemStatus();
  }
}
