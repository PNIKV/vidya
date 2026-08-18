/*******************************************************************************
 * ESP32-CAM DASHBOARD CODE WITH ACCESS POINT FALLBACK
 * Target Hardware : AI-Thinker ESP32-CAM
 * Tools > Board   : "ESP32 Wrover Module" (or AI Thinker ESP32-CAM)
 * Partition Scheme: "Huge APP (3MB No OTA/1MB SPIFFS)"
 * PSRAM           : "Enabled"
 * Open URL in Browser: http://192.168.0.214
 ******************************************************************************/

#include "esp_camera.h"
#include <WiFi.h>
#include "esp_http_server.h"

// =============================================================================
// 1. WI-FI & HARDWARE PIN CONFIGURATION
// =============================================================================

// --- Primary Wi-Fi Credentials ---
const char* WIFI_SSID     = "STEM";      // Your Wi-Fi Name (Case sensitive)
const char* WIFI_PASSWORD = "STEM@123";  // Your Wi-Fi Password

// --- Fallback Access Point Credentials (If home Wi-Fi fails) ---
const char* AP_SSID     = "ESP32-CAM-HOTSPOT";
const char* AP_PASSWORD = "password123";

// --- AI-THINKER Pin Definitions ---
#define PWDN_GPIO_NUM    32
#define RESET_GPIO_NUM   -1
#define XCLK_GPIO_NUM     0
#define SIOD_GPIO_NUM    26
#define SIOC_GPIO_NUM    27

#define Y9_GPIO_NUM      35
#define Y8_GPIO_NUM      34
#define Y7_GPIO_NUM      39
#define Y6_GPIO_NUM      36
#define Y5_GPIO_NUM      21
#define Y4_GPIO_NUM      19
#define Y3_GPIO_NUM      18
#define Y2_GPIO_NUM       5
#define VSYNC_GPIO_NUM   25
#define HREF_GPIO_NUM    23
#define PCLK_GPIO_NUM    22

#define FLASH_GPIO_NUM    4

httpd_handle_t camera_httpd = NULL;
httpd_handle_t stream_httpd = NULL;

// --- Motion Detection Variables ---
bool autoMode = false;
bool motionDetected = false;
uint8_t *prevGrayBuf = NULL;
int prevGrayLen = 0;
unsigned long lastMotionTime = 0;
const unsigned long MOTION_COOLDOWN = 3000;
const int MOTION_PIXEL_THRESHOLD = 80;
const float MOTION_PERCENT_THRESHOLD = 0.10;
const int SIZE_DIFF_THRESHOLD = 1500;

// =============================================================================
// 2. DASHBOARD HTML INTERFACE
// =============================================================================

static const char PROGMEM DASHBOARD_HTML[] = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ESP32-CAM Live Dashboard</title>
  <style>
    * { box-sizing: border-box; font-family: 'Segoe UI', Roboto, sans-serif; }
    body { background-color: #0b132b; color: #edf2f4; margin: 0; padding: 20px; text-align: center; }
    .card-panel { background: #1c2541; border: 1px solid #3a506b; border-radius: 12px; max-width: 650px; margin: 0 auto; padding: 24px; box-shadow: 0 8px 20px rgba(0,0,0,0.6); }
    h2 { color: #6fffe9; margin-top: 0; font-size: 24px; }
    .stream-container { position: relative; width: 100%; min-height: 240px; background: #000; border: 2px solid #3a506b; border-radius: 8px; overflow: hidden; margin-bottom: 15px; }
    .stream-container img { width: 100%; height: auto; display: block; }
    .btn-grid { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin: 20px 0; }
    button { background: #5bc0be; color: #0b132b; border: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; font-size: 14px; cursor: pointer; transition: 0.2s; }
    button:hover { background: #6fffe9; }
    .btn-danger { background: #ef4444; color: #ffffff; }
    .btn-danger:hover { background: #f87171; }
    .control-group { background: #0b132b; border: 1px solid #3a506b; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; text-align: left; }
    .control-header { display: flex; justify-content: space-between; color: #5bc0be; font-weight: bold; font-size: 14px; margin-bottom: 6px; }
    input[type=range] { width: 100%; accent-color: #5bc0be; cursor: pointer; }
    .status-text { color: #34d399; font-size: 13px; font-weight: bold; margin-top: 10px; }
    .btn-auto { background: #6366f1; color: #ffffff; }
    .btn-auto:hover { background: #818cf8; }
    .btn-auto.active { background: #22c55e; color: #ffffff; }
    .btn-auto.active:hover { background: #4ade80; }
    .motion-alert { display: none; background: #ef4444; color: #fff; padding: 10px; border-radius: 6px; font-weight: bold; font-size: 16px; margin-bottom: 12px; animation: blink 0.5s infinite; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  </style>
</head>
<body>
  <div class="card-panel">
    <h2>ESP32-CAM LIVE DASHBOARD</h2>
    
    <div class="stream-container">
      <img id="cameraStream" src="">
    </div>

    <div class="status-text" id="statusLabel">Stream Active</div>

    <div class="motion-alert" id="motionAlert">MOTION DETECTED!</div>

    <div class="btn-grid">
      <button onclick="startVideoStream()">Start Stream</button>
      <button class="btn-danger" onclick="stopVideoStream()">Stop Stream</button>
      <button onclick="setFlashMode(1)">Flash ON</button>
      <button class="btn-danger" onclick="setFlashMode(0)">Flash OFF</button>
      <button class="btn-auto" id="autoBtn" onclick="toggleAutoMode()">Auto Mode</button>
    </div>

    <div class="control-group">
      <div class="control-header">
        <span>Brightness</span>
        <span id="valBrightness">0</span>
      </div>
      <input type="range" min="-2" max="2" value="0" oninput="updateParam('brightness', this.value); document.getElementById('valBrightness').innerText=this.value;">
    </div>

    <div class="control-group">
      <div class="control-header">
        <span>Contrast</span>
        <span id="valContrast">0</span>
      </div>
      <input type="range" min="-2" max="2" value="0" oninput="updateParam('contrast', this.value); document.getElementById('valContrast').innerText=this.value;">
    </div>
  </div>

  <script>
    const streamPortUrl = window.location.protocol + '//' + window.location.hostname + ':81/stream';
    let autoModeOn = false;
    let motionPolling = null;

    function startVideoStream() {
      document.getElementById('cameraStream').src = streamPortUrl;
      document.getElementById('statusLabel').innerText = "Streaming Active";
      document.getElementById('statusLabel').style.color = "#34d399";
    }

    function stopVideoStream() {
      window.stop();
      document.getElementById('cameraStream').src = "";
      document.getElementById('statusLabel').innerText = "Stream Stopped";
      document.getElementById('statusLabel').style.color = "#f87171";
    }

    function setFlashMode(state) {
      fetch('/control?var=flash&val=' + state);
    }

    function updateParam(variable, value) {
      fetch('/control?var=' + variable + '&val=' + value);
    }

    function toggleAutoMode() {
      autoModeOn = !autoModeOn;
      const btn = document.getElementById('autoBtn');
      if (autoModeOn) {
        btn.classList.add('active');
        btn.innerText = 'Auto Mode ON';
        fetch('/control?var=automode&val=1');
        motionPolling = setInterval(checkMotion, 500);
      } else {
        btn.classList.remove('active');
        btn.innerText = 'Auto Mode';
        fetch('/control?var=automode&val=0');
        clearInterval(motionPolling);
        document.getElementById('motionAlert').style.display = 'none';
      }
    }

    function checkMotion() {
      fetch('/motion')
        .then(r => r.json())
        .then(data => {
          const alert = document.getElementById('motionAlert');
          if (data.motion) {
            alert.style.display = 'block';
          } else {
            alert.style.display = 'none';
          }
        })
        .catch(() => {});
    }

    window.onload = startVideoStream;
  </script>
</body>
</html>
)rawliteral";

// =============================================================================
// 3. SERVER HANDLERS
// =============================================================================

void detectMotion() {
  camera_fb_t *currentFrame = esp_camera_fb_get();
  if (!currentFrame) return;

  int len = currentFrame->len;

  if (prevGrayBuf == NULL) {
    prevGrayLen = len;
    prevGrayBuf = (uint8_t *)malloc(len);
    if (prevGrayBuf) memcpy(prevGrayBuf, currentFrame->buf, len);
    esp_camera_fb_return(currentFrame);
    Serial.println("[DEBUG] Baseline saved");
    return;
  }

  int sizeDiff = abs(len - prevGrayLen);
  int minLen = (len < prevGrayLen) ? len : prevGrayLen;
  int diffCount = 0;
  int step = 5;

  for (int i = 0; i < minLen; i += step) {
    int diff = abs((int)currentFrame->buf[i] - (int)prevGrayBuf[i]);
    if (diff > MOTION_PIXEL_THRESHOLD) {
      diffCount++;
    }
  }

  int sampled = minLen / step;
  float diffPercent = (sampled > 0) ? ((float)diffCount / (float)sampled) : 0;

  free(prevGrayBuf);
  prevGrayLen = len;
  prevGrayBuf = (uint8_t *)malloc(len);
  if (prevGrayBuf) memcpy(prevGrayBuf, currentFrame->buf, len);
  esp_camera_fb_return(currentFrame);

  Serial.printf("[DEBUG] SizeDiff:%d ByteDiff:%.2f%%\n", sizeDiff, diffPercent * 100);

  bool sizeChanged = (sizeDiff > SIZE_DIFF_THRESHOLD);
  bool bytesChanged = (diffPercent > MOTION_PERCENT_THRESHOLD);

  if (sizeChanged && bytesChanged) {
    if (millis() - lastMotionTime > MOTION_COOLDOWN) {
      motionDetected = true;
      lastMotionTime = millis();
      Serial.println(">> MOTION DETECTED! FLASH ON <<");
    }
  }

  if (millis() - lastMotionTime > MOTION_COOLDOWN) {
    motionDetected = false;
  }
}

static esp_err_t motion_handler(httpd_req_t *req) {
  Serial.printf("[DEBUG] /motion requested, motionDetected=%s\n", motionDetected ? "true" : "false");
  char resp[32];
  snprintf(resp, 32, "{\"motion\":%s}", motionDetected ? "true" : "false");
  httpd_resp_set_type(req, "application/json");
  return httpd_resp_send(req, resp, strlen(resp));
}

static esp_err_t index_handler(httpd_req_t *req) {
  httpd_resp_set_type(req, "text/html");
  return httpd_resp_send(req, (const char *)DASHBOARD_HTML, strlen(DASHBOARD_HTML));
}

static esp_err_t stream_handler(httpd_req_t *req) {
  camera_fb_t * fb = NULL;
  esp_err_t res = ESP_OK;
  char part_buf[64];

  res = httpd_resp_set_type(req, "multipart/x-mixed-replace; boundary=frame");
  if (res != ESP_OK) return res;

  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      res = ESP_FAIL;
    } else {
      size_t hlen = snprintf((char *)part_buf, 64, "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n", fb->len);
      res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
      if (res == ESP_OK) res = httpd_resp_send_chunk(req, (const char *)fb->buf, fb->len);
      if (res == ESP_OK) res = httpd_resp_send_chunk(req, "\r\n--frame\r\n", 12);
      esp_camera_fb_return(fb);
      if (res != ESP_OK) break;
    }
  }
  return res;
}

static esp_err_t control_handler(httpd_req_t *req) {
  char buf[64];
  char variable[16] = {0,};
  char value[16] = {0,};

  Serial.printf("[DEBUG] control_handler called, URI: %s\n", req->uri);

  if (httpd_req_get_url_query_str(req, buf, sizeof(buf)) == ESP_OK) {
    Serial.printf("[DEBUG] Query string: %s\n", buf);
    httpd_query_key_value(buf, "var", variable, sizeof(variable));
    httpd_query_key_value(buf, "val", value, sizeof(value));
  } else {
    Serial.println("[DEBUG] Failed to get query string!");
  }

  Serial.printf("[DEBUG] variable=%s, value=%s\n", variable, value);

  int val = atoi(value);
  sensor_t * s = esp_camera_sensor_get();

  if (!strcmp(variable, "flash")) {
    digitalWrite(FLASH_GPIO_NUM, val ? HIGH : LOW);
  } else if (!strcmp(variable, "automode")) {
    Serial.printf("[DEBUG] *** AUTOMODE COMMAND RECEIVED! val=%d ***\n", val);
    autoMode = val ? true : false;
    motionDetected = false;
    if (!autoMode && prevGrayBuf) {
      free(prevGrayBuf);
      prevGrayBuf = NULL;
      prevGrayLen = 0;
      digitalWrite(FLASH_GPIO_NUM, LOW);
    }
    Serial.printf("[DEBUG] Auto Mode set to: %s\n", autoMode ? "ON" : "OFF");
  } else if (!strcmp(variable, "brightness") && s) {
    s->set_brightness(s, val);
  } else if (!strcmp(variable, "contrast") && s) {
    s->set_contrast(s, val);
  } else {
    Serial.printf("[DEBUG] Unknown variable: %s\n", variable);
  }

  httpd_resp_set_type(req, "text/plain");
  return httpd_resp_send(req, "OK", 2);
}

void startCameraServer() {
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = 80;

  httpd_uri_t index_uri   = { .uri = "/", .method = HTTP_GET, .handler = index_handler, .user_ctx = NULL };
  httpd_uri_t control_uri = { .uri = "/control", .method = HTTP_GET, .handler = control_handler, .user_ctx = NULL };
  httpd_uri_t motion_uri  = { .uri = "/motion", .method = HTTP_GET, .handler = motion_handler, .user_ctx = NULL };

  if (httpd_start(&camera_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(camera_httpd, &index_uri);
    httpd_register_uri_handler(camera_httpd, &control_uri);
    httpd_register_uri_handler(camera_httpd, &motion_uri);
  }

  config.server_port = 81;
  config.ctrl_port = 32769;
  httpd_uri_t stream_uri = { .uri = "/stream", .method = HTTP_GET, .handler = stream_handler, .user_ctx = NULL };

  if (httpd_start(&stream_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(stream_httpd, &stream_uri);
  }
}

// =============================================================================
// 4. SETUP
// =============================================================================

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("ESP32-CAM Starting...");

  pinMode(FLASH_GPIO_NUM, OUTPUT);
  digitalWrite(FLASH_GPIO_NUM, LOW);

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    config.frame_size   = FRAMESIZE_VGA;
    config.jpeg_quality = 10;
    config.fb_count     = 3;
  } else {
    config.frame_size   = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count     = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\n", err);
    Serial.println("Restarting in 5 seconds...");
    delay(5000);
    ESP.restart();
    return;
  }
  Serial.println("Camera init OK!");

  // Attempt Wi-Fi Connection
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  Serial.println();

  // If connected to home Wi-Fi
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("------------------------------------");
    Serial.println("Wi-Fi Connected Successfully!");
    Serial.print("Open URL in Browser: http://");
    Serial.println(WiFi.localIP());
    Serial.println("------------------------------------");
  } 
  // Fallback: Create Access Point Hotspot if Wi-Fi fails
  else {
    Serial.println("------------------------------------");
    Serial.println("Could NOT connect to home Wi-Fi!");
    Serial.println("Creating Access Point Hotspot instead...");
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    
    Serial.print("1. Connect Phone/PC Wi-Fi to: ");
    Serial.println(AP_SSID);
    Serial.print("2. Hotspot Password: ");
    Serial.println(AP_PASSWORD);
    Serial.print("3. Open URL in Browser: http://");
    Serial.println(WiFi.softAPIP());
    Serial.println("------------------------------------");
  }

  startCameraServer();
}

void loop() {
  if (autoMode) {
    detectMotion();
    digitalWrite(FLASH_GPIO_NUM, motionDetected ? HIGH : LOW);
    delay(200);
  } else {
    delay(1000);
  }
}