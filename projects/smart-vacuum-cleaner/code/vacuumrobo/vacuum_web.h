// Smart Vacuum Cleaner Robot - Web Interface & PROGMEM HTML Dashboard

#ifndef VACUUM_WEB_H
#define VACUUM_WEB_H

#include <Arduino.h>

// HTML5 + CSS3 + Vanilla JavaScript Web Dashboard stored in flash PROGMEM
const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Smart Vacuum Cleaner Control Panel</title>
    <style>
        :root {
            /* DARK THEME (DEFAULT) */
            --bg-color: #0b1329;
            --card-bg: #142242;
            --card-border: rgba(255, 255, 255, 0.08);
            --accent: #00d2ff;
            --accent-glow: rgba(0, 210, 255, 0.4);
            --success: #10b981;
            --success-glow: rgba(16, 185, 129, 0.4);
            --warning: #f59e0b;
            --danger: #ef4444;
            --danger-glow: rgba(239, 68, 68, 0.4);
            --text: #f1f5f9;
            --subtext: #94a3b8;
            --gauge-bg: #1e293b;
            --joystick-bg: radial-gradient(circle, #101c38 0%, #0a1020 100%);
            --joystick-border: rgba(0, 210, 255, 0.35);
            --badge-bg: rgba(255, 255, 255, 0.06);
        }

        [data-theme="light"] {
            /* LIGHT THEME */
            --bg-color: #f1f5f9;
            --card-bg: #ffffff;
            --card-border: rgba(0, 0, 0, 0.08);
            --accent: #0284c7;
            --accent-glow: rgba(2, 132, 199, 0.25);
            --success: #059669;
            --success-glow: rgba(5, 150, 105, 0.25);
            --warning: #d97706;
            --danger: #dc2626;
            --danger-glow: rgba(220, 38, 38, 0.25);
            --text: #0f172a;
            --subtext: #64748b;
            --gauge-bg: #e2e8f0;
            --joystick-bg: radial-gradient(circle, #f8fafc 0%, #e2e8f0 100%);
            --joystick-border: rgba(2, 132, 199, 0.4);
            --badge-bg: rgba(0, 0, 0, 0.05);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
            user-select: none;
            -webkit-user-select: none;
            touch-action: manipulation;
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
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
            width: 100%;
            max-width: 900px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.2rem;
            padding: 0.5rem 0;
        }

        .header-title h1 {
            font-size: 1.6rem;
            color: var(--accent);
            display: flex;
            align-items: center;
            gap: 0.6rem;
            text-shadow: 0 0 12px var(--accent-glow);
        }

        .header-title p {
            font-size: 0.82rem;
            color: var(--subtext);
            margin-top: 0.2rem;
        }

        .theme-toggle-btn {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            color: var(--text);
            padding: 0.55rem 1rem;
            border-radius: 12px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .theme-toggle-btn:hover {
            border-color: var(--accent);
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
            box-shadow: 0 12px 30px rgba(0,0,0,0.15);
            border: 1px solid var(--card-border);
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
        }

        .card-title {
            width: 100%;
            font-size: 0.95rem;
            font-weight: 700;
            color: var(--subtext);
            margin-bottom: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* VACUUM RELAY CARD */
        .relay-btn {
            width: 100%;
            padding: 1.2rem;
            border-radius: 16px;
            border: 2px solid var(--card-border);
            background: var(--gauge-bg);
            color: var(--text);
            font-size: 1.05rem;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.8rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .relay-btn.active {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            border-color: #34d399;
            box-shadow: 0 0 25px var(--success-glow);
            color: #ffffff;
        }

        .status-pill {
            font-size: 0.75rem;
            padding: 4px 10px;
            border-radius: 20px;
            background: var(--badge-bg);
            color: var(--subtext);
            font-weight: 600;
            letter-spacing: 0.5px;
        }

        /* OBSTACLE ALERT BANNER */
        .obstacle-banner {
            width: 100%;
            padding: 0.75rem 1rem;
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid var(--danger);
            border-radius: 12px;
            color: var(--danger);
            font-weight: bold;
            font-size: 0.85rem;
            display: none;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            animation: pulseAlert 1.5s infinite;
        }
        @keyframes pulseAlert {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        /* LARGE PRECISION JOYSTICK */
        .joystick-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .joystick-wrapper {
            position: relative;
            width: 300px;
            height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: none;
            margin: 0.5rem 0;
        }

        #joystickCanvas {
            width: 300px;
            height: 300px;
            border-radius: 50%;
            background: var(--joystick-bg);
            border: 3px solid var(--joystick-border);
            box-shadow: inset 0 0 25px rgba(0,0,0,0.5), 0 0 20px var(--accent-glow);
            cursor: pointer;
        }

        /* SPEED GAUGE & DUAL MOTOR METERS */
        .speed-gauge-section {
            width: 100%;
            margin-top: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .speed-header {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--subtext);
        }

        .progress-bar-bg {
            width: 100%;
            height: 12px;
            background: var(--gauge-bg);
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--card-border);
        }

        .progress-bar-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #00d2ff 0%, #3b82f6 100%);
            border-radius: 10px;
            transition: width 0.1s linear;
        }

        .dual-motor-meters {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
            width: 100%;
            margin-top: 0.2rem;
        }

        .motor-meter {
            background: var(--badge-bg);
            padding: 0.6rem;
            border-radius: 10px;
            border: 1px solid var(--card-border);
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
        }
        .motor-meter-header {
            display: flex;
            justify-content: space-between;
            font-size: 0.75rem;
            color: var(--subtext);
        }

        /* DIAGNOSTICS & TELEMETRY LIST */
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
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 700;
        }
        .badge-cyan { background: rgba(0, 210, 255, 0.15); color: var(--accent); border: 1px solid rgba(0, 210, 255, 0.3); }
        .badge-green { background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-danger { background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); }
        .badge-warning { background: rgba(245, 158, 11, 0.15); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.3); }

        .chassis-footer {
            width: 100%;
            margin-top: 1rem;
            padding: 0.75rem;
            background: var(--badge-bg);
            border-radius: 10px;
            border: 1px dashed var(--card-border);
            font-size: 0.78rem;
            color: var(--subtext);
            text-align: center;
        }
        .chassis-footer a { color: var(--accent); text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>

    <header>
        <div class="header-title">
            <h1>🧹 Smart Vacuum Robot</h1>
            <p>Thingiverse 5116129 Body • Multi-WiFi & Precision Control</p>
        </div>
        <button class="theme-toggle-btn" onclick="toggleTheme()">
            <span id="themeIcon">🌙</span>
            <span id="themeText">Dark Mode</span>
        </button>
    </header>

    <div class="dashboard-grid">

        <!-- AIR PUMP SUCTION RELAY -->
        <div class="card">
            <div class="card-title">
                <span>Air Pump Suction</span>
                <span class="status-pill" id="pumpPill">STANDBY</span>
            </div>
            <button class="relay-btn" id="vacuumToggleBtn" onclick="toggleVacuumPump()">
                <span id="pumpIcon">🌀</span>
                <span id="pumpBtnText">START VACUUM PUMP</span>
            </button>
        </div>

        <!-- DUAL ULTRASONIC SENSORS MONITOR -->
        <div class="card">
            <div class="card-title">
                <span>Ultrasonic Sensors (Auto-Detect)</span>
                <span class="badge badge-cyan" id="obstacleStatusBadge">CLEAR</span>
            </div>

            <div class="obstacle-banner" id="obstacleBanner">
                <span>⚠️ OBSTACLE DETECTED! FORWARD MOTION INHIBITED</span>
            </div>

            <ul class="diag-list">
                <li class="diag-item">
                    <span class="diag-label">Sensor 1 (Front Left):</span>
                    <span class="badge badge-cyan" id="sensor1Badge">Connecting...</span>
                </li>
                <li class="diag-item">
                    <span class="diag-label">Sensor 2 (Front Right):</span>
                    <span class="badge badge-cyan" id="sensor2Badge">Connecting...</span>
                </li>
            </ul>
        </div>

        <!-- HIGH-PRECISION 300px JOYSTICK -->
        <div class="card joystick-card" style="grid-column: 1 / -1;">
            <div class="card-title">
                <span>Precision Joystick Drive Control (Deadman Switch)</span>
                <span id="actionBadge" class="badge badge-cyan">STOPPED</span>
            </div>
            
            <div class="joystick-wrapper">
                <canvas id="joystickCanvas" width="300" height="300"></canvas>
            </div>

            <div class="speed-gauge-section">
                <div class="speed-header">
                    <span>Overall Power Displacement</span>
                    <span id="speedGaugeText">0% (PWM 0)</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" id="speedBarFill"></div>
                </div>

                <div class="dual-motor-meters">
                    <div class="motor-meter">
                        <div class="motor-meter-header">
                            <span>Left Motor</span>
                            <span id="leftMotorVal">PWM 0</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" id="leftMotorFill"></div>
                        </div>
                    </div>
                    <div class="motor-meter">
                        <div class="motor-meter-header">
                            <span>Right Motor</span>
                            <span id="rightMotorVal">PWM 0</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" id="rightMotorFill"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- SYSTEM DIAGNOSTICS & RESET REASON CARD -->
        <div class="card" style="grid-column: 1 / -1;">
            <div class="card-title">
                <span>System Telemetry & Hardware Diagnostics</span>
                <span class="badge badge-green" id="mdnsBadge">vacuum.local</span>
            </div>
            <ul class="diag-list">
                <li class="diag-item">
                    <span class="diag-label">ESP8266 Reset Reason:</span>
                    <span class="diag-val" style="color: var(--warning);" id="resetReasonVal">Fetching...</span>
                </li>
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

            <div class="chassis-footer">
                Chassis 3D Reference: <strong>Marcus Lanzoni Vacuum Cleaner</strong> (<a href="https://www.thingiverse.com/thing:5116129" target="_blank">Thingiverse #5116129</a>)
            </div>
        </div>
    </div>

    <script>
        // --- THEME SWITCHER (DARK / LIGHT) ---
        let currentTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeUI();

        function toggleTheme() {
            currentTheme = (currentTheme === 'dark') ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', currentTheme);
            localStorage.setItem('theme', currentTheme);
            updateThemeUI();
            drawJoystick();
        }

        function updateThemeUI() {
            const icon = document.getElementById('themeIcon');
            const text = document.getElementById('themeText');
            if (currentTheme === 'light') {
                icon.innerText = '☀️';
                text.innerText = 'Light Mode';
            } else {
                icon.innerText = '🌙';
                text.innerText = 'Dark Mode';
            }
        }

        // --- VACUUM RELAY TOGGLE ---
        let vacuumActive = false;
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

        // --- ENLARGED 300px PRECISION JOYSTICK DRIVE ---
        const canvas = document.getElementById('joystickCanvas');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = 110;  // enlarged boundary radius
        const deadZone = 12;     // 10% deadzone radius

        let stickX = centerX;
        let stickY = centerY;
        let isDragging = false;
        let lastSendTime = 0;
        const SEND_INTERVAL = 40; // 40ms stream interval (~25Hz)

        function drawJoystick() {
            ctx.clearRect(0, 0, width, height);

            const isLight = (currentTheme === 'light');
            const primaryColor = isLight ? '#0284c7' : '#00d2ff';
            const ringColor = isLight ? 'rgba(2, 132, 199, 0.3)' : 'rgba(0, 210, 255, 0.3)';
            const knobFill = isDragging ? primaryColor : (isLight ? '#94a3b8' : '#334155');

            // Draw Outer Ring Boundary
            ctx.beginPath();
            ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
            ctx.strokeStyle = ringColor;
            ctx.lineWidth = 5;
            ctx.stroke();

            // Draw Deadzone Center Ring
            ctx.beginPath();
            ctx.arc(centerX, centerY, deadZone, 0, Math.PI * 2);
            ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Vector Drag Line
            if (isDragging) {
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(stickX, stickY);
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 4;
                ctx.stroke();
            }

            // Draw Knob
            ctx.beginPath();
            ctx.arc(stickX, stickY, 36, 0, Math.PI * 2); // 36px knob
            ctx.fillStyle = knobFill;
            ctx.shadowColor = isDragging ? primaryColor : 'transparent';
            ctx.shadowBlur = isDragging ? 22 : 0;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3.5;
            ctx.stroke();
            ctx.shadowBlur = 0;
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

            // Vector math (-100 to +100)
            let normX = Math.round((dx / maxRadius) * 100);
            let normY = Math.round((-dy / maxRadius) * 100); // Invert Y so up is positive

            // Deadman Switch / Deadzone Check
            let speedPercent = 0;
            let speedPWM = 0;

            if (distance > deadZone) {
                // Map displacement cleanly starting from 50 PWM up to 255 PWM!
                let ratio = (distance - deadZone) / (maxRadius - deadZone);
                speedPercent = Math.round(ratio * 100);
                speedPWM = Math.round(50 + ratio * (255 - 50));
            } else {
                normX = 0;
                normY = 0;
            }

            updateSpeedDisplay(speedPercent, speedPWM, normX, normY);
            drawJoystick();

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
                .catch(err => console.error("Joystick Send Error", err));
        }

        // Pointer Event Listeners (Mouse & Touch)
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

        // --- SYSTEM STATUS TELEMETRY POLLING ---
        function pollStatus() {
            fetch('/status')
                .then(res => res.json())
                .then(data => {
                    document.getElementById('resetReasonVal').innerText = data.reset_reason || 'Normal Boot';
                    document.getElementById('wifiMode').innerText = data.wifi_mode || '-';
                    document.getElementById('ipAddr').innerText = data.ip || '-';
                    document.getElementById('rssiVal').innerText = (data.rssi || 0) + ' dBm';
                    document.getElementById('uptimeVal').innerText = (data.uptime || 0) + ' s';
                    document.getElementById('heapVal').innerText = Math.round((data.free_heap || 0) / 1024) + ' KB';

                    // Update Motor Meters
                    if (typeof data.left_motor_pwm !== 'undefined') {
                        document.getElementById('leftMotorVal').innerText = `PWM ${data.left_motor_pwm}`;
                        document.getElementById('leftMotorFill').style.width = `${Math.round((data.left_motor_pwm / 255) * 100)}%`;
                    }
                    if (typeof data.right_motor_pwm !== 'undefined') {
                        document.getElementById('rightMotorVal').innerText = `PWM ${data.right_motor_pwm}`;
                        document.getElementById('rightMotorFill').style.width = `${Math.round((data.right_motor_pwm / 255) * 100)}%`;
                    }

                    // Update Dual Ultrasonic Sensors Status
                    const s1Badge = document.getElementById('sensor1Badge');
                    if (data.sensor1_connected) {
                        s1Badge.innerText = `${data.sensor1_dist_cm} cm`;
                        s1Badge.className = 'badge badge-green';
                    } else {
                        s1Badge.innerText = 'NOT CONNECTED';
                        s1Badge.className = 'badge badge-warning';
                    }

                    const s2Badge = document.getElementById('sensor2Badge');
                    if (data.sensor2_connected) {
                        s2Badge.innerText = `${data.sensor2_dist_cm} cm`;
                        s2Badge.className = 'badge badge-green';
                    } else {
                        s2Badge.innerText = 'NOT CONNECTED';
                        s2Badge.className = 'badge badge-warning';
                    }

                    // Obstacle Alert Banner
                    const obsBanner = document.getElementById('obstacleBanner');
                    const obsStatusBadge = document.getElementById('obstacleStatusBadge');
                    if (data.obstacle_detected) {
                        obsBanner.style.display = 'flex';
                        obsStatusBadge.innerText = 'OBSTACLE NEAR';
                        obsStatusBadge.className = 'badge badge-danger';
                    } else {
                        obsBanner.style.display = 'none';
                        obsStatusBadge.innerText = 'CLEAR';
                        obsStatusBadge.className = 'badge badge-cyan';
                    }

                    if (typeof data.vacuum_relay !== 'undefined') {
                        updateVacuumUI(data.vacuum_relay);
                    }
                })
                .catch(err => console.error("Status Poll Error", err));
        }

        drawJoystick();
        setInterval(pollStatus, 1200);
        pollStatus();
    </script>
</body>
</html>
)rawliteral";

void initWebServer();
void updateWebServer();

#endif // VACUUM_WEB_H
