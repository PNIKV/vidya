/**
 * VIDYA STEM – Tinkering Lab Inventory System
 * Central Data Store  |  data/labs.js
 *
 * Structure:
 *   LABS_DATA.labs[]         → All lab definitions with items
 *   LABS_DATA.users[]        → Auth credentials & roles
 *   LABS_DATA.config         → App-level config
 *
 * accessRoles:
 *   ["admin"]                → Admin only (Lab, Advanced Lab)
 *   ["admin","trainer"]      → Both roles (Trainer Kit, Devices)
 *
 * Image paths: ./data/images/<folder>/<filename>.jpg
 *   Place real .jpg images in these paths. App auto-fallback if missing.
 */

const LABS_DATA = {

  /* ─────────────────────────────────────────
     USERS
  ───────────────────────────────────────── */
  users: [
    { username: "admin",    password: "admin123", role: "admin",   displayName: "Lab Admin"   },
    { username: "trainer1", password: "train1",   role: "trainer", displayName: "Trainer — Rahul" },
    { username: "trainer2", password: "train2",   role: "trainer", displayName: "Trainer — Priya" }
  ],

  /* ─────────────────────────────────────────
     APP CONFIG
  ───────────────────────────────────────── */
  config: {
    labName:    "Tinkering Lab",
    orgName:    "Vidya STEM",
    version:    "2.0.0",
    storageKey: "tl_audit_history_v2"
  },

  /* ─────────────────────────────────────────
     LABS
  ───────────────────────────────────────── */
  labs: [

    /* ── 1. Basic Electronics Lab ─────────── */
    {
      id:          "lab",
      name:        "Basic Electronics Lab",
      shortName:   "Electronics Lab",
      description: "Core safety gear, soldering tools & primary electronic components",
      icon:        "fa-flask",
      color:       "#34d399",
      categoryImg: "./data/images/lab/category.jpg",
      accessRoles: ["admin"],          // ← Trainers do NOT see this
      items: [
        { id: "l01", name: "Fire Extinguisher",      img: "./data/images/lab/fire_extinguisher.jpg",  quantity: 1,  category: "Safety"           },
        { id: "l02", name: "First-Aid Kit",           img: "./data/images/lab/first_aid_kit.jpg",      quantity: 1,  category: "Safety"           },
        { id: "l03", name: "Safety Goggles",          img: "./data/images/lab/safety_goggles.jpg",     quantity: 18, category: "Safety"           },
        { id: "l04", name: "Soldering Station",       img: "./data/images/lab/soldering_station.jpg",  quantity: 3,  category: "Tools"            },
        { id: "l05", name: "Solder Wire (Roll)",      img: "./data/images/lab/solder_wire.jpg",        quantity: 6,  category: "Consumables"      },
        { id: "l06", name: "Digital Multimeter",      img: "./data/images/lab/multimeter.jpg",         quantity: 3,  category: "Instruments"      },
        { id: "l07", name: "Breadboard (Full Size)",  img: "./data/images/lab/breadboard.jpg",         quantity: 9,  category: "Prototyping"      },
        { id: "l08", name: "Arduino Uno R3",          img: "./data/images/lab/arduino_uno.jpg",        quantity: 6,  category: "Microcontrollers" },
        { id: "l09", name: "Raspberry Pi 4B (4GB)",   img: "./data/images/lab/raspberry_pi.jpg",       quantity: 3,  category: "SBCs"             },
        { id: "l10", name: "LEDs – Assorted Pack",    img: "./data/images/lab/leds.jpg",               quantity: 50, category: "Components"       },
        { id: "l11", name: "Resistor Kit (600pcs)",   img: "./data/images/lab/resistors.jpg",          quantity: 3,  category: "Components"       },
        { id: "l12", name: "Capacitor Kit",           img: "./data/images/lab/capacitors.jpg",         quantity: 2,  category: "Components"       },
        { id: "l13", name: "Jumper Wire Set (M-M/F)", img: "./data/images/lab/jumper_wires.jpg",       quantity: 10, category: "Wiring"           },
        { id: "l14", name: "USB Power Adapters (5V)", img: "./data/images/lab/usb_adapter.jpg",        quantity: 6,  category: "Power"            },
        { id: "l15", name: "Antistatic Wrist Strap",  img: "./data/images/lab/wrist_strap.jpg",        quantity: 4,  category: "Safety"           }
      ]
    },

    /* ── 2. Advanced Prototyping Lab ─────── */
    {
      id:          "advLab",
      name:        "Advanced Prototyping Lab",
      shortName:   "Adv. Prototyping",
      description: "High-value instruments, AI hardware & fabrication equipment",
      icon:        "fa-microchip",
      color:       "#f472b6",
      categoryImg: "./data/images/advlab/category.jpg",
      accessRoles: ["admin"],          // ← Trainers do NOT see this
      items: [
        { id: "al01", name: "Oscilloscope – DSO (100MHz)",    img: "./data/images/advlab/oscilloscope.jpg",      quantity: 1, category: "Instruments" },
        { id: "al02", name: "Function / Signal Generator",    img: "./data/images/advlab/function_generator.jpg",quantity: 1, category: "Instruments" },
        { id: "al03", name: "Benchtop Power Supply (30V/5A)", img: "./data/images/advlab/power_supply.jpg",      quantity: 2, category: "Instruments" },
        { id: "al04", name: "Raspberry Pi 5 (8GB)",           img: "./data/images/advlab/rpi5.jpg",              quantity: 2, category: "SBCs"        },
        { id: "al05", name: "Jetson Nano Developer Kit",      img: "./data/images/advlab/jetson_nano.jpg",       quantity: 2, category: "AI Hardware" },
        { id: "al06", name: "3D Printer (FDM – Ender 3)",     img: "./data/images/advlab/3d_printer.jpg",        quantity: 1, category: "Fabrication" },
        { id: "al07", name: "PLA Filament Spools (1kg)",      img: "./data/images/advlab/pla_filament.jpg",      quantity: 5, category: "Consumables" },
        { id: "al08", name: "Drone Frame Kit (450mm)",        img: "./data/images/advlab/drone_frame.jpg",       quantity: 2, category: "Robotics"    },
        { id: "al09", name: "BLDC Motors + ESC (Set of 4)",   img: "./data/images/advlab/bldc_esc.jpg",          quantity: 8, category: "Robotics"    },
        { id: "al10", name: "LiPo Battery 2200mAh 3S",        img: "./data/images/advlab/lipo_battery.jpg",      quantity: 4, category: "Power"       },
        { id: "al11", name: "Soldering Rework Station (Hot)", img: "./data/images/advlab/rework_station.jpg",    quantity: 1, category: "Tools"       },
        { id: "al12", name: "Digital Caliper (150mm)",        img: "./data/images/advlab/caliper.jpg",           quantity: 2, category: "Measurement" }
      ]
    },

    /* ── 3. School Trainer Kit ────────────── */
    {
      id:          "schoolTrainer",
      name:        "School Trainer Kit",
      shortName:   "Trainer Kits",
      description: "Student-facing kits, sensors & session consumables",
      icon:        "fa-chalkboard-user",
      color:       "#fbbf24",
      categoryImg: "./data/images/trainer/category.jpg",
      accessRoles: ["admin", "trainer"],  // ← Both roles
      items: [
        { id: "st01", name: "Basic Toolkit Set",              img: "./data/images/trainer/toolkit.jpg",         quantity: 5,  category: "Tools"        },
        { id: "st02", name: "Arduino Starter Kit",            img: "./data/images/trainer/arduino_kit.jpg",     quantity: 10, category: "Kits"         },
        { id: "st03", name: "Motor Driver – L298N",           img: "./data/images/trainer/motor_driver.jpg",    quantity: 10, category: "Modules"      },
        { id: "st04", name: "DC Gear Motor (6V)",             img: "./data/images/trainer/dc_motor.jpg",        quantity: 20, category: "Actuators"    },
        { id: "st05", name: "Robot Chassis Wheels",           img: "./data/images/trainer/wheels.jpg",          quantity: 20, category: "Mechanical"   },
        { id: "st06", name: "Ultrasonic Sensor HC-SR04",      img: "./data/images/trainer/ultrasonic.jpg",      quantity: 10, category: "Sensors"      },
        { id: "st07", name: "IR Line Follower Sensor",        img: "./data/images/trainer/ir_sensor.jpg",       quantity: 15, category: "Sensors"      },
        { id: "st08", name: "9V PP3 Battery",                 img: "./data/images/trainer/9v_battery.jpg",      quantity: 15, category: "Power"        },
        { id: "st09", name: "Jumper Wire Set",                img: "./data/images/trainer/jumper_wires.jpg",    quantity: 50, category: "Wiring"       },
        { id: "st10", name: "Mini Breadboard",                img: "./data/images/trainer/mini_breadboard.jpg", quantity: 10, category: "Prototyping"  },
        { id: "st11", name: "Servo Motor (SG90)",             img: "./data/images/trainer/servo.jpg",           quantity: 15, category: "Actuators"    },
        { id: "st12", name: "LED Traffic Light Module",       img: "./data/images/trainer/traffic_led.jpg",     quantity: 10, category: "Modules"      }
      ]
    },

    /* ── 4. Devices & IT Equipment ─────────── */
    {
      id:          "device",
      name:        "Devices & IT Equipment",
      shortName:   "IT Devices",
      description: "Computers, monitors, peripherals & networking gear",
      icon:        "fa-desktop",
      color:       "#60a5fa",
      categoryImg: "./data/images/devices/category.jpg",
      accessRoles: ["admin", "trainer"],  // ← Both roles
      items: [
        { id: "d01", name: "Monitor 24-inch FHD",        img: "./data/images/devices/monitor.jpg",   quantity: 10, category: "Display"      },
        { id: "d02", name: "Keyboard – USB Wired",       img: "./data/images/devices/keyboard.jpg",  quantity: 10, category: "Input"        },
        { id: "d03", name: "Mouse – USB Optical",        img: "./data/images/devices/mouse.jpg",     quantity: 10, category: "Input"        },
        { id: "d04", name: "Desktop CPU Tower",          img: "./data/images/devices/cpu.jpg",       quantity: 10, category: "Computing"    },
        { id: "d05", name: "Trainer Laptop",             img: "./data/images/devices/laptop.jpg",    quantity: 3,  category: "Computing"    },
        { id: "d06", name: "Projector – Full HD",        img: "./data/images/devices/projector.jpg", quantity: 1,  category: "Display"      },
        { id: "d07", name: "UPS Battery Backup (600VA)", img: "./data/images/devices/ups.jpg",       quantity: 5,  category: "Power"        },
        { id: "d08", name: "Network Switch 8-port",      img: "./data/images/devices/switch.jpg",    quantity: 1,  category: "Networking"   },
        { id: "d09", name: "HDMI Cable 1.5m",            img: "./data/images/devices/hdmi.jpg",      quantity: 10, category: "Cables"       },
        { id: "d10", name: "Webcam 1080p",               img: "./data/images/devices/webcam.jpg",    quantity: 5,  category: "Peripherals"  },
        { id: "d11", name: "Extension Board (6-port)",   img: "./data/images/devices/extension.jpg", quantity: 8,  category: "Power"        },
        { id: "d12", name: "Ethernet Cables (2m)",       img: "./data/images/devices/ethernet.jpg",  quantity: 15, category: "Networking"   }
      ]
    }

  ] // end labs[]

}; // end LABS_DATA
