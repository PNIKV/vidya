#pragma once
#include "Config.h"
#include <ESP8266WebServer.h>
#include "DataStore.h"

class WebManager {
public:
    void begin();
    void update();   // call every loop() — handles pending requests + SSE push

private:
    ESP8266WebServer _server{SERVER_PORT};
    WiFiClient       _sseClient;
    bool             _sseActive  = false;
    uint32_t         _lastPush   = 0;

    void _handleRoot();
    void _handleSSE();
    void _handleData();   // one-shot JSON endpoint (fallback / initial load)
    void _pushSSE();
};