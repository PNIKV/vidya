#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>

// --- WIFI CONFIGURATION ---
const char* primary_ssid     = "STEM";
const char* primary_password = "STEM@123";

const char* ap_ssid          = "VacuumBot-AP";
const char* ap_password      = "12345678"; // Min 8 chars
const char* mdns_hostname    = "vacuum";   // http://vacuum.local/

// --- L298N PIN DEFINITIONS ---
const int ENA = 14; // D5
const int IN1 = 5;  // D1
const int IN2 = 4;  // D2
const int IN3 = 12; // D6
const int IN4 = 13; // D7
const int ENB = 15; // D8

// --- GLOBAL VARIABLES ---
ESP8266WebServer server(80);
int currentSpeed = 200; // Default PWM Speed (0-255)
String currentAction = "STOP";
String wifiStatusStr = "Initializing...";
String resetReasonStr = "";

// --- HTML / CSS / JS WEB DASHBOARD ---
const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Smart Vacuum Cleaner</title>
    <style>
        :root {
            --bg-color: #0f172a;
            --card-bg: #1e293b;
            --accent: #06b6d4;
            --accent-hover: #0891b2;
            --danger: #ef4444;
            --text: #f8fafc;
            --subtext: #94a3b8;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            user-select: none;
            -webkit-user-select: none;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1rem;
        }

        header {
            text-align: center;
            margin-bottom: 1.5rem;
        }

        header h1 {
            font-size: 1.8rem;
            color: var(--accent);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.2rem;
            width: 100%;
            max-width: 900px;
        }

        @media (min-width: 768px) {
            .dashboard-grid {
                grid-template-columns: 1fr 1fr;
            }
        }

        .card {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 1.2rem;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.05);
        }

        /* Interactive Visualizer */
        .visualizer-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 220px;
            position: relative;
            background: #0b1120;
            border-radius: 12px;
            overflow: hidden;
            border: 1px dashed rgba(255,255,255,0.1);
        }

        .robot-body {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: radial-gradient(circle, #334155 0%, #1e293b 100%);
            border: 4px solid var(--accent);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: transform 0.2s ease, border-color 0.2s ease;
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
        }

        .robot-sensor {
            width: 24px;
            height: 24px;
            background: var(--accent);
            border-radius: 50%;
            position: absolute;
            top: 8px;
            box-shadow: 0 0 8px var(--accent);
        }

        .robot-label {
            font-size: 0.75rem;
            font-weight: bold;
            color: var(--subtext);
            margin-top: 18px;
        }

        .motion-wave {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 2px solid var(--accent);
            opacity: 0;
            pointer-events: none;
        }

        /* Keyframe animations for visual state */
        .moving-FWD .robot-body { transform: translateY(-15px); }
        .moving-BWD .robot-body { transform: translateY(15px); }
        .moving-LEFT .robot-body { transform: rotate(-30deg) translateX(-10px); }
        .moving-RIGHT .robot-body { transform: rotate(30deg) translateX(10px); }
        .moving-STOP .robot-body { transform: scale(1); border-color: var(--subtext); box-shadow: none; }

        /* Controls */
        .dpad {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            max-width: 280px;
            margin: 0 auto;
        }

        .btn {
            background: #334155;
            color: var(--text);
            border: none;
            padding: 1.2rem;
            border-radius: 12px;
            font-size: 1.2rem;
            font-weight: bold;
            cursor: pointer;
            touch-action: manipulation;
            transition: background 0.1s, transform 0.1s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .btn:active {
            background: var(--accent);
            transform: scale(0.95);
        }

        .btn-stop {
            background: var(--danger);
            grid-column: 2;
        }

        .btn-stop:active {
            background: #dc2626;
        }

        /* Speed Slider */
        .speed-control {
            margin-top: 1.5rem;
        }

        .speed-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            color: var(--subtext);
        }

        input[type=range] {
            width: 100%;
            height: 8px;
            border-radius: 5px;
            background: #334155;
            outline: none;
            accent-color: var(--accent);
        }

        /* Diagnostics List */
        .diag-list {
            list-style: none;
            font-size: 0.88rem;
        }

        .diag-item {
            display: flex;
            justify-content: space-between;
            padding: 0.6rem 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .diag-item:last-child {
            border-bottom: none;
        }

        .diag-label { color: var(--subtext); }
        .diag-val { font-weight: 600; font-family: monospace; }
        .status-badge {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            background: rgba(6, 182, 212, 0.2);
            color: var(--accent);
        }
    </style>
</head>
<body>

    <header>
        <h1>🧹 Vacuum Bot UI</h1>
    </header>

    <div class="dashboard-grid">
        <!-- Visualizer Card -->
        <div class="card">
            <h2 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--subtext);">Live Robot Motion</h2>
            <div class="visualizer-container" id="visualizer">
                <div class="robot-body" id="robot">
                    <div class="robot-sensor"></div>
                    <span class="robot-label" id="robotState">STOPPED</span>
                </div>
            </div>
            
            <!-- Speed Control -->
            <div class="speed-control">
                <div class="speed-header">
                    <span>Motor Speed</span>
                    <span id="speedVal">80%</span>
                </div>
                <input type="range" id="speedSlider" min="0" max="255" value="200" onchange="setSpeed(this.value)">
            </div>
        </div>

        <!-- Directional D-Pad Controls -->
        <div class="card" style="display: flex; flex-direction: column; justify-content: center;">
            <div class="dpad">
                <div></div>
                <button class="btn" onmousedown="sendCmd('FWD')" onmouseup="sendCmd('STOP')" ontouchstart="sendCmd('FWD')" ontouchend="sendCmd('STOP')">▲</button>
                <div></div>
                
                <button class="btn" onmousedown="sendCmd('LEFT')" onmouseup="sendCmd('STOP')" ontouchstart="sendCmd('LEFT')" ontouchend="sendCmd('STOP')">◀</button>
                <button class="btn btn-stop" onclick="sendCmd('STOP')">■</button>
                <button class="btn" onmousedown="sendCmd('RIGHT')" onmouseup="sendCmd('STOP')" ontouchstart="sendCmd('RIGHT')" ontouchend="sendCmd('STOP')">▶</button>
                
                <div></div>
                <button class="btn" onmousedown="sendCmd('BWD')" onmouseup="sendCmd('STOP')" ontouchstart="sendCmd('BWD')" ontouchend="sendCmd('STOP')">▼</button>
                <div></div>
            </div>
        </div>

        <!-- System Diagnostics Card -->
        <div class="card" style="grid-column: 1 / -1;">
            <h2 style="font-size: 1.1rem; margin-bottom: 0.8rem; color: var(--subtext);">System Diagnostics & Logs</h2>
            <ul class="diag-list">
                <li class="diag-item">
                    <span class="diag-label">Network Connection:</span>
                    <span class="diag-val status-badge" id="wifiMode">Loading...</span>
                </li>
                <li class="diag-item">
                    <span class="diag-label">IP Address:</span>
                    <span class="diag-val" id="ipAddr">-</span>
                </li>
                <li class="diag-item">
                    <span class="diag-label">mDNS Endpoint:</span>
                    <span class="diag-val" style="color: var(--accent);">http://vacuum.local/</span>
                </li>
                <li class="diag-item">
                    <span class="diag-label">Last Reset Reason:</span>
                    <span class="diag-val" id="resetReason" style="color: var(--danger);">-</span>
                </li>
                <li class="diag-item">
                    <span class="diag-label">Uptime:</span>
                    <span class="diag-val" id="uptime">-</span>
                </li>
            </ul>
        </div>
    </div>

    <script>
        let currentDir = "STOP";

        function sendCmd(dir) {
            currentDir = dir;
            updateVisualizer(dir);
            fetch(`/control?dir=${dir}`)
                .catch(err => console.error("Control Command Failed", err));
        }

        function setSpeed(val) {
            let percentage = Math.round((val / 255) * 100);
            document.getElementById('speedVal').innerText = percentage + '%';
            fetch(`/control?speed=${val}`)
                .catch(err => console.error("Speed Command Failed", err));
        }

        function updateVisualizer(dir) {
            const visualizer = document.getElementById('visualizer');
            const robotState = document.getElementById('robotState');
            
            visualizer.className = 'visualizer-container moving-' + dir;
            robotState.innerText = dir === 'STOP' ? 'STOPPED' : dir;
        }

        function pollStatus() {
            fetch('/status')
                .then(res => res.json())
                .then(data => {
                    document.getElementById('wifiMode').innerText = data.wifi_mode;
                    document.getElementById('ipAddr').innerText = data.ip;
                    document.getElementById('resetReason').innerText = data.reset_reason;
                    document.getElementById('uptime').innerText = data.uptime + ' sec';
                })
                .catch(err => console.error("Status Poll Error", err));
        }

        // Poll system status every 2.5 seconds
        setInterval(pollStatus, 2500);
        pollStatus();
    </script>
</body>
</html>
)rawliteral";

// --- MOTOR CONTROL HELPER FUNCTIONS ---
void applyMotorDriver(int in1, int in2, int in3, int in4, int speed) {
  digitalWrite(IN1, in1);
  digitalWrite(IN2, in2);
  digitalWrite(IN3, in3);
  digitalWrite(IN4, in4);
  analogWrite(ENA, speed);
  analogWrite(ENB, speed);
}

void driveRobot(String dir) {
  currentAction = dir;
  if (dir == "FWD") {
    applyMotorDriver(HIGH, LOW, HIGH, LOW, currentSpeed);
  } else if (dir == "BWD") {
    applyMotorDriver(LOW, HIGH, LOW, HIGH, currentSpeed);
  } else if (dir == "LEFT") {
    applyMotorDriver(LOW, HIGH, HIGH, LOW, currentSpeed); // Spin in-place
  } else if (dir == "RIGHT") {
    applyMotorDriver(HIGH, LOW, LOW, HIGH, currentSpeed); // Spin in-place
  } else { // STOP
    applyMotorDriver(LOW, LOW, LOW, LOW, 0);
  }
}

// --- WEB ROUTE HANDLERS ---
void handleRoot() {
  server.send(200, "text/html", INDEX_HTML);
}

void handleControl() {
  if (server.hasArg("dir")) {
    String dir = server.arg("dir");
    driveRobot(dir);
  }
  if (server.hasArg("speed")) {
    currentSpeed = server.arg("speed").toInt();
    currentSpeed = constrain(currentSpeed, 0, 255);
    // Re-apply speed to running direction
    driveRobot(currentAction);
  }
  server.send(200, "text/plain", "OK");
}

void handleStatus() {
  String json = "{";
  json += "\"wifi_mode\":\"" + wifiStatusStr + "\",";
  json += "\"ip\":\"" + (WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString()) + "\",";
  json += "\"reset_reason\":\"" + resetReasonStr + "\",";
  json += "\"uptime\":" + String(millis() / 1000);
  json += "}";
  server.send(200, "application/json", json);
}

// --- SETUP AND INITIALIZATION ---
void setup() {
  Serial.begin(115200);
  delay(500);

  // Set Motor Pins as Output
  pinMode(ENA, OUTPUT);
  pinMode(ENB, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  // Set ESP8266 PWM range to standard 0-255
  analogWriteRange(255);
  driveRobot("STOP");

  // Read ESP8266 Hardware Reset Reason
  resetReasonStr = ESP.getResetReason();
  Serial.println("\n-------------------------------------------");
  Serial.println("SYSTEM BOOTING - VACUUM ROBOT");
  Serial.print("SYSTEM RESET REASON: ");
  Serial.println(resetReasonStr);
  Serial.println("-------------------------------------------");

  // Attempt WiFi Connection
  WiFi.mode(WIFI_STA);
  WiFi.begin(primary_ssid, primary_password);
  Serial.print("Connecting to primary WiFi: ");
  Serial.println(primary_ssid);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) { // 10s Timeout
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiStatusStr = "STA Mode (" + String(primary_ssid) + ")";
    Serial.println("\n[SUCCESS] Connected to WiFi!");
    Serial.print("[IP ADDRESS] ");
    Serial.println(WiFi.localIP());
  } else {
    // Fallback to Access Point (AP)
    Serial.println("\n[WARNING] WiFi Connection Failed! Starting Access Point...");
    WiFi.mode(WIFI_AP);
    WiFi.softAP(ap_ssid, ap_password);
    wifiStatusStr = "AP Mode (" + String(ap_ssid) + ")";
    Serial.print("[AP IP ADDRESS] ");
    Serial.println(WiFi.softAPIP());
  }

  // Setup mDNS Service
  if (MDNS.begin(mdns_hostname)) {
    Serial.print("[mDNS] Started: http://");
    Serial.print(mdns_hostname);
    Serial.println(".local/");
  } else {
    Serial.println("[mDNS] Error setting up mDNS responder!");
  }

  // Configure Server Routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/control", HTTP_GET, handleControl);
  server.on("/status", HTTP_GET, handleStatus);
  
  server.begin();
  Serial.println("[HTTP SERVER] Started successfully.");
}

void loop() {
  server.handleClient();
  MDNS.update();
}