#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Encoder.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
Encoder knob(2, 3);

// Pins
const int buttonPin = 4;
const int buzzer = 5;
const int greenLED = 6;
const int redLED = 7;

// Variables
long oldPosition = -999;
int setMinutes = 1;
int remainingSeconds = 60;

bool timerRunning = false;
bool timerPaused = false;
bool lastButtonState = HIGH;

unsigned long previousMillis = 0;

void showTime(int totalSeconds)
{
  int minutes = totalSeconds / 60;
  int seconds = totalSeconds % 60;

  lcd.setCursor(0, 1);

  if (minutes < 10) lcd.print("0");
  lcd.print(minutes);

  lcd.print(":");

  if (seconds < 10) lcd.print("0");
  lcd.print(seconds);

  lcd.print("   ");
}

void setup()
{
  lcd.init();
  lcd.backlight();

  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(greenLED, OUTPUT);
  pinMode(redLED, OUTPUT);
  pinMode(buzzer, OUTPUT);

  digitalWrite(greenLED, LOW);
  digitalWrite(redLED, LOW);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Countdown");

  knob.write(4);

  showTime(remainingSeconds);
}

void loop()
{
  if (!timerRunning)
  {
    long newPosition = knob.read() / 4;

    if (newPosition != oldPosition)
    {
      oldPosition = newPosition;

      if (newPosition < 1)
      {
        newPosition = 1;
        knob.write(4);
      }

      if (newPosition > 99)
      {
        newPosition = 99;
        knob.write(99 * 4);
      }

      setMinutes = newPosition;
      remainingSeconds = setMinutes * 60;

      lcd.setCursor(0, 0);
      lcd.print("Set Time      ");

      showTime(remainingSeconds);
    }
  }

  bool buttonState = digitalRead(buttonPin);

  if (buttonState == LOW && lastButtonState == HIGH)
  {
    delay(200);

    if (!timerRunning)
    {
      timerRunning = true;
      timerPaused = false;

      digitalWrite(greenLED, HIGH);
      digitalWrite(redLED, LOW);

      previousMillis = millis();

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Running...");
    }
    else
    {
      timerPaused = !timerPaused;

      if (timerPaused)
      {
        digitalWrite(greenLED, LOW);

        lcd.setCursor(0, 0);
        lcd.print("Paused        ");
      }
      else
      {
        digitalWrite(greenLED, HIGH);

        lcd.setCursor(0, 0);
        lcd.print("Running...    ");

        previousMillis = millis();
      }
    }
  }

  lastButtonState = buttonState;

  if (timerRunning && !timerPaused)
  {
    if (millis() - previousMillis >= 1000)
    {
      previousMillis = millis();

      if (remainingSeconds > 0)
      {
        remainingSeconds--;

        showTime(remainingSeconds);
      }

      if (remainingSeconds <= 0)
      {
        timerRunning = false;
        timerPaused = false;

        digitalWrite(greenLED, LOW);
        digitalWrite(redLED, HIGH);

        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("TIME UP!");

        lcd.setCursor(0, 1);
        lcd.print("Finished");

        for (int i = 0; i < 5; i++)
        {
          tone(buzzer, 1000);
          delay(300);

          noTone(buzzer);
          delay(300);
        }

        digitalWrite(redLED, LOW);

        remainingSeconds = setMinutes * 60;

        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Set Time");

        showTime(remainingSeconds);

        knob.write(setMinutes * 4);
        oldPosition = setMinutes;
      }
    }
  }
}
