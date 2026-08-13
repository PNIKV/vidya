// Smart Vacuum Cleaner Robot - Motor Driver & Dead-Time Protection Implementation

#include "vacuum_motors.h"

// Internal static state trackers for direction reversal dead-time check
static int lastIn1 = LOW;
static int lastIn2 = LOW;
static int lastIn3 = LOW;
static int lastIn4 = LOW;

void initMotors() {
    pinMode(RELAY_PIN, OUTPUT);
    setVacuumPump(false); // Default relay state OFF on startup

    pinMode(ENA, OUTPUT);
    pinMode(ENB, OUTPUT);
    pinMode(IN1, OUTPUT);
    pinMode(IN2, OUTPUT);
    pinMode(IN3, OUTPUT);
    pinMode(IN4, OUTPUT);

    // Ensure 0-255 PWM scale on ESP8266
    analogWriteRange(255);
    stopMotors();
}

void setVacuumPump(bool enable) {
    vacuumRelayState = enable;
    if (RELAY_ACTIVE_LOW) {
        digitalWrite(RELAY_PIN, enable ? LOW : HIGH);
    } else {
        digitalWrite(RELAY_PIN, enable ? HIGH : LOW);
    }
    Serial.print("[VACUUM PUMP RELAY] State -> ");
    Serial.println(enable ? "ACTIVE (ON)" : "STANDBY (OFF)");
}

void stopMotors() {
    leftMotorPWM  = 0;
    rightMotorPWM = 0;
    analogWrite(ENA, 0);
    analogWrite(ENB, 0);
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, LOW);
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, LOW);
    
    lastIn1 = LOW;
    lastIn2 = LOW;
    lastIn3 = LOW;
    lastIn4 = LOW;
}

void applyMotorDriver(int in1, int in2, int in3, int in4, int speedA, int speedB) {
    // Check if motor direction is reversing polarity (e.g. IN1 changed from HIGH to LOW while IN2 changed from LOW to HIGH)
    bool leftReversing  = (lastIn1 != in1 && lastIn2 != in2 && (lastIn1 != LOW || lastIn2 != LOW) && (in1 != LOW || in2 != LOW));
    bool rightReversing = (lastIn3 != in3 && lastIn4 != in4 && (lastIn3 != LOW || lastIn4 != LOW) && (in3 != LOW || in4 != LOW));

    // Sudden Direction Reversal Protection (Dead-time):
    // Cut PWM power immediately to prevent inductive back-EMF current spikes that trigger ESP8266 brownouts/resets
    if (leftReversing || rightReversing) {
        analogWrite(ENA, 0);
        analogWrite(ENB, 0);
        digitalWrite(IN1, LOW);
        digitalWrite(IN2, LOW);
        digitalWrite(IN3, LOW);
        digitalWrite(IN4, LOW);
        delay(DIRECTION_DEADTIME_MS);
    }

    leftMotorPWM  = constrain(speedA, 0, MAX_PWM);
    rightMotorPWM = constrain(speedB, 0, MAX_PWM);

    digitalWrite(IN1, in1);
    digitalWrite(IN2, in2);
    digitalWrite(IN3, in3);
    digitalWrite(IN4, in4);

    analogWrite(ENA, leftMotorPWM);
    analogWrite(ENB, rightMotorPWM);

    lastIn1 = in1;
    lastIn2 = in2;
    lastIn3 = in3;
    lastIn4 = in4;
}

void driveDifferential(int x, int y, int requestedSpeed) {
    joystickX = constrain(x, -100, 100);
    joystickY = constrain(y, -100, 100);
    lastControlTime = millis();

    // Check deadzone threshold or zero vector
    int displacementSq = joystickX * joystickX + joystickY * joystickY;
    if (displacementSq < (JOYSTICK_DEADZONE * JOYSTICK_DEADZONE)) {
        currentAction = "STOP";
        stopMotors();
        return;
    }

    // Safety Interlock: If moving forward (y > 0) and obstacle is detected by ultrasonic sensors, force stop
    if (joystickY > 0 && obstacleDetected) {
        currentAction = "OBSTACLE_STOP";
        stopMotors();
        Serial.println("[MOTOR SAFETY] Forward drive inhibited due to front obstacle!");
        return;
    }

    currentAction = "JOYSTICK";

    // Differential steering kinematics
    // y > 0 is Forward, y < 0 is Reverse
    // x > 0 is Right, x < 0 is Left
    int leftRaw  = joystickY + joystickX;
    int rightRaw = joystickY - joystickX;

    leftRaw  = constrain(leftRaw, -100, 100);
    rightRaw = constrain(rightRaw, -100, 100);

    // Calculate magnitude percentage (0 - 100%)
    float magnitude = sqrt(displacementSq);
    if (magnitude > 100.0f) magnitude = 100.0f;

    // Scale PWM output: Start at MIN_PWM (50) up to MAX_PWM (255) when joystick is held away from center
    // Scale formula: MIN_PWM + (magnitude / 100.0) * (MAX_PWM - MIN_PWM)
    int basePWM = MIN_PWM + (int)((magnitude / 100.0f) * (MAX_PWM - MIN_PWM));
    currentSpeed = constrain(basePWM, MIN_PWM, MAX_PWM);

    // Map proportional left/right motor values cleanly starting from MIN_PWM (50)
    int leftPWM  = map(abs(leftRaw), 0, 100, 0, currentSpeed);
    int rightPWM = map(abs(rightRaw), 0, 100, 0, currentSpeed);

    // Apply minimum PWM threshold so motors turn when active
    if (abs(leftRaw) > 5 && leftPWM < MIN_PWM) leftPWM = MIN_PWM;
    if (abs(rightRaw) > 5 && rightPWM < MIN_PWM) rightPWM = MIN_PWM;

    int in1 = (leftRaw >= 0)  ? HIGH : LOW;
    int in2 = (leftRaw >= 0)  ? LOW  : HIGH;
    int in3 = (rightRaw >= 0) ? HIGH : LOW;
    int in4 = (rightRaw >= 0) ? LOW  : HIGH;

    applyMotorDriver(in1, in2, in3, in4, leftPWM, rightPWM);
}

void driveDirection(String dir) {
    joystickX = 0;
    joystickY = 0;
    lastControlTime = millis();
    currentAction = dir;

    if (dir == "FWD") {
        if (obstacleDetected) {
            currentAction = "OBSTACLE_STOP";
            stopMotors();
            return;
        }
        applyMotorDriver(HIGH, LOW, HIGH, LOW, currentSpeed, currentSpeed);
    } else if (dir == "BWD") {
        applyMotorDriver(LOW, HIGH, LOW, HIGH, currentSpeed, currentSpeed);
    } else if (dir == "LEFT") {
        applyMotorDriver(LOW, HIGH, HIGH, LOW, currentSpeed, currentSpeed);
    } else if (dir == "RIGHT") {
        applyMotorDriver(HIGH, LOW, LOW, HIGH, currentSpeed, currentSpeed);
    } else { // STOP
        stopMotors();
    }
}

void checkMotorWatchdog() {
    // If joystick vector is actively engaged and no packet received for WATCHDOG_TIMEOUT_MS, auto-stop motors
    if (currentAction == "JOYSTICK" || currentAction == "FWD" || currentAction == "BWD" || currentAction == "LEFT" || currentAction == "RIGHT") {
        if (millis() - lastControlTime > WATCHDOG_TIMEOUT_MS) {
            currentAction = "STOP (WATCHDOG)";
            stopMotors();
        }
    }
}
