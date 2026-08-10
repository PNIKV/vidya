/**
 * =====================================================================================
 * LiFi Secure Terminal - Standalone JavaScript Application Engine
 * =====================================================================================
 * Encodes ASCII Strings into 10-Bit Optical Data Packets (Start=1, 8 Data Bits MSB, Stop=0).
 * Operates Screen Optical Flash Emitter, Live LCD Simulator, & Hardware Torch API.
 */

/**
 * Encodes string into 10-bit frames:
 * 1 Start Bit (HIGH = 1), 8 Data Bits (MSB first), 1 Stop Bit (LOW = 0)
 */
function encodeStringToBinaryFrames(text) {
  const frames = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const asciiVal = char.codePointAt(0) || 0;

    // Start Bit (HIGH = 1)
    frames.push({ bit: 1, char: char, type: 'START', index: i });

    // 8 Data Bits (MSB-first: Bit 7 down to Bit 0)
    for (let bitIdx = 7; bitIdx >= 0; bitIdx--) {
      const bitVal = (asciiVal >> bitIdx) & 1;
      frames.push({ bit: bitVal, char: char, type: `D${bitIdx}`, index: i });
    }

    // Stop Bit (LOW = 0)
    frames.push({ bit: 0, char: char, type: 'STOP', index: i });
  }

  return frames;
}

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM SELECTORS ---
  const toggleTorchModeBtn = document.getElementById('toggleTorchModeBtn');
  const torchModeLabel = document.getElementById('torchModeLabel');

  const lcdLine2 = document.getElementById('lcdLine2');

  const emitterPad = document.getElementById('emitterPad');
  const emitterPulseGlow = document.getElementById('emitterPulseGlow');
  const emitterPadText = document.getElementById('emitterPadText');
  const emitterStatusBadge = document.getElementById('emitterStatusBadge');

  const presetBtns = document.querySelectorAll('.btn-chip');
  const customTextInput = document.getElementById('customTextInput');
  const charCounter = document.getElementById('charCounter');
  const clearInputBtn = document.getElementById('clearInputBtn');

  const pulseTimingSlider = document.getElementById('pulseTimingSlider');
  const timingValueDisplay = document.getElementById('timingValueDisplay');
  const baudDisplay = document.getElementById('baudDisplay');

  const transmitBtn = document.getElementById('transmitBtn');
  const transmitBtnText = document.getElementById('transmitBtnText');

  const telemetryDot = document.getElementById('telemetryDot');
  const transmissionProgressText = document.getElementById('transmissionProgressText');
  const currentCharDisplay = document.getElementById('currentCharDisplay');
  const currentBitFrameDisplay = document.getElementById('currentBitFrameDisplay');
  const binaryQueueLog = document.getElementById('binaryQueueLog');

  const waveformCanvas = document.getElementById('waveformCanvas');
  const fullscreenFlashOverlay = document.getElementById('fullscreenFlashOverlay');
  const fullscreenPad = document.getElementById('fullscreenPad');
  const overlayCharText = document.getElementById('overlayCharText');
  const overlayBitText = document.getElementById('overlayBitText');
  const closeOverlayBtn = document.getElementById('closeOverlayBtn');

  // --- APPLICATION STATE ---
  let torchTrack = null;
  let isTorchEnabled = false;
  let isTransmitting = false;
  let transmissionTimer = null;
  let lcdTimeoutTimer = null;

  let bitPeriodMs = 100; // Default 100 ms (10 Hz baud rate)
  let activePayload = "";
  let binaryFrameQueue = [];
  let queueIndex = 0;

  // LCD Simulator State
  let simulatedLcdBuffer = "";
  let isLcdListening = true;

  // Waveform visualization history array
  const waveHistoryMax = 100;
  const waveHistory = new Array(waveHistoryMax).fill(0);

  // --- PRESET CHIP BUTTON SELECTION ---
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Deactivate all preset buttons
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const msg = btn.dataset.msg || "";
      customTextInput.value = msg;
      updateCharCounter();
    });
  });

  // --- CUSTOM INPUT CHARACTER COUNTER ---
  customTextInput.addEventListener('input', () => {
    // Remove active preset highlight on manual typing
    presetBtns.forEach(b => b.classList.remove('active'));
    updateCharCounter();
  });

  function updateCharCounter() {
    const len = customTextInput.value.length;
    charCounter.textContent = `${len} / 64 CHARS`;
  }

  clearInputBtn.addEventListener('click', () => {
    customTextInput.value = '';
    presetBtns.forEach(b => b.classList.remove('active'));
    updateCharCounter();
  });

  // --- SPEED TUNER SLIDER HANDLER ---
  pulseTimingSlider.addEventListener('input', (e) => {
    bitPeriodMs = Number.parseInt(e.target.value, 10);
    timingValueDisplay.textContent = bitPeriodMs;
    const baud = (1000 / bitPeriodMs).toFixed(1);
    baudDisplay.textContent = `(${baud} Hz Baud)`;
  });

  // --- OPTIONAL TORCH TOGGLE ---
  toggleTorchModeBtn.addEventListener('click', async () => {
    if (isTorchEnabled) {
      disableTorchHardware();
    } else {
      await enableTorchHardware();
    }
  });

  async function enableTorchHardware() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Torch API not supported on this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      torchTrack = stream.getVideoTracks()[0];
      const capabilities = torchTrack.getCapabilities ? torchTrack.getCapabilities() : {};

      if (capabilities?.torch) {
        isTorchEnabled = true;
        torchModeLabel.textContent = "Torch: ACTIVE";
        toggleTorchModeBtn.classList.add('active');
      } else {
        alert("Camera accessed, but flashlight torch API feature is missing.");
      }
    } catch (err) {
      console.debug("Torch activation debug:", err);
      alert("Unable to access flashlight torch. Optical Screen Flash will be used!");
    }
  }

  function disableTorchHardware() {
    if (torchTrack) {
      try {
        torchTrack.applyConstraints({ advanced: [{ torch: false }] });
        torchTrack.stop();
      } catch (err) {
        console.debug("Torch stop debug:", err);
      }
      torchTrack = null;
    }
    isTorchEnabled = false;
    torchModeLabel.textContent = "Torch: OFF";
    toggleTorchModeBtn.classList.remove('active');
  }

  // --- FULLSCREEN PULSER MODAL HANDLERS ---
  emitterPad.addEventListener('click', () => {
    fullscreenFlashOverlay.classList.remove('hidden');
  });

  closeOverlayBtn.addEventListener('click', () => {
    fullscreenFlashOverlay.classList.add('hidden');
  });

  // --- TRANSMISSION LOGIC ---
  transmitBtn.addEventListener('click', () => {
    if (isTransmitting) {
      stopTransmission();
    } else {
      startTransmission();
    }
  });

  function startTransmission() {
    const text = customTextInput.value.trim();
    if (!text) {
      alert("Please enter a message or select a preset to transmit.");
      return;
    }

    activePayload = text;
    binaryFrameQueue = encodeStringToBinaryFrames(activePayload);
    queueIndex = 0;
    isTransmitting = true;

    // Reset simulated LCD line 2 if previous idle
    if (isLcdListening) {
      simulatedLcdBuffer = "";
      isLcdListening = false;
      lcdLine2.textContent = "                ";
    }

    // UI Updates
    transmitBtn.classList.add('transmitting');
    transmitBtnText.textContent = "STOP TRANSMISSION";

    emitterStatusBadge.textContent = "TRANSMITTING";
    emitterStatusBadge.style.color = "#00f0ff";
    emitterStatusBadge.style.background = "rgba(0, 240, 255, 0.15)";
    telemetryDot.style.background = "#f59e0b";

    // Format 10-Bit Frame Queue display
    let binaryLogHtml = "";
    binaryFrameQueue.forEach((item) => {
      if (item.type === 'START') binaryLogHtml += `<span style="color:#f59e0b; font-weight:bold;">[1] </span>`;
      else if (item.type === 'STOP') binaryLogHtml += `<span style="color:#64748b; font-weight:bold;"> [0]  </span>`;
      else binaryLogHtml += `<span style="color:#00f0ff;">${item.bit}</span>`;
    });
    binaryQueueLog.innerHTML = binaryLogHtml;

    // Start bit pulse loop
    transmitNextBit();
  }

  function stopTransmission() {
    isTransmitting = false;
    if (transmissionTimer) clearTimeout(transmissionTimer);

    // Turn off torch if enabled
    applyTorchBitState(false);

    // Reset Emitter Pad
    emitterPulseGlow.style.opacity = "0";
    emitterPadText.textContent = "PLACE LDR SENSOR HERE";
    emitterPadText.style.color = "#ffffff";
    emitterStatusBadge.textContent = "READY";
    emitterStatusBadge.style.color = "#94a3b8";
    emitterStatusBadge.style.background = "#09101f";

    // Reset Fullscreen overlay
    fullscreenPad.style.backgroundColor = "#000000";
    overlayBitText.textContent = "Place Arduino LDR Sensor directly against phone screen";
    overlayCharText.textContent = "--";

    // Reset UI Transmit button
    transmitBtn.classList.remove('transmitting');
    transmitBtnText.textContent = "TRANSMIT TO LCD";

    telemetryDot.style.background = "#00f0ff";
    transmissionProgressText.textContent = "READY";
    currentCharDisplay.textContent = "--";
    currentBitFrameDisplay.textContent = "--";

    // Schedule 4000ms LCD idle timeout reset
    scheduleLcdTimeout();
  }

  /**
   * Recursive optical pulse bit execution loop
   */
  async function transmitNextBit() {
    if (!isTransmitting || queueIndex >= binaryFrameQueue.length) {
      stopTransmission();
      transmissionProgressText.textContent = "TRANSMISSION COMPLETE";
      return;
    }

    const currentFrame = binaryFrameQueue[queueIndex];
    const bitState = currentFrame.bit === 1;

    // Telemetry UI Updates
    transmissionProgressText.textContent = `SENDING BIT ${queueIndex + 1} / ${binaryFrameQueue.length}`;
    const codePoint = currentFrame.char.codePointAt(0) || 0;
    currentCharDisplay.textContent = `'${currentFrame.char}' (${codePoint})`;
    currentBitFrameDisplay.textContent = `${currentFrame.type}: [${currentFrame.bit}]`;

    // 1. Update Optical Emitter Target Pad on Page
    if (bitState) {
      emitterPulseGlow.style.opacity = "1";
      emitterPadText.textContent = `HIGH PULSE [1]`;
      emitterPadText.style.color = "#070b14";
      
      fullscreenPad.style.backgroundColor = "#FFFFFF";
      overlayBitText.textContent = `PULSE HIGH [1] - ${currentFrame.type}`;
      overlayBitText.style.color = "#000000";
      overlayCharText.style.color = "#000000";
    } else {
      emitterPulseGlow.style.opacity = "0";
      emitterPadText.textContent = `LOW PULSE [0]`;
      emitterPadText.style.color = "#00f0ff";

      fullscreenPad.style.backgroundColor = "#000000";
      overlayBitText.textContent = `PULSE LOW [0] - ${currentFrame.type}`;
      overlayBitText.style.color = "#94a3b8";
      overlayCharText.style.color = "#ffffff";
    }
    overlayCharText.textContent = `'${currentFrame.char}'`;

    // 2. Apply Hardware Torch state if active
    if (isTorchEnabled) {
      applyTorchBitState(bitState);
    }

    // 3. Update Simulated Hardware LCD Output as Stop Bit completes
    if (currentFrame.type === 'STOP') {
      updateSimulatedLCD(currentFrame.char);
    }

    // 4. Update Waveform graph history
    waveHistory.shift();
    waveHistory.push(currentFrame.bit);
    renderWaveform();

    // Advance queue index
    queueIndex++;

    // Schedule next bit pulse
    transmissionTimer = setTimeout(transmitNextBit, bitPeriodMs);
  }

  function applyTorchBitState(turnOn) {
    if (!torchTrack) return;
    try {
      torchTrack.applyConstraints({ advanced: [{ torch: turnOn }] });
    } catch (err) {
      console.debug("Torch constraint debug:", err);
    }
  }

  // --- SIMULATED HARDWARE LCD RECEIVER UPDATER ---
  function updateSimulatedLCD(char) {
    simulatedLcdBuffer += char;
    
    let displayStr = simulatedLcdBuffer;
    if (displayStr.length > 16) {
      displayStr = displayStr.substring(displayStr.length - 16);
    }
    
    // Pad to 16 chars with spaces
    while (displayStr.length < 16) {
      displayStr += " ";
    }
    
    lcdLine2.textContent = displayStr;
  }

  function scheduleLcdTimeout() {
    if (lcdTimeoutTimer) clearTimeout(lcdTimeoutTimer);
    lcdTimeoutTimer = setTimeout(() => {
      simulatedLcdBuffer = "";
      isLcdListening = true;
      lcdLine2.textContent = "Listening...    ";
    }, 4000);
  }

  // --- OSCILLOSCOPE CANVAS WAVEFORM RENDERER ---
  function renderWaveform() {
    if (!waveformCanvas) return;
    const ctx = waveformCanvas.getContext('2d');
    const width = waveformCanvas.width = waveformCanvas.parentElement.clientWidth;
    const height = waveformCanvas.height = waveformCanvas.parentElement.clientHeight;

    ctx.clearRect(0, 0, width, height);

    // Grid center line
    ctx.strokeStyle = "rgba(34, 53, 82, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw square wave
    ctx.strokeStyle = isTransmitting ? "#00f0ff" : "#334155";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = isTransmitting ? "#00f0ff" : "transparent";
    ctx.shadowBlur = 10;
    ctx.beginPath();

    const step = width / waveHistoryMax;

    for (let i = 0; i < waveHistory.length; i++) {
      const x = i * step;
      const y = waveHistory[i] === 1 ? height * 0.2 : height * 0.8;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevY = waveHistory[i - 1] === 1 ? height * 0.2 : height * 0.8;
        ctx.lineTo(x, prevY);
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  window.addEventListener('resize', renderWaveform);
  renderWaveform();
});
