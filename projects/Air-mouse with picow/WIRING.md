# 🔌 Raspberry Pi Pico W Air Mouse — Wiring & Hardware Guide

This document details the exact pin connections, circuit schematic, and hardware considerations for the **Raspberry Pi Pico W BLE 5.2 Air Mouse** with an **MPU-6050 6-Axis IMU** and **2 tactile push buttons**.

---

## 📌 Pinout & Connection Table

| Peripheral | Sensor/Component Pin | Pico W GPIO | Pico W Physical Pin | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **MPU-6050 IMU** | **VCC** | `3V3(OUT)` | **Pin 36** | 3.3V Power from onboard buck-boost regulator |
| **MPU-6050 IMU** | **GND** | `GND` | **Pin 38** (or Pin 3/8/13/18/23/28/33) | Ground reference |
| **MPU-6050 IMU** | **SDA** | `GP4` | **Pin 6** | I2C0 Serial Data (400 kHz Fast-Mode) |
| **MPU-6050 IMU** | **SCL** | `GP5` | **Pin 7** | I2C0 Serial Clock |
| **MPU-6050 IMU** | **AD0** | `GND` | Any GND | Selects I2C Address `0x68` (leave floating or GND) |
| **MPU-6050 IMU** | **INT** | *NC* | Not connected | (Optional interrupt line, not required) |
| **Left Click Button** | **Terminal 1** | `GP14` | **Pin 19** | Internal Pull-Up enabled in firmware (`Pin.PULL_UP`) |
| **Left Click Button** | **Terminal 2** | `GND` | **Pin 18** | Connected to Ground |
| **Right Click Button** | **Terminal 1** | `GP15` | **Pin 20** | Internal Pull-Up enabled in firmware (`Pin.PULL_UP`) |
| **Right Click Button** | **Terminal 2** | `GND` | **Pin 18** | Connected to Ground |
| **Status LED** | *Onboard* | `"LED"` | CYW43439 Radio | Onboard wireless LED (solid = connected, blink = pairing) |

> [!NOTE]  
> The buttons use the RP2040's internal programmable pull-up resistors (`Pin.PULL_UP` in MicroPython / `INPUT_PULLUP` in Arduino). **No external resistors are required!**

---

## 📐 Circuit Schematic (ASCII)

```text
                  +-----------------------------------+
                  |      Raspberry Pi Pico W          |
                  |                                   |
                  | (Pin 36) 3V3_OUT ---------+       |
                  | (Pin 38) GND ------------+ \      |
                  |                           |  \    |
                  | (Pin 6)  GP4 (SDA) ---+   |   \   |
                  | (Pin 7)  GP5 (SCL) --+ \  |    \  |
                  |                       \ \ |     \ |
                  | (Pin 19) GP14 --------+\ \|      \|
                  | (Pin 20) GP15 -------+ \ \ \      |
                  +-----------------------\-\-\-\-----+
                                           \ \ \ \
     +--------------------------+           \ \ \ \
     |       MPU-6050           |            \ \ \ +--> VCC
     |                          |             \ \ +---> GND
     | VCC <--------------------+--------------+ \----> SDA
     | GND <------------------------------------+-----> SCL
     | SCL <------------------------------------+
     | SDA <------------------------------------+
     | AD0 ----> (GND / 0x68)
     +--------------------------+

     +--------------------------+
     |   Left Button (GP14)     |
     |   [Pin 19] ----[ / ]----+----> GND (Pin 18)
     +--------------------------+

     +--------------------------+
     |   Right Button (GP15)    |
     |   [Pin 20] ----[ / ]----+----> GND (Pin 18)
     +--------------------------+
```

---

## 🛠️ Step-by-Step Breadboard Assembly

1. **Mount the Raspberry Pi Pico W** on the center bridge of a half-size or full-size solderless breadboard.
2. **Mount the MPU-6050 IMU module** next to the Pico W. Ensure the X-axis arrow points forward (towards the front of your hand) and the Y-axis arrow points horizontally.
3. **Connect Power**:
   - Run a red jumper wire from Pico Pin 36 (`3V3_OUT`) to MPU-6050 `VCC`.
   - Run a black jumper wire from Pico Pin 38 (`GND`) to MPU-6050 `GND`.
4. **Connect I2C Data**:
   - Run a blue jumper wire from Pico Pin 6 (`GP4`) to MPU-6050 `SDA`.
   - Run a yellow jumper wire from Pico Pin 7 (`GP5`) to MPU-6050 `SCL`.
5. **Connect Push Buttons**:
   - Place two momentary tactile push buttons on the breadboard.
   - Connect one leg of Button 1 (Left Click) to Pico Pin 19 (`GP14`).
   - Connect the opposite leg of Button 1 to Pico Pin 18 (`GND`).
   - Connect one leg of Button 2 (Right Click) to Pico Pin 20 (`GP15`).
   - Connect the opposite leg of Button 2 to Pico Pin 18 (`GND`).
6. **Plug in Micro-USB cable** from the Pico W to your PC.

---

## 🔍 Verification & Troubleshooting

- **Checking I2C Communication**:
  When `main.py` boots, it scans I2C addresses. You should see `[I2C] Found I2C devices at addresses: ['0x68']`.
  If no devices are found:
  1. Verify VCC is connected to `3V3_OUT` (Pin 36), **NOT** `VSYS` (Pin 39).
  2. Verify SDA is on Pin 6 (GP4) and SCL is on Pin 7 (GP5).
  3. Ensure headers are firmly soldered on both the Pico W and the MPU-6050 module.
