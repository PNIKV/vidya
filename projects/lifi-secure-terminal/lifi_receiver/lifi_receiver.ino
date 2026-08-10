/*
 * =====================================================================================
 * PROJECT   : LiFi Secure Terminal - Optical Receiver Firmware
 * HARDWARE  : Arduino Uno / Nano (ATmega328P)
 * SENSOR    : LDR Light Module (Digital Output D0 -> Pin 8)
 * DISPLAY   : 16x2 LCD via PCF8574 I2C Backpack (Address 0x27, SDA=A4, SCL=A5)
 * PROTOCOL  : 10 Hz Baud Rate (100 ms/bit) | 1 Start Bit + 8 Payload Bits (MSB) + 1 Stop Bit
 * SAMPLING  : 1.5x Bit Period (150 ms) Mid-Bit Synchronization
 * =====================================================================================
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// =====================================================================================
// SENSOR SIGNAL LOGIC NORMALIZATION
// =====================================================================================
// Line 8: Active-HIGH light detection logic macro.
// Note: If your LDR sensor module outputs LOW when hit by light (Active-LOW module),
// change line 8 to: #define LIGHT_ON LOW
#define LIGHT_ON  HIGH
#define LIGHT_OFF (!LIGHT_ON)

// =====================================================================================
// PIN & TIMING SPECIFICATIONS
// =====================================================================================
const uint8_t LDR_PIN = 8;               // Digital Pin connected to LDR Module D0
const unsigned long BIT_PERIOD_MS = 100; // Bit duration (100 ms = 10 Hz baud rate)
const unsigned long MID_BIT_DELAY_MS = (BIT_PERIOD_MS * 1.5); // 150 ms mid-bit offset
const unsigned long INACTIVITY_TIMEOUT_MS = 4000;            // Reset buffer after 4s idle

// Initialize 16x2 LCD with I2C address 0x27 (Default for PCF8574)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Dynamic Display Buffer Variables
String receivedMessage = "";
unsigned long lastSignalTime = 0;
bool isListeningState = true;

// Function prototypes
void initializeLCD();
void resetToListeningState();
char readOpticalByte();
void updateLCDDisplay(char newChar);

void setup() {
  // Configure LDR Digital Pin as input with internal pullup disabled (LM393 handles drive)
  pinMode(LDR_PIN, INPUT);

  // Initialize Serial interface for optional telemetry debugging (9600 baud)
  Serial.begin(9600);
  Serial.println(F("[LiFi Rx] Initializing Optical Communication Receiver..."));

  // Initialize I2C LCD
  initializeLCD();
  lastSignalTime = millis();
}

void loop() {
  // Read current sensor pin state
  int currentSignalState = digitalRead(LDR_PIN);

  // -----------------------------------------------------------------------------------
  // 1. START BIT SYNCHRONIZATION (Rising Edge Trigger)
  // -----------------------------------------------------------------------------------
  if (currentSignalState == LIGHT_ON) {
    // Optical Start Bit detected!
    Serial.println(F("[LiFi Rx] Start Bit Detected! Synchronizing timing..."));

    // ---------------------------------------------------------------------------------
    // 2. MID-BIT SAMPLING ALGORITHM
    // ---------------------------------------------------------------------------------
    // Wait 1.5 x BIT_PERIOD (150 ms) to skip remaining 50 ms of Start Bit and land
    // dead-center inside Payload Bit 7 (MSB) at T = 150 ms.
    // Timing Diagram:
    // |<- Start Bit 100ms ->|<- Data Bit 7 (100ms) ->|<- Data Bit 6 (100ms) ->|...
    // |^ (Edge Trigger)     |----(150ms)---->| (Sample Bit 7)
    // ---------------------------------------------------------------------------------
    delay(MID_BIT_DELAY_MS);

    // Read the 8 payload data bits
    char decodedByte = readOpticalByte();

    // ---------------------------------------------------------------------------------
    // 3. STOP BIT VALIDATION & BUFFER MANAGEMENT
    // ---------------------------------------------------------------------------------
    // Wait for Stop Bit window (100 ms)
    delay(BIT_PERIOD_MS);

    // Filter valid ASCII printable characters (range 32 to 126: space to '~')
    if (decodedByte >= 32 && decodedByte <= 126) {
      Serial.print(F("[LiFi Rx] Decoded ASCII Character: '"));
      Serial.print(decodedByte);
      Serial.print(F("' (0x"));
      Serial.print((int)decodedByte, HEX);
      Serial.println(F(")"));

      // Process character onto LCD display line 2
      updateLCDDisplay(decodedByte);
    } else {
      Serial.print(F("[LiFi Rx] Ignored Non-Printable Byte: 0x"));
      Serial.println((int)decodedByte, HEX);
    }

    // Refresh last active signal timestamp
    lastSignalTime = millis();
    isListeningState = false;
  }

  // -----------------------------------------------------------------------------------
  // 4. INACTIVITY AUTO-RESET (4000 ms Timeout)
  // -----------------------------------------------------------------------------------
  if (!isListeningState && (millis() - lastSignalTime >= INACTIVITY_TIMEOUT_MS)) {
    Serial.println(F("[LiFi Rx] Signal idle timeout reached (4000ms). Resetting LCD buffer..."));
    resetToListeningState();
  }
}

/**
 * Reads 8 sequential optical data bits (MSB first) at exact 100 ms sampling intervals.
 * Returns decoded byte character.
 */
char readOpticalByte() {
  uint8_t rawByte = 0;

  for (int i = 7; i >= 0; i--) {
    // Read current pin state at dead-center of bit slot
    int bitState = digitalRead(LDR_PIN);
    uint8_t bitVal = (bitState == LIGHT_ON) ? 1 : 0;

    // Shift in bit MSB-first
    rawByte |= (bitVal << i);

    // Unless it's the final payload bit (Bit 0), delay 100 ms to reach center of next bit
    if (i > 0) {
      delay(BIT_PERIOD_MS);
    }
  }

  return (char)rawByte;
}

/**
 * Initializes 16x2 I2C LCD Display with system header.
 */
void initializeLCD() {
  lcd.init();
  lcd.backlight();
  lcd.clear();

  // Line 1: Permanent Terminal Header
  lcd.setCursor(0, 0);
  lcd.print("LiFi Rx Terminal");

  // Line 2: Default Status
  lcd.setCursor(0, 1);
  lcd.print("Listening...");
}

/**
 * Updates Line 2 of LCD with decoded character stream (scrolls up to last 16 chars).
 */
void updateLCDDisplay(char newChar) {
  // If previously in listening state, clear LCD row 2 buffer
  if (isListeningState) {
    receivedMessage = "";
    lcd.setCursor(0, 1);
    lcd.print("                "); // 16 blank spaces
  }

  // Append new character to message string
  receivedMessage += newChar;

  // Format line to display only the last 16 characters (scrolling effect)
  String displaySubstring = receivedMessage;
  if (displaySubstring.length() > 16) {
    displaySubstring = displaySubstring.substring(displaySubstring.length() - 16);
  }

  // Render on Line 2
  lcd.setCursor(0, 1);
  // Pad with trailing spaces if string length is less than 16
  while (displaySubstring.length() < 16) {
    displaySubstring += " ";
  }
  lcd.print(displaySubstring);
}

/**
 * Resets LCD Line 2 back to default "Listening..." state after 4000 ms idle timeout.
 */
void resetToListeningState() {
  receivedMessage = "";
  isListeningState = true;
  lcd.setCursor(0, 1);
  lcd.print("Listening...    ");
}
