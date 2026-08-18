#pragma once
#include <Arduino.h>

const char DASHBOARD_HTML[] PROGMEM = R"HTMLPAGE(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Laser Security Bridge v3 — Defense Console</title>
<style>
  :root{
    --bg:#070b10; --panel:#0f1722; --panel2:#09101a; --panel3:#142132; --line:#1b2a3c;
    --text:#d2deec; --dim:#657b92; --safe:#00e575; --safe-glow:rgba(0,229,117,0.25);
    --alert:#ff2b43; --alert-glow:rgba(255,43,67,0.35); --amber:#ffb31a;
    --accent:#38bdf8; --accent-glow:rgba(56,189,248,0.25); --purple:#a855f7;
    --mono:'JetBrains Mono','SF Mono',Consolas,'Roboto Mono',monospace;
    --disp:'Barlow Condensed',system-ui,-apple-system,sans-serif;
  }
  *{box-sizing:border-box;}
  body{
    margin:0; min-height:100vh; background:
      radial-gradient(1400px 800px at 50% -10%, #0d1e33 0%, var(--bg) 65%);
    color:var(--text); font-family:var(--mono); overflow-x:hidden;
    transition:background .3s ease;
  }
  body.alarm-active{
    background: radial-gradient(1400px 800px at 50% -10%, #36070c 0%, #0c0204 70%);
  }

  header{
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 24px; border-bottom:1px solid var(--line);
    background:linear-gradient(180deg,rgba(15,23,34,.95),rgba(15,23,34,.6));
    position:sticky; top:0; backdrop-filter:blur(10px); z-index:20;
  }
  .brand{display:flex; align-items:center; gap:12px;}
  .brand .dot{
    width:12px; height:12px; border-radius:50%; background:var(--safe);
    box-shadow:0 0 12px var(--safe); transition:.3s;
  }
  .brand .dot.off{background:var(--alert); box-shadow:0 0 12px var(--alert);}
  .brand h1{
    font-family:var(--disp); font-weight:800; letter-spacing:.08em;
    font-size:21px; margin:0; text-transform:uppercase;
    background:linear-gradient(90deg, #fff, var(--accent));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  }
  .brand small{display:block; color:var(--dim); font-size:11px; letter-spacing:.09em;}

  .controls{display:flex; gap:8px; align-items:center; flex-wrap:wrap;}
  button{
    font-family:var(--mono); font-size:11px; letter-spacing:.06em; text-transform:uppercase;
    border-radius:6px; border:1px solid var(--line); background:var(--panel2);
    color:var(--text); padding:8px 14px; cursor:pointer; transition:.18s ease;
    display:inline-flex; align-items:center; gap:6px; font-weight:600;
  }
  button:hover{border-color:var(--accent); color:var(--accent); transform:translateY(-1px);}
  button:active{transform:translateY(0);}

  .btn-laser{border-color:rgba(168,85,247,.5); color:#c084fc; background:rgba(168,85,247,.08);}
  .btn-laser:hover{border-color:var(--purple); color:#fff; background:rgba(168,85,247,.25);}

  .arm-btn.armed{border-color:var(--safe); color:var(--safe); background:rgba(0,229,117,.08);}
  .arm-btn.disarmed{border-color:var(--amber); color:var(--amber); background:rgba(255,179,26,.08);}
  .arm-btn.tripped{border-color:var(--alert); color:#fff; background:var(--alert); animation:pulseBtn .8s infinite;}
  @keyframes pulseBtn{0%,100%{opacity:1;}50%{opacity:.65;}}

  .nav-bar{
    max-width:1040px; margin:12px auto 0; padding:0 20px;
    display:flex; justify-content:space-between; align-items:center;
  }
  .nav-bar a{
    color:var(--accent); text-decoration:none; font-size:12px; letter-spacing:.08em;
    text-transform:uppercase; display:inline-flex; align-items:center; gap:4px;
    padding:6px 12px; border-radius:6px; background:rgba(56,189,248,.08); border:1px solid rgba(56,189,248,.2);
  }
  .nav-bar a:hover{background:rgba(56,189,248,.2); color:#fff;}

  /* Perimeter Grid */
  .stage-wrapper{
    max-width:1040px; margin:18px auto 0; padding:0 20px;
  }
  .stage{
    display:grid; grid-template-columns:1fr 1.35fr 1fr; grid-template-rows:auto auto auto;
    gap:18px; align-items:center; justify-items:center; position:relative;
    background:radial-gradient(ellipse at center, rgba(56,189,248,.04) 0%, transparent 70%);
    border:1px solid var(--line); border-radius:16px; padding:24px;
  }

  .zone{
    width:100%; border:1px solid var(--line); border-radius:12px;
    background:linear-gradient(180deg,var(--panel),var(--panel2));
    padding:14px; text-align:center; position:relative; transition:.25s ease;
    box-shadow:0 6px 18px rgba(0,0,0,.4); z-index:3;
  }
  .zone-head{display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;}
  .zone .label{
    font-family:var(--disp); font-size:16px; letter-spacing:.1em;
    font-weight:700; text-transform:uppercase; color:#fff;
  }
  .zone .pin-badge{
    font-size:10px; color:var(--dim); background:var(--panel3);
    padding:2px 6px; border-radius:4px; border:1px solid var(--line);
  }

  .zone .state-banner{
    font-size:14px; font-weight:800; letter-spacing:.08em; padding:8px 10px;
    border-radius:6px; margin-bottom:10px; text-transform:uppercase;
    transition:.2s;
  }
  .zone.safe .state-banner{
    background:var(--safe-glow); color:var(--safe); border:1px solid rgba(0,229,117,.3);
  }
  .zone.tripped{
    border-color:var(--alert); box-shadow:0 0 24px var(--alert-glow);
    animation:zoneBlink .6s infinite alternate;
  }
  .zone.tripped .state-banner{
    background:rgba(255,43,67,.2); color:var(--alert); border:1px solid var(--alert);
  }
  .zone.bypassed{opacity:.65; border-style:dashed;}
  .zone.bypassed .state-banner{
    background:rgba(101,123,146,.15); color:var(--dim); border:1px solid var(--dim);
  }
  @keyframes zoneBlink{0%{border-color:var(--alert);}100%{border-color:#ff7888;}}

  .zone-metrics{
    display:grid; grid-template-columns:1fr 1fr; gap:6px;
    font-size:11px; color:var(--dim); margin-bottom:10px; text-align:left;
    background:rgba(0,0,0,.25); padding:6px 8px; border-radius:6px;
  }
  .zone-metrics span b{color:var(--text);}

  .zone-actions{display:flex; flex-direction:column; gap:6px;}
  .btn-polarity{
    width:100%; font-size:10px; padding:6px 8px; justify-content:center;
    background:var(--panel3); border-color:var(--line); color:var(--text);
  }
  .btn-polarity:hover{border-color:var(--amber); color:var(--amber);}
  .btn-polarity.high-mode{border-color:rgba(56,189,248,.4); color:var(--accent);}

  .btn-zone-arm{
    width:100%; font-size:10px; padding:6px 8px; justify-content:center;
  }
  .btn-zone-arm.is-armed{border-color:rgba(0,229,117,.3); color:var(--safe);}
  .btn-zone-arm.is-bypassed{border-color:var(--dim); color:var(--dim);}

  #zone-north{grid-column:2; grid-row:1;}
  #zone-west {grid-column:1; grid-row:2;}
  #zone-east {grid-column:3; grid-row:2;}
  #zone-south{grid-column:2; grid-row:3;}

  /* Center Protected Hub */
  .house{
    grid-column:2; grid-row:2; display:flex; flex-direction:column; align-items:center;
    justify-content:center; z-index:2; padding:10px;
  }
  .house svg{width:135px; height:135px; filter:drop-shadow(0 0 18px rgba(56,189,248,.35)); transition:.3s;}
  .house-label{
    font-family:var(--disp); font-size:14px; letter-spacing:.18em; color:var(--accent);
    font-weight:700; text-transform:uppercase; margin-top:8px;
  }
  body.alarm-active .house svg{filter:drop-shadow(0 0 28px rgba(255,43,67,.7));}
  body.alarm-active .house-label{color:var(--alert);}

  /* Beams */
  .beam{position:absolute; background:repeating-linear-gradient(90deg, var(--accent) 0 8px, transparent 8px 16px);
    opacity:.6; z-index:1; transition:.25s;}
  .beam.tripped{background:repeating-linear-gradient(90deg, var(--alert) 0 8px, transparent 8px 16px);
    opacity:1; box-shadow:0 0 16px var(--alert); animation:beamPulse .4s linear infinite;}
  @keyframes beamPulse{0%{background-position:0 0;}100%{background-position:32px 0;}}

  #beam-north{width:4px; height:80px; left:50%; top:8%; transform:translateX(-50%);}
  #beam-south{width:4px; height:80px; left:50%; bottom:8%; transform:translateX(-50%);}
  #beam-west{height:4px; width:25%; left:17%; top:50%; transform:translateY(-50%);}
  #beam-east{height:4px; width:25%; right:17%; top:50%; transform:translateY(-50%);}

  /* Quick Actions Bar */
  .quick-bar{
    max-width:1040px; margin:16px auto 0; padding:0 20px;
    display:grid; grid-template-columns:repeat(4, 1fr); gap:12px;
  }
  .card{
    border:1px solid var(--line); border-radius:10px; background:var(--panel);
    padding:12px 14px; display:flex; flex-direction:column; justify-content:space-between;
  }
  .card .k{color:var(--dim); font-size:10px; text-transform:uppercase; letter-spacing:.08em; margin-bottom:4px;}
  .card .v{font-size:14px; font-weight:700; color:var(--text);}

  /* Troubleshooting & Diagnostics Section */
  .diag-section{
    max-width:1040px; margin:26px auto 60px; padding:0 20px;
  }
  .diag-title{
    font-family:var(--disp); font-size:18px; letter-spacing:.1em; text-transform:uppercase;
    color:var(--accent); display:flex; align-items:center; justify-content:space-between;
    margin-bottom:14px; border-bottom:1px solid var(--line); padding-bottom:8px;
  }
  .diag-grid{
    display:grid; grid-template-columns:repeat(2, 1fr); gap:14px;
  }
  .diag-card{
    border:1px solid var(--line); border-radius:10px; background:var(--panel2);
    padding:16px; transition:.2s;
  }
  .diag-card:hover{border-color:rgba(56,189,248,.3); background:var(--panel);}
  .diag-card h3{
    margin:0 0 8px; font-size:13px; font-weight:700; color:#fff; display:flex; align-items:center; gap:8px;
  }
  .diag-card .problem{font-size:11px; color:var(--alert); margin-bottom:6px;}
  .diag-card .solution{font-size:11px; color:var(--dim); line-height:1.5;}
  .diag-card .solution b{color:var(--text);}
  .diag-card code{
    background:rgba(0,0,0,.4); color:var(--amber); padding:2px 4px; border-radius:4px; font-size:10px;
  }

  .alarm-banner{
    position:fixed; top:0; left:0; right:0; padding:12px; text-align:center;
    background:var(--alert); color:#fff; font-family:var(--disp); letter-spacing:.12em;
    text-transform:uppercase; font-weight:800; font-size:17px; z-index:100; transform:translateY(-100%);
    transition:transform .25s ease; box-shadow:0 4px 20px rgba(255,43,67,.6);
  }
  .alarm-banner.show{transform:translateY(0); animation:flashBanner .8s infinite;}
  @keyframes flashBanner{0%,100%{background:var(--alert);}50%{background:#800b17;}}

  @media (max-width:840px){
    .stage{grid-template-columns:1fr 1.1fr 1fr; padding:16px 10px; gap:10px;}
    .house svg{width:90px; height:90px;}
    .quick-bar{grid-template-columns:1fr 1fr;}
    .diag-grid{grid-template-columns:1fr;}
  }
</style>
</head>
<body>
  <div class="alarm-banner" id="alarmBanner">⚠️ PERIMETER BREACH DETECTED — ALARM TRIGGERED</div>

  <header>
    <div class="brand">
      <span class="dot off" id="connDot"></span>
      <div>
        <h1>Laser Security Bridge v3</h1>
        <small id="sysState">INITIALIZING SYSTEM…</small>
      </div>
    </div>
    <div class="controls">
      <button class="btn-laser" onclick="triggerLaserTest()">🔦 Laser: <span id="laserStatus">Test Pulse</span></button>
      <button id="soundBtn" onclick="enableSound()">🔊 Web Siren</button>
      <button id="muteBtn" onclick="toggleMute()">🔈 Mute</button>
      <button id="resetAlarmBtn" onclick="resetAlarm()">🔄 Reset Alarm</button>
      <button id="armBtn" class="arm-btn" onclick="toggleArm()">DISARM</button>
    </div>
  </header>

  <div class="nav-bar">
    <div style="font-size:11px; color:var(--dim);">
      Status: <span id="defenseMode" style="color:var(--safe); font-weight:700;">PERIMETER SECURE</span>
    </div>
    <a href="/config">⚙ System Settings & Pins →</a>
  </div>

  <div class="stage-wrapper">
    <div class="stage">
      <!-- NORTH ZONE -->
      <div class="zone safe" id="zone-north">
        <div class="zone-head">
          <span class="label">North Zone</span>
          <span class="pin-badge" id="pin-0">D2 (GPIO4)</span>
        </div>
        <div class="state-banner">SAFE</div>
        <div class="zone-metrics">
          <span>Signal: <b id="raw-0">LOW (0)</b></span>
          <span>Trips: <b id="trips-0">0</b></span>
        </div>
        <div class="zone-actions">
          <button class="btn-polarity" id="pol-btn-0" onclick="togglePolarity(0)">
            ⚡ Trips when signal goes HIGH
          </button>
          <button class="btn-zone-arm is-armed" id="arm-btn-0" onclick="toggleZoneArm(0)">
            🛡️ Zone: Armed
          </button>
        </div>
      </div>

      <!-- WEST ZONE -->
      <div class="zone safe" id="zone-west">
        <div class="zone-head">
          <span class="label">West Zone</span>
          <span class="pin-badge" id="pin-3">D7 (GPIO13)</span>
        </div>
        <div class="state-banner">SAFE</div>
        <div class="zone-metrics">
          <span>Signal: <b id="raw-3">LOW (0)</b></span>
          <span>Trips: <b id="trips-3">0</b></span>
        </div>
        <div class="zone-actions">
          <button class="btn-polarity" id="pol-btn-3" onclick="togglePolarity(3)">
            ⚡ Trips when signal goes HIGH
          </button>
          <button class="btn-zone-arm is-armed" id="arm-btn-3" onclick="toggleZoneArm(3)">
            🛡️ Zone: Armed
          </button>
        </div>
      </div>

      <!-- CENTER HUB -->
      <div class="house">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <polygon points="50,10 92,44 84,44 84,90 16,90 16,44 8,44" fill="none" stroke="#38bdf8" stroke-width="2.8" stroke-linejoin="round"/>
          <rect x="42" y="60" width="16" height="30" fill="none" stroke="#38bdf8" stroke-width="2.2"/>
          <rect x="24" y="50" width="12" height="12" fill="none" stroke="#38bdf8" stroke-width="1.8"/>
          <rect x="64" y="50" width="12" height="12" fill="none" stroke="#38bdf8" stroke-width="1.8"/>
          <circle cx="50" cy="30" r="6" fill="none" stroke="#38bdf8" stroke-width="1.8"/>
        </svg>
        <div class="house-label">Protected Core</div>
      </div>

      <!-- EAST ZONE -->
      <div class="zone safe" id="zone-east">
        <div class="zone-head">
          <span class="label">East Zone</span>
          <span class="pin-badge" id="pin-1">D5 (GPIO14)</span>
        </div>
        <div class="state-banner">SAFE</div>
        <div class="zone-metrics">
          <span>Signal: <b id="raw-1">LOW (0)</b></span>
          <span>Trips: <b id="trips-1">0</b></span>
        </div>
        <div class="zone-actions">
          <button class="btn-polarity" id="pol-btn-1" onclick="togglePolarity(1)">
            ⚡ Trips when signal goes HIGH
          </button>
          <button class="btn-zone-arm is-armed" id="arm-btn-1" onclick="toggleZoneArm(1)">
            🛡️ Zone: Armed
          </button>
        </div>
      </div>

      <!-- SOUTH ZONE -->
      <div class="zone safe" id="zone-south">
        <div class="zone-head">
          <span class="label">South Zone</span>
          <span class="pin-badge" id="pin-2">D6 (GPIO12)</span>
        </div>
        <div class="state-banner">SAFE</div>
        <div class="zone-metrics">
          <span>Signal: <b id="raw-2">LOW (0)</b></span>
          <span>Trips: <b id="trips-2">0</b></span>
        </div>
        <div class="zone-actions">
          <button class="btn-polarity" id="pol-btn-2" onclick="togglePolarity(2)">
            ⚡ Trips when signal goes HIGH
          </button>
          <button class="btn-zone-arm is-armed" id="arm-btn-2" onclick="toggleZoneArm(2)">
            🛡️ Zone: Armed
          </button>
        </div>
      </div>

      <!-- BEAMS -->
      <div class="beam" id="beam-north"></div>
      <div class="beam" id="beam-south"></div>
      <div class="beam" id="beam-west"></div>
      <div class="beam" id="beam-east"></div>
    </div>
  </div>

  <!-- Quick Info Bar -->
  <div class="quick-bar">
    <div class="card"><div class="k">Active Network / IP</div><div class="v" id="netInfo">—</div></div>
    <div class="card"><div class="k">Laser Emitter Pin</div><div class="v" id="laserPinInfo">D8 (Active)</div></div>
    <div class="card"><div class="k">Physical Buzzer</div><div class="v" id="buzzInfo">Enabled</div></div>
    <div class="card"><div class="k">System Uptime</div><div class="v" id="upInfo">0h 0m 0s</div></div>
  </div>

  <!-- Troubleshooting & Diagnostics Hub -->
  <div class="diag-section">
    <div class="diag-title">
      <span>🛠️ Hardware Troubleshooting & Future Issues Guide</span>
      <span style="font-size:11px; color:var(--dim);">Self-Diagnostics & Fault Isolation</span>
    </div>
    <div class="diag-grid">
      <div class="diag-card">
        <h3>☀️ 1. Sunlight & Ambient Optical Glare</h3>
        <div class="problem"><b>Issue:</b> False alarms occur during direct sunrise/sunset or room lights turning ON.</div>
        <div class="solution">
          <b>Fix:</b> Shroud the LDR sensor in a 1.5cm length of black heat-shrink tubing or a matte straw to shield ambient scatter.
          Turn the LM393 trimmer counter-clockwise until the DO LED turns OFF in normal ambient light.
        </div>
      </div>

      <div class="diag-card">
        <h3>🔀 2. Inverted Trip Polarity (HIGH vs LOW)</h3>
        <div class="problem"><b>Issue:</b> Card shows "BEAM BROKEN" when laser hits receiver and "SAFE" when beam is cut.</div>
        <div class="solution">
          <b>Fix:</b> Click the <code>⚡ Trips when signal goes HIGH / LOW</code> button on that zone's card above.
          It toggles instant software inversion on the ESP8266 without requiring rewiring or reboot!
        </div>
      </div>

      <div class="diag-card">
        <h3>📐 3. Laser Misalignment & Thermal Drift</h3>
        <div class="problem"><b>Issue:</b> Beam drifts off the LDR target after temperature changes or wind vibration.</div>
        <div class="solution">
          <b>Fix:</b> Use rigid laser brackets. Increase the <b>Debounce Filter</b> in Settings (e.g. <code>25ms - 50ms</code>)
          to reject transient micro-vibrations from footsteps or moving curtains.
        </div>
      </div>

      <div class="diag-card">
        <h3>⚡ 4. ESP8266 Boot-Strapping Pin Traps</h3>
        <div class="problem"><b>Issue:</b> Board fails to boot or hangs in flashing mode after connecting sensor wires.</div>
        <div class="solution">
          <b>Fix:</b> ESP8266 pins <code>D3 (GPIO0)</code> and <code>D4 (GPIO2)</code> must remain HIGH at boot, while <code>D8 (GPIO15)</code> must be LOW.
          Always use <b>D1, D2, D5, D6, D7</b> for sensor inputs. Safe analog input is on <b>A0</b>.
        </div>
      </div>

      <div class="diag-card">
        <h3>🔋 5. Laser Diode Dimming & Power Drops</h3>
        <div class="problem"><b>Issue:</b> Laser brightness drops over time or when buzzer sounds, causing erratic trips.</div>
        <div class="solution">
          <b>Fix:</b> Ensure 5V USB power supply provides ≥1.5A. Power lasers and active buzzer from the 5V/VIN rail rather than the ESP 3.3V LDO regulator.
        </div>
      </div>

      <div class="diag-card">
        <h3>🌐 6. WiFi Disconnect & mDNS Resolution</h3>
        <div class="problem"><b>Issue:</b> Cannot open <code>http://laser.local/</code> from Android phone or Windows PC.</div>
        <div class="solution">
          <b>Fix:</b> Windows: Run <code>ipconfig /flushdns</code>. On Android/Chrome, mDNS may not resolve — connect to the Fallback AP <code>lasor</code> at <code>http://192.168.4.1/</code>.
        </div>
      </div>
    </div>
  </div>

<script>
let ws, armed = true, connected = false;
let audioCtx = null, sirenOsc = null, sirenGain = null, sirenInterval = null;
let soundEnabled = false, muted = false;
let currentZones = [];

const zoneOrder = ['north', 'east', 'south', 'west'];

function connectWS(){
  ws = new WebSocket('ws://' + location.hostname + ':81/');
  ws.onopen = () => {
    connected = true;
    document.getElementById('connDot').classList.remove('off');
    document.getElementById('sysState').textContent = 'REALTIME DEFENSE LINK ONLINE';
  };
  ws.onclose = () => {
    connected = false;
    document.getElementById('connDot').classList.add('off');
    document.getElementById('sysState').textContent = 'DISCONNECTED — RECONNECTING…';
    setTimeout(connectWS, 2000);
  };
  ws.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      if (data.type === 'status') updateUI(data);
    } catch(e){}
  };
}

function updateUI(data){
  armed = data.armed;
  currentZones = data.zones || [];
  let anyAlarm = false;

  const zoneMap = [
    { elId: 'zone-north', beamId: 'beam-north', idx: 0 },
    { elId: 'zone-east',  beamId: 'beam-east',  idx: 1 },
    { elId: 'zone-south', beamId: 'beam-south', idx: 2 },
    { elId: 'zone-west',  beamId: 'beam-west',  idx: 3 }
  ];

  zoneMap.forEach(z => {
    const zData = currentZones[z.idx];
    if (!zData) return;

    const el = document.getElementById(z.elId);
    const beam = document.getElementById(z.beamId);
    const isTripped = zData.tripped;
    const isZoneArmed = zData.armed;

    if (isTripped && isZoneArmed && armed) anyAlarm = true;

    el.classList.toggle('tripped', isTripped);
    el.classList.toggle('safe', !isTripped && isZoneArmed);
    el.classList.toggle('bypassed', !isZoneArmed);

    const banner = el.querySelector('.state-banner');
    if (!isZoneArmed) {
      banner.textContent = 'BYPASSED / DISARMED';
    } else {
      banner.textContent = isTripped ? 'BEAM BROKEN' : 'SAFE';
    }

    beam.classList.toggle('tripped', isTripped);

    // Update metrics
    document.getElementById('raw-' + z.idx).textContent = zData.isAnalog ?
      `ADC: ${zData.raw}` : (zData.raw === 1 ? 'HIGH (1)' : 'LOW (0)');
    document.getElementById('trips-' + z.idx).textContent = zData.trips || 0;
    document.getElementById('pin-' + z.idx).textContent = `${zData.pin} [${zData.isAnalog ? 'Analog' : 'Digital'}]`;

    // Polarity button label
    const polBtn = document.getElementById('pol-btn-' + z.idx);
    polBtn.textContent = zData.actLow ? '⚡ Trips when signal goes LOW' : '⚡ Trips when signal goes HIGH';
    polBtn.classList.toggle('high-mode', !zData.actLow);

    // Zone Arm button
    const armBtn = document.getElementById('arm-btn-' + z.idx);
    armBtn.textContent = isZoneArmed ? '🛡️ Zone: Armed' : '⚪ Zone: Bypassed';
    armBtn.className = 'btn-zone-arm ' + (isZoneArmed ? 'is-armed' : 'is-bypassed');
  });

  const alarmOn = anyAlarm;
  document.body.classList.toggle('alarm-active', alarmOn);
  document.getElementById('alarmBanner').classList.toggle('show', alarmOn);

  const mainArmBtn = document.getElementById('armBtn');
  mainArmBtn.textContent = armed ? 'DISARM SYSTEM' : 'ARM SYSTEM';
  mainArmBtn.className = 'arm-btn ' + (alarmOn ? 'tripped' : (armed ? 'armed' : 'disarmed'));

  document.getElementById('sysState').textContent =
    alarmOn ? '🚨 ALARM ACTIVE — PERIMETER BREACH' : (armed ? 'ARMED — 4 ZONES MONITORING' : 'SYSTEM DISARMED');
  document.getElementById('defenseMode').textContent =
    alarmOn ? '⚠️ INTRUSION DETECTED' : (armed ? 'PERIMETER SECURE' : 'MONITORING PAUSED');
  document.getElementById('defenseMode').style.color =
    alarmOn ? 'var(--alert)' : (armed ? 'var(--safe)' : 'var(--amber)');

  document.getElementById('netInfo').textContent = `${data.net || '—'} (${data.ip || ''})`;
  document.getElementById('laserPinInfo').textContent = `${data.laserPin || 'NONE'} (${data.laserState ? 'ON' : 'OFF'})`;
  document.getElementById('buzzInfo').textContent = data.buzzer ? 'Enabled' : 'Muted';

  if (data.uptime !== undefined) {
    const s = data.uptime;
    document.getElementById('upInfo').textContent =
      Math.floor(s/3600)+'h '+Math.floor((s%3600)/60)+'m '+Math.floor(s%60)+'s';
  }

  if (alarmOn && soundEnabled && !muted) startSiren(); else stopSiren();
}

function togglePolarity(zoneIndex){
  if (ws && connected) {
    ws.send(JSON.stringify({ cmd: 'set_polarity', zone: zoneIndex }));
  }
}

function toggleZoneArm(zoneIndex){
  if (ws && connected) {
    ws.send(JSON.stringify({ cmd: 'toggle_zone', zone: zoneIndex }));
  }
}

function triggerLaserTest(){
  if (ws && connected) {
    ws.send(JSON.stringify({ cmd: 'laser_trigger' }));
    const lStat = document.getElementById('laserStatus');
    lStat.textContent = 'PULSING…';
    setTimeout(() => { lStat.textContent = 'Test Pulse'; }, 3000);
  }
}

function resetAlarm(){
  if (ws && connected) {
    ws.send(JSON.stringify({ cmd: 'reset_alarm' }));
  }
}

function toggleArm(){
  if (!ws || !connected) return;
  if (armed) {
    const pin = prompt('Enter Security PIN to Disarm (leave blank or default 1234):', '');
    if (pin !== null) {
      ws.send(JSON.stringify({ cmd: 'disarm', pin: pin.trim() }));
    }
  } else {
    ws.send(JSON.stringify({ cmd: 'arm' }));
  }
}

function toggleMute(){
  muted = !muted;
  document.getElementById('muteBtn').textContent = muted ? '🔇 Muted' : '🔈 Mute';
  if (muted) stopSiren();
}

function enableSound(){
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  soundEnabled = true;
  const b = document.getElementById('soundBtn');
  b.textContent = '🔊 Siren Active'; b.disabled = true;
}

function startSiren(){
  if (!audioCtx || sirenOsc) return;
  sirenOsc = audioCtx.createOscillator();
  sirenGain = audioCtx.createGain();
  sirenOsc.type = 'sawtooth';
  sirenGain.gain.value = 0.28;
  sirenOsc.connect(sirenGain).connect(audioCtx.destination);
  sirenOsc.start();
  let up = true;
  sirenInterval = setInterval(() => {
    if (!sirenOsc) return;
    sirenOsc.frequency.setValueAtTime(up ? 1300 : 700, audioCtx.currentTime);
    up = !up;
  }, 260);
}

function stopSiren(){
  if (sirenOsc){ sirenOsc.stop(); sirenOsc.disconnect(); sirenOsc = null; }
  if (sirenInterval){ clearInterval(sirenInterval); sirenInterval = null; }
}

window.onload = connectWS;
</script>
</body>
</html>
)HTMLPAGE";
