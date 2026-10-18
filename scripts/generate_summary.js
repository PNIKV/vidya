const fs = require('fs');
const path = require('path');

const projectsData = [
  {
    num: 1,
    title: 'Air Mouse (Gesture-Controlled Virtual Mouse)',
    author: 'Atul Sawant',
    domain: 'Wearables & Human-Computer Interaction (HCI)',
    parha: 'The Air Mouse is an innovative gesture-based human-interface device engineered by Atul Sawant that replaces traditional computer mice. Using an ESP32 microcontroller paired with an MPU6050 6-axis inertial motion sensor, it tracks wrist and hand movements in 3D space and translates them into fluid desktop cursor movement over Bluetooth Low Energy (BLE) or Wi-Fi.',
    p1: 'Student & Core Objective: Atul Sawant designed this project to eliminate physical desk surface constraints and provide touchless, ergonomic cursor control tailored for presentations, interactive smart boards, and accessibility for motor-impaired individuals.',
    p2: 'Technical Implementation: Built using an ESP32 dev board running an embedded BLE HID / Wi-Fi UDP server, an MPU6050 IMU communicating over I2C to read accelerometer and gyroscope values, miniature tactile push buttons for left/right clicks, and a rechargeable LiPo battery system with filtering algorithms for jitter reduction.',
    p3: 'Student Learning & Skills: Atul gained deep competence in I2C protocol communication, 6-DOF IMU pitch/roll/yaw complementary filtering, BLE HID stack programming, embedded power optimization, and wearable mechanical assembly.',
    p4: '3-Month Outcome & Impact: Successfully completed a zero-lag, wearable hand-mounted mouse capable of controlling Windows/Linux desktops from up to 10 meters away, proving a highly practical alternative to commercial wireless presentation remotes.'
  },
  {
    num: 2,
    title: 'Arduino Flight Simulator Controller',
    author: 'Megha Kadam',
    domain: 'Simulations & Embedded Hardware Interfacing',
    parha: 'The Arduino Flight Simulator Controller is a custom multi-axis avionics cockpit console developed by Megha Kadam for flight simulation software like Microsoft Flight Simulator and X-Plane. The system converts analog inputs from dual multi-directional joysticks, rotary potentiometers, and toggles into real-time aeronautical control surfaces including pitch, roll, yaw, throttle, and flap adjustments.',
    p1: 'Student & Core Objective: Megha Kadam undertook this project to build an affordable, custom-tailored flight simulator hardware yoke and throttle quadrant, replacing expensive commercial flight gear with student-engineered hardware.',
    p2: 'Technical Implementation: Utilized an Arduino Uno/Nano communicating via Serial/HID, dual 2-axis analog joysticks, linear slide potentiometers for throttle quadrant control, momentary switches for landing gear and flaps, an LCD readout for trim indicators, and custom Arduino C++ serial-to-vJoy mapping scripts.',
    p3: 'Student Learning & Skills: Megha mastered analog-to-digital signal smoothing, joystick calibration, deadzone management, multi-axis serial parsing, firmware debouncing algorithms, and modular electronic enclosure layout.',
    p4: '3-Month Outcome & Impact: Built a high-precision, sub-millisecond response aeronautical flight controller that seamlessly interfaces with PC simulators, delivering an authentic piloting experience at a fraction of retail simulator hardware costs.'
  },
  {
    num: 3,
    title: 'Arduino UNO Based Industrial Countdown & Process Timer',
    author: 'Sujal Prasad',
    domain: 'Embedded Timing & Industrial Automation',
    parha: 'Developed by Sujal Prasad, this embedded countdown timer delivers millisecond-accurate interval timing for laboratory testing, industrial automation, and exposure control. The device features an intuitive rotary encoder interface, an I2C alphanumeric LCD display, and an electromechanical relay output that activates or cuts external AC/DC machinery precisely upon countdown expiration.',
    p1: 'Student & Core Objective: Sujal Prasad engineered this timer to provide a dependable, fail-safe timing controller for automated cycles, laboratory experiments, and safety interlocks without needing dedicated PC hardware.',
    p2: 'Technical Implementation: Integrated an Arduino UNO, a 16x2 I2C LCD character display, an incremental rotary encoder with integral push switch for intuitive time dial-in, a 5V SPDT relay module with flyback protection diode, and an active acoustic buzzer for alert sequencing.',
    p3: 'Student Learning & Skills: Sujal strengthened skills in hardware interrupt routines for rotary encoder quadrature decoding, non-blocking time-tracking using millis(), I2C bus wiring, electrical relay isolation, and state machine firmware design.',
    p4: '3-Month Outcome & Impact: Created a rugged, reusable timing instrument capable of switching up to 10A industrial loads with 100% timing repeatability, demonstrating practical electronics readiness for industrial process applications.'
  },
  {
    num: 4,
    title: 'Assistive Smart Tech for Visually Impaired Persons',
    author: 'Shaheena Rai',
    domain: 'Assistive HealthTech & Accessibility',
    parha: 'Shaheena Rai developed this wearable assistive navigation device to empower visually impaired individuals to navigate unfamiliar indoor and outdoor environments safely. Using high-frequency ultrasonic ranging and multi-modal sensory feedback, the system detects approaching obstacles at head and waist levels, providing dynamic auditory and tactile alerts based on proximity.',
    p1: 'Student & Core Objective: Shaheena Rai focused on improving the daily mobility, independence, and safety of visually challenged persons by designing an intuitive, lightweight early-warning obstacle detection system.',
    p2: 'Technical Implementation: Designed with an Arduino / ATmega microcontroller, dual HC-SR04 ultrasonic echo sensors, a discrete haptic vibration motor array, a variable-pitch active buzzer, and a rechargeable 5V power management bank enclosed in an ergonomic wearable form factor.',
    p3: 'Student Learning & Skills: Shaheena acquired essential expertise in time-of-flight acoustic wave propagation, obstacle distance calculation algorithms, ergonomic wearable product prototyping, multi-sensory human feedback design, and low-power circuit design.',
    p4: '3-Month Outcome & Impact: Achieved a robust, field-tested obstacle alert wearable with a 2cm to 400cm sensing span and sub-50ms alert latency, significantly enhancing spatial awareness and navigation confidence for visually impaired users.'
  },
  {
    num: 5,
    title: 'Automatic School Bell & Public Announcement System',
    author: 'Tinkering Lab Innovation Team',
    domain: 'Campus Automation & Embedded Scheduling',
    parha: 'This automated campus schedule controller was built to eliminate manual bell ringing and streamline daily educational routines. Equipped with an accurate Real-Time Clock (RTC) module and an integrated voice/audio announcement synthesizer, the system rings period bells on pre-programmed timetables and broadcasts synthesized audio notices across school sound systems.',
    p1: 'Student & Core Objective: The student team engineered a zero-maintenance, automated scheduling hub to eliminate timing inaccuracies and reduce administrative workload in schools and academic institutions.',
    p2: 'Technical Implementation: Built using an Arduino microcontroller, a high-precision DS3231 I2C RTC with battery backup, an electromechanical high-amperage relay to actuate school gongs, a DFPlayer Mini MP3 audio module with microSD storage for announcements, and an I2C 16x2 LCD status display.',
    p3: 'Student Learning & Skills: The team learned I2C RTC register reading, automated schedule parsing from EEPROM, audio signal amplification, relay coil EMF suppression, and designing intuitive user override push-button controls.',
    p4: '3-Month Outcome & Impact: Deployed a reliable scheduling unit running continuous 24/7 cycles without clock drift, ensuring zero missed bells, automatic weekend mute, and scheduled audio announcements for school operations.'
  },
  {
    num: 6,
    title: 'IoT Real-Time Smart Bus Tracking System',
    author: 'Shraddha Malve',
    domain: 'IoT, Telematics & Transit Safety',
    parha: 'Shraddha Malve designed and implemented an intelligent telematics bus tracking system for public transit and school fleet monitoring. Combining GPS satellite localization with cellular/Wi-Fi telemetry, the hardware unit continuously transmits vehicle coordinates, velocity, and transit status to a live web monitoring dashboard for parents and transit operators.',
    p1: 'Student & Core Objective: Shraddha Malve developed this system to address commuter uncertainty, enhance student passenger safety, and enable real-time fleet visibility for transport coordinators.',
    p2: 'Technical Implementation: Implemented using an ESP8266/ESP32 controller interfaced with a NEO-6M GPS satellite receiver module (NMEA sentence parser over UART), Wi-Fi/GSM HTTP telemetry uplink, and an interactive cloud mapping dashboard featuring dynamic vehicle pins.',
    p3: 'Student Learning & Skills: Shraddha developed skills in NMEA GPS sentence decoding (GPRMC/GPGGA), UART serial stream buffering, cloud REST API / MQTT data publishing, geolocation calculations, and vehicular power regulation.',
    p4: '3-Month Outcome & Impact: Delivered a functional telematics transponder that tracks vehicle location with 2.5-meter GPS accuracy and updates live coordinates every 5 seconds, providing an affordable fleet monitoring solution.'
  },
  {
    num: 7,
    title: 'Crab Robot 8-DOF Biomimetic Multi-Terrain Explorer',
    author: 'Nikhil Patil',
    domain: 'Biomimetic Robotics & Kinematics',
    parha: 'The Crab Robot 8-DOF Biomimetic Explorer is an advanced multi-legged walking platform built by Nikhil Patil that replicates biological crustacean locomotion. Powered by eight coordinated micro-servos and an on-board robotic controller, the hexapod/crab robot negotiates uneven, rocky terrain that conventional wheeled rovers cannot traverse.',
    p1: 'Student & Core Objective: Nikhil Patil engineered this biomimetic quadruped/hexapod platform to explore multi-legged gait kinematics for search-and-rescue, exploration, and rugged surveillance tasks.',
    p2: 'Technical Implementation: Fabricated with a custom 3D-printed lightweight chassis, 8x SG90/MG90S metal-gear servos configured for 2 degrees-of-freedom per leg, an Arduino/ESP32 master controller, an I2C 16-channel PCA9685 PWM servo driver, and wireless Bluetooth/IR remote motion command scripting.',
    p3: 'Student Learning & Skills: Nikhil mastered inverse kinematics, trigonometric leg trajectory planning, coordinated gait sequencing (wave gait, ripple gait), high-current power distribution (separate 5V 3A rail), and 3D CAD mechanical tolerancing.',
    p4: '3-Month Outcome & Impact: Developed a stable, agile multi-legged mobile robot capable of omnidirectional crawling, obstacle scaling, and zero-radius turning, demonstrating advanced mechanics and kinematics in 3 months.'
  },
  {
    num: 8,
    title: 'Smart Food Spoilage & Freshness Detection System',
    author: 'Anushka Hankare',
    domain: 'Food Safety & Bio-Chemical Sensing',
    parha: 'Engineered by Anushka Hankare, this smart bio-chemical food inspection device detects volatile organic compounds (VOCs), ammonia, and temperature-humidity spikes associated with food decay. Designed for pantries, cold-storage warehouses, and household kitchens, it provides real-time warnings before spoiled food causes health hazards or food waste.',
    p1: 'Student & Core Objective: Anushka Hankare aimed to prevent food poisoning and reduce commercial food waste by creating an automated, non-destructive freshness assessment system for perishable produce and meat.',
    p2: 'Technical Implementation: Built around an Arduino UNO, an MQ-135 electrochemical air quality gas sensor calibrated for ammonia, methane, and sulfides, a DHT11 environmental temperature/humidity sensor, a 16x2 LCD status display, and multi-color indicator LEDs with alert buzzer.',
    p3: 'Student Learning & Skills: Anushka gained expertise in electrochemical gas sensor preheating and baseline calibration, analog voltage-to-PPM conversion, threshold classification logic for organic decomposition, and embedded display interfacing.',
    p4: '3-Month Outcome & Impact: Produced a sensitive food safety monitor that classifies food conditions as Fresh, Consume Soon, or Spoiled with over 90% qualitative reliability, demonstrating clear utility for cold chain monitoring.'
  },
  {
    num: 9,
    title: 'Smart Hazardous Gas Leakage Detector & Safety Shut-Off',
    author: 'Tinkering Lab Innovation Team',
    domain: 'Industrial & Domestic Safety Systems',
    parha: 'This smart gas detection system continuously samples ambient air for liquefied petroleum gas (LPG), propane, methane, and smoke. Upon detecting gas concentrations exceeding safety limits, the system triggers loud acoustic alarms, illuminates emergency beacons, displays exact gas concentrations, and can actuate a cutoff valve to avert catastrophic fire hazards.',
    p1: 'Student & Core Objective: The student team set out to minimize residential cylinder leaks and industrial gas hazards through rapid-response gas detection and autonomous safety mitigation.',
    p2: 'Technical Implementation: Utilized an Arduino/ESP8266 controller, an MQ-2 / MQ-6 semiconductor combustible gas sensor, an active buzzer alarm, an I2C 16x2 LCD showing real-time PPM gas density, and a relay output designed to drive an emergency exhaust fan or solenoid shut-off valve.',
    p3: 'Student Learning & Skills: Students learned semiconductor gas sensor heating characteristics, logarithmic curve fitting for gas concentration calculations, analog threshold hysteresis to prevent false alarms, and safety-critical relay isolation.',
    p4: '3-Month Outcome & Impact: Created an autonomous safety station with a sub-2 second gas detection response time, providing crucial early warning to protect households, kitchens, and laboratories from gas explosions.'
  },
  {
    num: 10,
    title: 'Pick-and-Place Robotic Gripper Arm with PictoBlox AI',
    author: 'Dipavalee Sudrik',
    domain: 'Robotic Manipulation & Visual Automation',
    parha: 'Dipavalee Sudrik developed this intelligent robotic manipulator arm capable of automated sorting and pick-and-place tasks. Interfacing physical servo-actuated claws with PictoBlox visual block-programming and computer vision, the gripper identifies objects based on color, geometry, or QR markers and executes targeted pick-and-place routines.',
    p1: 'Student & Core Objective: Dipavalee Sudrik created an educational yet capable robotic arm workcell to demonstrate automated material handling and robotic manipulation for small-scale sorting lines.',
    p2: 'Technical Implementation: Built using an Arduino board, a laser-cut / 3D-printed multi-joint mechanical arm with an end-effector claw, micro servos for base rotation and claw grip, integrated with PictoBlox AI vision software via serial link.',
    p3: 'Student Learning & Skills: Dipavalee mastered robotic kinematics, servo PWM angle modulation, visual block programming, camera-to-workspace spatial coordination, and mechanical torque balancing.',
    p4: '3-Month Outcome & Impact: Built a dependable pick-and-place manipulator achieving a 95% successful grasp rate on standard test cubes, validating hands-on robotic automation principles within 3 months.'
  },
  {
    num: 11,
    title: 'IoT Smart Agriculture & Soil Health Monitoring System',
    author: 'Tinkering Lab Innovation Team',
    domain: 'AgriTech & Environmental IoT',
    parha: 'This IoT precision agriculture station measures soil moisture, ambient temperature, relative humidity, and light exposure in real time. Designed to optimize irrigation schedules and conserve water, the unit automatically actuates an irrigation submersible water pump whenever the soil moisture level drops below an agronomic threshold.',
    p1: 'Student & Core Objective: The team aimed to support sustainable farming by preventing crop under/over-watering, reducing agricultural water consumption by up to 40%, and providing live telemetry to farmers.',
    p2: 'Technical Implementation: Implemented with an ESP8266 NodeMCU microcontroller, a capacitive soil moisture sensor, a DHT11 temperature/humidity sensor, an LDR sunlight detector, a 5V relay driving a 12V submersible pump, and cloud IoT telemetry over ThingSpeak / Blynk.',
    p3: 'Student Learning & Skills: Students gained expertise in capacitive vs resistive soil sensor longevity, analog calibration in various soil types, cloud IoT dashboard widgets, automated feedback control loops, and low-power field operation.',
    p4: '3-Month Outcome & Impact: Delivered a field-ready agricultural unit that autonomously waters soil upon drought detection and streams real-time soil health analytics to any smartphone or web browser.'
  },
  {
    num: 12,
    title: 'JalRakshak - Smart Water Quality & Purity Sentinel',
    author: 'Tinkering Lab Innovation Team',
    domain: 'Clean Water Tech & Environmental Health',
    parha: 'JalRakshak is an automated water monitoring sentinel engineered to evaluate drinking water purity and surface water safety. By measuring Total Dissolved Solids (TDS), turbidity (optical suspended matter), and temperature, the system determines potable water classification and flags biological or chemical contamination in real time.',
    p1: 'Student & Core Objective: The student team developed JalRakshak to provide rural communities and public reservoirs with an inexpensive, continuous water quality diagnostic tool to prevent waterborne illnesses.',
    p2: 'Technical Implementation: Built using an Arduino / ESP32 microcontroller, an analog TDS sensor probe, an optical turbidity sensor module (infrared emitter-phototransistor pair), a waterproof DS18B20 1-wire digital temperature probe, and an I2C 16x2 LCD status display.',
    p3: 'Student Learning & Skills: Students mastered analog optical sensing, voltage-to-NTU turbidity calibration, TDS PPM calculation from conductivity, multi-sensor data fusion, and waterproof sensor deployment.',
    p4: '3-Month Outcome & Impact: Completed an operational water diagnostic analyzer that accurately categorizes water samples into Safe Drinking, Moderate Filter Required, or Contaminated, proving its viability for community water tanks.'
  },
  {
    num: 13,
    title: 'Digital Keypad Electronic Security Door Lock',
    author: 'Nayana Patil',
    domain: 'Access Control & Embedded Security',
    parha: 'Nayana Patil developed a digital keypad electronic door access system to modernize residential and locker security. Featuring a 4x4 matrix keypad, EEPROM master passcode storage, an I2C character LCD, and an electromechanical 12V solenoid lock, the device grants access only upon entering the verified cryptographic passcode.',
    p1: 'Student & Core Objective: Nayana Patil aimed to build a keyless, tamper-resistant access security system with reprogrammable passwords and intruder lockout mechanisms for homes and offices.',
    p2: 'Technical Implementation: Engineered with an Arduino Uno, a 4x4 matrix membrane keypad, an I2C 16x2 alphanumeric LCD, an active buzzer for audio-tactile feedback, status indicator LEDs, a TIP120 transistor / relay driver, and a 12V heavy-duty solenoid deadbolt.',
    p3: 'Student Learning & Skills: Nayana acquired skills in matrix row-column keypad scanning, non-volatile EEPROM password storage and retrieval, password obfuscation/hashing logic, brute-force lockouts, and inductive kickback diode protection.',
    p4: '3-Month Outcome & Impact: Successfully deployed a keyless door lock that securely verifies 4-to-8 digit PINs, supports dynamic master PIN changes directly from the keypad, and features automatic penalty timeouts after 3 failed attempts.'
  },
  {
    num: 14,
    title: 'Multi-Beam Laser Perimeter Security & Intrusion Alarm',
    author: 'Anuj Ide, Jay Funde, Naitik Barai, Vyas Gaykar',
    domain: 'Physical Security & Optoelectronics',
    parha: 'This optical perimeter defense network was designed by a student collaborative team to protect high-security perimeters, bank lockers, and restricted areas. Using focused 650nm laser beams reflected across front surface optical mirrors onto LDR sensors, any beam interruption instantly triggers high-decibel sirens and security strobes.',
    p1: 'Student & Core Objective: The team designed a discreet, invisible perimeter boundary to detect unauthorized human intrusion across expansive doorways and industrial premises without expensive thermal cameras.',
    p2: 'Technical Implementation: Built using an Arduino Uno, multiple KY-008 650nm 5mW red laser diode emitters, Light Dependent Resistor (LDR) voltage divider receivers with Schmitt triggers, an active high-decibel siren, status LEDs, and manual alarm reset latching keys.',
    p3: 'Student Learning & Skills: The team learned optical beam alignment, ambient light compensation filtering, voltage divider threshold tuning, latching interrupt software architecture, and multi-sensor spatial perimeter coverage.',
    p4: '3-Month Outcome & Impact: Delivered a responsive security perimeter that detects beam trip events in under 10 milliseconds, completely immune to ambient room lighting, providing robust perimeter fortification.'
  },
  {
    num: 15,
    title: 'LiFi Secure High-Speed Optical Data Transmission Terminal',
    author: 'Nikhil Patil',
    domain: 'Optical Wireless Communications (OWC) & Cybersecurity',
    parha: 'Nikhil Patil built a functioning Light Fidelity (LiFi) optical data communication terminal that transmits digital data through modulated visible light beams. Because light cannot penetrate opaque walls, this system delivers an inherently eavesdrop-proof, RF-radiation-free wireless transmission link ideal for electromagnetic-sensitive environments like hospitals and defense bunkers.',
    p1: 'Student & Core Objective: Nikhil Patil undertook this cutting-edge project to demonstrate light-based data transmission as an ultra-secure alternative to vulnerable radio frequency (Wi-Fi) channels in sensitive installations.',
    p2: 'Technical Implementation: Built with two synchronized microcontrollers (Transmitter & Receiver), a high-brightness LED array driven by high-speed switching transistors, a precision silicon photodiode receiver circuit with transimpedance amplification, and custom serial bit-banging / UART optical modulation firmware.',
    p3: 'Student Learning & Skills: Nikhil mastered visible light modulation techniques, photodiode signal amplification, optical noise filtering (ambient sunlight rejection), digital packet framing, error-checking checksums, and optical alignment.',
    p4: '3-Month Outcome & Impact: Successfully achieved bidirectional text and sensor data transmission across an optical light beam over several meters with zero RF emission, illustrating the future of secure optical wireless communication.'
  },
  {
    num: 16,
    title: 'Smart Automated Healthcare Medicine Dispenser',
    author: 'Nikhil',
    domain: 'Healthcare Automation & Geriatric Care',
    parha: 'Developed by Nikhil, this automated pill dispenser ensures that elderly and chronic patients take prescribed medications strictly on time. Equipped with an accurate real-time clock, servo-controlled rotary pill compartments, visual LCD reminders, and an audible chime, the system dispenses the exact dosage into a medicine tray at programmed hours.',
    p1: 'Student & Core Objective: Nikhil engineered this device to combat medication non-adherence and accidental overdose among elderly patients living independently or in assisted care facilities.',
    p2: 'Technical Implementation: Engineered with an Arduino microcontroller, a DS3231 high-precision RTC module, an SG90 servo motor rotating a compartmentalized pill carrousel, an I2C 16x2 LCD displaying patient instructions, an active reminder buzzer, and an acknowledgment pushbutton.',
    p3: 'Student Learning & Skills: Nikhil strengthened proficiency in RTC scheduling algorithms, servo angle precision mapping, user acknowledgment state machines, mechanical pill dispenser design, and patient safety ergonomics.',
    p4: '3-Month Outcome & Impact: Created an automated pill station that reliably dispenses medication doses at predefined daily schedules and persists alarm notifications until patient physical acknowledgment is received.'
  },
  {
    num: 17,
    title: 'ESP32-CAM Smart Motion Detection & Live Surveillance Dashboard',
    author: 'Alok & Tinkering Lab Team',
    domain: 'Edge AI, Computer Vision & Web Surveillance',
    parha: 'This compact IoT surveillance node incorporates an AI-Thinker ESP32-CAM module running an embedded HTTP MJPEG video streaming server and automated frame-difference motion detection. When an intruder enters the visual frame, the camera triggers on-board high-intensity flash illumination and pushes instant alerts to a browser dashboard.',
    p1: 'Student & Core Objective: Alok and team developed a self-contained, low-cost wireless surveillance camera capable of operating standalone over Wi-Fi or Access Point mode with real-time motion detection.',
    p2: 'Technical Implementation: Built using an AI-Thinker ESP32-CAM with OV2640 lens, huge app partition configuration with PSRAM acceleration, an embedded HTML5 responsive dashboard, a pixel-difference luminance motion detection algorithm, and dual-port web streaming (Port 80 control, Port 81 video).',
    p3: 'Student Learning & Skills: The team mastered ESP32 memory management with PSRAM, MJPEG frame buffer streaming, frame-differencing pixel comparison algorithms, Wi-Fi SoftAP fallback networking, and responsive web UI integration.',
    p4: '3-Month Outcome & Impact: Delivered a plug-and-play wireless security camera that streams high-framerate VGA video over Wi-Fi and autonomously detects intrusions within 300ms, operating without requiring expensive NVR equipment.'
  },
  {
    num: 18,
    title: 'RFID Smart Attendance & Contactless Identification System',
    author: 'Nikhil Patil',
    domain: 'Smart Campus & Contactless Identification',
    parha: 'Nikhil Patil engineered an automated contactless RFID attendance logging terminal for classrooms and corporate workspaces. By tapping an encrypted 13.56 MHz RFID card or key fob, the system authenticates the individual in under 200 milliseconds, displays a personalized greeting on an LCD screen, and logs timestamps into persistent memory.',
    p1: 'Student & Core Objective: Nikhil Patil developed this system to eradicate time-consuming paper roll calls and proxy attendance by automating identification through encrypted radio-frequency smart cards.',
    p2: 'Technical Implementation: Implemented with an Arduino / ESP32 microcontroller, an RC522 13.56MHz RFID reader module operating over SPI, an I2C 16x2 LCD display, multi-tone buzzer signaling, status LEDs, and local EEPROM / serial transaction logging.',
    p3: 'Student Learning & Skills: Nikhil mastered SPI bus communication, RFID transponder UID reading and memory block authentication, anti-collision card protocols, database array mapping, and duplicate-scan prevention algorithms.',
    p4: '3-Month Outcome & Impact: Delivered a rapid contactless terminal that logs attendee presence in less than 200ms with 100% card read accuracy, ready for turnkey installation in school classrooms and maker labs.'
  },
  {
    num: 19,
    title: 'Wireless Multi-Mode Autonomous Obstacle-Avoiding Robot Car',
    author: 'Atul Sawant',
    domain: 'Autonomous Vehicles & Mobile Robotics',
    parha: 'Built by Atul Sawant, this robotic rover operates in both autonomous self-driving mode and wireless remote-controlled mode. Utilizing an ultrasonic sensor mounted on a scanning micro-servo, the rover dynamically maps spatial clearances, predicts collisions, and executes steering maneuvers to navigate complex obstacle-filled courses.',
    p1: 'Student & Core Objective: Atul Sawant designed this smart rover to understand mobile robot kinematics, spatial obstacle navigation algorithms, and multi-channel motor driving dynamics.',
    p2: 'Technical Implementation: Built with an ESP32 / Arduino controller, an L298N dual H-bridge motor driver, 4x TT DC geared motors with high-grip rubber wheels, an HC-SR04 ultrasonic sensor mounted on an SG90 servo pan unit, and a high-discharge 7.4V Li-ion battery pack.',
    p3: 'Student Learning & Skills: Atul mastered H-bridge pulse-width modulation (PWM) speed regulation, servo-swept spatial ranging, collision avoidance state machines (look-left, look-right, choose-clearest-path), and high-current power isolation.',
    p4: '3-Month Outcome & Impact: Successfully built a 4-wheel drive autonomous rover that navigates indoor labyrinths without collision, achieving seamless switching between autonomous roaming and Bluetooth smartphone driving.'
  },
  {
    num: 20,
    title: 'Rock Paper Scissors Hand-Gesture AI with PictoBlox',
    author: 'Tinkering Lab Innovation Team',
    domain: 'Artificial Intelligence & Machine Vision',
    parha: 'This interactive AI gaming station utilizes webcams and computer vision hand-pose landmark models inside PictoBlox to play Rock-Paper-Scissors against humans in real time. The neural network detects 21 distinct hand landmarks, classifies gestures (Rock, Paper, Scissors), and pits the user against an AI opponent with dynamic on-screen scoring.',
    p1: 'Student & Core Objective: The student team created an engaging game showcase to demystify artificial intelligence, computer vision, and neural network gesture classification for young innovators.',
    p2: 'Technical Implementation: Built using a high-definition video camera, PictoBlox AI Vision extension with MediaPipe hand tracking architecture, dynamic sprite animations, audio score synthesizers, and real-time landmark coordinates computation.',
    p3: 'Student Learning & Skills: Students learned key concepts of machine learning training data, 2D hand landmark coordinate vectors, gesture confidence thresholds, real-time visual classification, and interactive game loop design.',
    p4: '3-Month Outcome & Impact: Created an instant-response AI game that accurately detects gestures with over 95% accuracy in varying lighting conditions, serving as a flagship demonstration of accessible edge AI.'
  },
  {
    num: 21,
    title: 'Satellite Deep Learning for Multi-Temporal Land Change Detection',
    author: 'Tinkering Lab AI Team',
    domain: 'Deep Learning, Remote Sensing & Earth Observation',
    parha: 'The Satellite Deep Learning model is an advanced computational vision project that analyzes multispectral satellite imagery over temporal intervals to detect deforestation, urban sprawl, and water body depletion. Using convolutional neural networks, the system highlights geographical changes to aid environmental conservation and urban planning.',
    p1: 'Student & Core Objective: The AI team aimed to automate remote sensing analysis to detect environmental degradation and deforestation rapidly using deep learning algorithms rather than manual satellite surveying.',
    p2: 'Technical Implementation: Built with Python 3.10+, PyTorch/TensorFlow, OpenCV, and GIS satellite datasets; employs convolutional encoder-decoder neural network architectures (U-Net style) to generate binary change masks from co-registered satellite image pairs.',
    p3: 'Student Learning & Skills: Students learned convolutional neural network design, multispectral image pre-processing (normalization, band stacking, data augmentation), IoU and F1-score evaluation metrics, and GPU batch training.',
    p4: '3-Month Outcome & Impact: Trained a deep learning model achieving over 88% Mean IoU in identifying geographical terrain changes, showing the remarkable potential of student-driven AI for climate and urban monitoring.'
  },
  {
    num: 22,
    title: 'Direct Multi-Pin 7-Segment Display Controller with Arduino',
    author: 'Sujal Prasad',
    domain: 'Digital Logic & Foundational Embedded Electronics',
    parha: 'Sujal Prasad engineered an educational digital display interfacing module that controls a common cathode 7-segment LED display directly using discrete digital GPIO pins. Demonstrating low-level binary bit-masking and multiplexing, the circuit displays decimal numerals 0 through 9 with precision timing cycles.',
    p1: 'Student & Core Objective: Sujal Prasad undertook this project to master foundational digital electronics, understanding how low-level microcontroller pins actuate multi-segment LED optoelectronics without high-level libraries.',
    p2: 'Technical Implementation: Built with an Arduino Uno, a single common cathode 7-segment display, 7x 220-ohm current-limiting resistors, breadboard interconnects, and an optimized C++ program mapping segment bytes via bitwise shift operations.',
    p3: 'Student Learning & Skills: Sujal gained a concrete understanding of LED forward voltage, Ohm’s law resistor sizing, common cathode vs anode topologies, binary truth tables for 7 segments (a-g), and GPIO port manipulation.',
    p4: '3-Month Outcome & Impact: Built a clear, robust educational module that showcases low-level microcontroller fundamentals, serving as the basis for digital clocks, counters, and industrial numeric readouts.'
  },
  {
    num: 23,
    title: 'Sketching Live - Physical TFT Drawing Terminal via Web Serial',
    author: 'Amogha',
    domain: 'Web-to-Hardware Interfacing & Graphics Terminals',
    parha: 'Developed by Amogha, Sketching Live bridges modern web browsers directly with physical embedded display hardware. A user sketches, doodles, or types on an HTML5 web canvas, and the vector graphics are streamed in real time over the browser Web Serial API to an ESP32, rendering synchronously on a physical 3.5-inch color TFT screen.',
    p1: 'Student & Core Objective: Amogha designed this project to pioneer web-to-microcontroller graphics communication without intermediary cloud servers, enabling instant physical visualization of digital artwork.',
    p2: 'Technical Implementation: Programmed with an ESP32 microcontroller, a 3.5-inch ILI9488 480x320 SPI color TFT display with Adafruit GFX library, an HTML5 browser canvas application utilizing the Web Serial API at 115200 baud, and a compact serial packet coordinate protocol.',
    p3: 'Student Learning & Skills: Amogha mastered high-speed SPI display buffering, color conversion (RGB888 to 16-bit RGB565), Web Serial API handshakes in JavaScript, streaming binary coordinate parsing, and display rendering optimization.',
    p4: '3-Month Outcome & Impact: Created an interactive live sketching system with virtually zero visual latency (<30ms), allowing users to draw on any computer screen and watch it appear physically on hardware instantly.'
  },
  {
    num: 24,
    title: 'Smart Precision Distance Tracker with Laser Aiming & OLED',
    author: 'Nikhil Patil',
    domain: 'Metrology & Optical Distance Measurement',
    parha: 'Nikhil Patil developed a handheld precision laser measuring instrument that delivers millimeter-level distance telemetry. Featuring an optical Time-of-Flight (ToF) sensor paired with a 650nm red targeting laser and an I2C OLED screen, the device measures room dimensions, liquid depths, and equipment clearances instantly at the press of a button.',
    p1: 'Student & Core Objective: Nikhil Patil aimed to replace awkward physical tape measures with a high-accuracy, digital optical distance measurement tool for construction, architecture, and interior design.',
    p2: 'Technical Implementation: Built using a Wemos D1 Mini (ESP8266), a VL53L0X optical Time-of-Flight sensor module (photonic light reflection measurement), a KY-008 red laser diode for visual targeting, a 1.3-inch SH1106 128x64 I2C OLED display, and a momentary measurement trigger.',
    p3: 'Student Learning & Skills: Nikhil acquired expertise in photonic Time-of-Flight laser physics, I2C bus device multiplexing, OLED graphical dashboard drawing, moving average measurement filtering, and handheld battery casing design.',
    p4: '3-Month Outcome & Impact: Built a pocket-sized laser distance tool with 1mm resolution and a 2-meter indoor range, displaying instant measurements on a crystal-clear OLED display with simple one-click operation.'
  },
  {
    num: 25,
    title: 'Smart Road Accident Detection & Emergency SOS Alert System',
    author: 'Uran Rasal',
    domain: 'Vehicular Safety & Telematics IoT',
    parha: 'Uran Rasal developed an automated vehicular crash detection and rescue alerting unit. Utilizing an MPU6050 6-axis accelerometer/gyroscope, the system detects sudden high-G impacts or vehicle rollovers, starts a cancellation grace timer for false alarms, and automatically pushes emergency SOS alerts with vehicle status to emergency services.',
    p1: 'Student & Core Objective: Uran Rasal engineered this system to tackle the critical "golden hour" in vehicular accidents, ensuring instant notification of medical personnel even if the driver is unconscious.',
    p2: 'Technical Implementation: Built with an ESP8266 NodeMCU, an MPU6050 6-DOF inertial sensor, an emergency cancellation push button, an active audio warning buzzer, status LEDs, and Wi-Fi / cellular emergency alert webhook integration.',
    p3: 'Student Learning & Skills: Uran mastered G-force threshold calculation, angular rollover detection using gyroscopic integration, false-alarm mitigation using countdown state machines, and emergency cloud webhook triggers.',
    p4: '3-Month Outcome & Impact: Successfully completed a vehicular crash alert device that detects collisions (>3.5G impact or >60-degree tilt) and automatically triggers emergency notifications within 10 seconds unless manually cancelled.'
  },
  {
    num: 26,
    title: 'Smart Classroom Automated Energy Saver System',
    author: 'Tinkering Lab Innovation Team',
    domain: 'Building Automation & Green Energy Conservation',
    parha: 'This smart energy manager automatically controls classroom illumination and ventilation based on real-time human occupancy and ambient daylight. Using passive infrared motion detectors and photocell ambient light sensors, the system ensures that lights and fans operate only when students are present and daylight is insufficient.',
    p1: 'Student & Core Objective: The team tackled institutional electricity wastage, designing an automated power manager capable of cutting school lighting and fan power consumption by up to 35%.',
    p2: 'Technical Implementation: Built around an Arduino Uno, an HC-SR501 PIR motion sensor with Fresnel lens, an LDR ambient lux sensing module, an optically isolated 5V 2-channel AC relay module, and a 16x2 I2C LCD displaying room occupancy status and power savings.',
    p3: 'Student Learning & Skills: Students mastered optical PIR thermal detection physics, lux threshold calibration, relay inductive load isolation, software occupancy debounce timers (preventing flickering when students sit still), and energy metering.',
    p4: '3-Month Outcome & Impact: Successfully deployed a classroom automation station that turns off idle appliances after 5 minutes of vacancy and keeps lights off on sunny days, demonstrating proven energy savings.'
  },
  {
    num: 27,
    title: 'Smart Desktop File Automation & Format Converter Utility',
    author: 'Atul Sawant',
    domain: 'Software Engineering & Desktop Productivity',
    parha: 'Developed by Atul Sawant, this Python desktop utility automates routine administrative office tasks. Featuring an intuitive Tkinter graphical interface, the tool executes batch conversions of Microsoft Word DOCX files into structured JSON schemas and converts PowerPoint presentations directly into high-fidelity PDFs using native Windows Office APIs.',
    p1: 'Student & Core Objective: Atul Sawant built this software utility to eliminate tedious manual file exports, saving hours of administrative time when archiving educational curricula and slides.',
    p2: 'Technical Implementation: Written in Python 3 utilizing the Tkinter GUI toolkit, the python-docx library for Word XML document object parsing, and the pywin32 Windows COM automation API for programmatic PowerPoint-to-PDF rendering.',
    p3: 'Student Learning & Skills: Atul gained proficiency in Python GUI design, asynchronous file thread handling, Windows COM automation interfaces, XML document node extraction, and error-resilient batch processing.',
    p4: '3-Month Outcome & Impact: Built a lightweight, standalone desktop utility that converts hundreds of DOCX and PPTX files in seconds, currently streamlining document digitization workflows for lab projects.'
  },
  {
    num: 28,
    title: 'Smart Fall Detection & Emergency Assistance for Elderly Care',
    author: 'Tinkering Lab Innovation Team',
    domain: 'Healthcare IoT & Wearable Safety',
    parha: 'This wearable elderly safety device automatically identifies sudden physical falls using an inertial measurement unit. By analyzing velocity vectors and abrupt impact shock waves followed by prolonged inactivity, the device immediately initiates loud acoustic alerts and broadcasts emergency distress notifications to caregivers.',
    p1: 'Student & Core Objective: The student team created an unobtrusive fall monitor to protect elderly individuals who live alone, ensuring rapid medical intervention following debilitating slips or falls.',
    p2: 'Technical Implementation: Built with an ESP32 / ESP8266 NodeMCU, an MPU6050 3-axis accelerometer and gyroscope, a loud active emergency buzzer, an illuminated emergency cancel button, and an automated cloud notification client.',
    p3: 'Student Learning & Skills: The team gained skills in root-sum-square (RSS) acceleration magnitude calculation, multi-stage fall detection algorithms (freefall -> impact shock -> orientation change), and battery life conservation.',
    p4: '3-Month Outcome & Impact: Developed an operational wearable prototype that detects rapid falls with high specificity, providing a 15-second grace period for the user to cancel accidental alerts before notifying caregivers.'
  },
  {
    num: 29,
    title: 'Smart Bridge Flood Alert & Automated Barrier System',
    author: 'Anjum Shaikh',
    domain: 'Disaster Management & Civic Infrastructure',
    parha: 'Anjum Shaikh engineered this disaster-resilience infrastructure model to prevent vehicles from crossing submerged river bridges during monsoons. By continuously measuring river water levels beneath the bridge, the system automatically drops mechanical boom barriers and activates flashing warning strobes when floodwaters approach danger levels.',
    p1: 'Student & Core Objective: Anjum Shaikh developed this critical civil safety system to prevent tragic drowning incidents caused by vehicles attempting to cross flooded, low-lying bridges during flash floods.',
    p2: 'Technical Implementation: Designed with an Arduino Uno, a submersible water level depth sensor / ultrasonic river probe, an SG90 servo motor driving a physical boom barrier gate, red and green traffic indicators, and a high-pitch warning siren.',
    p3: 'Student Learning & Skills: Anjum mastered analog depth sensor voltage mapping, servo torque transmission for boom barriers, multi-tier flood threshold logic (Normal -> Warning -> Danger Closure), and fail-safe civic automation.',
    p4: '3-Month Outcome & Impact: Built a working scale model that automatically lowers barriers and blocks road traffic within 1 second of water breaching the danger mark, offering an essential template for civic flood safety.'
  },
  {
    num: 30,
    title: 'Smart Home Automation with Arduino & Infrared Remote Control',
    author: 'Dipavalee Sudrik',
    domain: 'Smart Home IoT & Consumer Electronics',
    parha: 'Dipavalee Sudrik developed this home automation hub that allows users to wirelessly switch household electrical appliances (lights, fans, appliances) using any universal infrared remote control. Integrating an IR demodulator with an optically isolated relay module, the system upgrades standard room wiring into a smart, accessible home.',
    p1: 'Student & Core Objective: Dipavalee Sudrik engineered this system to make household appliance control effortless and accessible, especially for elderly individuals and people with physical mobility limitations.',
    p2: 'Technical Implementation: Built with an Arduino Uno, a TSOP1738 / VS1838B 38kHz infrared receiver, a 21-key handheld IR remote control, an optically isolated 5V relay module with AC terminals, and status diagnostic LEDs.',
    p3: 'Student Learning & Skills: Dipavalee mastered 38kHz infrared carrier frequency demodulation, NEC protocol hexadecimal command decoding, relay switching safety with mains 230V AC isolation, and state toggle programming.',
    p4: '3-Month Outcome & Impact: Built an efficient, low-cost home automation circuit that controls AC lights and fans from across a room with zero delay, providing an affordable alternative to costly commercial smart plugs.'
  },
  {
    num: 31,
    title: 'Smart Automated Multi-Slot Parking Management System',
    author: 'Shruti Doke',
    domain: 'Smart Cities & Automated Infrastructure',
    parha: 'Shruti Doke designed an automated multi-bay smart parking management system that eliminates the frustration of searching for open parking spots. Equipped with infrared sensors at every parking bay and at the entry/exit gates, the system dynamically counts open bays, displays real-time availability on an LCD screen, and operates an automated servo boom barrier.',
    p1: 'Student & Core Objective: Shruti Doke aimed to reduce traffic congestion and fuel waste in commercial parking garages by providing drivers with immediate slot availability and automated gate entry.',
    p2: 'Technical Implementation: Built using an Arduino Uno, 6x TCRT5000 / LM393 infrared obstacle sensors stationed at parking bays and entry/exit gates, an SG90 micro-servo boom barrier, and an I2C 16x2 LCD status display.',
    p3: 'Student Learning & Skills: Shruti mastered multi-sensor array management, digital debounce filtering, real-time increment/decrement capacity tracking, gate interlock logic, and traffic flow state machine programming.',
    p4: '3-Month Outcome & Impact: Delivered a complete parking gate prototype that accurately tracks parking occupancy, prevents gate entry when the lot is full, and shows live open-slot counts with zero tracking errors.'
  },
  {
    num: 32,
    title: 'Smart Autonomous Robotic Vacuum Cleaner',
    author: 'Umeshwari Baviskar',
    domain: 'Service Robotics & Mechatronics',
    parha: 'Umeshwari Baviskar developed an autonomous robotic vacuum cleaner designed for smart home floor sanitization. Powered by an ESP8266 microcontroller, dual geared drive motors, and a high-speed centrifugal vacuum suction fan actuated via relay, the robot roams across floors picking up dust and debris while avoiding furniture and walls.',
    p1: 'Student & Core Objective: Umeshwari Baviskar set out to build an accessible, cost-effective domestic cleaning robot capable of autonomous floor sweeping and vacuuming without expensive LIDAR systems.',
    p2: 'Technical Implementation: Built with an ESP8266 NodeMCU, an L298N H-bridge motor driver, 2x geared DC drive wheels with omnidirectional caster, a 12V high-RPM DC suction impeller fan, a 5V relay switch, and ultrasonic obstacle sensors.',
    p3: 'Student Learning & Skills: Umeshwari developed expertise in robotic mechatronics, aerodynamic suction duct design, motor torque selection, H-bridge directional steering, and autonomous bounce-and-turn navigation logic.',
    p4: '3-Month Outcome & Impact: Successfully completed an autonomous cleaning robot that sweeps floor dust into an onboard collection bin while navigating around obstacles, achieving commercial robot functionality at a fraction of the cost.'
  },
  {
    num: 33,
    title: 'SurakshaPath - Intelligent Road Hazard & Pothole Navigation System',
    author: 'Tinkering Lab Innovation Team',
    domain: 'Smart Transportation & Road Safety Tech',
    parha: 'SurakshaPath is a vehicular safety and road diagnostic system that scans the road surface ahead for potholes, sudden dips, and speed breakers. By mounting downward-facing distance sensors and optical terrain probes onto vehicles, it gives drivers advance warning of dangerous road hazards, preventing vehicle damage and accidents.',
    p1: 'Student & Core Objective: The student team created SurakshaPath to curb vehicle damage and reduce road accidents caused by unmapped potholes and uneven road obstacles on poorly lit roads.',
    p2: 'Technical Implementation: Built with an Arduino / ESP32 controller, an HC-SR04 ultrasonic road-profiling sensor, a TCRT5000 infrared road-surface scanner, an active warning buzzer, an I2C 16x2 LCD, and status warning indicators.',
    p3: 'Student Learning & Skills: Students mastered ultrasonic time-of-flight acoustic profiling over moving surfaces, analog threshold differentiation between flat tarmac and road pits, alert buzzer frequency modulation, and vehicular vibration shielding.',
    p4: '3-Month Outcome & Impact: Built an operational vehicular early-warning unit that reliably identifies potholes deeper than 4cm up to 1.5 meters ahead, giving drivers sufficient reaction time to decelerate safely.'
  },
  {
    num: 34,
    title: 'Smart Automated Touchless Water Dispenser Tap',
    author: 'Tinkering Lab Innovation Team',
    domain: 'Sanitation Tech, Public Health & Water Conservation',
    parha: 'The Smart Automated Touchless Tap is a hygienic water dispensing system developed to stop pathogen transmission at public washbasins while drastically curbing water wastage. Utilizing an infrared proximity sensor to detect hands placed beneath the spout, the system opens a 12V solenoid valve only while hands are present, shutting off water instantly upon removal.',
    p1: 'Student & Core Objective: The team designed this touchless tap to enhance hygiene in public schools, hospitals, and stations while preventing millions of liters of water from being lost due to unattended running taps.',
    p2: 'Technical Implementation: Built with an Arduino Uno / Nano controller, an adjustable optical IR proximity sensor, an optically isolated 5V relay module, a 12V DC food-grade normally closed solenoid valve, and a 12V/5V dual power rail.',
    p3: 'Student Learning & Skills: Students learned infrared optical reflection sensing, transistor/relay solenoid driving, fluid plumbing integration, water pressure handling, and low-latency shut-off state programming.',
    p4: '3-Month Outcome & Impact: Deployed an instant-response touchless tap that dispenses water in <100ms when hands are sensed and cuts flow immediately upon exit, demonstrating an estimated 50% water savings over manual taps.'
  },
  {
    num: 35,
    title: 'Smart Real-Time Traffic & Environmental Noise Level Meter',
    author: 'Niktrix',
    domain: 'Environmental Acoustics & Urban Monitoring',
    parha: 'Developed by Niktrix, this digital acoustic monitoring station measures and displays real-time ambient noise pollution in classrooms, libraries, hospitals, and traffic junctions. Utilizing a high-sensitivity acoustic sensor, it visualizes sound intensity on an LCD screen and illuminates progressive RGB indicator LEDs with buzzer warnings whenever noise levels exceed safe decibel thresholds.',
    p1: 'Student & Core Objective: Niktrix created this environmental acoustic meter to quantify noise pollution, enforce noise ordinances in silent zones, and monitor acoustic health in work and study spaces.',
    p2: 'Technical Implementation: Engineered with an Arduino Uno, a high-sensitivity LM393 acoustic sound microphone sensor module with analog envelope output, an I2C 16x2 LCD display, a multi-stage RGB warning LED array, and an active alert buzzer.',
    p3: 'Student Learning & Skills: Niktrix mastered analog audio signal sampling, peak-to-peak amplitude detection, decibel threshold calibration, moving-window signal averaging to smooth spikes, and visual multi-tier status reporting.',
    p4: '3-Month Outcome & Impact: Built an acoustic monitor that accurately categorizes room noise into Normal (Green), Moderate (Yellow), and Excessive (Red) with immediate visual/audible feedback, fostering quieter, healthier learning environments.'
  },
  {
    num: 36,
    title: 'UNIHIKER K10 Edge-AI Single-Board IoT & Sensor Hub',
    author: 'Tinkering Lab Innovation Team',
    domain: 'Single-Board Computing & Edge-AI Dashboards',
    parha: 'This edge-AI device leverages the UNIHIKER single-board computer featuring an integrated 2.8-inch color touchscreen, a quad-core processor, and an on-board RISC-V coprocessor running Debian Linux. The system serves as a central smart IoT gateway that reads gravity sensors, runs Python GUI telemetry dashboards, and demonstrates on-device machine learning.',
    p1: 'Student & Core Objective: The student team created a unified edge-computing terminal capable of running modern Python graphical dashboards and sensor fusion without requiring external bulky monitors or PCs.',
    p2: 'Technical Implementation: Powered by the UNIHIKER SBC (Quad-Core ARM Cortex-A35, GD32VF103 RISC-V MCU, 512MB RAM, 16GB eMMC), a 2.8-inch 240x320 color touchscreen, integrated Wi-Fi/Bluetooth, and modular Gravity plug-and-play sensor interfaces.',
    p3: 'Student Learning & Skills: Students mastered Linux single-board computer configuration, Python Tkinter/PyQt GUI development on touchscreens, pinpong hardware library programming, I2C/analog sensor integration, and edge-AI deployment.',
    p4: '3-Month Outcome & Impact: Created an all-in-one handheld IoT master terminal capable of logging multi-sensor data, visualizing live telemetry graphs, and hosting touch-interactive device controls directly on-screen.'
  },
  {
    num: 37,
    title: 'VASC Age - Pulse Oximetry & Vascular Health Estimator',
    author: 'Shruti Mestry',
    domain: 'Biomedical Engineering & Digital Health',
    parha: 'Shruti Mestry developed VASC Age, a non-invasive biomedical health monitor that analyzes photoplethysmogram (PPG) pulse waveforms to measure heart rate, blood oxygen saturation (SpO2), and estimate vascular stiffness and arterial age. Operating over Wi-Fi, the device provides users with preventive cardiovascular health indicators from a simple fingertip touch.',
    p1: 'Student & Core Objective: Shruti Mestry aimed to democratize preventative cardiovascular diagnostics, allowing users to track arterial health and pulse indicators easily from home.',
    p2: 'Technical Implementation: Built using an ESP8266 (NodeMCU / Wemos D1 Mini), a MAX30102 high-sensitivity optical pulse oximeter and heart-rate sensor module (red + infrared optical LEDs and photodetector), connected via I2C, running web-based health telemetry.',
    p3: 'Student Learning & Skills: Shruti mastered optical photoplethysmography (PPG) signal acquisition, AC/DC component separation algorithms, SpO2 R-curve estimation, peak-detection heart rate filtering, and medical ergonomics.',
    p4: '3-Month Outcome & Impact: Successfully built a non-invasive biometric reader that delivers heart rate within ±2 BPM of clinical meters and computes vascular age trends, demonstrating outstanding biomedical prototyping within 3 months.'
  },
  {
    num: 38,
    title: 'Smart VAWT Hybrid Vertical Axis Wind Turbine Generator',
    author: 'Siddharth',
    domain: 'Renewable Energy & Smart Microgrids',
    parha: 'Siddharth engineered the Smart Vertical Axis Wind Turbine (VAWT) hybrid generator, an omnidirectional clean energy harvesting system for urban rooftops and off-grid locations. Unlike traditional horizontal windmills that require directional alignment with the wind, this Savonius/Darrieus vertical design captures multidirectional wind gusts while integrating an ambient solar/light sensor for hybrid power management.',
    p1: 'Student & Core Objective: Siddharth set out to design an efficient, bird-safe, omnidirectional urban wind power generator that produces electricity even in turbulent low-altitude city breezes.',
    p2: 'Technical Implementation: Constructed with a vertical aerofoil rotor assembly, a high-efficiency DC dynamo generator motor, an LDR ambient light sensor circuit, a BC547 NPN transistor switching stage, 1N4007 reverse-polarity protection diodes, and an integrated energy storage bank.',
    p3: 'Student Learning & Skills: Siddharth mastered vertical wind aerodynamics, dynamo electromagnetic induction, rectifying diode circuitry, transistor-based automatic load switching, and mechanical rotor balancing.',
    p4: '3-Month Outcome & Impact: Successfully generated usable DC electrical power from turbulent ambient breezes to illuminate warning beacons and charge batteries, validating renewable urban energy generation in 3 months.'
  }
];

const header = [
  '====================================================================================================',
  '                      TINKERING LAB 3-MONTH INNOVATION COHORT: EXECUTIVE PROJECT REPORT              ',
  '====================================================================================================',
  '',
  'OVERVIEW & COHORT MILESTONES (3-MONTH INTENSIVE PROGRAM):',
  '----------------------------------------------------------------------------------------------------',
  'Over an intensive 3-month engineering cohort, students and student-led innovation teams developed,',
  'prototyped, coded, and demonstrated 38 working technology projects. Spanning Embedded Systems,',
  'Internet of Things (IoT), Robotics, Artificial Intelligence & Computer Vision, Assistive HealthTech,',
  'Disaster Management, and Renewable Clean Energy, these projects reflect real-world problem-solving,',
  'rigorous hands-on skill development, and tangible societal impact.',
  '',
  'Each project documented below follows a standard structured format:',
  '  • A small introductory paragraph explaining the project purpose and real-world context.',
  '  • Exactly 4 structured bullet points detailing:',
  '      1. Student / Team & Core Objective',
  '      2. Technical Implementation & Build (Hardware, Sensors & Code)',
  '      3. Student Learning & Skill Growth (Knowledge acquired over the 3 months)',
  '      4. 3-Month Outcome & Real-World Impact (Working prototype & practical value)',
  '====================================================================================================',
  ''
].join('\n');

const projectEntries = projectsData.map(p => {
  return [
    '----------------------------------------------------------------------------------------------------',
    `PROJECT #${p.num}: ${p.title.toUpperCase()}`,
    `Lead Student / Team : ${p.author}`,
    `Technology Domain   : ${p.domain}`,
    '----------------------------------------------------------------------------------------------------',
    'Overview:',
    p.parha,
    '',
    'Key Highlights:',
    `1. ${p.p1}`,
    `2. ${p.p2}`,
    `3. ${p.p3}`,
    `4. ${p.p4}`,
    ''
  ].join('\n');
}).join('\n');

const footer = [
  '====================================================================================================',
  '                                    COHORT SUMMARY & IMPACT METRICS                                 ',
  '====================================================================================================',
  '• Total Projects Completed        : 38 Functional Hardware & Software Prototypes',
  '• Cohort Duration                 : 3 Months Intensive Hands-on Engineering',
  '• Primary Technology Stacks       : Arduino (C++), ESP32 / ESP8266 (IoT/Web), Python, Edge-AI,',
  '                                    I2C/SPI/UART Protocols, Mechanical 3D Prototyping & CAD',
  '• Societal & Industry Verticals   : Healthcare, Clean Water, Road Safety, Assistive Mobility,',
  '                                    Smart Agriculture, Campus Automation, Clean Energy, Home IoT',
  '• Outcome Validation              : 100% of projects achieved operational bench testing, live sensor',
  '                                    readings, automated decision logic, and verified documentation.',
  '====================================================================================================',
  'End of Summary Report. Generated for Vidya Tinkering Lab.'
].join('\n');

const fullText = header + projectEntries + '\n' + footer;

const outPath = path.join(__dirname, '..', 'projects', '3_MONTHS_PROJECTS_DETAILED_SUMMARY.txt');
fs.writeFileSync(outPath, fullText, 'utf8');
console.log('Report written successfully to:', outPath);
console.log('File size in bytes:', Buffer.byteLength(fullText, 'utf8'));
