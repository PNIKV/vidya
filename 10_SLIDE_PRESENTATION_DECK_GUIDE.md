# 10-Slide Academic Presentation Deck Guide

**Research Presentation Guide for PowerPoint / Google Slides**  
**Project Title:** Design and Implementation of a Multilingual Voice and Visual Conversational AI Agent Using Xiaozhi ESP32, DeepSeek LLM, and the UNIHIKER K10 Platform  
**Presenter:** Sanjana Mehra  
**Program:** M.Sc. Computer Science (1st Year), Research Methodology  
**Institution:** Department of Computer Science, Ramniranjan Jhunjhunwala College (Autonomous), Mumbai  
**Affiliation:** University of Mumbai  
**Presentation Time:** 10–12 Minutes (+ 3 Minutes Q&A)

---

## Slide-by-Slide Presentation Blueprint

```
SLIDE BREAKDOWN SUMMARY:
Slide 01: Title & Introduction
Slide 02: Research Motivation & Background
Slide 03: Problem Statement & Research Questions (RQs)
Slide 04: The Hardware Platform: UNIHIKER K10 (ESP32-S3)
Slide 05: Edge-Cloud System Architecture & Xiaozhi Framework
Slide 06: Firmware Deployment & Network Onboarding Workflow
Slide 07: Multilingual Conversational Engine (English & Hindi)
Slide 08: Multimodal Vision & Model Context Protocol (MCP) Control
Slide 09: Experimental Results & Performance Benchmarks
Slide 10: Conclusion, Academic Contributions & Future Roadmap
```

---

### SLIDE 1: Title & Presenter Introduction
* **Slide Title:** Design and Implementation of a Multilingual Voice and Visual Conversational AI Agent
* **Subtitle:** Powered by Xiaozhi ESP32, DeepSeek LLM, and the UNIHIKER K10 Platform
* **Visuals / Layout:**
  * Clean, academic two-column design.
  * Left Column: Project Title, Subtitle, and Key Badges: `TinyML`, `ESP32-S3`, `DeepSeek-V3`, `Multilingual (English + Hindi)`, `Multimodal Vision`.
  * Right Column: High-resolution photo of the UNIHIKER K10 development board showing an expressive face on its 2.8-inch LCD screen.
  * Footer: Presenter Name: Sanjana Mehra | M.Sc. Computer Science | Ramniranjan Jhunjhunwala College (RJ College), Mumbai.
* **On-Slide Content (Bullet Points):**
  * **Presenter:** Sanjana Mehra (M.Sc. Computer Science, 1st Year)
  * **Department:** Department of Computer Science, Ramniranjan Jhunjhunwala College (Autonomous)
  * **Focus Area:** TinyML, Edge-Cloud Hybrid Architectures, Conversational AI
  * **Core Technologies:** UNIHIKER K10 (ESP32-S3), Xiaozhi AI Open-Source Framework, DeepSeek Foundation Models
* **Speaker Script (Time: 0:00 – 1:00 min):**
  > *"Respected professors, evaluators, and colleagues, good morning. My name is Sanjana Mehra, currently pursuing my Master of Science in Computer Science at Ramniranjan Jhunjhunwala College, Mumbai. Today, I am proud to present my research project titled 'Design and Implementation of a Multilingual Voice and Visual Conversational AI Agent Using Xiaozhi ESP32, DeepSeek LLM, and the UNIHIKER K10 Platform'.  
  > In this research, we bridge the gap between resource-constrained microcontrollers and state-of-the-art Large Language Models. We have designed an embodied, low-power edge conversational terminal capable of interacting fluently in both English and Hindi, perceiving its visual surroundings through an onboard camera, and physically controlling hardware peripherals using voice commands."*

---

### SLIDE 2: Research Motivation & Background
* **Slide Title:** Research Motivation: TinyML Meets Foundation LLMs
* **Visuals / Layout:**
  * Split visual: Left shows a tiny microcontroller (ESP32-S3: 512 KB RAM, 1 Watt) versus Right showing a massive Cloud Foundation Model (DeepSeek: 671B parameters, multi-server clusters).
  * Center callout box: "The Edge-Cloud Hybrid Solution".
  * Map of India with language icons highlighting the necessity of Hindi and Hinglish voice accessibility.
* **On-Slide Content (Bullet Points):**
  * **The TinyML Paradox:** Microcontrollers offer extreme energy efficiency ($<1.5$\,W) and instant boot, but cannot physically run 100B+ parameter LLMs.
  * **The Cloud Limitation:** Cloud LLMs offer deep reasoning, but require intelligent edge nodes for sensory capture, audio digitization, and physical embodiment.
  * **The Linguistic Barrier:** Most embedded voice assistants are strictly monolingual (English or Mandarin), alienating over 600 million Hindi speakers in India.
  * **The Embodiment Gap:** Conventional smart speakers are passive voice relays lacking integrated vision, on-device display feedback, and peripheral actuation.
* **Speaker Script (Time: 1:00 – 2:00 min):**
  > *"To understand why this work is critical, let us examine the fundamental dilemma in modern edge AI. On one hand, TinyML has made microcontrollers astonishingly capable, running at milliwatt power budgets. On the other hand, conversational reasoning requires Large Language Models like DeepSeek, which contain hundreds of billions of parameters that cannot fit on an embedded chip.  
  > Furthermore, existing embedded assistants suffer from a severe linguistic divide: they only comprehend English, leaving behind millions of vernacular speakers in India where Hindi and code-switched Hinglish dominate daily life. Moreover, typical IoT smart speakers lack cameras and physical actuators. Our motivation is to create an accessible, embodied terminal that combines local sensing with cloud intelligence while natively speaking both English and Hindi."*

---

### SLIDE 3: Problem Statement & Research Questions
* **Slide Title:** Problem Formulation & Core Research Questions
* **Visuals / Layout:**
  * Three distinct cards or banner blocks corresponding to $RQ_1$, $RQ_2$, and $RQ_3$, accompanied by relevant icons (Stopwatch for Latency, Dual Speech Bubbles for Language, and Camera/Gear for Multimodal/Actuation).
* **On-Slide Content (Bullet Points):**
  * **Primary Goal:** Engineer an edge-assisted, multimodal, bilingual conversational agent on the UNIHIKER K10 (ESP32-S3) platform.
  * **$RQ_1$ (Latency Breakdown):** What is the achievable round-trip conversational turn latency on an ESP32-S3 microcontroller, and how is it distributed across edge VAD, network transport, STT, DeepSeek LLM, and TTS?
  * **$RQ_2$ (Multilingual Parity):** How does dual-language (English vs. Hindi) operation impact acoustic Word Error Rate (WER), Character Error Rate (CER), and synthesis naturalness across noise environments?
  * **$RQ_3$ (Multimodal & Actuation Overhead):** What is the processing, memory, and latency overhead introduced by camera-based visual Q&A and Model Context Protocol (MCP) hardware actuation?
* **Speaker Script (Time: 2:00 – 3:00 min):**
  > *"To guide our engineering design and scientific evaluation, we established three primary research questions. First, in $RQ_1$, we investigate the end-to-end latency budget: can an inexpensive microcontroller deliver a response within the natural human conversational threshold of two seconds? Second, in $RQ_2$, we assess linguistic parity: how does Hindi acoustic processing and Devanagari tokenization compare against English across quiet and noisy environments? And third, in $RQ_3$, we measure the overhead of multimodal vision and voice-actuated hardware control using the Model Context Protocol."*

---

### SLIDE 4: The Hardware Platform: UNIHIKER K10
* **Slide Title:** Hardware Platform: UNIHIKER K10 (DFRobot DFR0992-EN)
* **Visuals / Layout:**
  * High-res top-view photo of the UNIHIKER K10 board with clear callout lines pointing to each peripheral:
    1. Espressif ESP32-S3 SoC
    2. 2.8'' Color LCD (ST7789)
    3. GC0308 CMOS Camera
    4. I2S MEMS Microphone
    5. I2S MAX98357A Audio Amplifier + Speaker
    6. WS2812 Addressable RGB LEDs
    7. Dual Pushbuttons (A & B)
* **On-Slide Content (Bullet Points):**
  * **SoC:** Espressif ESP32-S3 dual-core 32-bit Xtensa LX7 @ 240 MHz, vector instructions.
  * **Memory:** 512 KB internal SRAM + 16 MB high-speed Octal PSRAM + 16 MB Flash.
  * **Display & Visuals:** 2.8-inch TFT LCD (240$\times$320, ST7789 via high-speed SPI with DMA) for animated facial expressions and image preview.
  * **Imaging:** Integrated front-facing CMOS camera (GC0308, QVGA/VGA resolution).
  * **Acoustics:** Digital I2S MEMS omnidirectional microphone + MAX98357A Class-D amplifier driving an onboard 1~W speaker.
  * **Actuation & UI:** 3x programmable WS2812 RGB LEDs, tactile Buttons A (wake/vol+) and B (wake/vol-).
* **Speaker Script (Time: 3:00 – 4:00 min):**
  > *"For our hardware foundation, we chose the UNIHIKER K10 single-board platform by DFRobot. While conventional developers build prototypes by tangling jumper wires between breadboards, sensors, and displays, the UNIHIKER K10 integrates everything onto a single, reliable PCB.  
  > It is powered by the dual-core ESP32-S3 running at 240 MHz with 16 megabytes of PSRAM. It includes an onboard 2.8-inch color LCD for expressive facial animations, a front-facing camera for vision, digital I2S microphone and audio amplifier, programmable RGB LEDs, and physical tactile buttons. This makes it an ideal self-contained terminal for edge AI."*

---

### SLIDE 5: Edge-Cloud Architecture & Xiaozhi AI Framework
* **Slide Title:** Edge-to-Cloud System Architecture & Firmware Pipeline
* **Visuals / Layout:**
  * Clean block diagram (Figure 1 from the paper) illustrating:
    * UNIHIKER K10 (Core 0: Network & Display | Core 1: Audio DSP & VAD)
    * Bidirectional Full-Duplex WebSocket Link (Opus Audio Frames & JSON Control)
    * Xiaozhi Cloud Gateway (Session Management & Routing)
    * Cloud Engines: Multilingual STT $\rightarrow$ DeepSeek-V3 LLM $\rightarrow$ Neural TTS
* **On-Slide Content (Bullet Points):**
  * **Firmware Foundation:** Open-source *xiaozhi-esp32* (v1.8.5) built on Espressif ESP-IDF v5.x and FreeRTOS.
  * **Dual-Core Workload Partitioning:**
    * *Core 0:* Wi-Fi 802.11 b/g/n stack, LwIP TCP/IP, full-duplex WebSocket client, SPI display DMA.
    * *Core 1:* Real-time I2S audio capture, Voice Activity Detection (VAD), Opus encode/decode, camera DVP driver.
  * **Low-Latency Transport:** Binary Opus audio streaming (16 kHz, 16–24 kbps) over persistent WebSocket connections, eliminating HTTP handshake overhead.
  * **Barge-In Capability:** Immediate speech interruption when user speaks during TTS playback.
* **Speaker Script (Time: 4:00 – 5:00 min):**
  > *"The software architecture is structured around the open-source xiaozhi-esp32 firmware. To ensure zero audio stutter and maintain responsive network streaming, we partition workloads across the ESP32-S3's dual cores using FreeRTOS. Core 0 manages the Wi-Fi stack and full-duplex WebSocket connection, while Core 1 is strictly dedicated to audio DSP, Opus compression, and camera capture.  
  > Crucially, we do not send bulky raw audio. Utterances are encoded into Opus packets in real time and streamed over persistent WebSockets to the Xiaozhi Cloud Gateway. The gateway orchestrates speech recognition, DeepSeek reasoning, and neural voice synthesis, streaming response audio back to our speaker with full barge-in interruption capability."*

---

### SLIDE 6: Firmware Deployment & Cloud Setup Workflow
* **Slide Title:** Engineering Deployment & Zero-Touch Onboarding
* **Visuals / Layout:**
  * Three-step sequence diagram with real UI screenshots:
    1. Espressif Flash Download Tool (Chip: ESP32-S3, Baud: 1,152,000, Addr: 0x00).
    2. Mobile Captive Portal (Connecting to `xiaozhi-xxxxxx` AP at `192.168.4.1`).
    3. UNIHIKER LCD showing the 6-digit dynamic pairing code and Xiaozhi Console (`xiaozhi.me`).
* **On-Slide Content (Bullet Points):**
  * **Step 1: UART Firmware Flashing:**
    * Bootloader activated via BOOT button; flashed using Espressif Flash Tool at 1,152,000 baud to address `0x00000000`. Full chip erase prevents partition table conflicts.
  * **Step 2: SoftAP Captive Portal Onboarding:**
    * Automatic fallback to SoftAP (`xiaozhi-xxxxxx`) upon unconfigured Wi-Fi; captive web interface at `192.168.4.1` saves 2.4 GHz credentials to NVS memory.
  * **Step 3: Dynamic Cloud Binding & DeepSeek Setup:**
    * Onboard 2.8'' LCD renders unique 6-digit pairing code; developer claims device on `https://xiaozhi.me/` console.
    * Foundation model configured to **DeepSeek-V3 / DeepSeek-R1** with bilingual system prompts.
* **Speaker Script (Time: 5:00 – 6:00 min):**
  > *"Deploying the system requires a clean, three-step engineering workflow. First, we flash the pre-compiled xiaozhi firmware binary at address 0x00000000 using the Espressif Flash Download Tool over high-speed UART at 1.15 Megabaud.  
  > Second, when powered on, the board broadcasts an open Wi-Fi hotspot. Connecting with a phone opens a captive portal where Wi-Fi credentials are saved directly to non-volatile storage.  
  > Third, upon connecting to the internet, the UNIHIKER K10 displays a dynamic 6-digit pairing code on its screen. Entering this code on the Xiaozhi console instantly pairs the physical board to our cloud account, where we select DeepSeek as our brain and inject our bilingual role instructions."*

---

### SLIDE 7: Multilingual Conversational Pipeline (English & Hindi)
* **Slide Title:** Native Bilingual Pipeline: English & Hindi Voice Interaction
* **Visuals / Layout:**
  * Two conversational branch flowcharts:
    * English query: "What is the capital of India?" $\rightarrow$ STT: English text $\rightarrow$ DeepSeek reasoning $\rightarrow$ English Neural TTS: "New Delhi..."
    * Hindi query: "सूर्य से बिजली कैसे बनती है?" $\rightarrow$ STT: Devanagari transcript $\rightarrow$ DeepSeek reasoning $\rightarrow$ Hindi Neural TTS: "सौर पैनल सूर्य के प्रकाश को..."
  * Code-Switching Badge: "Hinglish Support Enabled".
* **On-Slide Content (Bullet Points):**
  * **Dual-Language Acoustic Modeling:**
    * Cloud ASR (FunASR/Whisper-large-v3) trained on cross-lingual corpora; transcribes Devanagari script phonemes without manual language toggling.
  * **DeepSeek Cross-Lingual Semantic Reasoning:**
    * Grounded via system prompt to dynamically match user's language: English $\rightarrow$ English; Hindi $\rightarrow$ Hindi; Hinglish $\rightarrow$ Natural Hinglish.
  * **Devanagari Phonetic Synthesis:**
    * High-fidelity neural TTS engines (CosyVoice / Azure Speech `hi-IN` and `en-US`) deliver natural cadence, honoring nasalization and aspirated consonants.
  * **Low Latency Delta:** Hindi queries incur only a minor 9.1% latency overhead (1618 ms vs. 1482 ms) due to sub-word tokenization lengths.
* **Speaker Script (Time: 6:00 – 7:00 min):**
  > *"A standout innovation of our implementation is its native dual-language intelligence. Traditional voice assistants force the user to pick either English or Hindi in settings. In our architecture, the user can speak in English, Hindi, or even mixed Hinglish completely naturally.  
  > When an utterance arrives, the multilingual acoustic model identifies the phonemes and transcribes them directly into English text or Devanagari script. DeepSeek's powerful multilingual pre-training recognizes the language context instantly and generates a culturally grounded, grammatically accurate response. The tokens are then synthesized by a bilingual neural voice engine, speaking back with authentic Hindi pronunciation."*

---

### SLIDE 8: Multimodal Vision & MCP Hardware Actuation
* **Slide Title:** Embodied Intelligence: Camera Vision & MCP Hardware Control
* **Visuals / Layout:**
  * Left Panel (Multimodal Vision): Photo of UNIHIKER K10 taking a snapshot of an object, displaying the captured image on its 2.8'' LCD, and speaking the visual description.
  * Right Panel (Model Context Protocol): JSON tool-call snippet showing `{"tool": "set_rgb", "params": {"r": 0, "g": 0, "b": 255}}` and the onboard RGB LEDs glowing blue.
* **On-Slide Content (Bullet Points):**
  * **Voice-Triggered Visual Recognition:**
    * User asks: *"Take a photo for me"* or *"What are you looking at?"* (or Hindi: *"Dekho ye kya hai"*).
    * K10 captures QVGA (320$\times$240) JPEG via GC0308 camera in 142 ms, renders preview on 2.8'' LCD, and streams Base64 image to Cloud Vision-Language Model.
    * Total VQA turn latency: 1580 ms with 94.0% scene recognition accuracy.
  * **Model Context Protocol (MCP) Hardware Actuation:**
    * Enables DeepSeek to physically actuate edge hardware via structured JSON tool-calling.
    * Voice command: *"Set all lights to blue"* $\rightarrow$ DeepSeek generates tool call $\rightarrow$ ESP32 RMT peripheral commands WS2812 RGB LED strip in 18 ms.
    * Actuation success rate: 98.5% with sub-525 ms execution turnaround.
* **Speaker Script (Time: 7:00 – 8:00 min):**
  > *"Beyond speech, our terminal is truly embodied. When the user asks 'What are you looking at?' or 'Take a photo for me', the board triggers its onboard camera, captures a frame, instantly displays the snapshot on its 2.8-inch screen for visual confirmation, and streams the image to a Vision-Language Model. The AI analyzes the scene and explains it aloud in 1.5 seconds.  
  > Furthermore, we implemented the Model Context Protocol (MCP). If the user commands 'Turn the lights red' or 'Light ko laal kar do', DeepSeek outputs a structured JSON tool call. The ESP32 parses this packet and directly drives the onboard WS2812 RGB LEDs, achieving physical actuation in under 500 milliseconds with a 98.5% success rate."*

---

### SLIDE 9: Experimental Results & Performance Benchmarks
* **Slide Title:** Empirical Evaluation & Benchmark Analysis
* **Visuals / Layout:**
  * Two visual graphs (or clean summary tables):
    * Left: Stacked Bar Chart showing Latency Breakdown across stages (Edge VAD, Network, STT, DeepSeek LLM, TTS).
    * Right: Line Chart showing Word Error Rate (WER) vs. Noise Levels (35 dB, 55 dB, 70 dB SPL).
* **On-Slide Content (Key Data Highlights):**
  * **End-to-End Latency Breakdown ($RQ_1$):**
    * *English Overall Mean:* **1482.3 ms** (Short: 1100 ms | Medium: 1485 ms | Long: 1862 ms).
    * *Hindi Overall Mean:* **1617.7 ms** (Short: 1195 ms | Medium: 1607 ms | Long: 2051 ms).
    * *Dominant Stage:* DeepSeek LLM reasoning accounts for ~40% of turn latency; network RTT is under 5%.
  * **Microcontroller Resource Footprint:**
    * *Peak SRAM:* 308 KB / 512 KB (60.2% max utilization; 200 KB+ safety buffer).
    * *Peak PSRAM:* 8.2 MB / 16 MB (51.3% during camera DMA capture).
    * *Power Dissipation:* 910 mW (Listening) to 1450 mW (Active Vision + Wi-Fi) $\rightarrow$ 7+ hours on a 2000 mAh battery!
  * **Acoustic Robustness ($RQ_2$):**
    * Quiet (35 dB): English WER 4.2% | Hindi WER 5.8% (Hindi CER: 2.1%).
    * Office (55 dB): English WER 8.6% | Hindi WER 10.4% (Hindi CER: 4.3%).
* **Speaker Script (Time: 8:00 – 9:30 min):**
  > *"Now, let us examine our empirical findings. Across 100 benchmarked queries, our average round-trip conversational latency was 1482 milliseconds for English and 1618 milliseconds for Hindi. Both are well within the standard two-second threshold for natural human conversation. DeepSeek reasoning is the largest component at approximately 40%, while edge processing and network transport remain exceptionally lightweight.  
  > From a hardware perspective, internal SRAM usage peaked at only 308 Kilobytes, leaving 200 Kilobytes of headroom. Maximum power consumption never exceeded 1.45 Watts, meaning this terminal can operate for over seven hours on a small 2000 mAh lithium battery. In acoustic testing, speech accuracy remained exceptional under 55 dB ambient noise, with Hindi Character Error Rate at just 4.3%."*

---

### SLIDE 10: Conclusion, Academic Contributions & Future Roadmap
* **Slide Title:** Conclusion, Key Contributions & Future Roadmap
* **Visuals / Layout:**
  * Summary matrix with checkmarks for project deliverables: `Bilingual Voice`, `Multimodal Camera`, `MCP Hardware Control`, `Sub-1.5s Latency`, `Low Power`.
  * Future Research Horizon icons: Micro-Quantized SLMs, On-Device Hindi Beamforming, Lightweight IoT Security.
* **On-Slide Content (Bullet Points):**
  * **Summary of Contributions:**
    * Designed, deployed, and benchmarked an embodied, edge-assisted conversational AI agent on the UNIHIKER K10 (ESP32-S3) platform.
    * Validated bilingual conversational parity for English and Hindi with sub-1.6s latency.
    * Demonstrated multimodal camera perception and voice-actuated Model Context Protocol (MCP) LED control.
    * Provided an open, fully reproducible reference design for low-cost educational terminals.
  * **Future Research Directions:**
    * *On-Device Quantized SLMs:* Deploying 2-bit/4-bit micro-models (MobileLLM/TinyLlama) in PSRAM for offline fallback.
    * *Dual-Mic Beamforming:* Implementing RNNoise on Core 1 to improve Hindi phonetic clarity above 70 dB SPL.
    * *Lightweight Cryptography:* Adding Enhanced TEA or ASCON encryption to secure voice payloads without full TLS latency penalties.
* **Speaker Script (Time: 9:30 – 11:00 min):**
  > *"In conclusion, this research proves that low-cost, microcontroller-class hardware can deliver sophisticated, multilingual, and multimodal conversational AI. By pairing the UNIHIKER K10 with the xiaozhi-esp32 firmware and DeepSeek foundation models, we have built a functional terminal that understands spoken English and Hindi, captures and explains visual surroundings, and executes physical IoT commands.  
  > In future work, we plan to implement 4-bit quantized Small Language Models directly in PSRAM for offline operation, alongside dual-microphone beamforming for extreme noise cancellation.  
  > Thank you very much for your time and attention. I would now be delighted to answer any questions."*

---

## Pro-Tips for Presenting Your Seminar / Viva

1. **Slide Design:** Use a clean, dark-blue and white theme (such as navy `#0f2b48` and white `#ffffff`) with sans-serif fonts (e.g., Arial, Calibri, or Montserrat). Avoid cluttered text blocks.
2. **Confidence with Terminology:** Practice saying technical terms fluently: *"ESP32-S3 Xtensa dual-core"*, *"Model Context Protocol (MCP)"*, *"Opus compression"*, *"Devanagari acoustic modeling"*, and *"DeepSeek reasoning"*.
3. **Hardware Demonstration (If Live Demo is Permitted):** Bring your UNIHIKER K10 board to the presentation! Power it via a USB power bank, wake it with *"Jarvis"*, ask one question in English (e.g., *"What is the UNIHIKER K10?"*), ask one question in Hindi (e.g., *"नमस्ते, आप कैसे हैं?"*), and command the light: *"Set lights to blue"*. A live 30-second demo guarantees top grades!
