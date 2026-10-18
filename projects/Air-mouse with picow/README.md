# 🖱️ Raspberry Pi Pico W — BLE 5.2 Air Mouse

A wireless, gesture-controlled **Bluetooth Low Energy 5.2 HID Air Mouse** built with the **Raspberry Pi Pico W** (RP2040 + CYW43439), an **MPU-6050 6-Axis Gyroscope & Accelerometer**, and **2 tactile click buttons**.

Control your mouse cursor naturally through free-hand wrist gestures, click with tactile physical buttons, drag-and-drop objects, and tune sensitivity in real time using the included interactive Web Dashboard.

---

## 🌟 Key Features

- **Bluetooth Low Energy 5.2 (BLE HID)**: Universal driverless plug-and-play pairing with Windows 10/11, macOS, Linux, Android, iOS, and Smart TVs.
- **6-DOF IMU Motion Engine**: Tracks yaw (wrist twists) and pitch (wrist tilts) with 400kHz I2C burst sampling.
- **Zero-Drift Stillness Detection**: Intelligent suppression algorithm eliminates micro-jitter and stops cursor crawl when the mouse is at rest.
- **Dynamic Non-Linear Acceleration**: Micro-movements remain pixel-precise, while quick flicks effortlessly glide across dual-monitor workstations.
- **2 Tactile Click Buttons**:
  - **Left Click (GP14)**: Tap for standard click; hold for seamless drag-and-drop.
  - **Right Click (GP15)**: Context menu click.
  - **Dual-Hold Re-zero Gesture**: Hold both buttons for 1.8 seconds to recalibrate the gyro zero-bias on the fly.
- **Dual Firmware Support**: Full codebases provided for both **MicroPython** and **Arduino C++**.
- **Interactive Web Dashboard**: Beautiful Web Serial / Web BLE dashboard for 3D orientation visualization, live telemetry, and runtime parameter tuning.

---

## 📂 Project Structure

```
Air-mouse with picow/
├── main.py                     # MicroPython main loop & state machine
├── mpu6050.py                  # High-performance MPU6050 I2C driver & filter
├── ble_hid_mouse.py            # BLE 5.2 HID Mouse GATT server
├── config.json                 # Tunable settings (sensitivity, deadzone, pins)
├── air_mouse_picow.ino         # Arduino C++ alternative sketch (Earle Philhower core)
├── air_mouse_dashboard.html    # Web Bluetooth & Web Serial diagnostic panel
├── WIRING.md                   # Pinout diagram & hardware schematic
├── banner.png                  # High-resolution project banner
├── icon.png                    # Project icon
└── Air-mouse with picow.json   # VidyaSTEM project metadata
```

---

## ⚡ Quick Start: MicroPython Installation

### Step 1: Install MicroPython on Raspberry Pi Pico W
1. Download the latest official Raspberry Pi Pico W MicroPython UF2 firmware:
   [https://micropython.org/download/RPI_PICO_W/](https://micropython.org/download/RPI_PICO_W/)
2. Hold down the **BOOTSEL** button on your Pico W and plug it into your computer via USB.
3. Drag and drop the downloaded `.uf2` file into the `RPI-RP2` drive. The board will automatically reboot with MicroPython installed.

### Step 2: Upload Files using Thonny IDE
1. Open **Thonny IDE** ([https://thonny.org/](https://thonny.org/)).
2. Set the interpreter in the bottom-right corner to **MicroPython (Raspberry Pi Pico)**.
3. Open the following files in Thonny and save them directly onto the Pico W (`Raspberry Pi Pico` storage):
   - `mpu6050.py`
   - `ble_hid_mouse.py`
   - `config.json`
   - `main.py`
4. Disconnect and reconnect USB, or click the **Green Run button** in Thonny to launch `main.py`.

---

## 📶 Bluetooth Pairing

1. On boot, the Pico W onboard LED will start a **slow heartbeat blink** indicating it is advertising as a BLE HID device.
2. On your PC / Mac / Smartphone:
   - Go to **Bluetooth Settings** -> **Add Device**.
   - Select **"Pico W Air Mouse"**.
   - Click **Pair / Connect**.
3. Once paired:
   - The onboard LED will turn **solid ON**.
   - Your PC will register the device as a standard Bluetooth Mouse.
   - Tilt your wrist to move the cursor; press Button 1 for Left Click and Button 2 for Right Click!

---

## 🖥️ Using the Web Dashboard

1. Open `air_mouse_dashboard.html` in Google Chrome, Microsoft Edge, or any Web Serial/BLE compatible browser.
2. Keep your Pico W plugged into USB.
3. Click **"Connect Serial"** and select the Pico W USB COM port.
4. You will see:
   - **3D Spatial Attitude**: An interactive 3D model tilting and pitching in sync with your hand.
   - **Virtual Test Canvas**: A preview screen where you can test cursor control and button clicks.
   - **Live Telemetry**: Real-time Gyro X/Y/Z, Accel X/Y/Z, and board temperature.
   - **Sensitivity & Deadzone Sliders**: Adjust controls and click **"Export config.json"** to persist your preferences.

---

## 🔧 Hardware Troubleshooting

- **Cursor drifting on its own**: Place the mouse on a flat desk and hold both physical buttons down for 2 seconds. The LED will pulse rapidly and calibrate the gyro zero bias.
- **MPU-6050 not detected (`0x68`)**:
  - Ensure VCC is connected to `3V3_OUT` (Pin 36), **NOT** `VSYS` (Pin 39).
  - Check that SDA goes to Pin 6 (`GP4`) and SCL goes to Pin 7 (`GP5`).
- **Bluetooth not showing up in search**:
  - Ensure you flashed the official **Pico W** MicroPython UF2 (not the standard non-wireless Pico UF2).
  - Unpair any previous "Pico W Air Mouse" profiles from your computer's Bluetooth settings and search again.
