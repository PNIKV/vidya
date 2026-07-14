// ============================================================
// VECTOR-1 FLIGHT SIM — App / Input / Instruments
// ============================================================

const Input = {
  pitch: 0, roll: 0, yaw: 0, throttle: 0,
  source: 'none' 
};

const Keys = {};
let serialPort = null;
let serialReader = null;
let serialActive = false;
let rawData = { roll: 519, pitch: 524, yaw: 320, throttle: 331 };

// --- CUSTOM HARDWARE CALIBRATION ---
const JS = {
  rollCenter: 519, pitchCenter: 524, yawCenter: 320, throttleCenter: 331,
  deadzone: 20
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

  Input.roll    = applyDeadzone(rollRaw    - JS.rollCenter, 500);
  Input.pitch   = applyDeadzone(pitchRaw   - JS.pitchCenter, 500) * -1; 
  Input.yaw     = applyDeadzone(yawRaw     - JS.yawCenter, 500);
  
  let activeThrottle = Math.max(0, throttleRaw - JS.throttleCenter);
  Input.throttle = clamp(activeThrottle / (1023 - JS.throttleCenter), 0, 1); 

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

globalThis.addEventListener('keydown', e=>{ Keys[e.code] = true; });
globalThis.addEventListener('keyup', e=>{ Keys[e.code] = false; });

function updateKeyboardInput(dt){
  if(Input.source !== 'keyboard') return;
  const rampSpeed = 2.2 * dt;
  let targetPitch = 0, targetRoll = 0, targetYaw = 0;

  if(Keys['KeyW']) targetPitch = 1;
  if(Keys['KeyS']) targetPitch = -1;
  if(Keys['KeyA']) targetRoll = -1;
  if(Keys['KeyD']) targetRoll = 1;
  if(Keys['KeyQ']) targetYaw = -1;
  if(Keys['KeyE']) targetYaw = 1;

  Input.pitch += (targetPitch - Input.pitch) * Math.min(1, rampSpeed*3);
  Input.roll  += (targetRoll  - Input.roll ) * Math.min(1, rampSpeed*3);
  Input.yaw   += (targetYaw   - Input.yaw  ) * Math.min(1, rampSpeed*3);

  if(Keys['ShiftLeft'] || Keys['ShiftRight']) Input.throttle = clamp(Input.throttle + dt*0.6, 0, 1);
  if(Keys['ControlLeft'] || Keys['ControlRight']) Input.throttle = clamp(Input.throttle - dt*0.6, 0, 1);
  if(Keys['KeyR']) resetSim();
}

// ---------------- Setup overlay & UI ----------------
// ---------------- Sound Effects ----------------
const SFX = {
  ctx: null, engineOsc: null, engineGain: null,
  init(){
    if(this.ctx) return;
    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
    if(!AudioContext) return;
    this.ctx = new AudioContext();

    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc.start();
  },
  update(throttle, speed){
    if(!this.ctx || this.ctx.state !== 'running') return;
    const baseFreq = 40 + (throttle * 60) + (speed * 0.1);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.1);
    const targetVol = 0.02 + (throttle * 0.15) + (speed * 0.0005);
    this.engineGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.2);
  }
};

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
function updateThrottleGauge(t){ document.getElementById('throttle-fill').style.height = (t*100).toFixed(0) + '%'; }

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
function resetSim(){ Physics.reset(); hideStatus(); }

// ---------------- Camera follow ----------------
function updateCamera(){
  const p = Physics;
  
  // Set plane position and quaternion correctly to avoid gimbal lock and flip
  plane.position.set(p.position.x, p.position.y, p.position.z);
  const euler = new THREE.Euler(p.rotation.pitch, p.rotation.yaw, -p.rotation.roll, 'YXZ');
  plane.quaternion.setFromEuler(euler);

  plane.updateMatrixWorld();
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(plane.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(plane.quaternion);

  const backDist = 14, upDist = 4;
  const camTargetX = p.position.x - forward.x*backDist + up.x*upDist;
  const camTargetY = p.position.y - forward.y*backDist + up.y*upDist;
  const camTargetZ = p.position.z - forward.z*backDist + up.z*upDist;

  camera.position.x += (camTargetX - camera.position.x) * 0.15;
  camera.position.y += (camTargetY - camera.position.y) * 0.15;
  camera.position.z += (camTargetZ - camera.position.z) * 0.15;

  camera.up.lerp(up, 0.15); 
  camera.lookAt(p.position.x + forward.x*20, p.position.y + forward.y*20, p.position.z + forward.z*20);
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

  updateCamera();
  if(typeof updateTerrain === 'function') updateTerrain(Physics.position.x, Physics.position.z);
  if(typeof recycleClouds === 'function') recycleClouds(Physics.position.x, Physics.position.y, Physics.position.z);
  if(typeof updateEnvironment === 'function') updateEnvironment(Physics.position.x, Physics.position.y, Physics.position.z, dt);
  if(typeof updatePlaneVisuals === 'function') updatePlaneVisuals(Physics.throttle, Physics.speed);

  if(SFX.ctx) SFX.update(Physics.throttle, Physics.speed);

  updateSpeedTape(Physics.speed);
  updateAltTape(Physics.altitude);
  updateCoords(Physics.position.x, Physics.position.z);
  updateVSI(Physics.vsi);
  updateGForce(Physics.gForce);
  updateThrottleGauge(Physics.throttle);
  updateHorizon(Physics.rotation.pitch, Physics.rotation.roll);
  updateCompass(Physics.rotation.yaw);
  updateStallWarning(Physics.speed, Physics.STALL_SPEED);

  renderer.render(scene, camera);
}

// ---------------- Boot ----------------
window.addEventListener('load', ()=>{
  initScene();
  if(typeof globalStations !== 'undefined' && globalStations.length > 0) {
    Physics.position.y = globalStations[0].y + 2;
  }
  buildPitchLines();
  animate();
});