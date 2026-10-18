"""
Raspberry Pi Pico W — BLE 5.2 Air Mouse
Firmware Version: 1.0.0
Author: VidyaSTEM Robotics & IoT Lab

Features:
- Bluetooth Low Energy (BLE 5.2) HID Mouse Profile
- MPU-6050 6-Axis Gyroscope & Accelerometer tracking
- Real-time digital filtering, deadzone compensation, and non-linear acceleration
- 2x Physical Tactile Buttons (Left & Right Click, Debounced, Drag & Drop support)
- Recalibration gesture (Hold both buttons for 2s to re-zero gyro)
- Onboard LED state indicator (Pairing: Blink | Connected: Solid ON | Calibrating: Fast pulse)
- Live Serial Telemetry output for Web Dashboard connection
"""

import time
import json
import sys
import select
from machine import Pin, I2C
from mpu6050 import MPU6050
from ble_hid_mouse import BLEHIDMouse

# Default Configuration
DEFAULT_CONFIG = {
    "device_name": "Pico W Air Mouse",
    "i2c_id": 0,
    "sda_pin": 4,
    "scl_pin": 5,
    "i2c_freq": 400000,
    "btn_left_pin": 14,
    "btn_right_pin": 15,
    "led_pin": "LED",
    "sens_x": 1.25,
    "sens_y": 1.25,
    "deadzone": 0.045,
    "invert_x": False,
    "invert_y": False,
    "smoothing_alpha": 0.75,
    "poll_interval_ms": 10
}

def load_config():
    """Load configuration from config.json or use defaults."""
    cfg = DEFAULT_CONFIG.copy()
    try:
        with open("config.json", "r") as f:
            user_cfg = json.load(f)
            cfg.update(user_cfg)
            print("[CONFIG] Loaded config.json successfully")
    except Exception as e:
        print(f"[CONFIG] Using built-in defaults ({e})")
    return cfg

def save_config(cfg):
    """Save configuration to config.json."""
    try:
        with open("config.json", "w") as f:
            json.dump(cfg, f)
        print("[CONFIG] Saved config.json")
    except Exception as e:
        print(f"[CONFIG] Failed to save config: {e}")

class AirMouseController:
    def __init__(self):
        self.config = load_config()

        # Setup Status LED (supports string "LED" on Pico W or integer GPIO)
        try:
            led_target = self.config["led_pin"]
            self.led = Pin(led_target, Pin.OUT)
        except Exception:
            # Fallback to GP16 if "LED" identifier fails
            self.led = Pin(16, Pin.OUT)
        self.led.off()

        # Setup Tactile Buttons (Active LOW with internal Pull-ups)
        self.btn_left = Pin(self.config["btn_left_pin"], Pin.IN, Pin.PULL_UP)
        self.btn_right = Pin(self.config["btn_right_pin"], Pin.IN, Pin.PULL_UP)

        # Button state tracking
        self.last_btn_state = 0
        self.both_pressed_start = 0

        # Setup I2C Bus for MPU6050
        print(f"[I2C] Initializing I2C{self.config['i2c_id']} on SDA=GP{self.config['sda_pin']}, SCL=GP{self.config['scl_pin']}...")
        self.i2c = I2C(
            self.config["i2c_id"],
            sda=Pin(self.config["sda_pin"]),
            scl=Pin(self.config["scl_pin"]),
            freq=self.config["i2c_freq"]
        )

        devices = self.i2c.scan()
        print(f"[I2C] Found I2C devices at addresses: {[hex(d) for d in devices]}")
        if 0x68 not in devices and 0x69 not in devices:
            print("[WARN] MPU6050 not detected on I2C bus! Please check wiring (SDA->GP4, SCL->GP5, 3V3, GND)")

        addr = 0x69 if 0x69 in devices and 0x68 not in devices else 0x68
        self.mpu = MPU6050(self.i2c, addr=addr)
        self.mpu.alpha = self.config.get("smoothing_alpha", 0.75)

        # Initial Calibration
        self.calibrate()

        # Setup BLE 5.2 HID Mouse
        print(f"[BLE] Initializing BLE HID Mouse '{self.config['device_name']}'...")
        self.ble_mouse = BLEHIDMouse(device_name=self.config["device_name"])
        self.ble_mouse.add_connection_callback(self._on_ble_connection_change)

        # Telemetry timer
        self.last_telemetry_ms = 0
        self.telemetry_interval_ms = 50  # 20Hz telemetry for dashboard

    def _on_ble_connection_change(self, connected: bool):
        if connected:
            self.led.on()
            print("[STATUS] BLE Connected -> Mouse Active")
        else:
            self.led.off()
            print("[STATUS] BLE Disconnected -> Advertising")

    def calibrate(self):
        """Calibrate Gyro zero-point while flashing LED rapidly."""
        print("[CALIB] Keep device completely still! Calibrating gyro...")
        for _ in range(6):
            self.led.toggle()
            time.sleep_ms(50)

        def progress(pct):
            if pct % 20 == 0:
                self.led.toggle()

        self.mpu.calibrate_gyro(samples=200, progress_cb=progress)
        self.led.off()
        print("[CALIB] Calibration complete!")

    def check_serial_commands(self):
        """Handle incoming serial commands from Web Dashboard or USB Terminal."""
        # Non-blocking stdin check
        while sys.stdin in select.select([sys.stdin], [], [], 0)[0]:
            try:
                line = sys.stdin.readline().strip()
                if not line:
                    continue
                if line == "PING":
                    print("PONG")
                elif line == "CALIBRATE":
                    self.calibrate()
                    print("OK:CALIBRATED")
                elif line.startswith("SET_SENS:"):
                    parts = line.split(":")[1].split(",")
                    self.config["sens_x"] = float(parts[0])
                    self.config["sens_y"] = float(parts[1] if len(parts) > 1 else parts[0])
                    save_config(self.config)
                    print(f"OK:SENS:{self.config['sens_x']},{self.config['sens_y']}")
                elif line.startswith("SET_DEADZONE:"):
                    self.config["deadzone"] = float(line.split(":")[1])
                    save_config(self.config)
                    print(f"OK:DEADZONE:{self.config['deadzone']}")
                elif line == "GET_CONFIG":
                    print(f"CONFIG:{json.dumps(self.config)}")
            except Exception as e:
                print(f"[SERIAL] Error: {e}")

    def run(self):
        print("\n=======================================================")
        print(" Raspberry Pi Pico W — BLE 5.2 Air Mouse System Ready ")
        print(" Pair with your PC / Phone via Bluetooth to begin!    ")
        print(" Hold BOTH buttons for 2s anytime to re-calibrate.    ")
        print("=======================================================\n")

        last_blink_ms = time.ticks_ms()
        poll_interval = self.config.get("poll_interval_ms", 10)

        while True:
            loop_start = time.ticks_ms()

            # 1. LED State Machine for Disconnected / Advertising
            is_connected = self.ble_mouse.is_connected()
            if not is_connected:
                # Slow heartbeat blink when waiting for pairing
                if time.ticks_diff(loop_start, last_blink_ms) > 500:
                    self.led.toggle()
                    last_blink_ms = loop_start

            # 2. Read physical tactile buttons (Active LOW -> 0 is pressed)
            left_pressed = (self.btn_left.value() == 0)
            right_pressed = (self.btn_right.value() == 0)

            # Build BLE HID button bitmask:
            # bit 0 = Left button (0x01)
            # bit 1 = Right button (0x02)
            button_mask = 0
            if left_pressed:
                button_mask |= 0x01
            if right_pressed:
                button_mask |= 0x02

            # Dual-button hold gesture: Recalibrate gyro if held for > 1.5 seconds
            if left_pressed and right_pressed:
                if self.both_pressed_start == 0:
                    self.both_pressed_start = loop_start
                elif time.ticks_diff(loop_start, self.both_pressed_start) > 1500:
                    self.calibrate()
                    self.both_pressed_start = 0
            else:
                self.both_pressed_start = 0

            # 3. Read IMU Motion & Calculate deltas
            dx, dy, imu_data = self.mpu.get_motion_deltas(
                sens_x=self.config["sens_x"],
                sens_y=self.config["sens_y"],
                deadzone=self.config["deadzone"],
                invert_x=self.config["invert_x"],
                invert_y=self.config["invert_y"]
            )

            # 4. Transmit BLE HID Mouse Report if motion or button changed
            has_motion = (dx != 0 or dy != 0)
            button_changed = (button_mask != self.last_btn_state)

            if is_connected and (has_motion or button_changed):
                self.ble_mouse.send_mouse_report(buttons=button_mask, dx=dx, dy=dy, wheel=0)

            self.last_btn_state = button_mask

            # 5. Output Telemetry for Dashboard over USB Serial
            if time.ticks_diff(loop_start, self.last_telemetry_ms) >= self.telemetry_interval_ms:
                self.last_telemetry_ms = loop_start
                gx, gy, gz = imu_data["gyro"]
                ax, ay, az = imu_data["accel"]
                telem = {
                    "t": loop_start,
                    "ble": 1 if is_connected else 0,
                    "dx": dx,
                    "dy": dy,
                    "btnL": 1 if left_pressed else 0,
                    "btnR": 1 if right_pressed else 0,
                    "gx": round(gx, 2),
                    "gy": round(gy, 2),
                    "gz": round(gz, 2),
                    "ax": round(ax, 2),
                    "ay": round(ay, 2),
                    "az": round(az, 2),
                    "temp": round(imu_data["temp"], 1)
                }
                print(f"TELEM:{json.dumps(telem)}")

            # 6. Check for Serial commands from Dashboard
            self.check_serial_commands()

            # 7. Regulate polling rate (~100Hz)
            elapsed = time.ticks_diff(time.ticks_ms(), loop_start)
            if elapsed < poll_interval:
                time.sleep_ms(poll_interval - elapsed)

if __name__ == "__main__":
    app = AirMouseController()
    app.run()
