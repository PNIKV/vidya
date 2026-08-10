# LiFi Secure Terminal

High-Security Visible Light Communication (VLC) Transmitter PWA & Real-Time Arduino Receiver Firmware for EMI-Sensitive Zones.

---

## Technical Overview

The **LiFi Secure Terminal** provides high-security, zero-RF optical data transmission for environments where Electromagnetic Interference (EMI) or Radio Frequency (RF) risks exist—such as **Intensive Care Units (ICUs)**, **Defense Command Bunkers**, **Aircraft Cabins**, and **Secure Cleanrooms**.

- **Transmitter**: A mobile-first Progressive Web Application (PWA) using HTML5 `MediaStreamTrack` flashlight torch constraints (with screen pulse fallback).
- **Receiver**: An Arduino Uno microcontroller paired with an LDR digital module and a 16x2 I2C LCD screen, operating a $1.5 \times \text{Bit Period}$ ($150\text{ ms}$) **mid-bit sampling synchronization algorithm**.

---

## 🛠️ Hardware Requirements & Pinout

| Component | Pin / Terminal | Arduino Uno Connection |
| :--- | :--- | :--- |
| **LDR Sensor Module** | VCC | 5V |
| | GND | GND |
| | **D0** (Digital Output) | **Digital Pin 8** |
| **16x2 LCD (PCF8574)** | VCC | 5V |
| | GND | GND |
| | **SDA** | **Analog Pin A4** |
| | **SCL** | **Analog Pin A5** |

---

## ⏱️ Optical Protocol & Mid-Bit Sampling Math

### Framing Format
Each character is converted into 8-bit ASCII binary and enclosed within a 10-bit framing packet:
1. **Start Bit**: `HIGH` signal for $100\text{ ms}$ (1 Bit Period).
2. **Payload Data**: 8Bits (MSB-first, Bit 7 down to Bit 0), $100\text{ ms}$ per bit.
3. **Stop Bit**: `LOW` signal gap for $100\text{ ms}$.

```
Signal:   OFF |=== START (100ms) ===|=== BIT 7 ===|=== BIT 6 ===| ... |=== BIT 0 ===|___ STOP ___|
Timeline: T=0ms                     T=100ms       T=200ms             T=800ms       T=900ms
Sampling:                             ▲ (150ms)     ▲ (250ms)           ▲ (850ms)
```

### Why 150 ms Mid-Bit Delay?
- **Rising Edge Trigger**: When the sensor detects the optical Start Bit (transition to `LIGHT_ON`), time starts at $T = 0\text{ ms}$.
- **Delaying $1.5 \times 100\text{ ms} = 150\text{ ms}$**:
  - First $100\text{ ms}$ skips the remainder of the Start Bit window.
  - The remaining $50\text{ ms}$ places the sensor read directly in the **dead center** of Payload Bit 7 ($100\text{ ms} \dots 200\text{ ms}$).
  - Subsequent 7 bits are sampled every $100\text{ ms}$ interval, guaranteeing maximum immunity against edge rise-time jitter!

---

## ⚙️ Firmware Inverted Logic Normalization Macro

Some LDR digital sensor modules (with LM393 comparators) output `LOW` when illuminated instead of `HIGH` (Active-LOW modules).

In `lifi_receiver.ino`, line 8 handles logic normalization:
```cpp
// Change line 8 to LOW if your module outputs LOW on light pulse:
#define LIGHT_ON  HIGH
#define LIGHT_OFF (!LIGHT_ON)
```

---

## 📱 Web PWA Setup & Deployment

1. Serve the files in `projects/lifi-secure-terminal/` (`index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.json`) over HTTPS (required for WebRTC Camera Torch API).
2. Open on any modern Android / iOS smartphone browser.
3. Select an emergency preset (e.g., `'PATIENT STABLE'`, `'EMERGENCY ROOM 2'`, `'ACCESS GRANTED'`) or type a custom string payload.
4. Align phone flashlight directly with LDR sensor lens and press **TRANSMIT SIGNAL**.

---

## 🔍 Calibration & Troubleshooting

1. **LCD Blank or Displaying Blocks**:
   - Check I2C address in `lifi_receiver.ino`. Default is `0x27`. If screen remains blank, test address `0x3F`.
   - Adjust contrast potentiometer on the back of the I2C backpack board.
2. **LDR Sensor Calibration**:
   - Turn the blue multi-turn potentiometer on the LDR board while aiming ambient room light away from the sensor.
   - Adjust until the onboard indicator LED turns ON only when hit by the flashlight beam.
3. **Inactivity Auto-Reset**:
   - After $4000\text{ ms}$ of signal idle timeout, LCD row 2 automatically clears and displays `"Listening..."`.
