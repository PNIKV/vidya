#include "WebManager.h"
#include "Config.h"
#include <Arduino.h>

static const char PAGE[] PROGMEM = R"rawhtml(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VitalSense</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#0d0d0f;color:#e0e0e0;padding:14px;min-height:100vh}
h1{font-size:1.15rem;font-weight:700;color:#fff;margin-bottom:12px;letter-spacing:.04em}

/* Status */
#sbar{display:flex;align-items:center;gap:8px;background:#161618;border:1px solid #222;border-radius:10px;padding:7px 12px;margin-bottom:12px;font-size:.78rem}
#dot{width:9px;height:9px;border-radius:50%;background:#444;flex-shrink:0;transition:background .4s,box-shadow .4s}
#dot.live{background:#22c55e;box-shadow:0 0 7px #22c55e99}
#dot.warn{background:#f59e0b;box-shadow:0 0 7px #f59e0b88}
#dot.dead{background:#ef4444}
#stxt{flex:1;color:#888}
#ftag{font-size:.7rem;padding:2px 10px;border-radius:20px;background:#222;color:#666;border:1px solid #333;transition:all .3s}
#ftag.on{background:#0d2b1a;color:#4ade80;border-color:#22c55e44}

/* Cards grid */
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
@media(max-width:500px){.grid{grid-template-columns:1fr}}
.card{background:#161618;border:1px solid #222;border-radius:12px;padding:14px}
.ctitle{font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;color:#555;margin-bottom:8px}

/* Big value */
.bval{font-size:2.6rem;font-weight:700;line-height:1;letter-spacing:-.03em;transition:color .3s}
.bval .unit{font-size:.95rem;font-weight:400;color:#666;margin-left:4px}
.bval.inv{color:#333}
.hrcol{color:#f87171}
.spcol{color:#60a5fa}

/* Canvas chart */
.chart-wrap{position:relative;width:100%;height:80px;margin-top:10px}
canvas{position:absolute;top:0;left:0;width:100%;height:100%}

/* Confidence bar */
.cbar-wrap{margin-top:8px;height:3px;background:#222;border-radius:2px;overflow:hidden}
.cbar{height:100%;width:0%;background:#22c55e;border-radius:2px;transition:width .5s}

/* Stats row */
.srow{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}
.stat{background:#161618;border:1px solid #222;border-radius:10px;padding:10px;text-align:center}
.slbl{font-size:.62rem;text-transform:uppercase;letter-spacing:.08em;color:#555;margin-bottom:4px}
.sval{font-size:1.25rem;font-weight:600}

/* IR raw bar */
.irrow{background:#161618;border:1px solid #222;border-radius:10px;padding:10px;margin-bottom:10px}
.irlbl{font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;color:#555;margin-bottom:6px}
.irbar-bg{height:6px;background:#222;border-radius:3px;overflow:hidden}
.irbar{height:100%;width:0%;background:#a78bfa;border-radius:3px;transition:width .4s}
.irval{font-size:.75rem;color:#888;margin-top:4px}

/* Log */
.logbox{background:#0a0a0c;border:1px solid #1e1e1e;border-radius:10px;padding:10px;max-height:90px;overflow-y:auto;font-size:.72rem;font-family:monospace;color:#555}
.logbox div{padding:1px 0}
.logbox .ok{color:#4ade80}
.logbox .warn{color:#f59e0b}
.logbox .err{color:#f87171}
</style>
</head>
<body>
<h1>VitalSense</h1>

<div id="sbar">
  <div id="dot"></div>
  <span id="stxt">Connecting…</span>
  <span id="ftag">No finger</span>
</div>

<div class="grid">
  <div class="card">
    <div class="ctitle">Heart rate</div>
    <div class="bval hrcol inv" id="hrv">--<span class="unit">BPM</span></div>
    <div class="cbar-wrap"><div class="cbar" id="hrcbar"></div></div>
    <div class="chart-wrap"><canvas id="hrc"></canvas></div>
  </div>
  <div class="card">
    <div class="ctitle">SpO2</div>
    <div class="bval spcol inv" id="spv">--<span class="unit">%</span></div>
    <div class="cbar-wrap"><div class="cbar" id="spcbar"></div></div>
    <div class="chart-wrap"><canvas id="spc"></canvas></div>
  </div>
</div>

<div class="srow">
  <div class="stat"><div class="slbl">HR min</div><div class="sval hrcol" id="hrmin">--</div></div>
  <div class="stat"><div class="slbl">HR max</div><div class="sval hrcol" id="hrmax">--</div></div>
  <div class="stat"><div class="slbl">HR avg</div><div class="sval hrcol" id="hravg">--</div></div>
  <div class="stat"><div class="slbl">SpO2 min</div><div class="sval spcol" id="spmin">--</div></div>
  <div class="stat"><div class="slbl">SpO2 avg</div><div class="sval spcol" id="spavg">--</div></div>
  <div class="stat"><div class="slbl">Uptime</div><div class="sval" id="upt">--</div></div>
</div>

<div class="irrow">
  <div class="irlbl">IR signal strength (finger pressure indicator)</div>
  <div class="irbar-bg"><div class="irbar" id="irbar"></div></div>
  <div class="irval" id="irval">IR: --</div>
</div>

<div class="logbox" id="log"></div>

<script>
// ── Chart engine ──────────────────────────────────────────────────────────────
function Chart(id, color, yLo, yHi) {
  var cv = document.getElementById(id);
  var cx = cv.getContext('2d');
  var pts = [];
  var MAX = 60;

  function resize() {
    var r = cv.parentElement.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      cv.width  = r.width  * devicePixelRatio;
      cv.height = r.height * devicePixelRatio;
      cx.scale(devicePixelRatio, devicePixelRatio);
      draw();
    }
  }

  function draw() {
    var W = cv.parentElement.clientWidth;
    var H = cv.parentElement.clientHeight;
    if (!W || !H || pts.length < 2) { cx.clearRect(0,0,cv.width,cv.height); return; }

    cx.clearRect(0, 0, W, H);

    // Grid lines
    cx.strokeStyle = '#1e1e1e';
    cx.lineWidth = 1;
    [.25,.5,.75].forEach(function(f) {
      cx.beginPath(); cx.moveTo(0, H*f); cx.lineTo(W, H*f); cx.stroke();
    });

    // Line path
    var step = W / (MAX - 1);
    cx.beginPath();
    pts.forEach(function(v, i) {
      var x = i * step;
      var y = H - Math.max(2, Math.min(H-2, ((v-yLo)/(yHi-yLo))*H));
      i === 0 ? cx.moveTo(x,y) : cx.lineTo(x,y);
    });
    cx.strokeStyle = color;
    cx.lineWidth = 1.8;
    cx.lineJoin = 'round';
    cx.stroke();

    // Fill
    var lastX = (pts.length-1)*step;
    cx.lineTo(lastX, H); cx.lineTo(0, H); cx.closePath();
    cx.fillStyle = color + '28';
    cx.fill();

    // Latest value dot
    var lv = pts[pts.length-1];
    var lx = (pts.length-1)*step;
    var ly = H - Math.max(2, Math.min(H-2, ((lv-yLo)/(yHi-yLo))*H));
    cx.beginPath(); cx.arc(lx, ly, 3, 0, Math.PI*2);
    cx.fillStyle = color; cx.fill();
  }

  new ResizeObserver(resize).observe(cv.parentElement);
  resize();

  return {
    push: function(v) {
      pts.push(v);
      if (pts.length > MAX) pts.shift();
      draw();
    },
    clear: function() { pts=[]; draw(); },
    redraw: draw
  };
}

var hrChart = Chart('hrc', '#f87171', 40, 180);
var spChart = Chart('spc', '#60a5fa', 85, 100);

// ── Stats ──────────────────────────────────────────────────────────────────────
var hrArr=[], spArr=[], t0=Date.now();
function num(a){ return a.length ? (a.reduce(function(x,y){return x+y},0)/a.length).toFixed(0) : '--'; }
function mn(a){ return a.length ? Math.min.apply(null,a) : '--'; }
function mx(a){ return a.length ? Math.max.apply(null,a) : '--'; }

function updateStats(hr,hrOk,sp,spOk){
  if(hrOk){ hrArr.push(hr); if(hrArr.length>200)hrArr.shift(); }
  if(spOk){ spArr.push(sp); if(spArr.length>200)spArr.shift(); }
  document.getElementById('hrmin').textContent = mn(hrArr);
  document.getElementById('hrmax').textContent = mx(hrArr);
  document.getElementById('hravg').textContent = num(hrArr);
  document.getElementById('spmin').textContent = mn(spArr)!='--' ? mn(spArr)+'%' : '--';
  document.getElementById('spavg').textContent = num(spArr)!='--' ? num(spArr)+'%' : '--';
  var s=Math.floor((Date.now()-t0)/1000), m=Math.floor(s/60);
  document.getElementById('upt').textContent = (m?m+'m ':'')+(s%60)+'s';
}

// ── Log ───────────────────────────────────────────────────────────────────────
function log(msg, cls) {
  var b=document.getElementById('log');
  var d=document.createElement('div');
  d.textContent = new Date().toLocaleTimeString()+' '+msg;
  if(cls) d.className=cls;
  b.appendChild(d);
  if(b.children.length>30) b.removeChild(b.firstChild);
  b.scrollTop=b.scrollHeight;
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function setStatus(cls, msg){ document.getElementById('dot').className=cls; document.getElementById('stxt').textContent=msg; }
function setFinger(on){ var e=document.getElementById('ftag'); e.textContent=on?'Finger on':'No finger'; e.className=on?'on':''; }

function setMetric(id, val, ok, suffix) {
  var e=document.getElementById(id);
  if(ok){ e.classList.remove('inv'); e.innerHTML=val+'<span class="unit">'+suffix+'</span>'; }
  else  { e.classList.add('inv');    e.innerHTML='--<span class="unit">'+suffix+'</span>'; }
}

// ── SSE ───────────────────────────────────────────────────────────────────────
var es, rt, DELAY=3000;
function connect() {
  clearTimeout(rt);
  setStatus('warn','Connecting…');
  es = new EventSource('/sse');

  es.onopen = function(){ setStatus('live','Connected — live streaming'); log('Connected','ok'); };

  es.onmessage = function(e) {
    try {
      var d = JSON.parse(e.data);

      setFinger(d.finger);
      setMetric('hrv',  d.hr,   d.hrOk,   'BPM');
      setMetric('spv',  d.spo2, d.spo2Ok, '%');

      if(d.hrOk)   hrChart.push(d.hr);
      if(d.spo2Ok) spChart.push(d.spo2);

      // Confidence bars
      var conf = d.conf || 0;
      document.getElementById('hrcbar').style.width  = (d.hrOk   ? conf : 0)+'%';
      document.getElementById('spcbar').style.width  = (d.spo2Ok ? conf : 0)+'%';

      // IR bar (0–100000 mapped to 0–100%)
      if(d.ir !== undefined) {
        var pct = Math.min(100, Math.round(d.ir / 1000));
        document.getElementById('irbar').style.width = pct+'%';
        document.getElementById('irval').textContent = 'IR raw: '+d.ir+(d.finger?' ✓ finger detected':' — place finger flat');
      }

      updateStats(d.hr, d.hrOk, d.spo2, d.spo2Ok);

      if(d.hrOk && d.spo2Ok)
        log('HR '+d.hr+' BPM  SpO2 '+d.spo2+'%  conf '+conf+'%','ok');
      else if(d.finger)
        log('Reading… IR='+d.ir,'warn');

    } catch(err){ log('Parse error: '+err,'err'); }
  };

  es.onerror = function(){
    es.close();
    setStatus('dead','Disconnected — reconnecting…');
    setFinger(false);
    log('Disconnected','err');
    rt = setTimeout(connect, DELAY);
  };
}
connect();
</script>
</body>
</html>
)rawhtml";

// ── WebManager ────────────────────────────────────────────────────────────────

void WebManager::begin() {
    _server.on("/",     [this](){ _handleRoot(); });
    _server.on("/sse",  [this](){ _handleSSE();  });
    _server.on("/data", [this](){ _handleData(); });
    _server.begin();
    Serial.printf("[Web] Server started on port %d\n", SERVER_PORT);
}

void WebManager::update() {
    _server.handleClient();
    if (_sseActive && (millis() - _lastPush >= SSE_INTERVAL_MS)) {
        _pushSSE();
        _lastPush = millis();
    }
}

void WebManager::_handleRoot() {
    _server.send_P(200, "text/html", PAGE);
}

void WebManager::_handleSSE() {
    if (_sseActive) { _sseClient.stop(); _sseActive = false; }

    WiFiClient client = _server.client();
    if (!client) return;

    client.print(
        "HTTP/1.1 200 OK\r\n"
        "Content-Type: text/event-stream\r\n"
        "Cache-Control: no-cache\r\n"
        "Connection: keep-alive\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "\r\n"
    );

    _sseClient = client;
    _sseActive = true;
    _lastPush  = millis();
    Serial.println("[Web] SSE client connected");
}

void WebManager::_handleData() {
    const VitalData& v = DataStore::vitals;
    char buf[160];
    snprintf(buf, sizeof(buf),
        "{\"hr\":%d,\"hrOk\":%s,\"spo2\":%d,\"spo2Ok\":%s,"
        "\"finger\":%s,\"conf\":%d,\"ts\":%lu}",
        (int)v.heartRate,  v.hrValid   ? "true":"false",
        (int)v.spo2,       v.spo2Valid ? "true":"false",
        v.fingerOn         ? "true":"false",
        (int)v.confidence,
        v.timestamp
    );
    _server.send(200, "application/json", buf);
}

void WebManager::_pushSSE() {
    if (!_sseActive) return;
    if (!_sseClient.connected()) {
        _sseActive = false;
        return;
    }

    const VitalData& v = DataStore::vitals;

    char buf[220];
    snprintf(buf, sizeof(buf),
        "data:{\"hr\":%d,\"hrOk\":%s,\"spo2\":%d,\"spo2Ok\":%s,"
        "\"finger\":%s,\"conf\":%d,\"ir\":%lu}\n\n",
        (int)v.heartRate,  v.hrValid   ? "true":"false",
        (int)v.spo2,       v.spo2Valid ? "true":"false",
        v.fingerOn         ? "true":"false",
        (int)v.confidence,
        (unsigned long)v.ir
    );
    _sseClient.print(buf);

    // Keepalive — prevents browser from timing out the SSE connection
    _sseClient.print(": keep\n\n");
}