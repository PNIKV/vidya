// ============================================================
// VECTOR-1 FLIGHT SIM — App / Input / Realistic Audio / Challenges
// ============================================================

const Input = {
  pitch: 0, roll: 0, yaw: 0, throttle: 0,
  source: 'none' 
};

const Keys = {};
let serialPort = null;
let serialReader = null;
let serialActive = false;
let rawData = { roll: 512, pitch: 512, yaw: 512, throttle: 512 };

// --- HARDWARE CALIBRATION & RESOLUTION FIX ---
const JS = {
  rollCenter: 512,
  pitchCenter: 512,
  yawCenter: 512,
  throttleCenter: 512,
  throttleMin: 150,  // Dynamic auto-calibrating min
  throttleMax: 900,  // Dynamic auto-calibrating max
  deadzone: 20,
  throttleMode: 'direct', // 'direct' (full range 0-100%), 'center_split', or 'incremental' (cruise)
  throttleInvert: false,
  throttleBoost: 1.15     // Guarantees 100% full throttle reached even with limited stick travel
};

// --- CHALLENGE & MISSION STATE ---
const Mission = {
  active: true,
  score: 0,
  ringsCleared: 0,
  totalRings: 10,
  startTime: null,
  completed: false,
  landingEvaluated: false
};

// ---------------- Web Serial ----------------
async function connectArduino(){
  if(!('serial' in navigator)){
    alert('Web Serial API not available. Please use Chrome or Edge desktop.');
    return;
  }
  try{
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 115200 });
    serialActive = true;
    Input.source = 'arduino';
    setConnUI(true);
    
    document.getElementById('step-1').style.display = 'none';
    document.getElementById('step-2').style.display = 'block';
    
    readSerialLoop();
  }catch(err){
    console.error('Serial connection failed:', err);
    setConnUI(false, 'CONNECT FAILED');
  }
}

async function readSerialLoop(){
  const textDecoder = new TextDecoderStream();
  serialPort.readable.pipeTo(textDecoder.writable);
  serialReader = textDecoder.readable.getReader();

  let buffer = '';
  try{
    while(serialActive){
      const { value, done } = await serialReader.read();
      if(done) break;
      buffer += value;
      let idx;
      while((idx = buffer.indexOf('\n')) >= 0){
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx+1);
        if(line) parseSerialLine(line);
      }
    }
  }catch(err){
    console.error('Serial read error:', err);
  }finally{
    serialReader.releaseLock();
  }
}

function parseSerialLine(line){
  const parts = line.split(',').map(Number);
  if(parts.length < 4 || parts.some(Number.isNaN)) return;

  const [rollRaw, pitchRaw, yawRaw, throttleRaw] = parts;
  rawData = { roll: rollRaw, pitch: pitchRaw, yaw: yawRaw, throttle: throttleRaw };

  // Attitude Inputs with Deadzone
  Input.roll  = applyDeadzone(rollRaw  - JS.rollCenter, 480);
  Input.pitch = applyDeadzone(pitchRaw - JS.pitchCenter, 480) * -1; 
  Input.yaw   = applyDeadzone(yawRaw   - JS.yawCenter, 480);
  
  // Dynamic Min/Max Auto-tracking: Adapts to physical limits of user's potentiometers
  if (throttleRaw < JS.throttleMin && throttleRaw >= 0) JS.throttleMin = throttleRaw;
  if (throttleRaw > JS.throttleMax && throttleRaw <= 1023) JS.throttleMax = throttleRaw;

  // FIXED JOYSTICK THROTTLE LOGIC: Guarantees 0% to 100% full speed!
  if (JS.throttleMode === 'direct') {
    // Mode 1: Direct Full Range (Maps full physical throw to 0..100% speed)
    const range = Math.max(60, JS.throttleMax - JS.throttleMin);
    let norm = (throttleRaw - JS.throttleMin) / range;
    if (JS.throttleInvert) norm = 1.0 - norm;
    // Apply boost so full speed is reached even if stick stops slightly early
    Input.throttle = clamp(norm * JS.throttleBoost, 0, 1.0);
  } else if (JS.throttleMode === 'center_split') {
    // Mode 2: Center is Idle, Pushing Forward is 100%
    const forwardSpan = Math.max(60, JS.throttleMax - JS.throttleCenter);
    let diff = throttleRaw - JS.throttleCenter;
    if (JS.throttleInvert) diff = -diff;
    if (Math.abs(diff) < JS.deadzone) diff = 0;
    Input.throttle = clamp((Math.max(0, diff) / forwardSpan) * JS.throttleBoost, 0, 1.0);
  } else if (JS.throttleMode === 'incremental') {
    // Mode 3: Spring Cruise (Push forward to accelerate to 100%, release to hold speed, pull back to brake)
    let diff = throttleRaw - JS.throttleCenter;
    if (JS.throttleInvert) diff = -diff;
    if (Math.abs(diff) > JS.deadzone) {
      const rate = (diff > 0 ? (diff - JS.deadzone) : (diff + JS.deadzone)) / 420;
      Input.throttle = clamp(Input.throttle + rate * 0.035, 0, 1.0);
    }
  }

  // Update diagnostic readout
  const diagEl = document.getElementById('thr-diag');
  if (diagEl) {
    diagEl.textContent = `Raw: ${throttleRaw} | Out: ${Math.round(Input.throttle * 100)}% [${JS.throttleMode.toUpperCase()}]`;
  }

  flashLiveDot();
}

function applyDeadzone(val, range){
  if(Math.abs(val) < JS.deadzone) return 0;
  const sign = val > 0 ? 1 : -1;
  const mag = (Math.abs(val) - JS.deadzone) / (range - JS.deadzone);
  return sign * clamp(mag, 0, 1);
}

let liveDotTimeout;
function flashLiveDot(){
  const dot = document.getElementById('conn-dot');
  if(!dot) return;
  dot.classList.add('live');
  clearTimeout(liveDotTimeout);
  liveDotTimeout = setTimeout(()=> dot.classList.remove('live'), 200);
}

function setConnUI(connected, label){
  const el = id => document.getElementById(id);
  const UI = {
    dot: el('conn-dot'),
    text: el('conn-text'),
    btn1: el('btn-connect'),
    btn2: el('btn-connect-2')
  };
  
  if (connected) {
    if (UI.text) UI.text.textContent = 'ARDUINO LINKED';
    if (UI.dot) UI.dot.classList.add('live');
    if (UI.btn1) UI.btn1.textContent = 'Disconnect';
    if (UI.btn2) UI.btn2.textContent = 'Disconnect';
  } else {
    if (UI.text) UI.text.textContent = label || 'NO LINK';
    if (UI.dot) UI.dot.classList.remove('live');
    if (UI.btn1) UI.btn1.textContent = 'Connect Arduino';
    if (UI.btn2) UI.btn2.textContent = 'Connect Arduino';
  }
}

// ---------------- Keyboard fallback ----------------
function useKeyboard(){
  Input.source = 'keyboard';
  document.getElementById('conn-text').textContent = 'KEYBOARD MODE';
  hideSetup();
}

globalThis.addEventListener('keydown', e => { Keys[e.code] = true; });
globalThis.addEventListener('keyup', e => { Keys[e.code] = false; });

function updateKeyboardInput(dt){
  if(Input.source !== 'keyboard') return;
  const rampSpeed = 2.4 * dt;
  let targetPitch = 0, targetRoll = 0, targetYaw = 0;

  if(Keys['KeyW']) targetPitch = 1;
  if(Keys['KeyS']) targetPitch = -1;
  if(Keys['KeyA']) targetRoll = -1;
  if(Keys['KeyD']) targetRoll = 1;
  if(Keys['KeyQ']) targetYaw = -1;
  if(Keys['KeyE']) targetYaw = 1;

  Input.pitch += (targetPitch - Input.pitch) * Math.min(1, rampSpeed * 3);
  Input.roll  += (targetRoll  - Input.roll ) * Math.min(1, rampSpeed * 3);
  Input.yaw   += (targetYaw   - Input.yaw  ) * Math.min(1, rampSpeed * 3);

  if(Keys['ShiftLeft'] || Keys['ShiftRight']) Input.throttle = clamp(Input.throttle + dt * 0.65, 0, 1.0);
  if(Keys['ControlLeft'] || Keys['ControlRight']) Input.throttle = clamp(Input.throttle - dt * 0.65, 0, 1.0);
  if(Keys['KeyR']) resetSim();
}

// ============================================================
// REALISTIC PROCEDURAL WEB AUDIO ENGINE
// ============================================================
const SFX = {
  ctx: null,
  masterGain: null,
  isMuted: false,

  // Engine Nodes
  rumbleSource: null,
  rumbleFilter: null,
  rumbleGain: null,
  subOsc: null,
  subGain: null,

  turbineOsc1: null,
  turbineOsc2: null,
  turbineGain: null,

  windSource: null,
  windFilter: null,
  windGain: null,

  afterburnerShaper: null,
  afterburnerGain: null,

  stallOsc: null,
  stallGain: null,
  isStalling: false,

  currentRPM: 0,

  init(){
    if(this.ctx) {
      if(this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if(!AudioContextClass) return;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.ctx.destination);

    // 1. Core Combustion / Jet Rumble (Filtered Noise)
    const noiseBufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, noiseBufferSize, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < noiseBufferSize; i++) {
      // Pink/Brown noise approximation for realistic air turbulence
      const white = Math.random() * 2 - 1;
      noiseData[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = noiseData[i];
      noiseData[i] *= 3.5;
    }

    this.rumbleSource = this.ctx.createBufferSource();
    this.rumbleSource.buffer = noiseBuffer;
    this.rumbleSource.loop = true;

    this.rumbleFilter = this.ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = 110;
    this.rumbleFilter.Q.value = 3.0;

    this.rumbleGain = this.ctx.createGain();
    this.rumbleGain.gain.value = 0.0;

    this.rumbleSource.connect(this.rumbleFilter);
    this.rumbleFilter.connect(this.rumbleGain);
    this.rumbleGain.connect(this.masterGain);
    this.rumbleSource.start();

    // 2. Sub-bass turbine resonance (45Hz - 110Hz body thrum)
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'triangle';
    this.subOsc.frequency.value = 45;
    this.subGain = this.ctx.createGain();
    this.subGain.gain.value = 0.0;
    this.subOsc.connect(this.subGain);
    this.subGain.connect(this.masterGain);
    this.subOsc.start();

    // 3. High-Pitch Jet Turbine / Compressor Whine
    this.turbineOsc1 = this.ctx.createOscillator();
    this.turbineOsc1.type = 'sine';
    this.turbineOsc1.frequency.value = 280;

    this.turbineOsc2 = this.ctx.createOscillator();
    this.turbineOsc2.type = 'sine';
    this.turbineOsc2.frequency.value = 425;

    this.turbineGain = this.ctx.createGain();
    this.turbineGain.gain.value = 0.0;

    this.turbineOsc1.connect(this.turbineGain);
    this.turbineOsc2.connect(this.turbineGain);
    this.turbineGain.connect(this.masterGain);
    this.turbineOsc1.start();
    this.turbineOsc2.start();

    // 4. Supersonic Airflow / Cockpit Wind Rush
    const windBuffer = this.ctx.createBuffer(1, noiseBufferSize, this.ctx.sampleRate);
    const windData = windBuffer.getChannelData(0);
    for (let i = 0; i < noiseBufferSize; i++) {
      windData[i] = Math.random() * 2 - 1;
    }
    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = windBuffer;
    this.windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 750;
    this.windFilter.Q.value = 1.2;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.0;

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    this.windSource.start();

    // 5. Stall Warning Alarm Tone
    this.stallOsc = this.ctx.createOscillator();
    this.stallOsc.type = 'square';
    this.stallOsc.frequency.value = 820;
    this.stallGain = this.ctx.createGain();
    this.stallGain.gain.value = 0.0;
    this.stallOsc.connect(this.stallGain);
    this.stallGain.connect(this.masterGain);
    this.stallOsc.start();
  },

  update(throttle, speed, dt = 0.016){
    if(!this.ctx || this.ctx.state !== 'running' || this.isMuted) return;

    // Simulate realistic turbine spool inertia (turbines take time to spool up)
    const targetRPM = throttle;
    this.currentRPM += (targetRPM - this.currentRPM) * Math.min(1.0, 1.8 * dt);

    const t = this.ctx.currentTime;

    // Core rumble frequency and intensity
    const rumbleFreq = 60 + this.currentRPM * 180 + (speed * 0.15);
    this.rumbleFilter.frequency.setTargetAtTime(rumbleFreq, t, 0.08);
    const rumbleVol = 0.04 + (this.currentRPM * 0.32) + (speed * 0.0004);
    this.rumbleGain.gain.setTargetAtTime(rumbleVol, t, 0.08);

    // Sub-bass thrum
    const subFreq = 42 + this.currentRPM * 65;
    this.subOsc.frequency.setTargetAtTime(subFreq, t, 0.08);
    this.subGain.gain.setTargetAtTime(this.currentRPM * 0.18, t, 0.08);

    // High turbine compressor whine (rises smoothly up to 1.8 kHz)
    const whineFreq1 = 260 + (this.currentRPM * 1150) + (speed * 0.2);
    const whineFreq2 = whineFreq1 * 1.503;
    this.turbineOsc1.frequency.setTargetAtTime(whineFreq1, t, 0.1);
    this.turbineOsc2.frequency.setTargetAtTime(whineFreq2, t, 0.1);
    const whineVol = 0.01 + Math.pow(this.currentRPM, 1.6) * 0.16;
    this.turbineGain.gain.setTargetAtTime(whineVol, t, 0.1);

    // Wind rush scales with airspeed
    const speedRatio = clamp(speed / 450, 0, 1);
    const windVol = Math.pow(speedRatio, 1.5) * 0.28;
    this.windGain.gain.setTargetAtTime(windVol, t, 0.15);
    this.windFilter.frequency.setTargetAtTime(400 + speedRatio * 1600, t, 0.15);

    // Stall Warning Pulsing Alarm
    if(speed < Physics.STALL_SPEED && !Physics.grounded){
      const pulse = Math.sin(t * 12) > 0.0 ? 0.22 : 0.0;
      this.stallGain.gain.setTargetAtTime(pulse, t, 0.02);
    } else {
      this.stallGain.gain.setTargetAtTime(0.0, t, 0.05);
    }
  },

  // Ring Clear Chime: Ascending sci-fi melodic crystal arpeggio
  playRingChime(){
    if(!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      
      gain.gain.setValueAtTime(0.0, now + i * 0.055);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.055 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.055 + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.5);
    });
  },

  // Touchdown tyre screech & runway rumble
  playTouchdown(impactSpeed){
    if(!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Tyre chirp screech
    const chirpOsc = this.ctx.createOscillator();
    const chirpGain = this.ctx.createGain();
    chirpOsc.type = 'sawtooth';
    chirpOsc.frequency.setValueAtTime(1200, now);
    chirpOsc.frequency.exponentialRampToValueAtTime(450, now + 0.22);

    chirpGain.gain.setValueAtTime(0.35, now);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    chirpOsc.connect(chirpGain);
    chirpGain.connect(this.masterGain);
    chirpOsc.start(now);
    chirpOsc.stop(now + 0.3);
  },

  // Challenge Complete Victory Fanfare
  playVictory(){
    if(!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const chords = [
      { t: 0.0, freqs: [523.25, 659.25, 783.99] }, // C Major
      { t: 0.25, freqs: [587.33, 739.99, 880.00] }, // D Major
      { t: 0.55, freqs: [659.25, 830.61, 987.77] }, // E Major
      { t: 0.90, freqs: [1046.50, 1318.51, 1567.98] } // High C Octave
    ];
    chords.forEach(c => {
      c.freqs.forEach(f => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + c.t);
        gain.gain.setValueAtTime(0.2, now + c.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + c.t + 0.7);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + c.t);
        osc.stop(now + c.t + 0.8);
      });
    });
  },

  toggleMute(){
    this.isMuted = !this.isMuted;
    if(this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0.0 : 0.8;
    }
    return this.isMuted;
  }
};

// ---------------- Touchdown Event Listener ----------------
function onTouchdownEvent(info){
  SFX.playTouchdown(info.impactSpeed);

  if(info.onPad && info.station && info.station.id === 1 && !Mission.landingEvaluated){
    // Landed on Destination Aerodrome!
    Mission.landingEvaluated = true;
    Mission.completed = true;

    let grade = 'S+';
    let pts = 500;
    if(info.impactSpeed > 10) { grade = 'B'; pts = 150; }
    else if(info.impactSpeed > 6) { grade = 'A'; pts = 300; }

    Mission.score += pts;
    SFX.playVictory();

    showLandingVictory(grade, info.impactSpeed, pts);
  }
}

function showLandingVictory(grade, impactSpeed, pts){
  const card = document.getElementById('victory-card');
  if(!card) return;
  document.getElementById('vic-grade').textContent = grade;
  document.getElementById('vic-score').textContent = Mission.score;
  document.getElementById('vic-rings').textContent = `${Mission.ringsCleared} / ${Mission.totalRings}`;
  document.getElementById('vic-impact').textContent = `${Math.round(impactSpeed * 10)} FPM`;
  card.style.display = 'flex';
}

// ---------------- Setup overlay & UI ----------------
function hideSetup(){ document.getElementById('setup').style.display = 'none'; }

document.getElementById('btn-connect').addEventListener('click', ()=>{ 
  if(serialActive) {
    disconnectArduino();
  } else {
    document.getElementById('setup').style.display = 'flex';
    document.getElementById('step-1').style.display = 'none';
    document.getElementById('step-2').style.display = 'block';
    connectArduino();
  }
});
document.getElementById('btn-keyboard').addEventListener('click', ()=>{ useKeyboard(); SFX.init(); });
document.getElementById('btn-connect-2').addEventListener('click', connectArduino);
document.getElementById('btn-keyboard-2').addEventListener('click', ()=>{ useKeyboard(); SFX.init(); });

document.getElementById('btn-calibrate').addEventListener('click', ()=>{
  JS.rollCenter = rawData.roll;
  JS.pitchCenter = rawData.pitch;
  JS.yawCenter = rawData.yaw;
  JS.throttleCenter = rawData.throttle;
  // Set reasonable dynamic bounds based on calibration
  JS.throttleMin = Math.min(JS.throttleMin, rawData.throttle);
  JS.throttleMax = Math.max(JS.throttleMax, rawData.throttle + 250);
  hideSetup();
  SFX.init();
});

document.getElementById('btn-skip-cal').addEventListener('click', ()=>{
  hideSetup();
  SFX.init();
});

async function disconnectArduino(){
  serialActive = false;
  try{
    if(serialReader) await serialReader.cancel();
    if(serialPort) await serialPort.close();
  }catch(e){ console.warn(e); }
  setConnUI(false);
  Input.source = 'none';
}

function updateSpeedTape(speed){ document.getElementById('speed-readout').innerHTML = String(Math.max(0,Math.round(speed))).padStart(3,'0') + '<span class="readout-unit">KTS</span>'; }
function updateAltTape(alt){ document.getElementById('alt-readout').innerHTML = String(Math.max(0,Math.round(alt * 3.5))).padStart(4,'0') + '<span class="readout-unit">FT</span>'; }
function updateCoords(x, z){ document.getElementById('pos-readout').innerHTML = Math.round(x) + ', ' + Math.round(z); }
function updateVSI(vsi){
  const el = document.getElementById('vs-readout');
  const val = Math.round(vsi);
  el.innerHTML = (val >= 0 ? '+' : '-') + String(Math.abs(val)).padStart(4,'0') + '<span class="readout-unit">FPM</span>';
  el.parentElement.classList.toggle('warn', val < -800);
}
function updateGForce(g){
  const el = document.getElementById('g-readout');
  el.innerHTML = g.toFixed(1) + '<span class="readout-unit">G</span>';
  el.parentElement.classList.toggle('warn', g > 3.2 || g < -0.5);
}
function updateThrottleGauge(t){
  document.getElementById('throttle-fill').style.height = (t*100).toFixed(0) + '%';
  const valEl = document.getElementById('throttle-val');
  if(valEl) valEl.textContent = (t*100).toFixed(0) + '%';
}

let pitchLinesBuilt = false;
function buildPitchLines(){
  const container = document.getElementById('pitch-lines');
  container.innerHTML = '';
  for(let deg=-90; deg<=90; deg+=10){
    if(deg===0) continue;
    const line = document.createElement('div');
    line.className = 'pitch-line' + (deg%20 === 0 ? '' : ' minor');
    line.style.top = (-deg * 3) + 'px';
    if(deg%20===0){
      const label = document.createElement('span');
      label.textContent = Math.abs(deg);
      line.appendChild(label);
    }
    container.appendChild(line);
  }
  pitchLinesBuilt = true;
}

function updateHorizon(pitchRad, rollRad){
  if(!pitchLinesBuilt) buildPitchLines();
  const pitchDeg = pitchRad * 180/Math.PI;
  const rollDeg = rollRad * 180/Math.PI;
  const ball = document.getElementById('horizon-ball');
  ball.style.transform = `rotate(${-rollDeg}deg) translateY(${pitchDeg * 3}px)`;
  const bankPointer = document.getElementById('bank-pointer');
  bankPointer.style.transform = `translateX(-50%) rotate(${-rollDeg}deg)`;
  bankPointer.style.transformOrigin = '50% 130px';
}

function updateCompass(yawRad){
  let deg = (yawRad * 180/Math.PI) % 360;
  if(deg < 0) deg += 360;
  const strip = document.getElementById('compass-strip');
  if(!strip.dataset.built){
    let html = '';
    for(let d=-360; d<=720; d+=10){
      const norm = ((d%360)+360)%360;
      const dirs = {0:'N',90:'E',180:'S',270:'W'};
      html += `<span class="compass-tick ${dirs[norm] === undefined ? '' : 'major'}">${dirs[norm] === undefined ? norm : dirs[norm]}</span>`;
    }
    strip.innerHTML = html;
    strip.dataset.built = '1';
  }
  strip.style.left = (170 - (deg/10)*34 - 34*36) + 'px';
}

function updateStallWarning(speed, stallSpeed){ document.getElementById('stall-warn').style.display = speed < stallSpeed ? 'block' : 'none'; }
function showCrash(){
  document.getElementById('status-title').textContent = 'CRASHED';
  document.getElementById('status-sub').textContent = 'Press R to reset';
  document.getElementById('status-msg').style.display = 'block';
}
function hideStatus(){ document.getElementById('status-msg').style.display = 'none'; }

function resetSim(){
  Physics.reset();
  hideStatus();
  Mission.completed = false;
  Mission.landingEvaluated = false;
  const vic = document.getElementById('victory-card');
  if(vic) vic.style.display = 'none';
  if(typeof buildRingChallengeCourse === 'function') buildRingChallengeCourse();
  Mission.ringsCleared = 0;
  Mission.score = 0;
  updateMissionHUD();
}

// ---------------- Challenge HUD Updates ----------------
function updateMissionHUD(){
  const ringEl = document.getElementById('mission-rings');
  const scoreEl = document.getElementById('mission-score');
  const targetEl = document.getElementById('mission-target');
  const distEl = document.getElementById('mission-dist');

  if (ringEl) ringEl.textContent = `${activeRingIndex} / ${totalRingsCount}`;
  if (scoreEl) scoreEl.textContent = Mission.score;

  if (activeRingIndex < challengeRings.length) {
    const activeRing = challengeRings[activeRingIndex];
    if (targetEl) targetEl.textContent = activeRing.label || `RING ${activeRingIndex + 1}`;
    
    // Compute distance
    const dx = Physics.position.x - activeRing.pos.x;
    const dy = Physics.position.y - activeRing.pos.y;
    const dz = Physics.position.z - activeRing.pos.z;
    const distMeters = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));
    if (distEl) distEl.textContent = distMeters > 1000 ? `${(distMeters / 1000).toFixed(1)} KM` : `${distMeters} M`;
  } else {
    if (targetEl) targetEl.textContent = "DESTINATION RUNWAY 12";
    const dest = globalStations[1];
    if (dest && distEl) {
      const dx = Physics.position.x - dest.x;
      const dz = Physics.position.z - dest.z;
      const distM = Math.round(Math.sqrt(dx * dx + dz * dz));
      distEl.textContent = distM > 1000 ? `${(distM / 1000).toFixed(1)} KM` : `${distM} M`;
    }
  }
}

// ---------------- Camera follow ----------------
function updateCamera(){
  const p = Physics;
  
  plane.position.set(p.position.x, p.position.y, p.position.z);
  const euler = new THREE.Euler(p.rotation.pitch, p.rotation.yaw, -p.rotation.roll, 'YXZ');
  plane.quaternion.setFromEuler(euler);

  plane.updateMatrixWorld();
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(plane.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(plane.quaternion);

  const backDist = 13, upDist = 3.6;
  const camTargetX = p.position.x - forward.x * backDist + up.x * upDist;
  const camTargetY = p.position.y - forward.y * backDist + up.y * upDist;
  const camTargetZ = p.position.z - forward.z * backDist + up.z * upDist;

  camera.position.x += (camTargetX - camera.position.x) * 0.16;
  camera.position.y += (camTargetY - camera.position.y) * 0.16;
  camera.position.z += (camTargetZ - camera.position.z) * 0.16;

  camera.up.lerp(up, 0.16); 
  camera.lookAt(p.position.x + forward.x * 25, p.position.y + forward.y * 25, p.position.z + forward.z * 25);
}

// ---------------- Main loop ----------------
let lastTime = performance.now();

function animate(){
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - lastTime)/1000, 0.1);
  lastTime = now;

  updateKeyboardInput(dt);

  Physics.update(dt, {
    pitch: Input.pitch,
    roll: Input.roll,
    yaw: Input.yaw,
    throttle: Input.throttle
  });

  if(Physics.crashed) showCrash();

  // Check ring flight collisions
  const ringHit = checkRingPass(Physics.position);
  if (ringHit) {
    Mission.ringsCleared = ringHit.clearedCount;
    Mission.score += 100;
    SFX.playRingChime();
    
    // Show toast banner
    const toast = document.getElementById('ring-toast');
    if (toast) {
      toast.textContent = `+100 PTS • RING ${ringHit.clearedCount} CLEARED!`;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 1500);
    }
  }

  updateCamera();
  if(typeof updateTerrain === 'function') updateTerrain(Physics.position.x, Physics.position.z);
  if(typeof recycleClouds === 'function') recycleClouds(Physics.position.x, Physics.position.y, Physics.position.z);
  if(typeof updateEnvironment === 'function') updateEnvironment(Physics.position.x, Physics.position.y, Physics.position.z, dt);
  if(typeof updatePlaneVisuals === 'function') updatePlaneVisuals(Physics.throttle, Physics.speed);

  if(SFX.ctx) SFX.update(Physics.throttle, Physics.speed, dt);

  updateSpeedTape(Physics.speed);
  updateAltTape(Physics.altitude);
  updateCoords(Physics.position.x, Physics.position.z);
  updateVSI(Physics.vsi);
  updateGForce(Physics.gForce);
  updateThrottleGauge(Physics.throttle);
  updateHorizon(Physics.rotation.pitch, Physics.rotation.roll);
  updateCompass(Physics.rotation.yaw);
  updateStallWarning(Physics.speed, Physics.STALL_SPEED);
  updateMissionHUD();

  renderer.render(scene, camera);
}

// ---------------- Boot & UI Listeners ----------------
window.addEventListener('load', ()=>{
  initScene();
  if(typeof globalStations !== 'undefined' && globalStations.length > 0) {
    Physics.position.y = globalStations[0].y + 2;
    Physics.position.z = globalStations[0].z + 100;
  }
  buildPitchLines();

  // Day/Night UI listeners
  const btnDay = document.getElementById('btn-tod-day');
  const btnSunset = document.getElementById('btn-tod-sunset');
  const btnNight = document.getElementById('btn-tod-night');
  const btnDawn = document.getElementById('btn-tod-dawn');
  const timeSlider = document.getElementById('time-slider');
  const timeDisplay = document.getElementById('time-display');

  if(btnDay) btnDay.addEventListener('click', ()=> { setDayNightPreset('day'); if(timeSlider) timeSlider.value = 50; updateTimeDisplay(0.50); });
  if(btnSunset) btnSunset.addEventListener('click', ()=> { setDayNightPreset('sunset'); if(timeSlider) timeSlider.value = 78; updateTimeDisplay(0.78); });
  if(btnNight) btnNight.addEventListener('click', ()=> { setDayNightPreset('night'); if(timeSlider) timeSlider.value = 0; updateTimeDisplay(0.00); });
  if(btnDawn) btnDawn.addEventListener('click', ()=> { setDayNightPreset('dawn'); if(timeSlider) timeSlider.value = 25; updateTimeDisplay(0.25); });

  if(timeSlider) {
    timeSlider.addEventListener('input', (e)=>{
      const val = parseFloat(e.target.value) / 100.0;
      setTimeOfDay(val);
      updateTimeDisplay(val);
    });
  }

  function updateTimeDisplay(val){
    const totalMinutes = Math.round(val * 24 * 60);
    const hrs = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const mins = String(totalMinutes % 60).padStart(2, '0');
    if(timeDisplay) timeDisplay.textContent = `${hrs}:${mins}`;
  }

  // Throttle Mode Switcher
  const btnThrMode = document.getElementById('btn-thr-mode');
  if(btnThrMode){
    btnThrMode.addEventListener('click', ()=>{
      if(JS.throttleMode === 'direct'){
        JS.throttleMode = 'incremental';
        btnThrMode.textContent = 'THR: CRUISE';
      } else if(JS.throttleMode === 'incremental'){
        JS.throttleMode = 'center_split';
        btnThrMode.textContent = 'THR: CENTER';
      } else {
        JS.throttleMode = 'direct';
        btnThrMode.textContent = 'THR: DIRECT (100%)';
      }
    });
  }

  // Audio Toggle
  const btnAudio = document.getElementById('btn-audio');
  if(btnAudio){
    btnAudio.addEventListener('click', ()=>{
      SFX.init();
      const muted = SFX.toggleMute();
      btnAudio.textContent = muted ? '🔇 AUDIO OFF' : '🔊 AUDIO ON';
      btnAudio.style.borderColor = muted ? 'var(--amber)' : 'var(--cyan)';
    });
  }

  // Reset challenge button
  const btnRestart = document.getElementById('btn-restart-challenge');
  if(btnRestart) btnRestart.addEventListener('click', resetSim);

  animate();
});