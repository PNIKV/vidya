# Live Bus Tracking Display System

A real-time bus tracking dashboard system featuring a web-based controller and an Arduino-powered TFT display. The system communicates via a direct serial connection between the browser (using the Web Serial API) and the Arduino, rendering dynamic bus schedules and ETA data onto a physical LCD screen.

## 💻 Technologies & Languages Used

* **C++ (Arduino)**: Drives the microcontroller logic, parses incoming JSON payloads, and renders graphics on the TFT display.
* **HTML5**: Provides the structural layout for the browser-based control dashboard.
* **CSS3**: Styles the controller interface with a modern glassmorphic design and dark mode aesthetics.
* **JavaScript (ES6+)**: Handles the Web Serial API connection, manages the bus simulation queue, and formats data into JSON for transmission.

## 🛠️ Hardware Components

* **Arduino Uno**: The core microcontroller receiving instructions and driving the display.
* **TFT LCD Display**: Specifically, a DIYables RM68140 TFT Touch Shield (as driven by the code) mounted on the Arduino.
* **USB Cable**: Used for both power and serial data transmission between the PC and the Arduino.

## 📦 Software Libraries & APIs

* [**ArduinoJson**](https://arduinojson.org/): A lightweight JSON library used on the Arduino side to parse incoming configuration and queue data.
* **DIYables_TFT_Touch_Shield**: Library for controlling the specific TFT LCD screen being used.
* **Web Serial API**: A built-in modern browser API that allows the JavaScript controller to communicate directly with the Arduino COM port, eliminating the need for an intermediary backend server.

## 🚀 How It Works

1. **Web Dashboard**: Open `livebus.html` in a Web Serial-compatible browser (like Google Chrome or Microsoft Edge).
2. **Connect**: Click "Connect to Arduino" and select the Arduino's COM port from the browser prompt.
3. **Configure & Simulate**: You can adjust UI colors, update the station name, or manually add buses to the queue. You can also start a live bus simulation that automatically decrements ETAs and updates the physical screen in real-time.
4. **Hardware Display**: The Arduino continuously listens for incoming JSON serial data, parsing it and automatically repainting the specific sections of the screen to prevent flickering whenever new data arrives.
