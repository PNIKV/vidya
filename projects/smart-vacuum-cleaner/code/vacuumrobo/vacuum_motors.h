// Smart Vacuum Cleaner Robot - Motor Driver & Control Controller Header

#ifndef VACUUM_MOTORS_H
#define VACUUM_MOTORS_H

#include <Arduino.h>
#include "vacuum_config.h"

// Initialize motor output pins, PWM parameters, and relay pin
void initMotors();

// Set Vacuum Air Pump Relay State (ON / OFF)
void setVacuumPump(bool enable);

// Apply raw direction signals and PWM speeds to L298N driver pins with reversal dead-time protection
void applyMotorDriver(int in1, int in2, int in3, int in4, int speedA, int speedB);

// High-precision proportional 2D joystick differential drive kinematics (PWM 50-255 mapping)
void driveDifferential(int x, int y, int requestedSpeed);

// Legacy 4-directional command handler (FWD, BWD, LEFT, RIGHT, STOP)
void driveDirection(String dir);

// Stop all motor power immediately (0 PWM)
void stopMotors();

// Safety Watchdog: Stops motors if vector stream drops longer than WATCHDOG_TIMEOUT_MS
void checkMotorWatchdog();

#endif // VACUUM_MOTORS_H
