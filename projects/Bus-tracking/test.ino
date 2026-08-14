#include <DIYables_TFT_Touch_Shield.h>
#include <ArduinoJson.h>

// Initialize the display
DIYables_TFT_RM68140_Shield TFT_display;

// --- DYNAMIC STATE VARIABLES (No hardcoded data) ---
String stationName = "WAITING FOR DATA";
String currentTime = "--:--";

String busRoutes[3]   = {"-", "-", "-"};
String busDests[3]    = {"-", "-", "-"};
int busETAs[3]        = {0, 0, 0};

// Default Colors (Will be overwritten by HTML)
uint16_t colorBG     = DIYables_TFT::colorRGB(0, 0, 0);
uint16_t colorText   = DIYables_TFT::colorRGB(255, 255, 255);
uint16_t colorMuted  = DIYables_TFT::colorRGB(150, 150, 150);
uint16_t colorHeader = DIYables_TFT::colorRGB(255, 140, 0);
uint16_t colorRoute  = DIYables_TFT::colorRGB(255, 255, 0);
uint16_t colorGreen  = DIYables_TFT::colorRGB(50, 205, 50);

bool forceFullRedraw = true; // Flag to rebuild the UI when layout/colors change

void setup() {
  Serial.begin(9600);
  Serial.setTimeout(50); // Keep serial reading fast and non-blocking
  
  TFT_display.begin();
  TFT_display.setRotation(1); 
  
  drawStaticUI();
  updateBusDisplay();

  // Send boot status to client
  Serial.println("READY");
}

void loop() {
  // Listen for incoming Serial communication from the PC (HTML Dashboard)
  if (Serial.available() > 0) {
    String incomingData = Serial.readStringUntil('\n');
    processSerialCommand(incomingData);
  }
}

// --- SECURE JSON PARSER ---
void processSerialCommand(String jsonString) {
  // Allocate a small, safe memory pool for the Uno (Supports both ArduinoJson v6 and v7)
#if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
#else
  StaticJsonDocument<256> doc;
#endif
  DeserializationError error = deserializeJson(doc, jsonString);

  if (error) {
    Serial.print("Error parsing JSON: ");
    Serial.println(error.c_str());
    return;
  }

  String packetType = doc["type"].as<String>();

  if (packetType == "ping") {
    Serial.println("ACK: Pong");
    return;
  }

  // 1. Handle Configuration Data (Station Name & Time)
  if (packetType == "cfg") {
    stationName = doc["stn"].as<String>();
    currentTime = doc["tm"].as<String>();
    forceFullRedraw = true;
  }
  
  // 2. Handle Color Palette Updates
  else if (packetType == "clr") {
    colorBG     = DIYables_TFT::colorRGB(doc["bg"][0], doc["bg"][1], doc["bg"][2]);
    colorText   = DIYables_TFT::colorRGB(doc["txt"][0], doc["txt"][1], doc["txt"][2]);
    colorHeader = DIYables_TFT::colorRGB(doc["hdr"][0], doc["hdr"][1], doc["hdr"][2]);
    colorRoute  = DIYables_TFT::colorRGB(doc["rt"][0], doc["rt"][1], doc["rt"][2]);
    colorGreen  = DIYables_TFT::colorRGB(doc["grn"][0], doc["grn"][1], doc["grn"][2]);
    forceFullRedraw = true;
  }
  
  // 3. Handle Individual Bus Row Updates
  else if (packetType == "bus") {
    int idx = doc["i"].as<int>();
    if (idx >= 0 && idx < 3) {
      busRoutes[idx] = doc["rt"].as<String>();
      busDests[idx]  = doc["dst"].as<String>();
      busETAs[idx]   = doc["eta"].as<int>();
    }
  }

  // Redraw screen based on what changed
  if (forceFullRedraw) {
    drawStaticUI();
    forceFullRedraw = false;
  }
  updateBusDisplay();
  
  // Send acknowledgment back to PC
  Serial.println("ACK: Data Applied");
}

// --- RENDER ENGINE ---
void drawStaticUI() {
  TFT_display.fillScreen(colorBG);

  int displayWidth = TFT_display.width();

  // Draw Header
  TFT_display.setTextSize(2);
  TFT_display.setTextColor(colorHeader);
  TFT_display.setCursor(10, 12);
  TFT_display.print(stationName); 
  
  // Draw Time
  TFT_display.setTextColor(colorText);
  int timeX = displayWidth - 100; // "12:30 PM" at size 2 is ~96px wide
  if (timeX < 150) timeX = 220;   // Fallback safe coordinate
  TFT_display.setCursor(timeX, 12);
  TFT_display.print(currentTime);

  TFT_display.drawFastHLine(0, 35, displayWidth, colorMuted);

  // Draw Columns
  TFT_display.setTextSize(1);
  TFT_display.setTextColor(colorMuted);
  TFT_display.setCursor(10, 50);  TFT_display.print("ROUTE");
  TFT_display.setCursor(115, 50);  TFT_display.print("DESTINATION");
  
  int etaX = displayWidth - 60; // "ETA" at size 1 is ~18px wide
  if (etaX < 150) etaX = 260;   // Fallback
  TFT_display.setCursor(etaX, 50); TFT_display.print("ETA");
}

void updateBusDisplay() {
  TFT_display.setTextSize(2);
  int displayWidth = TFT_display.width();
  int etaX = displayWidth - 95; // "Arrived" at size 2 is 7*12 = 84px wide
  if (etaX < 150) etaX = 220;

  for (int i = 0; i < 3; i++) {
    int rowY = 85 + (i * 55); 
    
    // Clear only the row data areas to prevent flickering
    TFT_display.fillRect(etaX, rowY, displayWidth - etaX, 20, colorBG);
    TFT_display.fillRect(115, rowY, etaX - 120, 20, colorBG);
    TFT_display.fillRect(10, rowY, 100, 20, colorBG);

    // Route Number
    TFT_display.setTextColor(colorRoute);
    TFT_display.setCursor(10, rowY);   
    TFT_display.print(busRoutes[i]);      
    
    // Destination
    TFT_display.setTextColor(colorText);
    TFT_display.setCursor(115, rowY);   
    TFT_display.print(busDests[i]);   
    
    // ETA
    if (busETAs[i] <= 3) {
      TFT_display.setTextColor(colorGreen); 
    } else {
      TFT_display.setTextColor(colorText);
    }
    
    TFT_display.setCursor(etaX, rowY);  
    if(busETAs[i] <= 0) {
      if (busRoutes[i] == "-" || busRoutes[i] == "") {
        TFT_display.print("-");
      } else {
        TFT_display.print("Arrived");
      }
    } else {
      TFT_display.print(String(busETAs[i]) + " min");     
    }
  }
}