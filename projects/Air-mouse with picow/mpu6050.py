"""
MPU6050 6-Axis IMU Driver for MicroPython (Raspberry Pi Pico W)
Designed for gesture-controlled Air Mouse applications.
Features:
- Fast burst I2C reads for Accel, Temp, and Gyro
- Digital Low Pass Filter (DLPF) configuration
- Automatic zero-rate gyro calibration
- Noise suppression, stillness thresholding, and exponential smoothing
"""

import time
import struct
from machine import I2C

class MPU6050:
    # MPU-6050 Register Map
    DEFAULT_ADDR = 0x68
    ALT_ADDR = 0x69

    REG_SMPLRT_DIV   = 0x19
    REG_CONFIG       = 0x1A
    REG_GYRO_CONFIG  = 0x1B
    REG_ACCEL_CONFIG = 0x1C
    REG_INT_ENABLE   = 0x38
    REG_ACCEL_XOUT_H = 0x3B
    REG_TEMP_OUT_H   = 0x41
    REG_GYRO_XOUT_H  = 0x43
    REG_PWR_MGMT_1   = 0x6B
    REG_WHO_AM_I     = 0x75

    # Gyro Full-Scale Ranges & Sensitivities (LSB / (°/s))
    GYRO_FS_250  = (0x00, 131.0)
    GYRO_FS_500  = (0x08, 65.5)
    GYRO_FS_1000 = (0x10, 32.8)
    GYRO_FS_2000 = (0x18, 16.4)

    # Accelerometer Full-Scale Ranges & Sensitivities (LSB / g)
    ACCEL_FS_2G  = (0x00, 16384.0)
    ACCEL_FS_4G  = (0x08, 8192.0)
    ACCEL_FS_8G  = (0x10, 4096.0)
    ACCEL_FS_16G = (0x18, 2048.0)

    def __init__(self, i2c: I2C, addr: int = DEFAULT_ADDR, gyro_range=GYRO_FS_500, accel_range=ACCEL_FS_2G):
        self.i2c = i2c
        self.addr = addr
        self.gyro_scale = gyro_range[1]
        self.accel_scale = accel_range[1]

        # Sensor calibration offsets
        self.offset_gx = 0.0
        self.offset_gy = 0.0
        self.offset_gz = 0.0

        # Filter buffers for smooth motion
        self.smooth_gx = 0.0
        self.smooth_gy = 0.0
        self.smooth_gz = 0.0
        self.alpha = 0.75  # EMA smoothing factor (0.0 to 1.0)

        # Stillness / Anti-drift detector
        self.stillness_threshold = 0.5  # in deg/sec
        self.still_counter = 0

        self._init_sensor(gyro_range[0], accel_range[0])

    def _write_reg(self, reg: int, val: int):
        self.i2c.writeto_mem(self.addr, reg, bytes([val]))

    def _read_reg(self, reg: int, nbytes: int = 1) -> bytes:
        return self.i2c.readfrom_mem(self.addr, reg, nbytes)

    def _init_sensor(self, gyro_fs_bits: int, accel_fs_bits: int):
        """Wake up and configure the MPU6050."""
        # Check device ID
        who_am_i = self._read_reg(self.REG_WHO_AM_I, 1)[0]
        if who_am_i not in (0x68, 0x70, 0x72, 0x69):
            print(f"[MPU6050] Warning: Unexpected WHO_AM_I: 0x{who_am_i:02X} (expected 0x68)")

        # Reset & wake up with PLL gyro reference clock (CLKSEL = 1)
        self._write_reg(self.REG_PWR_MGMT_1, 0x01)
        time.sleep_ms(50)

        # Sample rate divider: 1kHz / (1 + 4) = 200Hz
        self._write_reg(self.REG_SMPLRT_DIV, 0x04)

        # DLPF (Digital Low Pass Filter): Config 3 (~42 Hz bandwidth for smooth cursor)
        self._write_reg(self.REG_CONFIG, 0x03)

        # Set Gyro Full Scale
        self._write_reg(self.REG_GYRO_CONFIG, gyro_fs_bits)

        # Set Accelerometer Full Scale
        self._write_reg(self.REG_ACCEL_CONFIG, accel_fs_bits)

        # Disable interrupts initially
        self._write_reg(self.REG_INT_ENABLE, 0x00)
        time.sleep_ms(20)

    def calibrate_gyro(self, samples: int = 250, progress_cb=None):
        """
        Calibrate gyro zero-rate bias.
        Keep the air mouse motionless on a table while calibrating.
        """
        sum_x = 0.0
        sum_y = 0.0
        sum_z = 0.0

        for i in range(samples):
            raw = self._read_raw_gyro()
            sum_x += raw[0]
            sum_y += raw[1]
            sum_z += raw[2]
            if progress_cb and (i % 25 == 0 or i == samples - 1):
                progress_cb(int((i + 1) / samples * 100))
            time.sleep_ms(4)

        self.offset_gx = (sum_x / samples) / self.gyro_scale
        self.offset_gy = (sum_y / samples) / self.gyro_scale
        self.offset_gz = (sum_z / samples) / self.gyro_scale

        print(f"[MPU6050] Calibrated Gyro Offsets -> X: {self.offset_gx:.3f}°/s, Y: {self.offset_gy:.3f}°/s, Z: {self.offset_gz:.3f}°/s")

    def _read_raw_gyro(self):
        """Read 6 bytes raw gyro data directly."""
        data = self._read_reg(self.REG_GYRO_XOUT_H, 6)
        return struct.unpack('>hhh', data)

    def read_all(self):
        """
        Burst-read 14 bytes: Accel (X,Y,Z), Temperature, Gyro (X,Y,Z).
        Returns:
            dict with 'accel': (ax, ay, az) in g,
                      'gyro': (gx, gy, gz) in °/s (calibrated and filtered),
                      'temp': temperature in °C
        """
        data = self._read_reg(self.REG_ACCEL_XOUT_H, 14)
        ax_r, ay_r, az_r, temp_r, gx_r, gy_r, gz_r = struct.unpack('>hhhhhhh', data)

        # Convert accel to g-force
        ax = ax_r / self.accel_scale
        ay = ay_r / self.accel_scale
        az = az_r / self.accel_scale

        # Convert temperature
        temperature = (temp_r / 340.0) + 36.53

        # Convert gyro to deg/sec and subtract calibration bias
        gx_deg = (gx_r / self.gyro_scale) - self.offset_gx
        gy_deg = (gy_r / self.gyro_scale) - self.offset_gy
        gz_deg = (gz_r / self.gyro_scale) - self.offset_gz

        # Anti-drift stillness suppression
        mag_sq = gx_deg * gx_deg + gy_deg * gy_deg + gz_deg * gz_deg
        thresh_sq = self.stillness_threshold * self.stillness_threshold

        if mag_sq < thresh_sq:
            self.still_counter += 1
            # If still for more than 5 cycles, gently snap to 0
            if self.still_counter > 5:
                gx_deg = 0.0
                gy_deg = 0.0
                gz_deg = 0.0
        else:
            self.still_counter = 0

        # Exponential moving average filter (EMA)
        self.smooth_gx = self.alpha * gx_deg + (1.0 - self.alpha) * self.smooth_gx
        self.smooth_gy = self.alpha * gy_deg + (1.0 - self.alpha) * self.smooth_gy
        self.smooth_gz = self.alpha * gz_deg + (1.0 - self.alpha) * self.smooth_gz

        return {
            'accel': (ax, ay, az),
            'gyro': (self.smooth_gx, self.smooth_gy, self.smooth_gz),
            'temp': temperature
        }

    def get_motion_deltas(self, sens_x: float = 1.0, sens_y: float = 1.0, deadzone: float = 0.05, invert_x: bool = False, invert_y: bool = False):
        """
        Calculates relative mouse cursor deltas (dx, dy) from angular velocity.
        - Horizontal wrist twist (Yaw / Gyro Z) maps to X axis motion.
        - Vertical wrist tilt (Pitch / Gyro Y) maps to Y axis motion.
        Returns:
            (dx: int, dy: int) clamped to int8 range [-127, 127]
        """
        readings = self.read_all()
        gx, gy, gz = readings['gyro']

        # Horizontal movement: Gyro Z (Yaw)
        raw_dx = -gz if not invert_x else gz
        # Vertical movement: Gyro Y (Pitch)
        raw_dy = -gy if not invert_y else gy

        # Deadzone filter
        if abs(raw_dx) < deadzone:
            dx_scaled = 0.0
        else:
            # Shift slightly so motion starts smoothly past deadzone
            sign_x = 1.0 if raw_dx > 0 else -1.0
            dx_scaled = (raw_dx - sign_x * deadzone) * sens_x

        if abs(raw_dy) < deadzone:
            dy_scaled = 0.0
        else:
            sign_y = 1.0 if raw_dy > 0 else -1.0
            dy_scaled = (raw_dy - sign_y * deadzone) * sens_y

        # Dynamic non-linear acceleration curve
        # Gentle movements remain precise; fast wrist flicks accelerate quickly
        dx_val = int(dx_scaled * (1.0 + abs(dx_scaled) * 0.05))
        dy_val = int(dy_scaled * (1.0 + abs(dy_scaled) * 0.05))

        # Clamp to 8-bit signed range [-127, 127] for standard HID report
        dx_clamped = max(-127, min(127, dx_val))
        dy_clamped = max(-127, min(127, dy_val))

        return dx_clamped, dy_clamped, readings
