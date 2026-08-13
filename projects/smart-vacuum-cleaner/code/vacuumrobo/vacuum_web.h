// comment for this is vacum robot car code
#ifndef VACUUM_WEB_H
#define VACUUM_WEB_H

#include <Arduino.h>

// --- HTML / CSS / JS WEB DASHBOARD ---
const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Smart Vacuum Cleaner Robot</title>
    <style>
        :root {
            --bg-color: #0b1329;
            --card-bg: #142242;
            --card-border: rgba(255, 255, 255, 0.08);
            --accent: #00d2ff;
            --accent-glow: rgba(0, 210, 255, 0.4);
            --success: #10b981;
            --success-glow: rgba(16, 185, 129, 0.4);
            --danger: #ef4444;
            --text: #f1f5f9;
            --subtext: #94a3b8;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            user-select: none;
            -webkit-user-select: none;
            touch-action: manipulation;
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
            margin-bottom: 1.2rem;
            width: 100%;
            max-width: 900px;
        }

        header h1 {
            font-size: 1.7rem;
            color: var(--accent);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.6rem;
            text-shadow: 0 0 12px var(--accent-glow);
        }

        header p {
            font-size: 0.85rem;
            color: var(--subtext);
            margin-top: 0.3rem;
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
            border-radius: 20px;
            padding: 1.3rem;
            box-shadow: 0 12px 30px rgba(0,0,0,0.4);
            border: 1px solid var(--card-border);
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
        }

        .card-title {
            width: 100%;
            font-size: 1rem;
            font-weight: 600;
            color: var(--subtext);
            margin-bottom: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        /* VACUUM AIR PUMP RELAY CARD */
        .relay-container {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }

        .relay-btn {
            width: 100%;
            padding: 1.2rem;
            border-radius: 16px;
            border: 2px solid var(--card-border);
            background: #1e293b;
            color: var(--text);
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.8rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .relay-btn.active {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            border-color: #34d399;
            box-shadow: 0 0 25px var(--success-glow);
            color: #ffffff;
        }

        .relay-status-pill {
            font-size: 0.75rem;
            padding: 4px 10px;
            border-radius: 20px;
            background: rgba(255,255,255,0.1);
            color: var(--subtext);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .relay-btn.active .relay-status-pill {
            background: rgba(255,255,255,0.25);
            color: #ffffff;
        }

        /* VIRTUAL JOYSTICK CANVAS */
        .joystick-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .joystick-wrapper {
            position: relative;
            width: 220px;
            height: 220px;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: none;
        }

        #joystickCanvas {
            width: 220px;
            height: 220px;
            border-radius: 50%;
            background: radial-gradient(circle, #101c38 0%, #0a1020 100%);
            border: 3px solid rgba(0, 210, 255, 0.3);
            box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 0 15px rgba(0, 210, 255, 0.1);
            cursor: pointer;
        }

        .speed-gauge {
            width: 100%;
            margin-top: 1.2rem;
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }

        .speed-header {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            color: var(--subtext);
        }

        .speed-bar-bg {
            width: 100%;
            height: 10px;
            background: #1e293b;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--card-border);
        }

        .speed-bar-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #00d2ff 0%, #3b82f6 100%);
            border-radius: 10px;
            transition: width 0.1s linear;
        }

        /* DIAGNOSTICS LIST */
        .diag-list {
            width: 100%;
            list-style: none;
            font-size: 0.85rem;
        }

        .diag-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.65rem 0;
            border-bottom: 1px solid var(--card-border);
        }

        .diag-item:last-child {
            border-bottom: none;
        }

        .diag-label { color: var(--subtext); }
        .diag-val { font-weight: 600; font-family: "SF Mono", Consolas, monospace; }
        
        .badge {
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .badge-cyan { background: rgba(0, 210, 255, 0.15); color: var(--accent); border: 1px solid rgba(0, 210, 255, 0.3); }
        .badge-green { background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); }

        .chassis-info {
            width: 100%;
            margin-top: 0.8rem;
            padding: 0.75rem;
            background: rgba(0, 210, 255, 0.05);
            border-radius: 10px;
            border: 1px dashed rgba(0, 210, 255, 0.2);
            font-size: 0.78rem;
            color: var(--subtext);
            text-align: center;
        }
        .chassis-info a { color: var(--accent); text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>

    <header>
        <h1>🧹 Smart Vacuum Robot</h1>
        <p>Thingiverse 5116129 Body • ESP8266 WiFi Remote Joystick</p>
    </header>

    <div class="dashboard-grid">
        
        <!-- VACUUM AIR PUMP RELAY CONTROL -->
        <div class="card">
            <div class="card-title">
                <span>Air Pump Suction</span>
                <span class="relay-status-pill" id="pumpPill">STANDBY</span>
            </div>
            <div class="relay-container">
                <button class="relay-btn" id="vacuumToggleBtn" onclick="toggleVacuumPump()">
                    <span id="pumpIcon">🌀</span>
                    <span id="pumpBtnText">START VACUUM PUMP</span>
                </button>
            </div>
        </div>

        <!-- SMOOTH VIRTUAL TOUCH JOYSTICK -->
        <div class="card joystick-card">
            <div class="card-title">
                <span>Joystick Drive Control</span>
                <span id="actionBadge" class="badge badge-cyan">STOPPED</span>
            </div>
            
            <div class="joystick-wrapper">
                <canvas id="joystickCanvas" width="220" height="220"></canvas>
            </div>

            <div class="speed-gauge">
                <div class="speed-header">
                    <span>Motor Power (Proportional)</span>
                    <span id="speedGaugeText">0% (PWM 0)</span>
                </div>
                <div class="speed-bar-bg">
                    <div class="speed-bar-fill" id="speedBarFill"></div>
                </div>
            </div>
        </div>

        <!-- SYSTEM DIAGNOSTICS CARD -->
        <div class="card" style="grid-column: 1 / -1;">
            <div class="card-title">
                <span>System Diagnostics & Network Telemetry</span>
                <span class="badge badge-green" id="mdnsBadge">vacuum.local</span>
            </div>
            <ul class="diag-list">
                <li class="diag-item">
                    <span class="diag-label">WiFi Connection Mode:</span>
                    <span class="diag-val" id="wifiMode">Initializing...</span>
                </li>
                <li class="diag-item">
                    <span class="diag-label">Active IP Address:</span>
                    <span class="diag-val" id="ipAddr">-</span>
                </li>
                <li class="diag-item">
                    <span class="diag-label">mDNS Host URL:</span>
                    <span class="diag-val" style="color: var(--accent);">http://vacuum.local/</span>
                </li>
                <li class="diag-item">
                    <span class="diag-label">Signal Strength (RSSI):</span>
                    <span class="diag-val" id="rssiVal">- dBm</span>
                </li>
                <li class="diag-item">
                    <span class="diag-label">Vacuum Relay State:</span>
                    <span class="diag-val" id="relayStateVal">OFF</span>
                </li>
                <li class="diag-item">
                    <span class="diag-label">Joystick Vector (X, Y):</span>
                    <span class="diag-val" id="vectorVal">(0, 0)</span>
                </li>
                <li class="diag-item">
                    <span class="diag-label">System Uptime:</span>
                    <span class="diag-val" id="uptimeVal">0s</span>
                </li>
                <li class="diag-item">
                    <span class="diag-label">Free Heap Memory:</span>
                    <span class="diag-val" id="heapVal">- KB</span>
                </li>
            </ul>

            <div class="chassis-info">
                Robot Chassis Model: <strong>Marcus Lanzoni 3D Vacuum Body</strong> (<a href="https://www.thingiverse.com/thing:5116129" target="_blank">Thingiverse #5116129</a>)
            </div>
        </div>
    </div>

    <script>
        let vacuumActive = false;
        let lastSendTime = 0;
        const SEND_INTERVAL = 50; // send command every 50ms during drag

        // --- VACUUM RELAY TOGGLE ---
        function toggleVacuumPump() {
            vacuumActive = !vacuumActive;
            updateVacuumUI(vacuumActive);
            fetch(`/control?vacuum=${vacuumActive ? 1 : 0}`)
                .catch(err => console.error("Vacuum Toggle Error", err));
        }

        function updateVacuumUI(state) {
            vacuumActive = state;
            const btn = document.getElementById('vacuumToggleBtn');
            const pill = document.getElementById('pumpPill');
            const text = document.getElementById('pumpBtnText');
            
            if (state) {
                btn.classList.add('active');
                pill.innerText = "VACUUM ON";
                text.innerText = "STOP VACUUM PUMP";
            } else {
                btn.classList.remove('active');
                pill.innerText = "STANDBY";
                text.innerText = "START VACUUM PUMP";
            }
        }

        // --- VIRTUAL JOYSTICK CANVAS ---
        const canvas = document.getElementById('joystickCanvas');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = 75; // outer ring boundary

        let stickX = centerX;
        let stickY = centerY;
        let isDragging = false;

        function drawJoystick() {
            ctx.clearRect(0, 0, width, height);

            // Draw Base Outer Ring
            ctx.beginPath();
            ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 210, 255, 0.3)';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Draw Inner Target Grid
            ctx.beginPath();
            ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Connecting Drag Line if moving
            if (isDragging) {
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(stickX, stickY);
                ctx.strokeStyle = 'rgba(0, 210, 255, 0.6)';
                ctx.lineWidth = 3;
                ctx.stroke();
            }

            // Draw Stick Knob
            ctx.beginPath();
            ctx.arc(stickX, stickY, 28, 0, Math.PI * 2);
            ctx.fillStyle = isDragging ? '#00d2ff' : '#334155';
            ctx.shadowColor = isDragging ? 'rgba(0, 210, 255, 0.8)' : 'transparent';
            ctx.shadowBlur = isDragging ? 18 : 0;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.shadowBlur = 0; // reset
        }

        function handlePointerMove(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            let dx = clientX - rect.left - centerX;
            let dy = clientY - rect.top - centerY;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > maxRadius) {
                dx = (dx / distance) * maxRadius;
                dy = (dy / distance) * maxRadius;
                distance = maxRadius;
            }

            stickX = centerX + dx;
            stickY = centerY + dy;

            // Normalized X and Y (-100 to 100)
            // Note: Invert Y so up is positive forward
            let normX = Math.round((dx / maxRadius) * 100);
            let normY = Math.round((-dy / maxRadius) * 100);

            // Calculate Speed proportional to displacement distance
            let speedPercent = Math.round((distance / maxRadius) * 100);
            let speedPWM = Math.round((distance / maxRadius) * 255);

            updateSpeedDisplay(speedPercent, speedPWM, normX, normY);
            drawJoystick();

            // Send throttle control request
            const now = Date.now();
            if (now - lastSendTime > SEND_INTERVAL) {
                lastSendTime = now;
                sendJoystickVector(normX, normY, speedPWM);
            }
        }

        function resetJoystick() {
            isDragging = false;
            stickX = centerX;
            stickY = centerY;
            drawJoystick();
            updateSpeedDisplay(0, 0, 0, 0);
            sendJoystickVector(0, 0, 0);
        }

        function updateSpeedDisplay(percent, pwm, x, y) {
            document.getElementById('speedGaugeText').innerText = `${percent}% (PWM ${pwm})`;
            document.getElementById('speedBarFill').style.width = `${percent}%`;
            document.getElementById('vectorVal').innerText = `(${x}, ${y})`;
            
            const badge = document.getElementById('actionBadge');
            if (percent === 0) {
                badge.innerText = 'STOPPED';
                badge.className = 'badge badge-cyan';
            } else {
                badge.innerText = `JOYSTICK (${percent}%)`;
                badge.className = 'badge badge-green';
            }
        }

        function sendJoystickVector(x, y, speed) {
            fetch(`/control?x=${x}&y=${y}&speed=${speed}`)
                .catch(err => console.error("Joystick Command Error", err));
        }

        // Pointer / Touch / Mouse Event Listeners
        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            handlePointerMove(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) handlePointerMove(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) resetJoystick();
        });

        canvas.addEventListener('touchstart', (e) => {
            isDragging = true;
            const touch = e.touches[0];
            handlePointerMove(touch.clientX, touch.clientY);
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (isDragging) {
                const touch = e.touches[0];
                handlePointerMove(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        window.addEventListener('touchend', () => {
            if (isDragging) resetJoystick();
        });

        // --- STATUS POLLING ---
        function pollStatus() {
            fetch('/status')
                .then(res => res.json())
                .then(data => {
                    document.getElementById('wifiMode').innerText = data.wifi_mode;
                    document.getElementById('ipAddr').innerText = data.ip;
                    document.getElementById('rssiVal').innerText = data.rssi + ' dBm';
                    document.getElementById('relayStateVal').innerText = data.vacuum_status;
                    document.getElementById('uptimeVal').innerText = data.uptime + ' s';
                    document.getElementById('heapVal').innerText = Math.round(data.free_heap / 1024) + ' KB';
                    
                    if (typeof data.vacuum_relay !== 'undefined') {
                        updateVacuumUI(data.vacuum_relay);
                    }
                })
                .catch(err => console.error("Status Poll Error", err));
        }

        drawJoystick();
        setInterval(pollStatus, 1500);
        pollStatus();
    </script>
</body>
</html>
)rawliteral";

#endif // VACUUM_WEB_H
