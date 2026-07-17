// ============================================================
// STEM Quest – Beginner Level Questions
// 10 MCQ | 15 T/F | 5 Match | 5 Fill-Bank | 3 Calc | 1 Picto | 1 Arduino IDE | 1 AI
// Total: 41 Questions | Shuffled at runtime
// ============================================================

const BEGINNER_QUESTIONS = [

  // ╔══════════════════════════════╗
  // ║    MCQ QUESTIONS  (10)       ║
  // ╚══════════════════════════════╝
  {
    id: 1, type: 'mcq', variant: 'card', marks: 1,
    text: 'What does STEM stand for?',
    tagline: 'Pick the correct full form!',
    options: [
      'Science, Tech, English, Math',
      'Science, Technology, Engineering, Math',
      'Space, Tech, Engine, Motion',
      'Simple Tech Easy Math'
    ],
    answer: 1
  },
  {
    id: 2, type: 'mcq', variant: 'image', marks: 1,
    text: 'Which one is an Arduino Uno?',
    tagline: 'Identify the microcontroller!',
    options: [
      { label: 'Breadboard', img: '../data/images/BreadBoard.jpg' },
      { label: 'Arduino Uno', img: '../data/images/Arduino-uno.jpg' },
      { label: 'LED', img: '../data/images/led.jpg' },
      { label: 'Battery', img: '../data/images/battery.jpg' }
    ],
    answer: 1
  },
  {
    id: 3, type: 'mcq', variant: 'emoji', marks: 1,
    text: 'What does an LED emit when powered?',
    tagline: 'What does a bulb produce?',
    options: [
      { text: 'Sound', emoji: '🔊' },
      { text: 'Light', emoji: '💡' },
      { text: 'Heat only', emoji: '🔥' },
      { text: 'Motion', emoji: '🌀' }
    ],
    answer: 1
  },
  {
    id: 4, type: 'mcq', variant: 'card', marks: 1,
    text: 'Which language uses colorful snap-together blocks for coding?',
    tagline: 'Hint: kids love it!',
    options: ['Python', 'C++', 'Scratch / Block Coding', 'HTML'],
    answer: 2
  },
  {
    id: 5, type: 'mcq', variant: 'image', marks: 1,
    text: 'Which sensor uses sound waves to detect distance?',
    tagline: 'Like a bat\'s sonar!',
    options: [
      { label: 'PIR Sensor', img: '../data/images/PIR-Motion-sensor.jpg' },
      { label: 'Ultrasonic HC-SR04', img: '../data/images/ultrasonic-hc-sr04.png' },
      { label: 'IR Sensor', img: '../data/images/IR-sensor.jpeg' },
      { label: 'Resistor', img: '../data/images/Resistor-color-codes-1.png' }
    ],
    answer: 1
  },
  {
    id: 6, type: 'mcq', variant: 'emoji', marks: 1,
    text: 'What is the unit of Voltage?',
    tagline: 'V = ? ... what unit?',
    options: [
      { text: 'Ampere (A)', emoji: '🔌' },
      { text: 'Ohm (Ω)', emoji: '🔬' },
      { text: 'Volt (V)', emoji: '⚡' },
      { text: 'Watt (W)', emoji: '💡' }
    ],
    answer: 2
  },
  {
    id: 7, type: 'mcq', variant: 'card', marks: 1,
    text: 'Which component stores electrical energy?',
    tagline: 'It holds charge like a tiny tank!',
    options: ['Resistor', 'Capacitor', 'Diode', 'LED'],
    answer: 1
  },
  {
    id: 8, type: 'mcq', variant: 'card', marks: 1,
    text: "What is Ohm's Law formula?",
    tagline: 'V, I, R – pick the right combo!',
    options: ['V = I + R', 'V = I × R', 'V = I ÷ R', 'V = I – R'],
    answer: 1
  },
  {
    id: 9, type: 'mcq', variant: 'image', marks: 1,
    text: 'Which of these shows the Arduino IDE interface?',
    tagline: 'Where we write Arduino code!',
    options: [
      { label: 'Arduino IDE', img: '../data/images/Arduino IDE main interface.jpg' },
      { label: 'Circuit Diagram', img: '../data/images/simple-circuit.jpg' },
      { label: 'Breadboard Setup', img: '../data/images/breadboard-circuit.jpg' },
      { label: 'LED Circuit', img: '../data/images/simple-led-circuit.jpg' }
    ],
    answer: 0
  },
  {
    id: 10, type: 'mcq', variant: 'emoji', marks: 1,
    text: 'Which of these is an INPUT device for a computer?',
    tagline: 'It sends data TO the computer!',
    options: [
      { text: 'Monitor', emoji: '🖥️' },
      { text: 'Speaker', emoji: '🔊' },
      { text: 'Keyboard', emoji: '⌨️' },
      { text: 'Printer', emoji: '🖨️' }
    ],
    answer: 2
  },

  // ╔══════════════════════════════╗
  // ║  TRUE / FALSE  (15)          ║
  // ╚══════════════════════════════╝
  {
    id: 11, type: 'true_false', marks: 1,
    text: 'A battery provides AC (Alternating Current) power.',
    answer: false,
    funFact: '🔋 Batteries give DC (Direct Current)! AC comes from power outlets!'
  },
  {
    id: 12, type: 'true_false', marks: 1,
    text: 'Python is a text-based programming language.',
    answer: true,
    funFact: '🐍 Yes! Python uses typed commands, unlike Scratch which uses blocks!'
  },
  {
    id: 13, type: 'true_false', marks: 1,
    text: 'A resistor INCREASES the flow of electricity.',
    answer: false,
    funFact: '⬜ Resistors RESIST (reduce) current flow – that\'s literally their job!'
  },
  {
    id: 14, type: 'true_false', marks: 1,
    text: 'Robotics combines mechanical, electrical, and software skills.',
    answer: true,
    funFact: '🤖 Robots need a body (mechanics), wiring (electronics) AND a brain (code)!'
  },
  {
    id: 15, type: 'true_false', marks: 1,
    text: 'PLA plastic used in 3D printing is biodegradable.',
    answer: true,
    funFact: '♻️ PLA is made from corn starch – it naturally breaks down over time!'
  },
  {
    id: 16, type: 'true_false', marks: 1,
    text: 'A breadboard REQUIRES soldering to build circuits.',
    answer: false,
    funFact: '🔧 Breadboards are solder-FREE! Just push components into the holes!'
  },
  {
    id: 17, type: 'true_false', marks: 1,
    text: 'An ultrasonic sensor uses LIGHT to detect objects.',
    answer: false,
    funFact: '📡 Ultrasonic uses SOUND waves (like a bat\'s echolocation)!'
  },
  {
    id: 18, type: 'true_false', marks: 1,
    text: 'G-Code is the language used to control 3D printers.',
    answer: true,
    funFact: '🖨️ G-Code tells the printer where to move and how fast – like GPS for the extruder!'
  },
  {
    id: 19, type: 'true_false', marks: 1,
    text: 'A standard servo motor can rotate 360° continuously forever.',
    answer: false,
    funFact: '⚙️ Standard servos move to angles (0°–180°). Continuous rotation servos are different!'
  },
  {
    id: 20, type: 'true_false', marks: 1,
    text: 'A multimeter can measure voltage, current, AND resistance.',
    answer: true,
    funFact: '📊 Multi + Meter = measures MULTIPLE things! It\'s the Swiss Army knife of electronics!'
  },
  {
    id: 21, type: 'true_false', marks: 1,
    text: 'LED stands for Light Emitting Diode.',
    answer: true,
    funFact: '💡 L=Light, E=Emitting, D=Diode. Current in → Light out!'
  },
  {
    id: 22, type: 'true_false', marks: 1,
    text: 'Arduino programs are written in the Python language.',
    answer: false,
    funFact: '⚙️ Arduino uses C/C++! Python runs on computers like Raspberry Pi!'
  },
  {
    id: 23, type: 'true_false', marks: 1,
    text: 'In an open circuit, electricity CAN flow freely.',
    answer: false,
    funFact: '🔓 OPEN = broken path! Electricity CANNOT flow. A closed circuit allows flow!'
  },
  {
    id: 24, type: 'true_false', marks: 1,
    text: 'A sensor detects information from the environment.',
    answer: true,
    funFact: '📡 Sensors are the "senses" of electronics – they see, feel, and hear the world!'
  },
  {
    id: 25, type: 'true_false', marks: 1,
    text: '3D printing is called "Subtractive Manufacturing".',
    answer: false,
    funFact: '🖨️ 3D printing is ADDITIVE! It ADDS material layer by layer to build objects!'
  },

  // ╔══════════════════════════════╗
  // ║  MATCH THE FOLLOWING  (5)    ║
  // ╚══════════════════════════════╝
  {
    id: 26, type: 'match', marks: 3,
    text: '🔗 Match each component to its function!',
    image: '../data/images/simple-circuit.jpg',
    pairs: [
      { left: '🔋 Battery',  right: '⚡ Provides Power' },
      { left: '💡 LED',      right: '🌟 Emits Light' },
      { left: '⬜ Resistor', right: '🔽 Limits Current' },
      { left: '⚙️ Motor',    right: '🔄 Creates Motion' },
      { left: '🔊 Buzzer',   right: '📢 Makes Sound' }
    ]
  },
  {
    id: 27, type: 'match', marks: 3,
    text: '🔗 Match each STEM letter to its field!',
    pairs: [
      { left: '🔬 S = ?',  right: '🌿 Science' },
      { left: '💻 T = ?',  right: '📱 Technology' },
      { left: '🔧 E = ?',  right: '🏗️ Engineering' },
      { left: '📐 M = ?',  right: '🔢 Mathematics' }
    ]
  },
  {
    id: 28, type: 'match', marks: 3,
    text: '🔗 Match the coding concept to its meaning!',
    pairs: [
      { left: '🔄 Loop',       right: '🔁 Repeat code forever' },
      { left: '📦 Variable',   right: '💾 Store a value' },
      { left: '🔀 If / Else',  right: '❓ Make a decision' },
      { left: '📞 Function',   right: '📋 Reusable block of code' },
      { left: '💬 Comment',    right: '📝 Note for humans only' }
    ]
  },
  {
    id: 29, type: 'match', marks: 3,
    text: '🔗 Match the Arduino function to what it does!',
    pairs: [
      { left: '📌 pinMode()',       right: '🔧 Sets pin as INPUT or OUTPUT' },
      { left: '✍️ digitalWrite()',   right: '💡 Sends HIGH or LOW to pin' },
      { left: '📖 digitalRead()',   right: '👂 Reads button/sensor state' },
      { left: '⏱️ delay()',         right: '⏸️ Waits for a given time (ms)' },
      { left: '⚙️ setup()',         right: '1️⃣ Runs ONCE at the start' }
    ]
  },
  {
    id: 30, type: 'match', marks: 3,
    text: '🔗 Match the computer part to what it does!',
    pairs: [
      { left: '🧠 CPU',       right: '⚙️ Processes all data' },
      { left: '💾 RAM',       right: '⚡ Short-term memory' },
      { left: '💿 SSD/HDD',   right: '📁 Stores files long-term' },
      { left: '🖥️ Monitor',  right: '👁️ Shows visual output' },
      { left: '🖱️ Mouse',    right: '🖱️ Controls the cursor' }
    ]
  },

  // ╔════════════════════════════════════╗
  // ║  FILL IN THE BLANK – WORD BANK (5) ║
  // ╚════════════════════════════════════╝
  {
    id: 31, type: 'fill_bank', marks: 2,
    text: 'An ___ emits ___ when electricity flows through it.',
    blanks: 2,
    blankLabels: ['Component', 'What it produces'],
    answers: ['LED', 'light'],
    wordBank: ['LED', 'light', 'battery', 'sound', 'motor', 'heat', 'sensor'],
    image: '../data/images/led.jpg'
  },
  {
    id: 32, type: 'fill_bank', marks: 2,
    text: 'In Arduino, the ___ function runs once. The ___ function loops forever.',
    blanks: 2,
    blankLabels: ['Run once', 'Loops forever'],
    answers: ['setup', 'loop'],
    wordBank: ['setup', 'loop', 'void', 'delay', 'begin', 'print', 'start'],
    image: '../data/images/Arduino IDE main interface.jpg'
  },
  {
    id: 33, type: 'fill_bank', marks: 2,
    text: 'A ___ board lets you build circuits quickly without ___.',
    blanks: 2,
    blankLabels: ['Board name', 'What you skip'],
    answers: ['bread', 'soldering'],
    wordBank: ['bread', 'soldering', 'motor', 'battery', 'welding', 'wire', 'gluing'],
    image: '../data/images/BreadBoard.jpg'
  },
  {
    id: 34, type: 'fill_bank', marks: 2,
    text: 'A ___ sensor uses ___ waves to measure distance to an object.',
    blanks: 2,
    blankLabels: ['Sensor type', 'Wave type'],
    answers: ['Ultrasonic', 'sound'],
    wordBank: ['Ultrasonic', 'sound', 'PIR', 'light', 'IR', 'motion', 'radio'],
    image: '../data/images/ultrasonic-hc-sr04.png'
  },
  {
    id: 35, type: 'fill_bank', marks: 2,
    text: 'V = I × R is called ___ Law. V stands for ___.',
    blanks: 2,
    blankLabels: ['Whose Law?', 'V stands for?'],
    answers: ["Ohm's", 'Voltage'],
    wordBank: ["Ohm's", 'Voltage', "Newton's", 'Current', "Faraday's", 'Resistance', 'Power']
  },

  // ╔══════════════════════════════╗
  // ║  CALCULATION QUESTIONS (3)   ║
  // ╚══════════════════════════════╝
  {
    id: 36, type: 'calc', marks: 3,
    emoji: '⚡',
    title: "Ohm's Law Challenge!",
    text: 'If Voltage = 9V and Resistance = 100Ω, what is the Current?',
    formula: 'I = V ÷ R',
    given: [
      { symbol: 'V', label: 'Voltage', value: '9', unit: 'Volts' },
      { symbol: 'R', label: 'Resistance', value: '100', unit: 'Ohms (Ω)' }
    ],
    find: { symbol: 'I', label: 'Current', unit: 'mA' },
    hint: '9 ÷ 100 = 0.09 A = 90 mA',
    options: ['9 mA', '45 mA', '90 mA', '900 mA'],
    answer: 2,
    image: '../data/images/simple-led-circuit.jpg'
  },
  {
    id: 37, type: 'calc', marks: 3,
    emoji: '💡',
    title: 'LED Power Challenge!',
    text: 'Your supply gives 5V and 100mA total. Each LED needs 20mA. How many LEDs can you light up?',
    formula: 'Count = Total mA ÷ mA per LED',
    given: [
      { symbol: 'Total', label: 'Total Current', value: '100', unit: 'mA' },
      { symbol: 'Per LED', label: 'Each LED needs', value: '20', unit: 'mA' }
    ],
    find: { symbol: 'N', label: 'Number of LEDs', unit: 'LEDs' },
    hint: '100 ÷ 20 = ?',
    options: ['2 LEDs', '4 LEDs', '5 LEDs', '10 LEDs'],
    answer: 2,
    image: '../data/images/led array circuit.png'
  },
  {
    id: 38, type: 'calc', marks: 3,
    emoji: '🔋',
    title: 'Series Circuit Challenge!',
    text: 'You have 3 LEDs in SERIES. Each LED needs 2V. What is the TOTAL voltage needed?',
    formula: 'Total V = V per LED × Count',
    given: [
      { symbol: 'V/LED', label: 'Voltage per LED', value: '2', unit: 'Volts' },
      { symbol: 'N', label: 'Number of LEDs', value: '3', unit: 'LEDs' }
    ],
    find: { symbol: 'Vtotal', label: 'Total Voltage', unit: 'Volts' },
    hint: '2 × 3 = ?',
    options: ['2V', '4V', '6V', '8V'],
    answer: 2,
    image: '../data/images/simple-circuit.jpg'
  },

  // ╔══════════════════════════════╗
  // ║  PICTO-BLOCK CODING (1)      ║
  // ╚══════════════════════════════╝
  {
    id: 39, type: 'picto', marks: 4,
    text: '🧩 Arrange the PictoBlocks to make an LED blink!',
    instruction: 'Click blocks from the PALETTE to add them to your CODE. Get the right sequence!',
    image: '../data/images/Led_Blink_320.gif',
    correctSequence: ['setup', 'pinmode', 'loop', 'high', 'delay1', 'low', 'delay2'],
    palette: [
      { id: 'setup',   label: 'void setup()',          color: '#ff6b6b', icon: '⚙️', category: 'Structure' },
      { id: 'pinmode', label: 'pinMode(13, OUTPUT)',   color: '#ff9f43', icon: '📌', category: 'Setup' },
      { id: 'loop',    label: 'void loop()',           color: '#48dbfb', icon: '🔄', category: 'Structure' },
      { id: 'high',    label: 'digitalWrite(HIGH)',    color: '#feca57', icon: '💡', category: 'Control' },
      { id: 'delay1',  label: 'delay(1000)',           color: '#1dd1a1', icon: '⏱️', category: 'Control' },
      { id: 'low',     label: 'digitalWrite(LOW)',     color: '#ff6348', icon: '🔕', category: 'Control' },
      { id: 'delay2',  label: 'delay(1000)',           color: '#1dd1a1', icon: '⏱️', category: 'Control' },
      { id: 'wrong1',  label: 'analogRead(A0)',        color: '#636e72', icon: '📊', category: 'Sensor' },
      { id: 'wrong2',  label: 'Serial.println()',      color: '#636e72', icon: '📺', category: 'Debug' }
    ]
  },

  // ╔══════════════════════════════╗
  // ║  ARDUINO IDE CODE  (1)       ║
  // ╚══════════════════════════════╝
  {
    id: 40, type: 'arduino_ide', marks: 3,
    text: '💻 Complete the Arduino code! Which function goes in the blank?',
    subtitle: 'This code makes LED on pin 13 blink. Fill in the missing function name:',
    codeLines: [
      { text: 'void setup() {',                  type: 'normal' },
      { text: '  ________(13, OUTPUT);',         type: 'blank'  },
      { text: '}',                               type: 'normal' },
      { text: '',                                type: 'empty'  },
      { text: 'void loop() {',                   type: 'normal' },
      { text: '  digitalWrite(13, HIGH);',       type: 'normal' },
      { text: '  delay(1000);',                  type: 'normal' },
      { text: '  digitalWrite(13, LOW);',        type: 'normal' },
      { text: '  delay(1000);',                  type: 'normal' },
      { text: '}',                               type: 'normal' }
    ],
    options: ['pinMode', 'digitalRead', 'analogWrite', 'Serial.begin'],
    answer: 0,
    image: '../data/images/Verify and Upload buttons in Arduino IDE.png'
  },

  // ╔══════════════════════════════╗
  // ║  AI QUESTION  (1)            ║
  // ╚══════════════════════════════╝
  {
    id: 41, type: 'ai_question', marks: 2,
    aiName: 'VIDYA AI Bot',
    setupText: 'Our AI Bot has a tricky real-world question! Can you help it answer?',
    text: 'What happens when you connect an LED directly to a 9V battery WITHOUT a resistor?',
    aiHint: '🤔 Think... what does too much current do to a tiny component?',
    options: [
      { text: 'The LED glows extra bright forever', emoji: '✨' },
      { text: 'The LED burns out instantly!',       emoji: '💥' },
      { text: 'The LED starts blinking on its own', emoji: '🔄' },
      { text: 'Nothing happens at all',             emoji: '😴' }
    ],
    answer: 1,
    explanation: 'Without a resistor, too much current flows through the LED and it burns out! Always protect LEDs with a resistor! ⬜ → 💡'
  }
];
