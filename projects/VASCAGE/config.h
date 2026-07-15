
#pragma once

// ── WiFi ──────────────────────────────────────────────────────────────────────
#define WIFI_SSID     "HARE KRISHNA"
#define WIFI_PASSWORD "@Harekrishna18"

// ── I2C Pins (NodeMCU) ────────────────────────────────────────────────────────
#define PIN_SDA  4    // D2
#define PIN_SCL  5    // D1

// ── Sensor ────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// MAX30102 Sensor Configuration — Every parameter explained
// Think of these as "camera settings" for your optical heart rate sensor.
// The sensor shines LEDs through your finger and measures how much light
// passes through. Your heartbeat changes blood volume, which changes light
// absorption — that rhythm IS your heart rate signal.
// ═══════════════════════════════════════════════════════════════════════════════

// ── How many raw samples to collect before running the HR/SpO2 algorithm ──────
// Think of this as "how long the sensor listens before making a decision."
//
// The algorithm needs to see at least 1–2 full heartbeat cycles to work.
// At 100Hz sample rate with SAMPLE_AVG=4, you get 25 clean samples/sec.
// So 50 samples = 2 seconds of data, which covers ~1.5 beats at 60 BPM. ✓
//
// TOO LOW  (e.g. 25): Algorithm doesn't see enough of the waveform.
//                     Misses peaks → wrong HR, invalid SpO2.
// TOO HIGH (e.g. 200): Works fine but takes 8+ seconds for first reading.
//                      Dashboard feels broken/frozen on startup.
// SWEET SPOT: 50–100. 50 is fast and accurate enough for most cases.
#define SENSOR_BUFFER_SIZE   50

// ── Brightness of the Red and IR LEDs (0–255) ─────────────────────────────────
// This controls how much light the sensor shines through your finger.
// It directly sets the LED drive current: 0=0mA, 255=51mA.
//
// Think of it like a torch — too dim and you can't see through the finger,
// too bright and the detector is blinded (saturates/clips the signal).
//
// Your target IR raw value should sit between 50,000 – 200,000.
// Watch the IR bar on your dashboard to judge this in real time.
//
// TOO LOW  (e.g. 10–20): IR raw value stays below 20,000.
//                         Weak signal buried in noise → always invalid readings.
// TOO HIGH (e.g. 200+):  IR raw value pins to maximum (clips flat).
//                         Algorithm sees a flat line, finds no peaks → invalid.
// SWEET SPOT: 30–70 for most fingers. Pale/thin skin → lower. Dark/thick → higher.
//             110 is aggressive — watch your IR value and reduce if it clips.
#define SENSOR_LED_BRIGHT    110

// ── How many consecutive raw samples the chip averages into one output sample ──
// The chip does this averaging internally in hardware before you ever see the data.
// Averaging smooths out high-frequency electrical noise in the signal.
//
// Think of it like asking 4 people "what time is it?" and averaging their answers
// instead of trusting just one — you get a more reliable answer.
//
// Valid values: 1, 2, 4, 8, 16, 32.
//
// TOO LOW  (1 = no averaging): Every tiny noise spike reaches the algorithm.
//                               HR detection is jittery, confidence fluctuates wildly.
// TOO HIGH (16–32): Signal is very smooth but reacts slowly to real heartbeat peaks.
//                   The algorithm can miss or blur the actual pulse peaks.
// SWEET SPOT: 4. Removes noise while keeping the pulse shape sharp and detectable.
#define SENSOR_SAMPLE_AVG    4

// ── Which LEDs to use ─────────────────────────────────────────────────────────
// Mode 1 = Red LED only   → Heart rate only, no SpO2
// Mode 2 = Red + IR LEDs  → Heart rate AND SpO2 (oxygen saturation)
// Mode 3 = Red + IR + Green (MAX30105 only, not available on MAX30102)
//
// Since you want both HR and SpO2, this must always be 2.
// Setting it to 1 will make SpO2 always show invalid — there is no "wrong"
// value here, it is just a feature selector. Never change this for your use case.
#define SENSOR_LED_MODE      2

// ── How many samples the sensor collects per second (Hz) ──────────────────────
// This is the raw sample rate BEFORE averaging is applied.
// After averaging by SAMPLE_AVG=4, your effective output rate = 100/4 = 25 samples/sec.
//
// IMPORTANT CONSTRAINT: With PULSE_WIDTH=411µs and dual LED mode (2 LEDs),
// the chip cannot physically sustain rates above 400Hz — the LED flashes
// would overlap. At 100Hz you are safely within limits.
//
// TOO LOW  (e.g. 25Hz): You capture fewer points of the heartbeat waveform.
//                        At very low HR (50 BPM = ~0.8 beats/sec), you might
//                        only see 20 samples per beat — borderline for the algorithm.
// TOO HIGH (e.g. 400Hz with 411µs pulse): Chip silently ignores your setting
//                        and drops to a lower rate anyway. You get unpredictable
//                        behaviour and the comment in your code becomes a lie.
// SWEET SPOT: 100Hz. Clean, compatible with 411µs pulse width, plenty of resolution.
#define SENSOR_SAMPLE_RATE   411

// ── How long each individual LED flash lasts (microseconds) ───────────────────
// Valid values: 69, 118, 215, 411 (µs). These are hardware-fixed steps, not arbitrary.
//
// This is the single most impactful quality setting on the sensor.
// A longer pulse lets the photodetector collect more photons per flash,
// giving a stronger, cleaner signal — like a longer camera exposure in low light.
//
// TOO LOW  (69µs): Each flash is very brief. Detector barely collects any light.
//                   IR raw values are tiny (often <10,000). Noisy, inaccurate.
// MEDIUM   (215µs): Decent signal but leaves quality on the table for no reason.
//                   You were using this before — it's why readings were borderline.
// TOO HIGH (411µs at 400Hz in dual LED): Timing constraint violated — chip clips
//                   the pulse silently. Must pair with 100Hz sample rate.
// SWEET SPOT: 411µs at 100Hz sample rate. Maximum photon collection within the
//              chip's timing budget. This is the #1 change that improves accuracy.
#define SENSOR_PULSE_WIDTH   411

// ── The measurement range of the analog-to-digital converter (ADC) ─────────────
// Valid values: 2048, 4096, 8192, 16384.
// This sets the maximum signal level the sensor can represent before it "clips"
// (saturates flat), similar to a volume knob's maximum before audio distorts.
//
// Higher ADC range = more headroom before clipping, but the signal occupies
// a smaller fraction of the range, so noise becomes proportionally larger.
//
// TOO LOW  (2048): Clips very easily. Any bright LED or thick finger saturates it.
//                   IR raw value hits 2048 and stays there (flat line) → invalid.
// TOO HIGH (16384): Lots of headroom, but your heartbeat signal is now a tiny
//                   ripple on a large background value. Harder for the algorithm
//                   to reliably detect peaks. This is your current setting.
// SWEET SPOT: 4096 for most cases with LED_BRIGHT in the 30–70 range.
//             Use 16384 only if your finger is very close and you keep clipping.
//             With LED_BRIGHT=110, you may need 16384 to avoid saturation — watch
//             your IR raw value. If it stays below 14,000 you are fine here.
#define SENSOR_ADC_RANGE     16384

// ── Finger detection ──────────────────────────────────────────────────────────
#define IR_FINGER_THRESHOLD  7000UL   // lower threshold — works across sensor units

// ── Web server ────────────────────────────────────────────────────────────────
#define SERVER_PORT      80
#define SSE_INTERVAL_MS  1000