import subprocess
import sys
import os

files = [
    "projects/Air-mouse with picow/ble_hid_mouse.py",
    "projects/Air-mouse with picow/config.json",
    "projects/Air-mouse with picow/main.py"
]

port = "COM10"

for f in files:
    print(f"Uploading {f} to {port}...")
    cmd = [sys.executable, "-m", "mpremote", "connect", port, "fs", "cp", f, ":"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error uploading {f}: {res.stderr}")
    else:
        print(f"Successfully uploaded {os.path.basename(f)}")

print("\nVerifying files on Pico W:")
res = subprocess.run([sys.executable, "-m", "mpremote", "connect", port, "fs", "ls"], capture_output=True, text=True)
print(res.stdout)

print("Resetting Pico W to execute main.py...")
res = subprocess.run([sys.executable, "-m", "mpremote", "connect", port, "reset"], capture_output=True, text=True)
print(res.stdout)
print("Done!")
