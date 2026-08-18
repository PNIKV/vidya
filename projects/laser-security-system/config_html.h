#pragma once
#include <Arduino.h>

const char CONFIG_HTML[] PROGMEM = R"HTMLPAGE(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Laser Security Bridge v3 — Configuration</title>
<style>
  :root{
    --bg:#070b10; --panel:#0f1722; --panel2:#09101a; --panel3:#142132; --line:#1b2a3c;
    --text:#d2deec; --dim:#657b92; --safe:#00e575; --alert:#ff2b43; --amber:#ffb31a;
    --accent:#38bdf8; --purple:#a855f7;
    --mono:'JetBrains Mono','SF Mono',Consolas,'Roboto Mono',monospace;
    --disp:'Barlow Condensed',system-ui,-apple-system,sans-serif;
  }
  *{box-sizing:border-box;}
  body{margin:0; background:var(--bg); color:var(--text); font-family:var(--mono); min-height:100vh;}
  header{
    padding:16px 24px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center;
    background:linear-gradient(180deg,rgba(15,23,34,.95),rgba(15,23,34,.6)); position:sticky; top:0; backdrop-filter:blur(8px); z-index:10;
  }
  h1{font-family:var(--disp); text-transform:uppercase; letter-spacing:.08em; font-size:21px; margin:0; color:#fff;}
  nav a{
    color:var(--accent); text-decoration:none; font-size:12px; letter-spacing:.08em; text-transform:uppercase;
    padding:6px 12px; border-radius:6px; background:rgba(56,189,248,.08); border:1px solid rgba(56,189,248,.2);
  }
  nav a:hover{background:rgba(56,189,248,.2); color:#fff;}

  main{max-width:760px; margin:0 auto; padding:24px 20px 80px;}
  section{border:1px solid var(--line); border-radius:12px; background:var(--panel2); padding:20px; margin-bottom:22px; box-shadow:0 4px 14px rgba(0,0,0,.3);}
  section h2{
    font-family:var(--disp); font-size:17px; letter-spacing:.08em; text-transform:uppercase;
    color:var(--accent); margin:0 0 14px; display:flex; align-items:center; justify-content:space-between;
  }
  p.desc{color:var(--dim); font-size:11px; margin-top:-6px; margin-bottom:14px; line-height:1.5;}

  label{display:block; font-size:11px; color:var(--dim); text-transform:uppercase; letter-spacing:.06em; margin:12px 0 4px;}
  input[type=text], input[type=password], input[type=number], select{
    width:100%; padding:9px 12px; background:var(--panel); border:1px solid var(--line); border-radius:6px;
    color:var(--text); font-family:var(--mono); font-size:13px; transition:.15s;
  }
  input:focus, select:focus{outline:none; border-color:var(--accent); box-shadow:0 0 8px rgba(56,189,248,.2);}

  .row{display:grid; grid-template-columns:1fr 1fr; gap:12px;}
  .row-3{display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;}

  /* Zone Config Cards */
  .zone-card{
    border:1px solid var(--line); border-radius:8px; background:var(--panel);
    padding:14px; margin-bottom:12px;
  }
  .zone-card-title{
    font-family:var(--disp); font-size:15px; font-weight:700; color:#fff;
    margin-bottom:10px; text-transform:uppercase; letter-spacing:.06em;
    display:flex; justify-content:space-between; align-items:center;
  }
  .analog-box{
    margin-top:10px; padding:10px; background:rgba(0,0,0,.3); border-radius:6px; border:1px dashed var(--line);
  }

  .netblock{border-top:1px dashed var(--line); padding-top:12px; margin-top:12px;}
  .netblock:first-child{border-top:none; margin-top:0; padding-top:0;}
  .checkline{display:flex; align-items:center; gap:10px; margin-top:14px;}
  .checkline input{width:auto; cursor:pointer;}
  .checkline label{margin:0; cursor:pointer; color:var(--text);}

  button{
    font-family:var(--mono); font-size:11px; text-transform:uppercase; letter-spacing:.06em;
    border-radius:6px; border:1px solid var(--accent); background:transparent; color:var(--accent);
    padding:10px 18px; cursor:pointer; font-weight:700; transition:.15s;
  }
  button:hover{background:var(--accent); color:#04121f;}
  button.secondary{border-color:var(--line); color:var(--dim);}
  button.secondary:hover{border-color:var(--accent); color:var(--accent); background:transparent;}

  .save-bar{
    position:sticky; bottom:0; background:rgba(7,11,16,.95); backdrop-filter:blur(8px);
    padding:16px 20px; border-top:1px solid var(--line); margin:0 -20px -80px;
    display:flex; justify-content:space-between; align-items:center; z-index:15;
  }
  .save-bar button{
    background:var(--safe); border-color:var(--safe); color:#03180c; font-size:12px; padding:12px 24px;
  }
  .save-bar button:hover{background:#00ff83; border-color:#00ff83;}
  #saveStatus{font-size:12px; color:var(--dim);}

  .pin-tip{font-size:10px; color:var(--amber); margin-top:4px;}
</style>
</head>
<body>
<header>
  <h1>Perimeter System Configuration</h1>
  <nav><a href="/">← Return to Dashboard</a></nav>
</header>
<main>

<!-- SECTION 1: PER-ZONE MATRIX -->
<section>
  <h2>
    <span>Laser & LDR Perimeter Zones</span>
    <span style="font-size:11px; color:var(--dim);">North / East / South / West</span>
  </h2>
  <p class="desc">
    Configure each zone's hardware pin, input type (Digital DO vs Analog AO), trigger polarity (Trips when signal goes HIGH / LOW), and analog trigger threshold.
  </p>
  <div id="zoneContainer"></div>
</section>

<!-- SECTION 2: LASER EMITTER CONTROL -->
<section>
  <h2>
    <span>Laser Emitter & Hardware Trigger Pin</span>
    <span style="font-size:11px; color:var(--purple);">Beam Power Management</span>
  </h2>
  <p class="desc">
    If your laser diode power rails are switched via a transistor or MOSFET connected to a GPIO pin, configure the control pin and operating mode below.
  </p>
  <div class="row">
    <div>
      <label>Laser Trigger / Power GPIO Pin</label>
      <select id="laserPin">
        <option value="NONE">Disabled / Always-On (VCC rail)</option>
        <option value="D8">D8 (GPIO15) — Dedicated Laser Switch</option>
        <option value="D3">D3 (GPIO0)</option>
        <option value="D4">D4 (GPIO2)</option>
        <option value="D0">D0 (GPIO16)</option>
        <option value="D1">D1 (GPIO5)</option>
        <option value="D2">D2 (GPIO4)</option>
        <option value="D5">D5 (GPIO14)</option>
        <option value="D6">D6 (GPIO12)</option>
        <option value="D7">D7 (GPIO13)</option>
      </select>
    </div>
    <div>
      <label>Laser Emitter Mode</label>
      <select id="laserMode">
        <option value="0">Always ON (Continuous Beams)</option>
        <option value="1">Armed Only (OFF when Disarmed to extend diode lifespan)</option>
        <option value="2">Continuous Strobe (Pulse Mode for calibration)</option>
      </select>
    </div>
  </div>
</section>

<!-- SECTION 3: ALARM & SECURITY TIMING -->
<section>
  <h2>
    <span>Alarm Siren, Timings & Security</span>
    <span style="font-size:11px; color:var(--dim);">Protection Controls</span>
  </h2>
  <div class="row">
    <div>
      <label>Buzzer GPIO Output Pin</label>
      <select id="buzzPin">
        <option value="D1">D1 (GPIO5) — Standard Buzzer</option>
        <option value="D2">D2 (GPIO4)</option>
        <option value="D5">D5 (GPIO14)</option>
        <option value="D6">D6 (GPIO12)</option>
        <option value="D7">D7 (GPIO13)</option>
        <option value="D8">D8 (GPIO15)</option>
        <option value="D0">D0 (GPIO16)</option>
        <option value="NONE">Disabled / Web Audio Only</option>
      </select>
    </div>
    <div>
      <label>Alarm Auto-Silence Timeout</label>
      <select id="alarmTimeout">
        <option value="0">Continuous (Until manual reset)</option>
        <option value="10">10 Seconds</option>
        <option value="30">30 Seconds</option>
        <option value="60">1 Minute</option>
        <option value="120">2 Minutes</option>
      </select>
    </div>
  </div>

  <div class="row" style="margin-top:8px;">
    <div>
      <label>Sensor Debounce Window (ms)</label>
      <input type="number" id="debounceMs" min="5" max="500" value="25" placeholder="25">
      <div class="pin-tip">Filters optical micro-vibrations and electrical noise (Default: 25ms).</div>
    </div>
    <div>
      <label>Master Security PIN Code (For Disarming)</label>
      <input type="password" id="secPin" placeholder="1234" maxlength="8">
      <div class="pin-tip">Required when disarming system from dashboard.</div>
    </div>
  </div>

  <div class="checkline">
    <input type="checkbox" id="buzzerEnabled">
    <label for="buzzerEnabled">Enable physical hardware buzzer</label>
  </div>
  <div class="checkline">
    <input type="checkbox" id="armedDefault">
    <label for="armedDefault">System automatically armed by default on boot</label>
  </div>
</section>

<!-- SECTION 4: DEVICE & AP -->
<section>
  <h2>
    <span>Device & Access Point Identity</span>
  </h2>
  <label>Hostname (Device reachable at http://&lt;hostname&gt;.local/)</label>
  <input type="text" id="hostname" placeholder="laser">
  <div class="row">
    <div>
      <label>Fallback AP SSID</label>
      <input type="text" id="apName" placeholder="lasor">
    </div>
    <div>
      <label>Fallback AP Password (min 8 chars)</label>
      <input type="text" id="apPass" placeholder="12345678">
    </div>
  </div>
</section>

<!-- SECTION 5: WIFI NETWORKS -->
<section>
  <h2>
    <span>WiFi Networks (Multi-WiFi STA Slots)</span>
  </h2>
  <div id="netContainer"></div>
  <div style="margin-top:12px;">
    <button type="button" class="secondary" onclick="scanNetworks()">🔍 Scan Nearby WiFi Networks</button>
  </div>
  <datalist id="ssidList"></datalist>
</section>

<div class="save-bar">
  <div id="saveStatus">Ready to save modifications.</div>
  <button onclick="saveConfig()">💾 Save Config & Reboot</button>
</div>

</main>
<script>
let netsData = [{s:'',p:''},{s:'',p:''},{s:'',p:''}];
let zonesData = [
  { name:'North', pin:'D2', isAnalog:false, thresh:500, actLow:0, armed:1 },
  { name:'East',  pin:'D5', isAnalog:false, thresh:500, actLow:0, armed:1 },
  { name:'South', pin:'D6', isAnalog:false, thresh:500, actLow:0, armed:1 },
  { name:'West',  pin:'D7', isAnalog:false, thresh:500, actLow:0, armed:1 }
];

const pinOptions = [
  { val: 'D2', text: 'D2 (GPIO4) — Safe I/O [Recommended]' },
  { val: 'D5', text: 'D5 (GPIO14) — Safe I/O [Recommended]' },
  { val: 'D6', text: 'D6 (GPIO12) — Safe I/O [Recommended]' },
  { val: 'D7', text: 'D7 (GPIO13) — Safe I/O [Recommended]' },
  { val: 'D1', text: 'D1 (GPIO5) — Safe I/O' },
  { val: 'D0', text: 'D0 (GPIO16) — Safe I/O' },
  { val: 'D3', text: 'D3 (GPIO0) — ⚠️ Boot Strapping' },
  { val: 'D4', text: 'D4 (GPIO2) — ⚠️ Boot Strapping' },
  { val: 'D8', text: 'D8 (GPIO15) — ⚠️ Boot Strapping' },
  { val: 'A0', text: 'A0 (ADC0) — Analog Input (0-1.0V)' }
];

function renderZones(){
  const c = document.getElementById('zoneContainer');
  c.innerHTML = '';
  zonesData.forEach((z, i) => {
    c.innerHTML += `
      <div class="zone-card">
        <div class="zone-card-title">
          <span>ZONE ${i+1}: ${z.name.toUpperCase()}</span>
          <span style="font-size:11px; color:var(--accent);">ID: ${i}</span>
        </div>
        <div class="row">
          <div>
            <label>Zone Name</label>
            <input type="text" value="${z.name}" onchange="zonesData[${i}].name=this.value">
          </div>
          <div>
            <label>Input Mode (Analog / Digital)</label>
            <select onchange="zonesData[${i}].isAnalog=(this.value==='1'); renderZones();">
              <option value="0" ${!z.isAnalog?'selected':''}>Digital Pin (DO)</option>
              <option value="1" ${z.isAnalog?'selected':''}>Analog Pin (A0 / AO)</option>
            </select>
          </div>
        </div>

        <div class="row" style="margin-top:8px;">
          <div>
            <label>Assigned Hardware Pin</label>
            <select onchange="zonesData[${i}].pin=this.value">
              ${pinOptions.map(p => `<option value="${p.val}" ${z.pin===p.val?'selected':''}>${p.text}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>Trip Polarity Logic</label>
            <select onchange="zonesData[${i}].actLow=parseInt(this.value)">
              <option value="0" ${z.actLow===0?'selected':''}>Trips when signal goes HIGH (1)</option>
              <option value="1" ${z.actLow===1?'selected':''}>Trips when signal goes LOW (0)</option>
            </select>
          </div>
        </div>

        ${z.isAnalog ? `
          <div class="analog-box">
            <label style="margin-top:0;">Analog Threshold (0 - 1023): <b id="thresh-val-${i}" style="color:var(--accent);">${z.thresh}</b></label>
            <input type="range" min="0" max="1023" value="${z.thresh}" style="width:100%;"
              oninput="document.getElementById('thresh-val-${i}').textContent=this.value; zonesData[${i}].thresh=parseInt(this.value);">
          </div>
        ` : ''}
      </div>`;
  });
}

function renderNets(){
  const c = document.getElementById('netContainer');
  c.innerHTML = '';
  netsData.forEach((n,i) => {
    c.innerHTML += `
      <div class="netblock">
        <label>Network ${i+1} SSID</label>
        <input type="text" list="ssidList" value="${n.s}" onchange="netsData[${i}].s=this.value" placeholder="Primary WiFi SSID">
        <label>Password (leave blank to keep current saved password)</label>
        <input type="password" placeholder="${n.p ? '••••••••' : 'Enter WiFi Password'}" onchange="netsData[${i}].p=this.value">
      </div>`;
  });
}

async function loadConfig(){
  try{
    const res = await fetch('/api/config');
    const cfg = await res.json();
    document.getElementById('hostname').value = cfg.host || 'laser';
    document.getElementById('apName').value = cfg.apName || 'lasor';
    document.getElementById('apPass').value = cfg.apPass || '12345678';
    document.getElementById('buzzerEnabled').checked = (cfg.buzzer !== false);
    document.getElementById('armedDefault').checked = (cfg.armed !== false);
    document.getElementById('buzzPin').value = cfg.buzzPin || 'D1';
    document.getElementById('laserPin').value = cfg.laserPin || 'NONE';
    document.getElementById('laserMode').value = cfg.laserMode || 0;
    document.getElementById('debounceMs').value = cfg.debounce || 25;
    document.getElementById('alarmTimeout').value = cfg.timeout || 0;
    document.getElementById('secPin').value = cfg.secPin || '1234';

    if (cfg.nets) {
      netsData = cfg.nets.map(n => ({s:n.s, p:''}));
    }
    if (cfg.zones && cfg.zones.length === 4) {
      zonesData = cfg.zones.map(z => ({
        name: z.name,
        pin: z.pin,
        isAnalog: z.isAnalog || false,
        thresh: z.thresh || 500,
        actLow: z.actLow || 0,
        armed: z.armed !== undefined ? z.armed : 1
      }));
    }
    renderNets();
    renderZones();
  }catch(e){
    document.getElementById('saveStatus').textContent = 'Error loading configuration: ' + e;
  }
}

async function scanNetworks(){
  const status = document.getElementById('saveStatus');
  status.textContent = 'Scanning 2.4GHz WiFi channels…';
  try{
    const res = await fetch('/api/scan');
    const list = await res.json();
    const dl = document.getElementById('ssidList');
    dl.innerHTML = '';
    list.forEach(s => { const o=document.createElement('option'); o.value=s; dl.appendChild(o); });
    status.textContent = `Found ${list.length} nearby networks. Select from SSID suggestions.`;
  }catch(e){
    status.textContent = 'WiFi Scan failed.';
  }
}

async function saveConfig(){
  const payload = {
    host: document.getElementById('hostname').value || 'laser',
    apName: document.getElementById('apName').value || 'lasor',
    apPass: document.getElementById('apPass').value || '12345678',
    buzzer: document.getElementById('buzzerEnabled').checked,
    armed: document.getElementById('armedDefault').checked,
    buzzPin: document.getElementById('buzzPin').value,
    laserPin: document.getElementById('laserPin').value,
    laserMode: parseInt(document.getElementById('laserMode').value),
    debounce: parseInt(document.getElementById('debounceMs').value) || 25,
    timeout: parseInt(document.getElementById('alarmTimeout').value) || 0,
    secPin: document.getElementById('secPin').value || '1234',
    nets: netsData,
    zones: zonesData
  };

  const status = document.getElementById('saveStatus');
  status.textContent = 'Saving configuration & rebooting ESP8266…';
  try{
    await fetch('/api/config', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    let countdown = 10;
    const timer = setInterval(() => {
      status.textContent = `Rebooting… Reconnect in ${countdown}s at http://${payload.host}.local/`;
      countdown--;
      if (countdown < 0) {
        clearInterval(timer);
        location.href = '/';
      }
    }, 1000);
  }catch(e){
    status.textContent = 'Save failed: ' + e;
  }
}

window.onload = loadConfig;
</script>
</body>
</html>
)HTMLPAGE";
