# LiFi Secure Terminal

High-Security Visible Light Communication (VLC) Transmitter PWA, Android APK, & Real-Time Arduino Receiver Firmware v2.0 for EMI-Sensitive Zones.

---

## Technical Overview

The **LiFi Secure Terminal** provides high-security, zero-RF optical data transmission for environments where Electromagnetic Interference (EMI) or Radio Frequency (RF) risks exist—such as **Intensive Care Units (ICUs)**, **Defense Command Bunkers**, **Aircraft Cabins**, and **Secure Cleanrooms**.

- **Web Dashboard & APK**: A mobile-first Progressive Web Application (PWA) and Native Android APK using hardware flashlight torch constraints (with screen pulse fallback).
- **Receiver Firmware v2.0**: An Arduino Uno microcontroller paired with an LDR digital module and a 16x2 I2C LCD screen, operating **Auto-Polarity Detection**, **Auto-Baud Rate Start Bit Calibration**, and **3-Point Majority Vote Noise Immunity**.

---

## 🛠️ Hardware Requirements & Pinout

| Component | Pin / Terminal | Arduino Uno Connection |
| :--- | :--- | :--- |
| **LDR Sensor Module** | VCC | 5V |
| | GND | GND |
| | **D0** (Digital Output) | **Digital Pin 8** |
| | **A0** (Optional Raw Analog) | **Analog Pin A0** |
| **16x2 LCD (PCF8574)** | VCC | 5V |
| | GND | GND |
| | **SDA** | **Analog Pin A4** |
| | **SCL** | **Analog Pin A5** |

---

## 🚀 Firmware v2.0 Key Enhancements

1. **Auto-Polarity Detection**:
   - At bootup, the receiver measures resting ambient light levels.
   - Automatically switches between **Active-HIGH** (`LIGHT_ON = HIGH`) and **Active-LOW** (`LIGHT_ON = LOW`) depending on your LDR module brand!

2. **Auto-Baud Start Bit Timing Calibration**:
   - Measures exact duration of incoming Start Bit pulse using microsecond timer (`pulseIn`).
   - Automatically auto-locks bit timing to match 50 ms, 100 ms, 150 ms, or 200 ms pulse speeds selected on the transmitter!

3. **3-Point Majority Vote Sampling**:
   - Takes 3 ultra-fast inter-sample reads per bit slot to reject room light glitches and flickering noise.

4. **Interactive Serial Config Menu**:
   - Press `P` in Serial Monitor to toggle Polarity.
   - Press `B` to toggle Auto-Baud.
   - Press `O` to toggle Bit Order (MSB First vs LSB First).
   - Press `S` to view Telemetry Stats (Valid Bytes vs Ignored Noise Bytes).

---

## ⏱️ Optical Protocol & Mid-Bit Sampling Math

### Framing Format
Each character is converted into 8-bit ASCII binary and enclosed within a 10-bit framing packet:
1. **Start Bit**: `HIGH` signal for $100\text{ ms}$ (1 Bit Period).
2. **Payload Data**: 8 Bits (MSB-first, Bit 7 down to Bit 0), $100\text{ ms}$ per bit.
3. **Stop Bit**: `LOW` signal gap for $100\text{ ms}$.

```
Signal:   OFF |=== START (100ms) ===|=== BIT 7 ===|=== BIT 6 ===| ... |=== BIT 0 ===|___ STOP ___|
Timeline: T=0ms                     T=100ms       T=200ms             T=800ms       T=900ms
Sampling:                             ▲ (150ms)     ▲ (250ms)           ▲ (850ms)
```

---

## 🔍 LDR Hardware Calibration Guide

1. **Blue Potentiometer Screw**:
   - Turn the blue multi-turn screw on your LDR module until the onboard DO LED turns ON **only** when flashlight/screen flash hits the sensor.
2. **Ambient Shielding**:
   - Wrap a small dark tube around the LDR sensor head to block ceiling ambient light.
3. **Quick Test Signal**:
   - Use the **"Transmit Signal Test Pattern ('LiFi')"** button on the dashboard to test receiver alignment instantly.
