// ============================================================================
//  VIDYA DIGI - WebSerial AVR (Arduino Uno / ATmega328P) STK500 Flasher
// ============================================================================

(function () {
  'use strict';

  // STK500 Constants
  const STK_OK = 0x10;
  const STK_FAILED = 0x11;
  const STK_UNKNOWN = 0x12;
  const STK_NODEVICE = 0x13;
  const STK_INSYNC = 0x14;

  const STK_GET_SYNC = 0x30;
  const STK_SET_DEVICE = 0x42;
  const STK_SET_DEVICE_EXT = 0x45;
  const STK_ENTER_PROGMODE = 0x50;
  const STK_LEAVE_PROGMODE = 0x51;
  const STK_LOAD_ADDRESS = 0x55;
  const STK_PROG_PAGE = 0x64;
  const CRC_EOP = 0x20;

  const PAGE_SIZE = 128; // 128 bytes for ATmega328P

  // Helper sleep
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // Intel HEX Parser
  function parseHex(hexText) {
    const lines = hexText.split(/\r?\n/);
    const memory = new Uint8Array(32768);
    memory.fill(0xff);
    let maxAddr = 0;
    let minAddr = 32768;

    for (let line of lines) {
      line = line.trim();
      if (!line.startsWith(':')) continue;
      const len = parseInt(line.substring(1, 3), 16);
      const addr = parseInt(line.substring(3, 7), 16);
      const type = parseInt(line.substring(7, 9), 16);

      if (type === 0) {
        // Data record
        for (let i = 0; i < len; i++) {
          const byteVal = parseInt(line.substring(9 + i * 2, 11 + i * 2), 16);
          memory[addr + i] = byteVal;
          if (addr + i > maxAddr) maxAddr = addr + i;
          if (addr + i < minAddr) minAddr = addr + i;
        }
      } else if (type === 1) {
        // End of File
        break;
      }
    }
    if (minAddr > maxAddr) {
      minAddr = 0;
      maxAddr = 0;
    }
    return { memory, minAddr, maxAddr, totalBytes: maxAddr + 1 };
  }

  // AVR Web Flasher Class
  class AvrWebFlasher {
    constructor() {
      this.port = null;
      this.reader = null;
      this.writer = null;
      this.isFlashing = false;
    }

    log(msg, type = 'info') {
      const consoleEl = document.getElementById('avrTerminalLog');
      if (!consoleEl) return;
      const line = document.createElement('div');
      line.className = `avr-log-line avr-log-${type}`;

      const time = new Date().toLocaleTimeString();
      let icon = 'ℹ️';
      if (type === 'success') icon = '✅';
      if (type === 'error') icon = '❌';
      if (type === 'warn') icon = '⚠️';
      if (type === 'cmd') icon = '⚡';

      line.innerHTML = `<span style="opacity:0.5; font-size:0.75rem;">[${time}]</span> ${icon} ${msg}`;
      consoleEl.appendChild(line);
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }

    updateProgress(pct, statusText) {
      const bar = document.getElementById('avrProgressBar');
      const text = document.getElementById('avrProgressText');
      const status = document.getElementById('avrStatusLabel');
      if (bar) bar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
      if (text) text.textContent = `${Math.round(pct)}%`;
      if (status && statusText) status.textContent = statusText;
    }

    async readResponse(timeoutMs = 1000, expectedLen = 2) {
      const startTime = Date.now();
      const buffer = [];

      while (Date.now() - startTime < timeoutMs) {
        try {
          const { value, done } = await Promise.race([
            this.reader.read(),
            sleep(timeoutMs).then(() => ({ value: null, done: false })),
          ]);

          if (done) break;
          if (value) {
            for (let b of value) buffer.push(b);
            if (buffer.length >= expectedLen) break;
          }
        } catch (e) {
          break;
        }
      }
      return buffer;
    }

    async sendCmd(cmdBytes, expectedLen = 2, timeoutMs = 800) {
      await this.writer.write(new Uint8Array(cmdBytes));
      return await this.readResponse(timeoutMs, expectedLen);
    }

    async flash(hexData, baudRate = 115200) {
      if (this.isFlashing) return;
      this.isFlashing = true;

      try {
        if (!('serial' in navigator)) {
          throw new Error('Web Serial API is not supported in this browser. Please use Google Chrome or Microsoft Edge on Desktop.');
        }

        this.log('Parsing Intel HEX file...', 'info');
        const parsed = parseHex(hexData);
        if (parsed.totalBytes === 0) {
          throw new Error('Invalid or empty .hex file.');
        }
        this.log(`Parsed ${parsed.totalBytes} bytes of flash memory data.`, 'success');

        this.log('Requesting serial port connection...', 'info');
        this.port = await navigator.serial.requestPort();
        await this.port.open({ baudRate: baudRate });
        this.log(`Serial port opened at ${baudRate} baud.`, 'success');

        this.writer = this.port.writable.getWriter();
        this.reader = this.port.readable.getReader();

        // Step 1: DTR Pulse Reset
        this.log('Resetting Arduino Uno via DTR signal pulse...', 'cmd');
        this.updateProgress(10, 'Resetting microcontroller...');
        await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });
        await sleep(250);
        await this.port.setSignals({ dataTerminalReady: true, requestToSend: true });
        await sleep(50);
        await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });
        await sleep(150);

        // Step 2: STK500 Sync
        this.log('Synchronizing with STK500/Optiboot bootloader...', 'cmd');
        this.updateProgress(25, 'Connecting to bootloader...');

        let synced = false;
        for (let attempt = 1; attempt <= 15; attempt++) {
          const resp = await this.sendCmd([STK_GET_SYNC, CRC_EOP], 2, 200);
          if (resp.length >= 2 && resp[0] === STK_INSYNC && resp[1] === STK_OK) {
            synced = true;
            this.log(`In sync with bootloader (attempt ${attempt})!`, 'success');
            break;
          }
          await sleep(50);
        }

        if (!synced) {
          throw new Error('Could not establish STK500 sync. Ensure your Arduino Uno is connected to the selected COM port.');
        }

        // Step 3: Enter Programming Mode
        this.log('Entering programming mode...', 'info');
        this.updateProgress(35, 'Entering programming mode...');
        const progModeResp = await this.sendCmd([STK_ENTER_PROGMODE, CRC_EOP], 2, 500);
        if (progModeResp.length < 2 || progModeResp[0] !== STK_INSYNC || progModeResp[1] !== STK_OK) {
          this.log('Warning: Enter progmode response abnormal, continuing...', 'warn');
        }

        // Step 4: Write Memory Pages
        const totalPages = Math.ceil(parsed.totalBytes / PAGE_SIZE);
        this.log(`Writing ${parsed.totalBytes} bytes across ${totalPages} pages (${PAGE_SIZE} B/page)...`, 'cmd');

        for (let page = 0; page < totalPages; page++) {
          const byteAddr = page * PAGE_SIZE;
          const wordAddr = byteAddr >> 1; // Word address for STK500

          // Load Address
          const loadAddrCmd = [
            STK_LOAD_ADDRESS,
            wordAddr & 0xff,
            (wordAddr >> 8) & 0xff,
            CRC_EOP,
          ];
          const addrResp = await this.sendCmd(loadAddrCmd, 2, 400);
          if (addrResp.length < 2 || addrResp[0] !== STK_INSYNC || addrResp[1] !== STK_OK) {
            throw new Error(`Failed to load address for page ${page}`);
          }

          // Build Program Page Command
          const pageData = parsed.memory.subarray(byteAddr, byteAddr + PAGE_SIZE);
          const progPageHeader = [
            STK_PROG_PAGE,
            (PAGE_SIZE >> 8) & 0xff,
            PAGE_SIZE & 0xff,
            0x46, // 'F' for Flash
          ];
          const progCmd = new Uint8Array(progPageHeader.length + PAGE_SIZE + 1);
          progCmd.set(progPageHeader, 0);
          progCmd.set(pageData, progPageHeader.length);
          progCmd[progCmd.length - 1] = CRC_EOP;

          const progResp = await this.sendCmd(progCmd, 2, 600);
          if (progResp.length < 2 || progResp[0] !== STK_INSYNC || progResp[1] !== STK_OK) {
            throw new Error(`Failed to write page ${page}`);
          }

          const currentPct = 35 + ((page + 1) / totalPages) * 55;
          this.updateProgress(currentPct, `Flashing page ${page + 1}/${totalPages}...`);
        }

        // Step 5: Leave Programming Mode
        this.log('Finalizing flash operation & exiting programming mode...', 'info');
        await this.sendCmd([STK_LEAVE_PROGMODE, CRC_EOP], 2, 400);

        this.updateProgress(100, 'Flash complete!');
        this.log('🎉 SUCCESS: Code uploaded successfully to Arduino Uno!', 'success');
      } catch (err) {
        this.log(`ERROR: ${err.message}`, 'error');
        this.updateProgress(0, 'Failed');
      } finally {
        await this.cleanup();
        this.isFlashing = false;
      }
    }

    async cleanup() {
      try {
        if (this.reader) {
          await this.reader.cancel().catch(() => {});
          this.reader.releaseLock();
          this.reader = null;
        }
        if (this.writer) {
          await this.writer.close().catch(() => {});
          this.writer.releaseLock();
          this.writer = null;
        }
        if (this.port) {
          await this.port.close().catch(() => {});
          this.port = null;
        }
      } catch (e) {
        console.warn('Cleanup warning:', e);
      }
    }
  }

  // Global Modal UI Handlers
  globalThis.avrFlasherInstance = new AvrWebFlasher();

  globalThis.openAvrFlasherModal = async function (hexUrl = null, defaultName = 'Arduino Firmware') {
    let hexText = '';
    if (hexUrl) {
      try {
        const resp = await fetch(hexUrl);
        if (resp.ok) {
          hexText = await resp.text();
        }
      } catch (e) {
        console.warn('Could not auto-fetch hex URL:', hexUrl);
      }
    }

    let existingModal = document.getElementById('avrFlasherModal');
    if (existingModal) existingModal.remove();

    const modalHtml = `
      <div id="avrFlasherModal" style="position:fixed; inset:0; z-index:99999; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:16px;">
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:16px; width:100%; max-width:680px; box-shadow:0 20px 50px rgba(0,0,0,0.6); overflow:hidden; color:#f8fafc; font-family:var(--font-body, system-ui);">
          
          <!-- Header -->
          <div style="padding:20px 24px; background:#1e293b; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155;">
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size:1.6rem;">⚡</span>
              <div>
                <h3 style="margin:0; font-size:1.15rem; font-weight:700; color:#00f0ff;">WebSerial Arduino Uno Flasher</h3>
                <span style="font-size:0.8rem; color:#94a3b8;">STK500 Direct Serial Flasher (ATmega328P)</span>
              </div>
            </div>
            <button onclick="document.getElementById('avrFlasherModal').remove()" style="background:none; border:none; color:#94a3b8; font-size:1.4rem; cursor:pointer; padding:4px 8px;">✕</button>
          </div>

          <!-- Body -->
          <div style="padding:24px; display:flex; flex-direction:column; gap:20px;">
            
            <!-- File Info / Upload Box -->
            <div style="background:#020617; padding:16px; border-radius:12px; border:1px solid #1e293b; display:flex; flex-direction:column; gap:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:600; font-size:0.9rem; color:#cbd5e1;">Target Hex File:</span>
                <input type="file" id="avrLocalHexFile" accept=".hex" style="display:none" onchange="avrHandleCustomFile(this)" />
                <button onclick="document.getElementById('avrLocalHexFile').click()" style="background:#334155; border:none; color:#fff; padding:4px 12px; border-radius:6px; font-size:0.8rem; cursor:pointer;">📁 Choose Custom .hex</button>
              </div>
              <div id="avrFileNameDisplay" style="font-family:monospace; font-size:0.85rem; color:#00f0ff; word-break:break-all; background:#0f172a; padding:8px 12px; border-radius:6px; border:1px solid #1e293b;">
                ${hexText ? `Loaded: ${defaultName} (${hexText.length} bytes)` : 'No .hex file loaded. Please choose a .hex file.'}
              </div>
            </div>

            <!-- Progress Bar -->
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem;">
                <span id="avrStatusLabel" style="color:#94a3b8;">Ready to flash</span>
                <span id="avrProgressText" style="font-weight:bold; color:#00f0ff;">0%</span>
              </div>
              <div style="height:10px; background:#1e293b; border-radius:5px; overflow:hidden; position:relative;">
                <div id="avrProgressBar" style="width:0%; height:100%; background:linear-gradient(90deg, #00f0ff, #3b82f6); transition:width 0.2s ease;"></div>
              </div>
            </div>

            <!-- Log Terminal -->
            <div>
              <div style="font-size:0.8rem; font-weight:600; color:#64748b; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">Live Terminal Output</div>
              <div id="avrTerminalLog" style="background:#020617; border:1px solid #1e293b; border-radius:8px; height:180px; overflow-y:auto; padding:12px; font-family:monospace; font-size:0.8rem; display:flex; flex-direction:column; gap:4px;">
                <div class="avr-log-line avr-log-info"><span style="opacity:0.5; font-size:0.75rem;">[System]</span> ℹ️ Ready. Plug in your Arduino Uno via USB and click "Start Flashing".</div>
              </div>
            </div>

            <!-- Actions -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
              <div style="font-size:0.78rem; color:#64748b;">
                💡 Works natively in Chrome / Edge.
              </div>
              <button id="avrStartFlashBtn" onclick="avrStartFlashing()" style="background:#00f0ff; color:#020617; border:none; font-weight:700; padding:12px 28px; border-radius:10px; font-size:0.95rem; cursor:pointer; box-shadow:0 0 20px rgba(0,240,255,0.3); transition:all 0.2s;">
                🚀 Connect & Flash Arduino Uno
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    window._currentAvrHexText = hexText;

    if (!hexText && hexUrl) {
      try {
        const res = await fetch(hexUrl);
        window._currentAvrHexText = await res.text();
        document.getElementById('avrFileNameDisplay').textContent = `Loaded: ${hexUrl.split('/').pop()}`;
      } catch (e) {
        document.getElementById('avrFileNameDisplay').textContent = '⚠️ Could not auto-fetch .hex file. Please select a local .hex file above.';
      }
    }
  };

  globalThis.avrHandleCustomFile = function (input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      window._currentAvrHexText = e.target.result;
      document.getElementById('avrFileNameDisplay').textContent = `Loaded Custom File: ${file.name} (${file.size} bytes)`;
    };
    reader.readAsText(file);
  };

  globalThis.avrStartFlashing = async function () {
    const hexData = window._currentAvrHexText;
    if (!hexData) {
      alert('Please select or load a .hex file first.');
      return;
    }
    const btn = document.getElementById('avrStartFlashBtn');
    if (btn) btn.disabled = true;
    await globalThis.avrFlasherInstance.flash(hexData, 115200);
    if (btn) btn.disabled = false;
  };
})();
