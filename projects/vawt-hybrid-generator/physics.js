(function(){
  'use strict';

  const el = {
    connectBtn: document.getElementById('connectBtn'),
    demoBtn: document.getElementById('demoBtn'),
    statusPill: document.getElementById('statusPill'),
    statusText: document.getElementById('statusText'),

    voltageVal: document.getElementById('voltageVal'),
    voltageSub: document.getElementById('voltageSub'),
    currentVal: document.getElementById('currentVal'),
    currentSub: document.getElementById('currentSub'),
    powerVal: document.getElementById('powerVal'),
    apparentVal: document.getElementById('apparentVal'),

    tempVal: document.getElementById('tempVal'),
    tempSub: document.getElementById('tempSub'),
    humidityVal: document.getElementById('humidityVal'),

    lightVal: document.getElementById('lightVal'),
    lightSub: document.getElementById('lightSub'),
    bulbIcon: document.getElementById('bulbIcon'),
    lampGlow: document.getElementById('lampGlow'),
    lampBulb: document.getElementById('lampBulb'),
    lightFoot: document.getElementById('lightFoot'),

    energyVal: document.getElementById('energyVal'),

    rpmVal: document.getElementById('rpmVal'),
    rpmSub: document.getElementById('rpmSub'),
    rpmArc: document.getElementById('rpmArc'),
    rpmSceneLabel: document.getElementById('rpmSceneLabel'),
    pulseCountSub: document.getElementById('pulseCountSub'),

    lastUpdate: document.getElementById('lastUpdate'),
    carGroup: document.getElementById('carGroup'),
    bladeSets: document.querySelectorAll('.blade-set'),
    sensorLed: document.getElementById('sensorLed'),
    sensorRing: document.getElementById('sensorRing'),
    sunMoon: document.getElementById('sunMoon'),
    stars: document.querySelectorAll('#stars .star'),
    logBody: document.getElementById('logBody'),
    clearLogBtn: document.getElementById('clearLogBtn'),
    infoPanel: document.getElementById('infoPanel'),
    infoToggle: document.getElementById('infoToggle'),
  };

  const MAX_RPM = 300;       // full-scale on the gauge, matches typical small-rotor range
  const GAUGE_ARC_LEN = 157; // path length of the semicircle in the SVG

  // ---------------------------------------------------------------------
  // Hall-effect pulse -> RPM
  // ---------------------------------------------------------------------
  // The firmware only prints "Magnet Detected!" on every loop where the pin
  // reads LOW — it does not compute RPM itself. RPM is timed here in the
  // browser, between accepted pulses.
  const CLIENT_PULSE_DEBOUNCE_MS = 40; // filters repeat prints from one magnet pass
  let lastClientPulseTime = 0;
  let pulseCount = 0;
  let rpmTimeoutHandle = null;

  // ---------------------------------------------------------------------
  // Energy integration state
  // ---------------------------------------------------------------------
  let energyWh = 0;
  let lastPowerSampleTime = null;
  let lastPowerWatts = 0;

  let port = null, reader = null, readableClosed = null;
  let demoTimer = null;

  function setStatus(mode){
    el.statusPill.classList.remove('live','demo');
    if(mode === 'live'){ el.statusPill.classList.add('live'); el.statusText.textContent = 'Live device'; }
    else if(mode === 'demo'){ el.statusPill.classList.add('demo'); el.statusText.textContent = 'Simulated demo'; }
    else { el.statusText.textContent = 'Not connected'; }
  }

  function logLine(text, alert){
    const empty = el.logBody.querySelector('.log-empty');
    if(empty) empty.remove();
    const row = document.createElement('div');
    row.className = 'row';
    const t = document.createElement('span');
    t.className = 't';
    t.textContent = new Date().toLocaleTimeString();
    const m = document.createElement('span');
    m.className = 'm' + (alert ? ' alert' : '');
    m.textContent = text;
    row.appendChild(t);
    row.appendChild(m);
    el.logBody.insertBefore(row, el.logBody.firstChild);
    while(el.logBody.children.length > 40){
      el.logBody.removeChild(el.logBody.lastChild);
    }
  }

  el.clearLogBtn.addEventListener('click', () => {
    el.logBody.innerHTML = '<div class="log-empty">Connect a device or run the demo to see live readings.</div>';
  });

  el.infoToggle.addEventListener('click', () => {
    el.infoPanel.classList.toggle('collapsed');
  });

  // ---------------------------------------------------------------------
  // Scene physics
  // ---------------------------------------------------------------------
  function updateTurbineSpeed(rpm){
    const mag = Math.min(Math.max(rpm, 0), MAX_RPM);
    const duration = mag <= 0.5 ? 6 : 6 - (mag / MAX_RPM) * 5.5;
    el.bladeSets[0].style.animationDuration = duration.toFixed(2) + 's';
  }

  function updateCarSpeed(rpm){
    const mag = Math.min(Math.max(rpm, 0), MAX_RPM);
    const duration = 9 - (mag / MAX_RPM) * 6; // 9s slow .. 3s fast
    el.carGroup.style.animationDuration = duration.toFixed(2) + 's';
  }

  // ---------------------------------------------------------------------
  // Electrical readings
  // ---------------------------------------------------------------------
  let lastV = 0, lastA = 0;

  function recomputePower(){
    const v = parseFloat(el.voltageVal.textContent) || 0;
    const a = parseFloat(el.currentVal.textContent) || 0;
    lastV = v; lastA = a;

    const p = v * a; // real power, P = V x I
    el.powerVal.textContent = p.toFixed(2);

    // For a DC circuit, RMS voltage/current equal the instantaneous values
    // and there is no phase angle between them, so apparent power (S) works
    // out numerically equal to real power (P) — power factor stays at 1.
    // Both are shown so the concept generalizes to AC systems the students
    // may study later, where S and P diverge.
    const s = Math.abs(v) * Math.abs(a);
    el.apparentVal.textContent = s.toFixed(2);

    integrateEnergy(p);
  }

  function integrateEnergy(pWatts){
    const now = performance.now();
    if(lastPowerSampleTime !== null){
      const dtHours = (now - lastPowerSampleTime) / 3600000;
      // Trapezoidal integration between the last and current power sample
      const avgP = (lastPowerWatts + pWatts) / 2;
      energyWh += avgP * dtHours;
      el.energyVal.textContent = energyWh.toFixed(3);
    }
    lastPowerSampleTime = now;
    lastPowerWatts = pWatts;
  }

  function updateVoltage(v){
    el.voltageVal.textContent = v.toFixed(2);
    el.voltageSub.textContent = v > 3 ? 'Within expected range' : 'Below nominal';
    recomputePower();
  }

  function updateCurrent(a){
    el.currentVal.textContent = a.toFixed(3);
    el.currentSub.textContent = a >= 0 ? 'Charging / generating' : 'Drawing load';
    recomputePower();
  }

  function updateRpm(rpm){
    const clamped = Math.min(Math.max(rpm, 0), MAX_RPM);
    el.rpmVal.textContent = rpm.toFixed(0);
    el.rpmSceneLabel.textContent = rpm.toFixed(0);
    el.rpmSub.textContent = (rpm > 0.5 ? 'Motor spinning' : 'Motor stopped') + ' · ' + pulseCount + ' pulses total';
    el.pulseCountSub.textContent = pulseCount;

    const offset = GAUGE_ARC_LEN * (1 - clamped / MAX_RPM);
    el.rpmArc.style.strokeDashoffset = offset.toFixed(1);

    updateTurbineSpeed(rpm);
    updateCarSpeed(rpm);

    // If no further pulses arrive, decay the reading back toward stopped,
    // mirroring the firmware's own pulse-timeout behavior.
    if(rpmTimeoutHandle) clearTimeout(rpmTimeoutHandle);
    if(clamped > 0.5){
      rpmTimeoutHandle = setTimeout(() => updateRpm(0), 2600);
    }
  }

  function updateWeather(temp, humidity){
    el.tempVal.textContent = temp.toFixed(1);
    el.humidityVal.textContent = humidity.toFixed(1);
    el.tempSub.textContent = temp >= 28 ? 'Warm' : (temp <= 15 ? 'Cool' : 'Mild');
  }

  // ---------------------------------------------------------------------
  // Ambient light (LDR) + streetlamp
  // ---------------------------------------------------------------------
  function updateLight(isDark){
    el.lightVal.textContent = isDark ? 'DARK' : 'BRIGHT';
    el.lightSub.textContent = isDark ? 'Streetlight ON' : 'Streetlight OFF';
    el.bulbIcon.classList.toggle('on', isDark);
    el.lampGlow.classList.toggle('on', isDark);
    el.lampBulb.classList.toggle('on', isDark);
    el.lightFoot.textContent = 'Streetlamp ' + (isDark ? 'lit — LDR reads dark' : 'off — LDR reads bright');

    // Day/night sky follows the actual light sensor rather than temperature,
    // since that's the physically correct signal for ambient light.
    el.sunMoon.setAttribute('fill', isDark ? '#dfe6f2' : '#ffd479');
    el.sunMoon.setAttribute('r', isDark ? 22 : 34);
    el.stars.forEach(s => s.classList.toggle('on', isDark));
  }

  function flashPulseIndicator(){
    el.sensorLed.classList.add('hit');
    el.sensorRing.classList.remove('ping');
    void el.sensorRing.offsetWidth;
    el.sensorRing.classList.add('ping');
    setTimeout(() => el.sensorLed.classList.remove('hit'), 400);
  }

  function handleMagnetPulse(){
    const now = performance.now();
    const delta = now - lastClientPulseTime;

    // A real magnet pass can trigger this line many times in a row while
    // the pin sits LOW. Anything faster than the debounce window is the
    // same pass, not a new revolution, so it's ignored rather than counted.
    if(lastClientPulseTime !== 0 && delta < CLIENT_PULSE_DEBOUNCE_MS){
      return;
    }

    const isFirstPulse = lastClientPulseTime === 0;
    lastClientPulseTime = now;
    pulseCount += 1;
    flashPulseIndicator();

    if(!isFirstPulse){
      const measuredRpm = 60000 / delta;
      updateRpm(measuredRpm);
    } else {
      el.pulseCountSub.textContent = pulseCount;
      el.rpmSub.textContent = 'Motor spinning · ' + pulseCount + ' pulses total';
    }
  }

  function touchUpdated(){
    el.lastUpdate.textContent = new Date().toLocaleTimeString();
  }

  // ---------------------------------------------------------------------
  // Serial line parser — matches wayside_firmware.ino's exact print formats
  // ---------------------------------------------------------------------
  function handleLine(line){
    line = line.trim();
    if(!line) return;

    let m;
    if((m = line.match(/Input Voltage\s*=\s*(-?\d+(\.\d+)?)/i))){
      updateVoltage(parseFloat(m[1]));
      touchUpdated();
      logLine(line);
      return;
    }
    if((m = line.match(/Current:\s*(-?\d+(\.\d+)?)\s*A/i))){
      updateCurrent(parseFloat(m[1]));
      touchUpdated();
      logLine(line);
      return;
    }
    if((m = line.match(/Humidity:\s*(-?\d+(\.\d+)?)\s*%\s*Temperature:\s*(-?\d+(\.\d+)?)/i))){
      updateWeather(parseFloat(m[3]), parseFloat(m[1]));
      touchUpdated();
      logLine(line);
      return;
    }
    if((m = line.match(/^RPM:\s*(-?\d+(\.\d+)?)/i))){
      updateRpm(parseFloat(m[1]));
      touchUpdated();
      logLine(line);
      return;
    }
    if(/Ambient Light:\s*DARK/i.test(line)){
      updateLight(true);
      touchUpdated();
      logLine(line);
      return;
    }
    if(/Ambient Light:\s*BRIGHT/i.test(line)){
      updateLight(false);
      touchUpdated();
      logLine(line);
      return;
    }
    if(/Failed to read from DHT sensor/i.test(line)){
      logLine(line, true);
      return;
    }
    if(/Magnet Detected/i.test(line)){
      handleMagnetPulse();
      touchUpdated();
      logLine(line, true);
      return;
    }
    logLine(line);
  }

  /* ---------------- Web Serial ---------------- */
  async function connectSerial(){
    if(!('serial' in navigator)){
      alert('Web Serial is not supported in this browser. Try Chrome or Edge on desktop, or use "Run demo" instead.');
      return;
    }
    try{
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      stopDemo();
      setStatus('live');
      el.connectBtn.textContent = 'Disconnect';
      logLine('Serial connection opened at 9600 baud.');

      const textDecoder = new TextDecoderStream();
      readableClosed = port.readable.pipeTo(textDecoder.writable);
      const reader2 = textDecoder.readable.getReader();
      reader = reader2;

      let buffer = '';
      while(true){
        const { value, done } = await reader2.read();
        if(done) break;
        buffer += value;
        let idx;
        while((idx = buffer.indexOf('\n')) >= 0){
          const line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          handleLine(line);
        }
      }
    }catch(err){
      logLine('Serial error: ' + err.message, true);
      setStatus(null);
      el.connectBtn.textContent = 'Connect device';
    }
  }

  async function disconnectSerial(){
    try{
      if(reader){ await reader.cancel(); reader = null; }
      if(readableClosed){ await readableClosed.catch(()=>{}); }
      if(port){ await port.close(); port = null; }
    }catch(e){}
    setStatus(null);
    el.connectBtn.textContent = 'Connect device';
    logLine('Serial connection closed.');
  }

  el.connectBtn.addEventListener('click', () => {
    if(port){ disconnectSerial(); }
    else { connectSerial(); }
  });

  /* ---------------- Demo mode ---------------- */
  let demoPulseTimer = null;
  let demoCurrentAmps = 0;
  let demoIsDark = false;

  function scheduleDemoPulse(){
    // Target RPM wanders with the simulated current, since a real motor's
    // speed tracks the load/generation it's producing.
    const targetRpm = 60 + Math.max(demoCurrentAmps, 0) * 70 + Math.sin(Date.now() / 3000) * 20;
    const period = 60000 / Math.max(targetRpm, 1);

    demoPulseTimer = setTimeout(() => {
      // Simulate the real sensor firing more than once per pass so the
      // debounce logic actually gets exercised, same as real hardware.
      handleLine('Magnet Detected!');
      handleLine('Magnet Detected!');
      scheduleDemoPulse();
    }, period);
  }

  function startDemo(){
    if(demoTimer) return;
    setStatus('demo');
    el.demoBtn.textContent = 'Stop demo';
    logLine('Demo mode started — simulating sensor stream.');

    let t = 0;

    demoTimer = setInterval(() => {
      t += 1;
      const v = 11.5 + Math.sin(t / 6) * 1.4 + (Math.random() - 0.5) * 0.3;
      const a = 1.8 + Math.sin(t / 4) * 1.6 + (Math.random() - 0.5) * 0.4;
      demoCurrentAmps = a;
      updateVoltage(v);
      updateCurrent(a);
      touchUpdated();
      logLine('Input Voltage = ' + v.toFixed(2));
      logLine('Current: ' + a.toFixed(3) + ' A');

      if(t % 4 === 0){
        const h = 45 + Math.sin(t / 10) * 15 + (Math.random() - 0.5) * 3;
        const temp = 24 + Math.sin(t / 14) * 6 + (Math.random() - 0.5) * 1;
        updateWeather(temp, h);
        logLine('Humidity: ' + h.toFixed(2) + '%  Temperature: ' + temp.toFixed(2) + '°C');
      }

      // Ambient light drifts slowly dark/bright to exercise the streetlamp
      if(t % 15 === 0){
        const shouldBeDark = Math.sin(t / 15) > 0;
        if(shouldBeDark !== demoIsDark){
          demoIsDark = shouldBeDark;
          const line = 'Ambient Light: ' + (demoIsDark ? 'DARK - Streetlight ON' : 'BRIGHT - Streetlight OFF');
          handleLine(line);
        }
      }
    }, 900);

    scheduleDemoPulse();
  }

  function stopDemo(){
    if(demoTimer){ clearInterval(demoTimer); demoTimer = null; }
    if(demoPulseTimer){ clearTimeout(demoPulseTimer); demoPulseTimer = null; }
    lastClientPulseTime = 0;
    el.demoBtn.textContent = 'Run demo';
  }

  el.demoBtn.addEventListener('click', () => {
    if(demoTimer){ stopDemo(); setStatus(null); logLine('Demo mode stopped.'); }
    else { startDemo(); }
  });

  // ---------------- Init ----------------
  updateTurbineSpeed(0);
  updateCarSpeed(0);
  updateRpm(0);
  updateLight(false);
})();
