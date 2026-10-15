import urllib.request
import re
import os
import shutil
import time

url = "https://micropython.org/download/RPI_PICO_W/"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

# Find first stable release .uf2 link
matches = re.findall(r'href=[\'"]([^\'"]+?RPI_PICO_W[^\'"]*?\.uf2)[\'"]', html)
if not matches:
    matches = re.findall(r'href=[\'"]([^\'"]+?\.uf2)[\'"]', html)

print("Found UF2 candidates:", matches[:3])

if matches:
    uf2_rel = matches[0]
    if not uf2_rel.startswith('http'):
        uf2_url = "https://micropython.org" + uf2_rel if uf2_rel.startswith('/') else "https://micropython.org/download/RPI_PICO_W/" + uf2_rel
    else:
        uf2_url = uf2_rel
    
    print("Downloading MicroPython UF2 from:", uf2_url)
    dest_path = os.path.join(os.path.dirname(__file__), "pico_w_micropython.uf2")
    urllib.request.urlretrieve(uf2_url, dest_path)
    print(f"Downloaded successfully: {dest_path} ({os.path.getsize(dest_path)} bytes)")
    
    # Check if D:\ drive exists
    if os.path.exists("D:\\INFO_UF2.TXT") or os.path.exists("D:\\INDEX.HTM"):
        print("Detected Raspberry Pi Pico in BOOTSEL mode at D:\\ !")
        print("Flashing MicroPython onto Raspberry Pi Pico W by copying UF2...")
        target_uf2 = "D:\\pico_w_micropython.uf2"
        shutil.copyfile(dest_path, target_uf2)
        print("Copied UF2 to D:\\! Board is rebooting into MicroPython...")
    else:
        print("D:\\ is not in BOOTSEL mode.")
