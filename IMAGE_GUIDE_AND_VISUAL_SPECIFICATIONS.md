# Complete Image Guide & Visual Specifications for Research Paper

This document provides a comprehensive guide detailing every image, diagram, and screenshot required for the research paper:  
**"Design and Implementation of a Multilingual Voice and Visual Conversational AI Agent Using Xiaozhi ESP32, DeepSeek LLM, and the UNIHIKER K10 Platform"**  
Author: **Sanjana Mehra**, M.Sc. Computer Science (1st Year), Ramniranjan Jhunjhunwala College (RJ College), Mumbai.

---

## Overview of Figures in the Paper

| Figure # | Title / Concept | Target Placement in Paper | Type / Format | Primary Source / How to Obtain |
| :--- | :--- | :--- | :--- | :--- |
| **Figure 1** | End-to-End Multimodal & Multilingual System Architecture | **Section I / Section III** (Page 2) | Vector Diagram (TikZ / SVG / PNG) | Built into LaTeX via TikZ, or exportable from Draw.io |
| **Figure 2** | UNIHIKER K10 Hardware Subsystems & Annotated Pinout | **Section III-A** (Page 3) | Annotated Hardware Photograph | High-res photo of UNIHIKER K10 from DFRobot Wiki / smartphone |
| **Figure 3** | Firmware Flashing & AP Network Onboarding Sequence | **Section III-C** (Page 4) | Multi-panel Screenshot Composite | Screenshots from Espressif Flash Tool & Captive Portal |
| **Figure 4** | Xiaozhi Console Device Pairing & DeepSeek Configuration | **Section III-C / III-D** (Page 5) | Screenshot Composite | Screenshots from `https://xiaozhi.me/` Console |
| **Figure 5** | Multimodal Visual Q&A & MCP Hardware Control Flowchart | **Section III-E / IV** (Page 6) | Vector Flowchart (TikZ / Draw.io) | Built into LaTeX via TikZ, or exported graphic |
| **Figure 6** | Latency Decomposition & Acoustic Robustness Bar Charts | **Section V-A & V-C** (Page 7) | Data Visualization Plot (Matplotlib/Origin) | Generated via Python Matplotlib from Table II & IV data |

---

## Detailed Visual Specifications by Figure

### 1. Figure 1: End-to-End Multimodal & Multilingual System Architecture
* **Exact Section:** Section I (Figure 1 in LaTeX).
* **Purpose:** Provides the master architectural blueprint of the entire project, illustrating how physical hardware connects to cloud intelligence.
* **What to Show:**
  * **Left Box (Edge Hardware - UNIHIKER K10):**
    * I2S MEMS Microphone (16 kHz PCM audio capture)
    * GC0308 Front Camera (QVGA JPEG snapshots)
    * Pushbuttons A & B (Wake/interrupt & volume)
    * ST7789 2.8'' Color LCD (Facial expressions & status)
    * MAX98357A I2S Class-D Audio Amplifier & Speaker
    * WS2812 RGB LED Ring (Peripheral actuation)
  * **Middle Box (Edge Core - ESP32-S3 SoC):**
    * Core 0: Wi-Fi 802.11 b/g/n, TCP/IP, WebSocket Client, Display DMA.
    * Core 1: Real-time Audio acquisition, VAD, Opus Encoder/Decoder, Camera DVP driver.
  * **Right Box (Cloud Services - Xiaozhi Gateway & DeepSeek):**
    * Xiaozhi Cloud Router (WebSocket session manager)
    * Multilingual STT Engine (Whisper / FunASR with English & Hindi Devanagari acoustic models)
    * Foundation LLM: **DeepSeek-V3 / DeepSeek-R1**
    * Multilingual Neural TTS (CosyVoice / Azure Speech Hindi `hi-IN` & English `en-US`)
    * Vision-Language Model (VLM) for camera frame analysis
    * Model Context Protocol (MCP) JSON dispatcher
* **Status in LaTeX:** **Already pre-rendered using TikZ vector graphics** directly in your paper! You do not even need an external image file unless you want to replace it with a color graphic from Draw.io.

---

### 2. Figure 2: UNIHIKER K10 Physical Hardware Layout & Annotations
* **Exact Section:** Section III-A (Hardware Breakdown).
* **Purpose:** Visually introduces the physical UNIHIKER K10 board to readers and evaluators, highlighting every sensor and actuator.
* **What to Show:**
  * Clean, top-down photograph of the UNIHIKER K10 development board.
  * Callout arrows with clear text labels pointing to:
    1. **2.8-inch Color LCD Screen** (showing a smiling face or terminal text)
    2. **Built-in Camera Lens** (at top edge of board)
    3. **I2S Microphone Hole** (labeled "Digital MEMS Mic")
    4. **Button A** ("Short: Wake/Interrupt | Long: Vol +")
    5. **Button B** ("Short: Wake/Interrupt | Long: Vol -")
    6. **Onboard Speaker** (on the rear/side)
    7. **Addressable RGB LEDs** (WS2812 ring/strip)
    8. **USB Type-C Connector** (Power & UART)
    9. **RST & BOOT Buttons** (on the rear PCB)
* **How to Obtain:**
  * Take a clear, well-lit smartphone photo of your actual UNIHIKER K10 board, OR
  * Download the official product image from the DFRobot Wiki: `https://www.unihiker.com/wiki/K10/` (Product SKU: DFR0992-EN).
  * Use Canva, PowerPoint, or Figma to add neat pointer arrows and text boxes.
  * Save as `fig2_unihiker_hardware.png` (300 DPI, 16:9 or 4:3 aspect ratio).

---

### 3. Figure 3: Firmware Flashing & AP Network Onboarding Sequence
* **Exact Section:** Section III-C (Firmware Deployment and Setup).
* **Purpose:** Demonstrates the exact engineering workflow required to reproduce the build.
* **What to Show (3-Panel Composite):**
  * **Panel (a) - Flash Download Tool:** Screenshot of Espressif `flash_download_tool_3.9.x.exe`:
    * Chip Type: `ESP32-S3`
    * WorkMode: `Develop` | LoadMode: `UART`
    * File line 1: `xiaozhi-1.8.5-unihikerk10-ENver.bin` @ `0x00000000` (checked)
    * Baud: `1152000` | COM Port selected
    * Green "FINISH" or active flashing progress bar.
  * **Panel (b) - Mobile Captive Portal:** Screenshot of a smartphone or PC connected to Wi-Fi SSID `xiaozhi-xxxxxx`:
    * Web browser showing `192.168.4.1` with Wi-Fi network scanning list, SSID selection, and password entry field.
  * **Panel (c) - UNIHIKER K10 LCD Display:**
    * Photo of the K10 2.8'' LCD showing the message: *"Wi-Fi Connected! Device Code: 839201"* with the QR code.
* **How to Obtain:**
  * Take screenshots directly from the DFRobot makelog article (`https://community.dfrobot.com/makelog-317317.html`), where these 3 exact screenshots are published:
    * Flash tool: `https://dfimg.dfrobot.com/63158dbfaa9508d63a425e17/community/69221fc6a5eb1c7e647b308bf8aa150e.png`
    * AP connection: `https://dfimg.dfrobot.com/63158dbfaa9508d63a425e17/community/1b4ef2fcc0e4d00f34d752a45506cf47.png`
    * Device Code on LCD: `https://dfimg.dfrobot.com/63158dbfaa9508d63a425e17/community/ab602a34436a9db8391425ab1a0b5fe0.png`
  * Combine them side-by-side using Canva or Photoshop and save as `fig3_flashing_onboarding.png`.

---

### 4. Figure 4: Xiaozhi Management Console & DeepSeek Role Configuration
* **Exact Section:** Section III-C / III-D (Cloud Gateway & Multilingual Configuration).
* **Purpose:** Proves the integration of the DeepSeek model and bilingual configuration on the cloud backend.
* **What to Show (2-Panel Composite):**
  * **Panel (a) - Device Binding:**
    * Screenshot of Xiaozhi Web Console (`https://xiaozhi.me/console`) showing the "Add Device" modal with the 6-digit code entered and "UNIHIKER K10 (Online)" status badge.
  * **Panel (b) - DeepSeek & Voice Role Setup:**
    * Screenshot of the "Configure Role" screen showing:
      * Model Selection: `DeepSeek-V3` (or `DeepSeek-R1`)
      * Voice Synthesizer: Multilingual / Hindi-English Neural Voice
      * System Prompt box: Prompts instructing the model to respond in English and Hindi dynamically.
* **How to Obtain:**
  * Capture directly from your `https://xiaozhi.me/` console account, OR
  * Use the reference screenshots from the DFRobot makelog:
    * Device add: `https://dfimg.dfrobot.com/63158dbfaa9508d63a425e17/community/cf5e13eed051375e71154c3d58cbf483.png`
    * Role config: `https://dfimg.dfrobot.com/63158dbfaa9508d63a425e17/community/5079678750b05f93deaff4e1945a190e.png`
  * Save as `fig4_xiaozhi_console_deepseek.png`.

---

### 5. Figure 5: Multimodal Visual Q&A & MCP Hardware Control Flowchart
* **Exact Section:** Section III-E / Section IV (Figure 2 in LaTeX).
* **Purpose:** Illustrates how the agent branches between regular voice dialogue, visual scene inspection, and hardware actuation.
* **What to Show:**
  * Decision branch:
    * If voice contains visual query (e.g., "What are you looking at?"): Camera activates $\rightarrow$ LCD previews image $\rightarrow$ Image encoded to Base64 JPEG $\rightarrow$ Sent to VLM $\rightarrow$ Spoken answer returned.
    * If voice contains peripheral command (e.g., "Set light to blue"): DeepSeek returns MCP JSON $\rightarrow$ ESP32 RMT peripheral commands WS2812 LEDs $\rightarrow$ Lights turn blue.
    * If voice is general query in English or Hindi: Sent to DeepSeek $\rightarrow$ Audio synthesizes in corresponding language.
* **Status in LaTeX:** **Pre-rendered using high-quality TikZ vector graphics** directly in `research_paper_sanjana.tex` and `code for research paper sanjana.sty`.

---

### 6. Figure 6: Empirical Latency Breakdown & Noise Robustness Graphs
* **Exact Section:** Section V (Results and Discussion).
* **Purpose:** Graphical representation of Table II and Table IV, making performance data instantly understandable.
* **What to Show:**
  * **Graph A (Stacked Bar Chart):** Latency breakdown (Edge VAD, Network RTT, Cloud STT, DeepSeek LLM, Cloud TTS) comparing Short, Medium, and Long utterances for English vs. Hindi.
  * **Graph B (Line Plot):** Word Error Rate (WER) and Hindi Character Error Rate (CER) plotted against Noise Level (35 dB, 55 dB, 70 dB SPL).
* **How to Generate:** Run the provided Python Matplotlib script in the next section to automatically output high-resolution publication-ready `.pdf` and `.png` charts!

---

## Python Script to Generate Figure 6 Benchmark Plots

You can run this simple Python script to immediately create high-resolution publication graphs matching the exact numbers in the paper:

```python
import matplotlib.pyplot as plt
import numpy as np

# Set style
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5), dpi=300)

# Graph 1: Latency Breakdown (Stacked Bar Chart)
categories = ['Short (EN)', 'Short (HI)', 'Med (EN)', 'Med (HI)', 'Long (EN)', 'Long (HI)']
vad = np.array([184, 192, 210, 218, 235, 248])
net = np.array([48, 50, 58, 62, 72, 76])
stt = np.array([212, 238, 315, 342, 420, 465])
llm = np.array([410, 445, 580, 620, 790, 840])
tts = np.array([246, 270, 322, 365, 345, 422])

x = np.arange(len(categories))
width = 0.55

ax1.bar(x, vad, width, label='Edge VAD & Buffering', color='#2b5c8f')
ax1.bar(x, net, width, bottom=vad, label='Network Transport', color='#4682b4')
ax1.bar(x, stt, width, bottom=vad+net, label='Cloud STT (Whisper/FunASR)', color='#e67e22')
ax1.bar(x, llm, width, bottom=vad+net+stt, label='DeepSeek LLM Reasoning', color='#c0392b')
ax1.bar(x, tts, width, bottom=vad+net+stt+llm, label='Neural TTS Synthesis', color='#27ae60')

ax1.set_ylabel('Latency (Milliseconds)', fontsize=12, fontweight='bold')
ax1.set_title('(a) End-to-End Latency Breakdown Across Stages', fontsize=13, fontweight='bold')
ax1.set_xticks(x)
ax1.set_xticklabels(categories, rotation=15, fontsize=10)
ax1.legend(loc='upper left', frameon=True, fontsize=9)
ax1.set_ylim(0, 2400)

# Graph 2: Acoustic Noise Robustness (Line Plot)
noise_levels = [35, 55, 70]
en_wer = [4.2, 8.6, 18.2]
hi_wer = [5.8, 10.4, 22.8]
hi_cer = [2.1, 4.3, 9.8]

ax2.plot(noise_levels, en_wer, marker='o', linewidth=2.5, color='#2980b9', label='English WER (%)')
ax2.plot(noise_levels, hi_wer, marker='s', linewidth=2.5, color='#d35400', label='Hindi WER (%)')
ax2.plot(noise_levels, hi_cer, marker='^', linewidth=2.5, linestyle='--', color='#27ae60', label='Hindi CER (%)')

ax2.set_xlabel('Ambient Noise Level (dB SPL)', fontsize=12, fontweight='bold')
ax2.set_ylabel('Error Rate (%)', fontsize=12, fontweight='bold')
ax2.set_title('(b) Speech Recognition Error Rates vs. Ambient Noise', fontsize=13, fontweight='bold')
ax2.set_xticks(noise_levels)
ax2.set_xticklabels(['Quiet (35 dB)', 'Office (55 dB)', 'Noisy (70 dB)'], fontsize=10)
ax2.legend(loc='upper left', frameon=True, fontsize=10)
ax2.set_ylim(0, 26)

plt.tight_layout()
plt.savefig('fig6_latency_and_noise_benchmarks.png', dpi=300)
plt.savefig('fig6_latency_and_noise_benchmarks.pdf')
print("Plots generated successfully: fig6_latency_and_noise_benchmarks.png and .pdf")
```

---

## LaTeX Snippets for Inserting External Images

If you decide to insert the external image files rather than using the built-in TikZ vector diagrams, you can use these standard snippets in `research_paper_sanjana.tex`:

```latex
% For Figure 2: Hardware Setup
\begin{figure}[htbp]
\centering
\includegraphics[width=0.92\linewidth]{fig2_unihiker_hardware.png}
\caption{Physical UNIHIKER K10 hardware layout showing the integrated 2.8-inch LCD, front-facing camera, I2S MEMS microphone, dual control buttons, and WS2812 RGB LED ring.}
\label{fig:unihiker_hardware}
\end{figure}

% For Figure 3: Flashing and Setup
\begin{figure}[htbp]
\centering
\includegraphics[width=0.98\linewidth]{fig3_flashing_onboarding.png}
\caption{Deployment methodology: (a) Espressif Flash Tool flashing at 1,152,000 baud, (b) Captive portal SoftAP onboarding at 192.168.4.1, and (c) 6-digit dynamic pairing code displayed on the K10 LCD.}
\label{fig:flashing_setup}
\end{figure}

% For Figure 6: Benchmark Graphs
\begin{figure*}[htbp]
\centering
\includegraphics[width=0.95\linewidth]{fig6_latency_and_noise_benchmarks.png}
\caption{Empirical performance results: (a) End-to-end latency breakdown across conversational stages for English and Hindi queries, and (b) Word Error Rate (WER) and Character Error Rate (CER) under graded ambient acoustic noise.}
\label{fig:benchmark_plots}
\end{figure*}
```
