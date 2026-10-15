"""
BLE 5.2 HID Mouse Profile for Raspberry Pi Pico W (MicroPython)
Implements standard Human Interface Device over GATT (HOGP) for universal
compatibility with Windows 10/11, macOS, Linux, Android, and iOS.
"""

import bluetooth
import struct
import time

# Standard BLE UUIDs
_ADV_TYPE_FLAGS = const(0x01)
_ADV_TYPE_NAME = const(0x09)
_ADV_TYPE_UUID16_COMPLETE = const(0x03)
_ADV_TYPE_APPEARANCE = const(0x19)

# Standard GATT Service UUIDs
_UUID_GENERIC_ACCESS = bluetooth.UUID(0x1800)
_UUID_DEVICE_INFO    = bluetooth.UUID(0x180A)
_UUID_BATTERY        = bluetooth.UUID(0x180F)
_UUID_HID_SERVICE    = bluetooth.UUID(0x1812)

# Standard Characteristic UUIDs
_UUID_DEVICE_NAME    = bluetooth.UUID(0x2A00)
_UUID_APPEARANCE     = bluetooth.UUID(0x2A01)
_UUID_MANUFACTURER   = bluetooth.UUID(0x2A29)
_UUID_MODEL_NUMBER   = bluetooth.UUID(0x2A24)
_UUID_PNP_ID         = bluetooth.UUID(0x2A50)
_UUID_BATTERY_LEVEL  = bluetooth.UUID(0x2A19)
_UUID_HID_INFO       = bluetooth.UUID(0x2A4A)
_UUID_HID_REPORT_MAP = bluetooth.UUID(0x2A4B)
_UUID_HID_CONTROL    = bluetooth.UUID(0x2A4C)
_UUID_HID_REPORT     = bluetooth.UUID(0x2A4D)
_UUID_PROTOCOL_MODE  = bluetooth.UUID(0x2A4E)
_UUID_REPORT_REF     = bluetooth.UUID(0x2908)

# Standard USB HID Mouse Report Descriptor (3 Buttons + X + Y + Scroll Wheel)
HID_REPORT_MAP = bytes([
    0x05, 0x01,        # Usage Page (Generic Desktop Ctrls)
    0x09, 0x02,        # Usage (Mouse)
    0xA1, 0x01,        # Collection (Application)
    0x09, 0x01,        #   Usage (Pointer)
    0xA1, 0x00,        #   Collection (Physical)
    0x05, 0x09,        #     Usage Page (Button)
    0x19, 0x01,        #     Usage Minimum (Button 1: Left)
    0x29, 0x03,        #     Usage Maximum (Button 3: Middle)
    0x15, 0x00,        #     Logical Minimum (0)
    0x25, 0x01,        #     Logical Maximum (1)
    0x95, 0x03,        #     Report Count (3)
    0x75, 0x01,        #     Report Size (1)
    0x81, 0x02,        #     Input (Data,Var,Abs) - Button bitmask
    0x95, 0x01,        #     Report Count (1)
    0x75, 0x05,        #     Report Size (5)
    0x81, 0x03,        #     Input (Const,Var,Abs) - 5-bit padding
    0x05, 0x01,        #     Usage Page (Generic Desktop Ctrls)
    0x09, 0x30,        #     Usage (X)
    0x09, 0x31,        #     Usage (Y)
    0x09, 0x38,        #     Usage (Wheel)
    0x15, 0x81,        #     Logical Minimum (-127)
    0x25, 0x7F,        #     Logical Maximum (127)
    0x75, 0x08,        #     Report Size (8)
    0x95, 0x03,        #     Report Count (3)
    0x81, 0x06,        #     Input (Data,Var,Rel)
    0xC0,              #   End Collection
    0xC0               # End Collection
])

# Helper to pack BLE advertising payloads
def advertising_payload(limited_disc=False, br_edr=False, name=None, services=None, appearance=0):
    payload = bytearray()

    def _append(adv_type, value):
        nonlocal payload
        payload += struct.pack("BB", len(value) + 1, adv_type) + value

    flags = (0x01 if limited_disc else 0x02) + (0x18 if not br_edr else 0)
    _append(_ADV_TYPE_FLAGS, struct.pack("B", flags))

    if name:
        _append(_ADV_TYPE_NAME, name.encode())

    if services:
        for uuid in services:
            b = bytes(uuid)
            if len(b) == 2:
                _append(_ADV_TYPE_UUID16_COMPLETE, b)

    if appearance:
        _append(_ADV_TYPE_APPEARANCE, struct.pack("<H", appearance))

    return payload


class BLEHIDMouse:
    # Button constants
    BUTTON_NONE   = 0x00
    BUTTON_LEFT   = 0x01
    BUTTON_RIGHT  = 0x02
    BUTTON_MIDDLE = 0x04

    def __init__(self, device_name="Pico W Air Mouse"):
        self.device_name = device_name
        self.ble = bluetooth.BLE()
        self.ble.active(True)
        self.ble.irq(self._irq)

        # Connection handle
        self.conn_handle = None
        self._connected = False
        self._callbacks = []

        # HID Info payload: bcdHID (v1.11 = 0x0111), bCountryCode (0), Flags (0x02 = Normally connectable)
        hid_info = bytes([0x11, 0x01, 0x00, 0x02])

        # Report reference descriptor payload: Report ID (0), Report Type (1 = Input)
        report_ref = bytes([0x00, 0x01])

        # PnP ID: Vendor Source (1=Bluetooth SIG), Vendor ID (0x005D), Product ID (0x0001), Version (0x0100)
        pnp_id = bytes([0x01, 0x5D, 0x00, 0x01, 0x00, 0x00, 0x01])

        # Register GATT services
        # 1. Device Information Service
        dis_service = (
            _UUID_DEVICE_INFO,
            (
                (_UUID_MANUFACTURER, bluetooth.FLAG_READ),
                (_UUID_MODEL_NUMBER, bluetooth.FLAG_READ),
                (_UUID_PNP_ID, bluetooth.FLAG_READ),
            ),
        )

        # 2. Battery Service
        bas_service = (
            _UUID_BATTERY,
            (
                (_UUID_BATTERY_LEVEL, bluetooth.FLAG_READ | bluetooth.FLAG_NOTIFY),
            ),
        )

        # 3. Human Interface Device Service
        # Descriptor flag 0x2908 requires report_ref
        hid_service = (
            _UUID_HID_SERVICE,
            (
                (_UUID_HID_INFO, bluetooth.FLAG_READ),
                (_UUID_HID_REPORT_MAP, bluetooth.FLAG_READ),
                (_UUID_HID_CONTROL, bluetooth.FLAG_WRITE_NO_RESPONSE),
                (_UUID_PROTOCOL_MODE, bluetooth.FLAG_READ | bluetooth.FLAG_WRITE_NO_RESPONSE),
                (_UUID_HID_REPORT, bluetooth.FLAG_READ | bluetooth.FLAG_NOTIFY, ((_UUID_REPORT_REF, bluetooth.FLAG_READ),)),
            ),
        )

        services = (dis_service, bas_service, hid_service)
        handles = self.ble.gatts_register_services(services)

        # Save handles
        (
            (self._handle_mfg, self._handle_model, self._handle_pnp),
            (self._handle_battery,),
            (self._handle_hid_info, self._handle_report_map, self._handle_hid_ctl, self._handle_proto_mode, self._handle_report, (self._handle_report_ref,)),
        ) = handles

        # Populate static characteristic values
        self.ble.gatts_write(self._handle_mfg, b"VidyaSTEM")
        self.ble.gatts_write(self._handle_model, b"PicoW-AirMouse-v1")
        self.ble.gatts_write(self._handle_pnp, pnp_id)
        self.ble.gatts_write(self._handle_battery, bytes([100]))  # 100% battery
        self.ble.gatts_write(self._handle_hid_info, hid_info)
        self.ble.gatts_write(self._handle_report_map, HID_REPORT_MAP)
        self.ble.gatts_write(self._handle_proto_mode, bytes([0x01]))  # Report Mode
        self.ble.gatts_write(self._handle_report_ref, report_ref)

        # Prepare advertising packet
        # Appearance: 0x03C2 = Generic Mouse (962 decimal)
        self._adv_payload = advertising_payload(
            name=self.device_name,
            services=[_UUID_HID_SERVICE, _UUID_BATTERY],
            appearance=962,
        )

        self.start_advertising()

    def _irq(self, event, data):
        # 1 = _IRQ_CENTRAL_CONNECT
        if event == 1:
            conn_handle, _, _ = data
            self.conn_handle = conn_handle
            self._connected = True
            print(f"[BLE] Host Connected! Handle: {conn_handle}")
            self._notify_state(True)
        # 2 = _IRQ_CENTRAL_DISCONNECT
        elif event == 2:
            conn_handle, _, _ = data
            print(f"[BLE] Host Disconnected. Re-advertising...")
            self.conn_handle = None
            self._connected = False
            self._notify_state(False)
            self.start_advertising()

    def add_connection_callback(self, cb):
        self._callbacks.append(cb)

    def _notify_state(self, connected: bool):
        for cb in self._callbacks:
            try:
                cb(connected)
            except Exception as e:
                print(f"[BLE] Callback error: {e}")

    def is_connected(self) -> bool:
        return self._connected

    def start_advertising(self):
        """Start advertising as a BLE HID Mouse."""
        self.ble.gap_advertise(100_000, self._adv_payload)
        print(f"[BLE] Advertising as '{self.device_name}' (Appearance: Mouse)...")

    def stop_advertising(self):
        self.ble.gap_advertise(None)

    def send_mouse_report(self, buttons: int = 0, dx: int = 0, dy: int = 0, wheel: int = 0):
        """
        Send a 4-byte HID Mouse Report over BLE notification.
        - buttons: bitmask (1=Left, 2=Right, 4=Middle)
        - dx: signed 8-bit horizontal delta (-127 to 127)
        - dy: signed 8-bit vertical delta (-127 to 127)
        - wheel: signed 8-bit scroll delta (-127 to 127)
        """
        if not self._connected or self.conn_handle is None:
            return False

        # Clamp deltas to int8 range [-127, 127]
        dx = max(-127, min(127, int(dx)))
        dy = max(-127, min(127, int(dy)))
        wheel = max(-127, min(127, int(wheel)))

        report = struct.pack("Bbbb", buttons & 0x07, dx, dy, wheel)
        try:
            self.ble.gatts_notify(self.conn_handle, self._handle_report, report)
            return True
        except Exception as e:
            # Buffer overflow or connection drop
            return False

    def update_battery(self, level: int):
        """Update battery level percentage (0 - 100)."""
        level = max(0, min(100, int(level)))
        try:
            self.ble.gatts_write(self._handle_battery, bytes([level]))
            if self._connected and self.conn_handle is not None:
                self.ble.gatts_notify(self.conn_handle, self._handle_battery, bytes([level]))
        except Exception:
            pass
