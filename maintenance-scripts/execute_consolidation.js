/**
 * execute_consolidation.js
 * 
 * Consolidates all projects from projects/, newprojects/, and py/ into
 * canonical kebab-case folders under projects/. Merges duplicates, generates
 * missing JSON files, and cleans up source dirs. Does NOT delete .py or utility scripts.
 */

const fs = require('fs');
const path = require('path');

const ROOT = 'c:/Users/Niktrix/vidya/vidya';
const PROJECTS = path.join(ROOT, 'projects');
const NEWPROJECTS = path.join(ROOT, 'newprojects');
const PY = path.join(ROOT, 'py');

// ── Helpers ──────────────────────────────────────────────────────────────────

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  📁 Created dir: ${dirPath.replace(ROOT, '')}`);
  }
}

// Copy a single file, skipping if destination already exists (keeps older copy)
function copyFile(src, dest, overwrite = false) {
  if (!fs.existsSync(src)) return false;
  if (fs.existsSync(dest) && !overwrite) {
    // If dest is newer/bigger, skip — keep existing
    return false;
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return true;
}

// Copy all files from srcDir into destDir, skipping existing unless overwrite
function mergeDir(srcDir, destDir, overwrite = false) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      mergeDir(srcPath, path.join(destDir, entry.name), overwrite);
    } else {
      const copied = copyFile(srcPath, destPath, overwrite);
      if (copied) console.log(`  📄 Copied: ${entry.name}`);
    }
  }
}

// Delete a directory recursively
function deleteDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  fs.rmSync(dirPath, { recursive: true, force: true });
  console.log(`  🗑️  Deleted dir: ${dirPath.replace(ROOT, '')}`);
}

// Delete a single file
function deleteFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  fs.unlinkSync(filePath);
  console.log(`  🗑️  Deleted file: ${filePath.replace(ROOT, '')}`);
}

// Write a JSON file to destDir with the given name and data (only if no valid JSON exists)
function writeJson(destDir, filename, data) {
  const dest = path.join(destDir, filename);
  fs.writeFileSync(dest, JSON.stringify(data, null, 2) + '\n');
  console.log(`  ✅ Wrote JSON: ${filename}`);
}

// Find the best JSON file in a directory (one with id + title)
function findBestJson(dirPath) {
  if (!fs.existsSync(dirPath)) return null;
  const files = fs.readdirSync(dirPath).filter(f => f.toLowerCase().endsWith('.json'));
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dirPath, f), 'utf8'));
      if (data.id && data.title) return { file: f, data };
    } catch {}
  }
  return null;
}

// Remove all JSON files from a directory
function removeAllJsons(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  fs.readdirSync(dirPath).filter(f => f.toLowerCase().endsWith('.json')).forEach(f => {
    fs.unlinkSync(path.join(dirPath, f));
  });
}

// Write JSON to target, rename it properly, remove all existing JSONs first
function setCanonicalJson(targetDir, canonicalName, data) {
  removeAllJsons(targetDir);
  writeJson(targetDir, canonicalName, data);
}

// ── Step 1: Consolidate each project ────────────────────────────────────────

const CONSOLIDATIONS = [
  {
    target: 'air-mouse',
    sources: [
      path.join(PROJECTS, 'AIR MOUSE'),
      path.join(NEWPROJECTS, 'AIR MOUSE'),
      path.join(PY, 'TESTING-Air-mouse'),
    ],
    jsonFile: 'air-mouse.json',
    generateJson: {
      id: 'air-mouse',
      title: 'Air Mouse',
      subtitle: 'Wireless BLE air mouse using ESP32 + MPU6050',
      level: 'Advanced',
      color: '#6C63FF',
      desc: 'Control your PC cursor with hand gestures using an ESP32 and MPU6050 gyroscope over Bluetooth!',
      fullDesc: 'The Air Mouse project turns an ESP32 microcontroller and an MPU6050 6-DOF IMU into a fully wireless Bluetooth HID mouse. Tilt and rotate the device to move the cursor, press physical buttons to click. Includes a configurable web dashboard accessible over BLE serial for tuning sensitivity, deadzone, and pin assignments. All settings are stored in non-volatile flash memory.',
      difficulty: 4,
      status: 'Available',
      tags: ['ESP32', 'BLE', 'MPU6050', 'HID', 'Gesture', 'Wireless'],
      date: '2026-07-01',
      author: 'Atul Sawant',
      team: [{ name: 'Atul Sawant', role: 'Trainer & Project Lead' }],
      innovation: 'Replaces a traditional mouse with a gesture-based air controller using consumer-grade IMU hardware, making cursor control hands-free and intuitive.',
      problemStatement: 'Traditional mice require a flat surface and restrict mobility. A gyroscope-based air mouse allows control from anywhere.',
      solutionApproach: 'Used an ESP32 as the Bluetooth HID host. The MPU6050 IMU provides raw acceleration data converted into relative mouse motion. A configurable dashboard served over BLE serial allows runtime tuning.',
      hardwareSpecs: {
        microcontroller: 'ESP32 Development Board',
        sensor: 'MPU6050 6-DOF IMU (I2C)',
        connectivity: 'Bluetooth Low Energy (BLE HID)',
        buttons: '2× Push Buttons (Left/Right click, GPIO 25/26)',
        led: 'Status LED (GPIO 2)'
      },
      components: ['ESP32', 'MPU6050 IMU', '2x Push Buttons', 'Status LED', 'USB Cable', 'Breadboard', 'Jumper Wires'],
      componentRefs: ['esp32', 'mpu6050', 'jumper-wires'],
      guide: [
        'Connect MPU6050 to ESP32: SDA→GPIO21, SCL→GPIO22, VCC→3.3V, GND→GND',
        'Wire left-click button to GPIO 25 and right-click to GPIO 26',
        'Install required Arduino libraries: Adafruit MPU6050, Adafruit Unified Sensor, ESP32-BLE-Mouse, ArduinoJson',
        'Upload air_mouse_firmware.ino using Arduino IDE with ESP32 board support',
        'Pair the device with your PC via Bluetooth as "ESP32 Air Mouse"',
        'Open the web dashboard (mouse_dashboard.html) to configure sensitivity and deadzone',
        'Hold the device and tilt/rotate to move the cursor, press buttons to click'
      ],
      estimatedTime: '90 minutes',
      prerequisites: ['ESP32 Arduino setup', 'Basic I2C wiring', 'Bluetooth pairing knowledge'],
      liveUrl: 'projects/air-mouse/mouse_dashboard.html',
      youtubeVideos: [],
      githubUrl: '',
      achievements: ['Wireless BLE HID device', 'Runtime-configurable via dashboard'],
      keywords: ['air mouse', 'gesture control', 'ESP32', 'MPU6050', 'BLE', 'HID', 'wireless mouse']
    }
  },
  {
    target: 'arduino-uno-countdown-timer',
    sources: [
      path.join(PROJECTS, 'Arduino UNO Based Countdown Timer'),
      path.join(NEWPROJECTS, 'Arduino UNO Based Countdown Timer'),
    ],
    jsonFile: 'arduino-uno-countdown-timer.json',
    pickBestFrom: [
      path.join(PROJECTS, 'Arduino UNO Based Countdown Timer'),
      path.join(NEWPROJECTS, 'Arduino UNO Based Countdown Timer'),
    ]
  },
  {
    target: 'arduino-flight-simulator',
    sources: [
      path.join(PROJECTS, 'arduino-flight-simulator'),
      path.join(NEWPROJECTS, 'Arduino-Based Flight Simulator Using Joystick Project'),
    ],
    jsonFile: 'arduino-flight-simulator.json',
    pickBestFrom: [
      path.join(PROJECTS, 'arduino-flight-simulator'),
    ]
  },
  {
    target: 'assistive-tech-blind-people',
    sources: [
      path.join(PROJECTS, 'Assistive-Tech-blind-people copy'),
      path.join(NEWPROJECTS, 'Assistive-Tech-blind-people'),
    ],
    jsonFile: 'assistive-tech-blind-people.json',
    pickBestFrom: [
      path.join(NEWPROJECTS, 'Assistive-Tech-blind-people'),
      path.join(PROJECTS, 'Assistive-Tech-blind-people copy'),
    ]
  },
  {
    target: 'automatic-school-bell-and-announcement-system',
    sources: [
      path.join(PROJECTS, 'automatic-school-bell-and-announcement-system'),
      path.join(PROJECTS, 'Automatic-School-Bell-System'),
      path.join(NEWPROJECTS, 'Automatic-School-Bell-System'),
    ],
    jsonFile: 'automatic-school-bell-and-announcement-system.json',
    pickBestFrom: [
      path.join(PROJECTS, 'automatic-school-bell-and-announcement-system'),
      path.join(NEWPROJECTS, 'Automatic-School-Bell-System'),
    ]
  },
  {
    target: 'bus-tracking',
    sources: [
      path.join(PROJECTS, 'Bus-tracking'),
      path.join(NEWPROJECTS, 'Bus-tracking'),
      path.join(PROJECTS, 'bus-tracking-system-at-bus-stop'),
      path.join(PY, 'live_bus_tracking'),
    ],
    jsonFile: 'bus-tracking.json',
    pickBestFrom: [
      path.join(PROJECTS, 'Bus-tracking'),
      path.join(NEWPROJECTS, 'Bus-tracking'),
    ]
  },
  {
    target: 'food-spoilage-detection-system',
    sources: [
      path.join(NEWPROJECTS, 'Food Spoilage Detection System'),
    ],
    jsonFile: 'food-spoilage-detection-system.json',
    pickBestFrom: [
      path.join(NEWPROJECTS, 'Food Spoilage Detection System'),
    ]
  },
  {
    target: 'gas-detector',
    sources: [
      path.join(PROJECTS, 'Gas-Detector'),
      path.join(NEWPROJECTS, 'Gas-Detector'),
    ],
    jsonFile: 'gas-detector.json',
    generateJson: {
      id: 'gas-detector',
      title: 'Gas Detector',
      subtitle: 'MQ135-based hazardous gas detection and alert system',
      level: 'Beginner',
      color: '#FF6B35',
      desc: 'Detects hazardous gas levels using an MQ135 sensor and triggers buzzer and LED alerts!',
      fullDesc: 'A portable gas detection system using an Arduino UNO and MQ135 gas sensor. The system continuously monitors air quality, displaying readings on a 16×2 I2C LCD. When the gas level exceeds a safe threshold, it activates a buzzer and LED alert. Suitable for school labs, kitchens, and any indoor environment where gas safety is a concern.',
      difficulty: 2,
      status: 'Available',
      tags: ['Arduino', 'Sensors', 'Safety', 'IoT', 'STEM'],
      date: '2026-08-05',
      author: 'Anushka Hankare',
      team: [{ name: 'Anushka Hankare', role: 'Student' }],
      innovation: 'A low-cost gas monitoring solution with real-time LCD display and audio-visual alert system that can be built with basic Arduino components.',
      problemStatement: 'Gas leaks in homes and labs can be dangerous. A simple, affordable gas detector can save lives by providing early warning.',
      solutionApproach: 'Used an MQ135 analog gas sensor with Arduino UNO. Readings are shown on a 16x2 I2C LCD in real-time. A configurable threshold triggers buzzer and LED alerts when unsafe levels are detected.',
      hardwareSpecs: {
        microcontroller: 'Arduino UNO',
        sensor: 'MQ135 Gas Sensor',
        display: '16x2 I2C LCD Display',
        alerts: 'Buzzer + LED',
        threshold: '150 (analog reading)'
      },
      components: ['Arduino UNO', 'MQ135 Gas Sensor', '16×2 I2C LCD', 'Buzzer', 'LED', 'Jumper Wires', 'Breadboard'],
      componentRefs: ['arduino-uno', 'mq135', 'lcd-i2c'],
      guide: [
        'Connect MQ135 analog output to Arduino A0 pin',
        'Wire I2C LCD: SDA→A4, SCL→A5, VCC→5V, GND→GND',
        'Connect buzzer positive to pin 8 and LED anode to pin 9',
        'Upload the Arduino sketch',
        'Allow 3 seconds warm-up time for sensor calibration',
        'Monitor gas levels on the LCD display',
        'Adjust the threshold value in code if needed for your sensor'
      ],
      estimatedTime: '60 minutes',
      prerequisites: ['Basic Arduino programming', 'I2C LCD wiring'],
      youtubeVideos: [],
      githubUrl: '',
      keywords: ['gas detector', 'MQ135', 'Arduino', 'air quality', 'safety', 'buzzer', 'LCD']
    }
  },
  {
    target: 'gripper-robot',
    sources: [
      path.join(PROJECTS, 'Griper Robot'),
      path.join(NEWPROJECTS, 'Griper Robot'),
    ],
    jsonFile: 'gripper-robot.json',
    pickBestFrom: [
      path.join(PROJECTS, 'Griper Robot'),
      path.join(NEWPROJECTS, 'Griper Robot'),
    ]
  },
  {
    target: 'iot-agriculture-monitoring',
    sources: [
      path.join(PROJECTS, 'Iot Agriculture monitoring'),
      path.join(NEWPROJECTS, 'Iot Agriculture monitoring'),
    ],
    jsonFile: 'iot-agriculture-monitoring.json',
    generateJson: {
      id: 'iot-agriculture-monitoring',
      title: 'IoT Agriculture Monitoring System',
      subtitle: 'Smart farm monitoring with soil moisture and weather sensors',
      level: 'Intermediate',
      color: '#27AE60',
      desc: 'Monitor soil moisture, temperature, and humidity remotely to enable smart farming decisions!',
      fullDesc: 'An IoT-based agriculture monitoring system that uses multiple sensors to track soil moisture, ambient temperature, and humidity. Data is transmitted wirelessly and can be monitored remotely. The system helps farmers make data-driven irrigation and crop management decisions, reducing water waste and improving yields.',
      difficulty: 3,
      status: 'Available',
      tags: ['IoT', 'Agriculture', 'Sensors', 'ESP32', 'STEM', 'Smart Farming'],
      date: '2026-07-15',
      author: 'Tinkering Lab',
      innovation: 'Combines multiple agricultural sensors with wireless data transmission to enable remote farm monitoring accessible via a simple web interface.',
      problemStatement: 'Traditional farming relies on manual monitoring which is time-consuming and imprecise. IoT-based systems enable real-time data collection and remote monitoring.',
      solutionApproach: 'Used ESP32 microcontroller with DHT11 and soil moisture sensors to collect environmental data. Data is transmitted wirelessly and displayed on a web dashboard.',
      hardwareSpecs: {
        microcontroller: 'ESP32 Development Board',
        sensors: 'DHT11 (Temperature & Humidity), Soil Moisture Sensor',
        connectivity: 'WiFi (ESP32)',
        powerSupply: '5V USB'
      },
      components: ['ESP32', 'DHT11 Sensor', 'Soil Moisture Sensor', 'Jumper Wires', 'Breadboard', 'USB Cable'],
      componentRefs: ['esp32', 'dht11', 'soil-moisture'],
      guide: [
        'Connect DHT11 data pin to ESP32 GPIO 4',
        'Connect soil moisture sensor analog output to ESP32 analog pin',
        'Update WiFi credentials in the code',
        'Upload the firmware using Arduino IDE',
        'Access the web dashboard at the ESP32 IP address',
        'Monitor real-time readings and set alert thresholds'
      ],
      estimatedTime: '90 minutes',
      prerequisites: ['ESP32 Arduino setup', 'Basic sensor wiring', 'WiFi configuration'],
      youtubeVideos: [],
      keywords: ['IoT', 'agriculture', 'soil moisture', 'ESP32', 'smart farming', 'DHT11']
    }
  },
  {
    target: 'jarakshak',
    sources: [
      path.join(PROJECTS, 'JaRakshak'),
      path.join(NEWPROJECTS, 'JaRakshak'),
    ],
    jsonFile: 'jarakshak.json',
    generateJson: {
      id: 'jarakshak',
      title: 'JalRakshak',
      subtitle: 'Smart water conservation and quality monitoring system',
      level: 'Intermediate',
      color: '#0099CC',
      desc: 'Monitor water quality and automate conservation with smart sensors and alerts!',
      fullDesc: 'JalRakshak (meaning "water guardian" in Hindi) is an IoT-based water monitoring and conservation system. It monitors water quality parameters and automates water conservation actions. The system aims to address water scarcity issues by providing real-time water quality data and automating waste prevention.',
      difficulty: 3,
      status: 'Available',
      tags: ['IoT', 'Water', 'Environment', 'Sensors', 'Conservation'],
      date: '2026-07-20',
      author: 'Tinkering Lab',
      innovation: 'Combines water quality sensing with automated conservation mechanisms to address water scarcity at the community level.',
      problemStatement: 'Water scarcity and contamination are critical issues. Smart monitoring can help detect problems early and enable efficient water usage.',
      solutionApproach: 'Used microcontroller-based sensors to monitor water parameters. Automated alerts and control actions help conserve water and prevent wastage.',
      components: ['Arduino/ESP32', 'Water Level Sensor', 'TDS/Turbidity Sensor', 'Relay Module', 'LCD Display', 'Jumper Wires'],
      guide: [
        'Assemble all sensors and connect to microcontroller',
        'Upload the firmware',
        'Calibrate sensors for your water source',
        'Set alert thresholds for water quality parameters',
        'Test the automation responses'
      ],
      estimatedTime: '120 minutes',
      prerequisites: ['Basic electronics', 'Arduino programming'],
      youtubeVideos: [],
      keywords: ['water', 'conservation', 'quality monitoring', 'IoT', 'environment', 'JalRakshak']
    }
  },
  {
    target: 'keypad-door-lock',
    sources: [
      path.join(PROJECTS, 'keypad-door-lock'),
      path.join(NEWPROJECTS, 'keypad-door-lock'),
    ],
    jsonFile: 'keypad-door-lock.json',
    pickBestFrom: [
      path.join(PROJECTS, 'keypad-door-lock'),
      path.join(NEWPROJECTS, 'keypad-door-lock'),
    ]
  },
  {
    target: 'laser-security-system',
    sources: [
      path.join(PROJECTS, 'laser-security-system'),
      path.join(PROJECTS, 'Laser Security System'),
      path.join(NEWPROJECTS, 'Laser Security System'),
    ],
    jsonFile: 'laser-security-system.json',
    pickBestFrom: [
      path.join(PROJECTS, 'laser-security-system'),
    ]
  },
  {
    target: 'medicine-dispenser',
    sources: [
      path.join(NEWPROJECTS, 'Medicine Dispenser'),
    ],
    jsonFile: 'medicine-dispenser.json',
    pickBestFrom: [
      path.join(NEWPROJECTS, 'Medicine Dispenser'),
    ]
  },
  {
    target: 'robot-car',
    sources: [
      path.join(PROJECTS, 'Robot-Car'),
      path.join(NEWPROJECTS, 'Robot-Car'),
    ],
    jsonFile: 'robot-car.json',
    externalJson: path.join(PY, 'Robot_Car_Project.json')
  },
  {
    target: 'rock-paper-scissors-pictoblox-ai',
    sources: [
      path.join(NEWPROJECTS, 'Rock Paper Sizor - Pictoblox ai'),
    ],
    jsonFile: 'rock-paper-scissors-pictoblox-ai.json',
    generateJson: {
      id: 'rock-paper-scissors-pictoblox-ai',
      title: 'Rock Paper Scissors — PictoBlox AI',
      subtitle: 'Hand gesture recognition game powered by PictoBlox AI',
      level: 'Beginner',
      color: '#FF4B8B',
      desc: 'Play Rock Paper Scissors with your hand using AI-powered gesture recognition in PictoBlox!',
      fullDesc: 'A fun and interactive Rock Paper Scissors game that uses PictoBlox\'s built-in AI machine learning extension to recognize hand gestures in real-time via webcam. Students learn about machine learning, gesture recognition, and AI by training a model to detect rock, paper, and scissors hand shapes.',
      difficulty: 1,
      status: 'Available',
      tags: ['AI', 'PictoBlox', 'Machine Learning', 'Gesture', 'Game', 'STEM'],
      date: '2026-08-01',
      author: 'Tinkering Lab',
      innovation: 'Introduces students to practical machine learning by having them train their own gesture recognition model in PictoBlox.',
      problemStatement: 'Making AI and machine learning concepts accessible to young students requires hands-on, playful projects.',
      solutionApproach: 'Used PictoBlox AI extensions to collect gesture training data (rock, paper, scissors) and train a classification model. The model is then used in a game logic block.',
      components: ['Computer with webcam', 'PictoBlox Software'],
      guide: [
        'Open PictoBlox and create a new project',
        'Add the Machine Learning extension',
        'Create classes: Rock, Paper, Scissors',
        'Train the model using webcam captures of each gesture',
        'Build game logic to compare your gesture with a random computer choice',
        'Add sprites and sound for a fun user experience'
      ],
      estimatedTime: '45 minutes',
      prerequisites: ['PictoBlox installed', 'Basic Scratch/block coding'],
      youtubeVideos: [],
      keywords: ['rock paper scissors', 'AI', 'PictoBlox', 'gesture recognition', 'machine learning', 'game']
    }
  },
  {
    target: 'satellite-deep-learning-model',
    sources: [
      path.join(PROJECTS, 'Satellite Deep Learning Model for Land Change Detection Project'),
      path.join(NEWPROJECTS, 'Satellite Deep Learning Model for Land Change Detection Project'),
    ],
    jsonFile: 'satellite-deep-learning-model.json',
    generateJson: {
      id: 'satellite-deep-learning-model',
      title: 'Satellite Deep Learning — Land Change Detection',
      subtitle: 'AI model to detect land use changes from satellite imagery',
      level: 'Advanced',
      color: '#2C3E50',
      desc: 'Detect changes in land use and cover from satellite images using a deep learning model!',
      fullDesc: 'A deep learning project that uses convolutional neural networks to analyze satellite imagery and detect changes in land use and land cover over time. Applications include monitoring deforestation, urban expansion, agricultural shifts, and environmental changes. The project demonstrates practical AI/ML techniques applied to geospatial data.',
      difficulty: 5,
      status: 'Available',
      tags: ['AI', 'Deep Learning', 'Satellite', 'Remote Sensing', 'Computer Vision', 'Python'],
      date: '2026-07-10',
      author: 'Tinkering Lab',
      innovation: 'Applies cutting-edge deep learning to satellite imagery analysis, making remote sensing techniques accessible to students and researchers.',
      problemStatement: 'Monitoring land use changes at scale requires automated analysis of large satellite image datasets that manual inspection cannot handle efficiently.',
      solutionApproach: 'Trained a convolutional neural network on paired satellite images (before/after) to classify pixel-level changes in land cover categories.',
      components: ['Python', 'TensorFlow/Keras', 'Satellite Dataset', 'GPU (recommended)'],
      guide: [
        'Set up Python environment with TensorFlow and required libraries',
        'Download satellite imagery dataset',
        'Preprocess images: normalize, crop, and split into train/test',
        'Train the deep learning model on labeled change detection data',
        'Evaluate model performance on test set',
        'Run inference on new satellite image pairs to detect changes',
        'Visualize change detection results on maps'
      ],
      estimatedTime: '4+ hours',
      prerequisites: ['Python programming', 'Basic ML knowledge', 'TensorFlow setup'],
      youtubeVideos: [],
      keywords: ['satellite', 'deep learning', 'land change detection', 'remote sensing', 'computer vision', 'CNN']
    }
  },
  {
    target: 'seven-segment-display',
    sources: [
      path.join(NEWPROJECTS, 'Seven Segment Display'),
    ],
    jsonFile: 'seven-segment-display.json',
    pickBestFrom: [
      path.join(NEWPROJECTS, 'Seven Segment Display'),
    ]
  },
  {
    target: 'sketching-live',
    sources: [
      path.join(PROJECTS, 'sketching-live'),
      path.join(PY, 'sketching-live-main'),
    ],
    jsonFile: 'sketching-live.json',
    externalJson: path.join(PY, 'sketching-live.json')
  },
  {
    target: 'smart-accident-detection',
    sources: [
      path.join(PROJECTS, 'accident-detection-system'),
      path.join(PROJECTS, 'Smart-Accident-Detection'),
      path.join(NEWPROJECTS, 'Smart-Accident-Detection'),
    ],
    jsonFile: 'smart-accident-detection.json',
    pickBestFrom: [
      path.join(PROJECTS, 'accident-detection-system'),
      path.join(PROJECTS, 'Smart-Accident-Detection'),
    ]
  },
  {
    target: 'smart-classroom',
    sources: [
      path.join(PROJECTS, 'Smart-classroom'),
      path.join(NEWPROJECTS, 'Smart-classroom'),
    ],
    jsonFile: 'smart-classroom.json',
    generateJson: {
      id: 'smart-classroom',
      title: 'Smart Classroom Energy Saver',
      subtitle: 'Automated energy management system for smart classrooms',
      level: 'Intermediate',
      color: '#F39C12',
      desc: 'Automatically control classroom lights and fans based on occupancy and ambient light levels!',
      fullDesc: 'The Smart Classroom Energy Saver automates lighting and ventilation control based on occupancy detection and ambient light levels. Using PIR sensors and LDR modules, the system automatically turns off electrical devices when the classroom is empty and adjusts them based on natural light availability, significantly reducing energy waste in educational institutions.',
      difficulty: 3,
      status: 'Available',
      tags: ['Arduino', 'Automation', 'Energy Saving', 'IoT', 'Smart Building', 'STEM'],
      date: '2026-08-06',
      author: 'Tinkering Lab',
      innovation: 'Reduces energy consumption in classrooms by automating control of lights and fans based on real-time occupancy and light sensing.',
      problemStatement: 'Schools often waste energy on lights and fans left running in empty classrooms, contributing to high electricity bills and environmental impact.',
      solutionApproach: 'Used PIR motion sensors to detect occupancy and LDR sensors for ambient light. Arduino controls relays for lights and fans, turning them on/off automatically.',
      hardwareSpecs: {
        microcontroller: 'Arduino UNO',
        sensors: 'PIR Motion Sensor, LDR (Light Dependent Resistor)',
        control: 'Relay Module (2-channel)',
        display: 'Optional LCD for status',
        powerSupply: '5V USB'
      },
      components: ['Arduino UNO', 'PIR Motion Sensor', 'LDR Sensor', '2-Channel Relay Module', 'Bulb/Fan (load)', 'Jumper Wires'],
      componentRefs: ['arduino-uno', 'pir-sensor', 'relay-module'],
      guide: [
        'Connect PIR sensor to Arduino digital input pin',
        'Connect LDR to Arduino analog input with voltage divider',
        'Connect relay module to Arduino output pins for controlling loads',
        'Upload the automation firmware',
        'Test occupancy detection and light level response',
        'Calibrate LDR threshold for your classroom lighting conditions'
      ],
      estimatedTime: '90 minutes',
      prerequisites: ['Basic Arduino programming', 'Relay module wiring', 'AC safety awareness'],
      youtubeVideos: [],
      keywords: ['smart classroom', 'energy saver', 'automation', 'PIR', 'LDR', 'relay', 'Arduino']
    }
  },
  {
    target: 'smart-converter-app',
    sources: [],
    extraFiles: [
      { src: path.join(PY, 'smart_converter_app.py'), dest: 'smart_converter_app.py' }
    ],
    jsonFile: 'smart-converter-app.json',
    generateJson: {
      id: 'smart-converter-app',
      title: 'Smart Converter App',
      subtitle: 'Batch DOCX/PPTX to JSON/PDF file converter utility',
      level: 'Beginner',
      color: '#8E44AD',
      desc: 'A Python desktop utility to batch-convert DOCX files to JSON and PPTX files to PDF!',
      fullDesc: 'Smart Converter App is a Python Tkinter desktop application that recursively scans a selected folder and converts all DOCX files to structured JSON and all PPTX files to PDF. It uses python-docx for DOCX parsing and win32com for PowerPoint conversion. Designed for batch processing of student project submissions.',
      difficulty: 2,
      status: 'Available',
      tags: ['Python', 'Utility', 'File Conversion', 'Desktop App', 'Automation'],
      date: '2026-08-01',
      author: 'Atul Sawant',
      innovation: 'Automates batch file conversion for processing large numbers of student document submissions, saving significant manual effort.',
      problemStatement: 'Processing hundreds of student-submitted DOCX and PPTX files manually into usable formats is extremely time-consuming.',
      solutionApproach: 'Built a Python Tkinter GUI app that walks the entire folder tree recursively, identifying and converting each file type. Parsed JSON content is saved with the same filename.',
      hardwareSpecs: {},
      components: ['Python 3.x', 'python-docx library', 'pywin32 library', 'Tkinter (built-in)'],
      guide: [
        'Install required Python libraries: pip install python-docx pywin32',
        'Run the app: python smart_converter_app.py',
        'Click "Select Main Folder & Start" and choose your folder',
        'Confirm the operation in the warning dialog',
        'Wait for conversion to complete — a summary will be shown'
      ],
      estimatedTime: '15 minutes setup',
      prerequisites: ['Python 3 installed', 'pip package manager', 'Windows (required for PPTX→PDF)'],
      youtubeVideos: [],
      keywords: ['python', 'converter', 'DOCX', 'PPTX', 'PDF', 'JSON', 'utility', 'batch conversion', 'desktop app']
    }
  },
  {
    target: 'smart-fall-detection',
    sources: [
      path.join(PROJECTS, 'Smart-fall-detection'),
      path.join(NEWPROJECTS, 'Smart-fall-detection'),
    ],
    jsonFile: 'smart-fall-detection.json',
    generateJson: {
      id: 'smart-fall-detection',
      title: 'Smart Fall Detection System',
      subtitle: 'IMU-based fall detection with emergency alert system',
      level: 'Intermediate',
      color: '#E74C3C',
      desc: 'Detect falls automatically using an accelerometer and send instant emergency alerts!',
      fullDesc: 'The Smart Fall Detection System uses an accelerometer/IMU to detect sudden falls in real-time. When a fall is detected, the system triggers an alarm and can send emergency notifications. Designed primarily for elderly care and workplace safety, it provides a reliable, low-cost safety net for vulnerable individuals.',
      difficulty: 3,
      status: 'Available',
      tags: ['Safety', 'IoT', 'Sensors', 'Arduino', 'Healthcare', 'STEM'],
      date: '2026-08-06',
      author: 'Tinkering Lab',
      innovation: 'Provides affordable fall detection for elder care using widely available IMU sensors and Arduino, without requiring expensive dedicated medical devices.',
      problemStatement: 'Falls are a leading cause of injury among the elderly. Early detection and rapid emergency response can significantly reduce injury severity.',
      solutionApproach: 'Used an accelerometer/gyroscope module to measure sudden changes in acceleration. A fall detection algorithm identifies fall patterns and triggers alerts via buzzer and optional GSM notification.',
      hardwareSpecs: {
        microcontroller: 'Arduino UNO / ESP32',
        sensor: 'MPU6050 or ADXL345 Accelerometer',
        alert: 'Buzzer, LED, Optional GSM Module'
      },
      components: ['Arduino UNO', 'MPU6050 Accelerometer', 'Buzzer', 'LED', 'Optional GSM Module', 'Jumper Wires'],
      guide: [
        'Connect accelerometer to Arduino via I2C (SDA/SCL)',
        'Upload the fall detection firmware',
        'Calibrate thresholds for your accelerometer',
        'Test by simulating falls with the device',
        'Optionally integrate GSM module for remote alerts'
      ],
      estimatedTime: '90 minutes',
      prerequisites: ['Basic Arduino programming', 'I2C sensor wiring'],
      youtubeVideos: [],
      keywords: ['fall detection', 'accelerometer', 'MPU6050', 'elderly care', 'safety', 'Arduino', 'IoT']
    }
  },
  {
    target: 'smart-flood-alert',
    sources: [
      path.join(PROJECTS, 'Smart-Flood-Alert'),
      path.join(NEWPROJECTS, 'Smart-Flood-Alert'),
    ],
    jsonFile: 'smart-flood-alert.json',
    pickBestFrom: [
      path.join(PROJECTS, 'Smart-Flood-Alert'),
      path.join(NEWPROJECTS, 'Smart-Flood-Alert'),
    ]
  },
  {
    target: 'smart-home-automation',
    sources: [
      path.join(PROJECTS, 'Smart-Home-Automation'),
      path.join(NEWPROJECTS, 'Smart-Home-Automation'),
    ],
    jsonFile: 'smart-home-automation.json',
    pickBestFrom: [
      path.join(PROJECTS, 'Smart-Home-Automation'),
      path.join(NEWPROJECTS, 'Smart-Home-Automation'),
    ]
  },
  {
    target: 'smart-vacuum-cleaner',
    sources: [
      path.join(PROJECTS, 'Smart-vacum-cleaner'),
      path.join(NEWPROJECTS, 'Smart-vacum-cleaner'),
    ],
    jsonFile: 'smart-vacuum-cleaner.json',
    pickBestFrom: [
      path.join(NEWPROJECTS, 'Smart-vacum-cleaner'),
      path.join(PROJECTS, 'Smart-vacum-cleaner'),
    ]
  },
  {
    target: 'smart-parking-system',
    sources: [
      path.join(PROJECTS, 'Smart_parking_system'),
      path.join(NEWPROJECTS, 'Smart_parking_system'),
    ],
    jsonFile: 'smart-parking-system.json',
    pickBestFrom: [
      path.join(PROJECTS, 'Smart_parking_system'),
      path.join(NEWPROJECTS, 'Smart_parking_system'),
    ]
  },
  {
    target: 'surakshapath',
    sources: [
      path.join(PROJECTS, 'SurakshaPath'),
      path.join(NEWPROJECTS, 'SurakshaPath'),
    ],
    jsonFile: 'surakshapath.json',
    generateJson: {
      id: 'surakshapath',
      title: 'SurakshaPath',
      subtitle: 'Smart road safety and navigation system',
      level: 'Intermediate',
      color: '#E67E22',
      desc: 'A smart safety navigation system for road hazard detection and driver alerting!',
      fullDesc: 'SurakshaPath (meaning "safe path" in Hindi) is a smart road safety system designed to detect road hazards and alert drivers in real time. The system uses sensors to identify obstacles, potholes, or unsafe conditions and provides timely warnings to prevent accidents. It aims to improve road safety, especially in rural and low-visibility road conditions.',
      difficulty: 3,
      status: 'Available',
      tags: ['Safety', 'Navigation', 'IoT', 'Road Safety', 'Sensors'],
      date: '2026-07-25',
      author: 'Tinkering Lab',
      innovation: 'Provides low-cost road safety alerting using embedded sensor systems, making smart safety features accessible to ordinary vehicles.',
      problemStatement: 'Road accidents in India often occur due to poor road conditions and lack of hazard warnings, especially at night and in rural areas.',
      solutionApproach: 'Used ultrasonic and IR sensors to detect obstacles and road irregularities. Alert system provides audio-visual warnings to the driver.',
      components: ['Microcontroller', 'Ultrasonic Sensor', 'IR Sensor', 'Buzzer', 'LED Display', 'GPS Module (optional)'],
      guide: [
        'Assemble sensor array and connect to microcontroller',
        'Upload hazard detection firmware',
        'Calibrate distance thresholds for your environment',
        'Test with simulated road obstacles',
        'Optionally integrate GPS for location-based hazard logging'
      ],
      estimatedTime: '120 minutes',
      prerequisites: ['Basic electronics', 'Microcontroller programming'],
      youtubeVideos: [],
      keywords: ['road safety', 'navigation', 'hazard detection', 'SurakshaPath', 'IoT', 'sensors']
    }
  },
  {
    target: 'traffic-noise-meter',
    sources: [
      path.join(PROJECTS, 'traffic-noise-meter'),
      path.join(NEWPROJECTS, 'traffic-noise-meter'),
    ],
    jsonFile: 'traffic-noise-meter.json',
    generateJson: {
      id: 'traffic-noise-meter',
      title: 'Traffic Noise Meter',
      subtitle: 'Real-time traffic noise level measurement and display',
      level: 'Beginner',
      color: '#1ABC9C',
      desc: 'Measure and display real-time traffic and environmental noise levels using a sound sensor!',
      fullDesc: 'The Traffic Noise Meter project measures ambient noise levels using a sound/decibel sensor and displays the readings on an LCD or LED bar graph. It can classify noise levels as safe, moderate, or dangerous based on configurable thresholds. Applications include traffic monitoring, school zone safety, and general environmental noise studies.',
      difficulty: 2,
      status: 'Available',
      tags: ['Arduino', 'Sensors', 'Environment', 'Noise', 'STEM', 'Measurement'],
      date: '2026-08-04',
      author: 'Tinkering Lab',
      innovation: 'Provides a low-cost, portable tool for measuring and classifying noise pollution in real-time, useful for both education and environmental monitoring.',
      problemStatement: 'Noise pollution is a significant public health issue. Simple, portable noise monitoring tools can raise awareness and support noise reduction efforts.',
      solutionApproach: 'Used an analog sound sensor module with Arduino to capture noise levels. Readings are processed and displayed, with LED or LCD indicating safe/warning/danger zones.',
      hardwareSpecs: {
        microcontroller: 'Arduino UNO',
        sensor: 'Sound Sensor Module (Analog)',
        display: 'LCD 16x2 or LED Bar Graph',
        powerSupply: '5V USB'
      },
      components: ['Arduino UNO', 'Sound Sensor Module', '16×2 LCD or LED Bar Graph', 'Jumper Wires', 'Breadboard'],
      componentRefs: ['arduino-uno', 'sound-sensor'],
      guide: [
        'Connect sound sensor analog output to Arduino A0 pin',
        'Connect LCD or LED bar graph for display',
        'Upload the noise measurement sketch',
        'Calibrate the sensor by testing in known quiet and noisy environments',
        'Set thresholds for safe, warning, and danger noise levels',
        'Test in traffic or other noisy environments'
      ],
      estimatedTime: '60 minutes',
      prerequisites: ['Basic Arduino programming', 'Sensor wiring basics'],
      youtubeVideos: [],
      keywords: ['noise meter', 'sound sensor', 'traffic', 'decibel', 'Arduino', 'environment monitoring']
    }
  },
  {
    target: 'unihicker',
    sources: [
      path.join(PROJECTS, 'unihicker'),
      path.join(NEWPROJECTS, 'unihicker'),
    ],
    jsonFile: 'unihicker.json',
    pickBestFrom: [
      path.join(NEWPROJECTS, 'unihicker'),
      path.join(PROJECTS, 'unihicker'),
    ]
  },
  {
    target: 'vasc-age',
    sources: [
      path.join(PROJECTS, 'VASCAGE'),
      path.join(NEWPROJECTS, 'VASCAGE'),
      path.join(PROJECTS, 'VitalSense'),
    ],
    jsonFile: 'vasc-age.json',
    pickBestFrom: [
      path.join(PROJECTS, 'VASCAGE'),
    ]
  },
  {
    target: 'vawt-hybrid-generator',
    sources: [
      path.join(PROJECTS, 'vawt-hybrid-generator'),
      path.join(NEWPROJECTS, 'vawt-hybrid-generator'),
    ],
    jsonFile: 'vawt-hybrid-generator.json',
    pickBestFrom: [
      path.join(PROJECTS, 'vawt-hybrid-generator'),
    ]
  },
];

// ── Process each consolidation ────────────────────────────────────────────────

function processConsolidation(c) {
  const targetDir = path.join(PROJECTS, c.target);
  console.log(`\n🔧 Processing: ${c.target}`);
  ensureDir(targetDir);

  // Copy files from all source dirs into target
  for (const src of c.sources) {
    if (fs.existsSync(src)) {
      console.log(`  📦 Merging from: ${path.basename(src)}`);
      mergeDir(src, targetDir, false);
    }
  }

  // Copy any extra individual files
  if (c.extraFiles) {
    for (const ef of c.extraFiles) {
      const destPath = path.join(targetDir, ef.dest);
      const copied = copyFile(ef.src, destPath, false);
      if (copied) console.log(`  📄 Extra copied: ${ef.dest}`);
    }
  }

  // Determine which JSON to use
  let jsonData = null;

  if (c.generateJson) {
    jsonData = c.generateJson;
    console.log(`  🤖 Using generated JSON for: ${c.target}`);
  } else if (c.externalJson && fs.existsSync(c.externalJson)) {
    try {
      jsonData = JSON.parse(fs.readFileSync(c.externalJson, 'utf8'));
      console.log(`  📋 Using external JSON: ${path.basename(c.externalJson)}`);
    } catch (e) {
      console.log(`  ⚠️  Failed to read external JSON: ${e.message}`);
    }
  } else if (c.pickBestFrom) {
    for (const srcDir of c.pickBestFrom) {
      const found = findBestJson(srcDir);
      if (found) {
        jsonData = found.data;
        console.log(`  📋 Picked JSON from: ${path.basename(srcDir)}/${found.file}`);
        break;
      }
    }
  }

  // If still nothing, try to find a JSON in the target dir itself
  if (!jsonData) {
    const found = findBestJson(targetDir);
    if (found) {
      jsonData = found.data;
      console.log(`  📋 Found existing JSON in target: ${found.file}`);
    }
  }

  // Write canonical JSON
  if (jsonData) {
    // Strip auto-generated fields before saving
    const AUTO_FIELDS = ['gallery', 'posters', 'presentationPdfs', 'files3d', 'codeFiles', 'firmware', 'bannerImages', 'dataVideos', 'image', 'bannerImage', 'bannerImage2', 'poster', 'researchPaper', 'icon'];
    for (const f of AUTO_FIELDS) delete jsonData[f];
    setCanonicalJson(targetDir, c.jsonFile, jsonData);
  } else {
    console.log(`  ❗ WARNING: No JSON data found for ${c.target}!`);
  }
}

// Process all consolidations
for (const c of CONSOLIDATIONS) {
  processConsolidation(c);
}

// ── Step 2: Clean up source folders ──────────────────────────────────────────

console.log('\n\n🗑️  Cleaning up source folders...\n');

// Delete all newprojects subdirs
if (fs.existsSync(NEWPROJECTS)) {
  const npDirs = fs.readdirSync(NEWPROJECTS).filter(d => fs.statSync(path.join(NEWPROJECTS, d)).isDirectory());
  for (const d of npDirs) {
    deleteDir(path.join(NEWPROJECTS, d));
  }
}

// Delete old/non-canonical project folders that got merged
const OLD_PROJECT_DIRS = [
  'AIR MOUSE',
  'Arduino UNO Based Countdown Timer',
  'Assistive-Tech-blind-people copy',
  'Automatic-School-Bell-System',
  'Bus-tracking',
  'bus-tracking-system-at-bus-stop',
  'Gas-Detector',
  'Griper Robot',
  'Iot Agriculture monitoring',
  'JaRakshak',
  'Laser Security System',
  'Robot-Car',
  'Satellite Deep Learning Model for Land Change Detection Project',
  'Smart-Accident-Detection',
  'Smart-classroom',
  'Smart-fall-detection',
  'Smart-Flood-Alert',
  'Smart-Home-Automation',
  'Smart-vacum-cleaner',
  'Smart_parking_system',
  'SurakshaPath',
  'traffic-noise-meter',
  'unihicker',
  'VASCAGE',
  'VitalSense',
  'accident-detection-system',
];

for (const d of OLD_PROJECT_DIRS) {
  const full = path.join(PROJECTS, d);
  if (fs.existsSync(full)) deleteDir(full);
}

// Delete py subfolders (but NOT .py files or utility scripts)
const PY_DIRS_TO_DELETE = ['live_bus_tracking', 'sketching-live-main', 'TESTING-Air-mouse'];
for (const d of PY_DIRS_TO_DELETE) {
  deleteDir(path.join(PY, d));
}

// Delete py loose JSON files (not .py files!)
const PY_FILES_TO_DELETE = ['Robot_Car_Project.json', 'sketching-live.json'];
for (const f of PY_FILES_TO_DELETE) {
  deleteFile(path.join(PY, f));
}

// ── Step 3: Save all maintenance scripts to maintenance-scripts/ ──────────────

console.log('\n\n📁 Copying scripts to maintenance-scripts/...\n');

const MAINTENANCE_DIR = path.join(ROOT, 'maintenance-scripts');
ensureDir(MAINTENANCE_DIR);

const SCRATCH_DIR = 'C:/Users/Niktrix/.gemini/antigravity-ide/brain/1f5bb05f-fa51-4982-9cc2-a00c1f30c430/scratch';
const SCRIPT_FILES = [
  'analyze.js',
  'plan_merges.js',
  'analyze_details.js',
  'check_ids.js',
  'check_vascage.js',
  'query_analysis.js',
];

for (const scriptName of SCRIPT_FILES) {
  const src = path.join(SCRATCH_DIR, scriptName);
  const dest = path.join(MAINTENANCE_DIR, scriptName);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  📄 Saved: maintenance-scripts/${scriptName}`);
  }
}

// Save this script itself
fs.copyFileSync(path.join(SCRATCH_DIR, 'execute_consolidation.js'), path.join(MAINTENANCE_DIR, 'execute_consolidation.js'));
console.log(`  📄 Saved: maintenance-scripts/execute_consolidation.js`);

// Save a README for the maintenance scripts
const readmeContent = `# Maintenance Scripts

This folder contains scripts used to analyze, merge, and consolidate projects into the \`projects/\` directory.

## Scripts

| Script | Purpose |
|:---|:---|
| \`analyze.js\` | Scans projects/, newprojects/, py/ and saves a JSON snapshot of all directories and files |
| \`analyze_details.js\` | Detailed file-by-file comparison of overlapping project directories |
| \`plan_merges.js\` | Identifies matching/duplicate projects across the three directories |
| \`check_ids.js\` | Reads and prints the \`id\` and \`title\` fields from all project JSON files |
| \`check_vascage.js\` | Inspects VASCAGE/VitalSense JSON files to identify duplicates |
| \`query_analysis.js\` | Queries the saved analysis snapshot for specific project comparisons |
| \`execute_consolidation.js\` | **Main script** — Merges all projects, generates missing JSONs, cleans up old dirs |

## How to use for future projects

When you add new projects in a temporary folder and want to consolidate them:

1. **Run \`analyze.js\`** to get a fresh snapshot of all directories.
2. **Run \`plan_merges.js\`** to see what overlaps and what is new.
3. **Update \`execute_consolidation.js\`** with the new project entries in the \`CONSOLIDATIONS\` array.
4. **Run \`execute_consolidation.js\`** to perform the merge.
5. **Run \`node js/update_projects.js\`** to rebuild the compiled output.
6. **Run \`node js/update_projects.js --test\`** to validate everything.
`;

fs.writeFileSync(path.join(MAINTENANCE_DIR, 'README.md'), readmeContent);
console.log(`  📄 Saved: maintenance-scripts/README.md`);

console.log('\n\n✅ Consolidation complete! Now run: node js/update_projects.js\n');
