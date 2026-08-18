/*
====================================================
       JALRAKSHAK
 Smart Water Leakage Detection System
====================================================

Board : ESP8266 NodeMCU

Flow Sensor 1 -> D5
Flow Sensor 2 -> D6

LCD SDA -> D2
LCD SCL -> D1

Green LED -> D3
Red LED   -> D7
Buzzer    -> D0

WiFi AP:
SSID     : JalRakshak
Password : 12345678

Dashboard:
http://192.168.4.1
====================================================
*/

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ================= WIFI =================

const char* ssid = "JalRakshak";
const char* password = "12345678";

ESP8266WebServer server(80);

// ================= LCD =================

LiquidCrystal_I2C lcd(0x27, 16, 2);

// ================= PINS =================

#define FLOW_SENSOR1 D5
#define FLOW_SENSOR2 D6

#define GREEN_LED D3
#define RED_LED D7
#define BUZZER D0

// ================= FLOW VARIABLES =================

volatile unsigned long pulse1 = 0;
volatile unsigned long pulse2 = 0;

float flowRate1 = 0;
float flowRate2 = 0;

float difference = 0;
float waterLoss = 0;

const float calibrationFactor = 7.5;

unsigned long previousMillis = 0;

// ================= STATUS =================

bool leakDetected = false;

// ================= INTERRUPTS =================

ICACHE_RAM_ATTR void flow1Counter()
{
  pulse1++;
}

ICACHE_RAM_ATTR void flow2Counter()
{
  pulse2++;
}

// ====================================================
// DASHBOARD HTML
// ====================================================

const char MAIN_PAGE[] PROGMEM = R"rawliteral(

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>JalRakshak Dashboard</title>

<style>

*{
box-sizing:border-box;
margin:0;
padding:0;
}

body{

font-family:Arial, sans-serif;

background:#eef7ff;

color:#123;

padding:15px;

}

.header{

background:linear-gradient(135deg,#0077ff,#00b4d8);

color:white;

padding:20px;

border-radius:18px;

margin-bottom:20px;

box-shadow:0 8px 20px rgba(0,0,0,.15);

}

.header h1{

font-size:28px;

margin-bottom:8px;

}

.connection{

font-size:14px;

}

.online{

color:#b7ffcf;

font-weight:bold;

}

.container{

max-width:1100px;

margin:auto;

}

.cards{

display:grid;

grid-template-columns:
repeat(auto-fit,minmax(210px,1fr));

gap:15px;

}

.card{

background:white;

padding:20px;

border-radius:18px;

box-shadow:0 6px 18px rgba(0,0,0,.10);

}

.card h3{

font-size:15px;

color:#657;

margin-bottom:12px;

}

.value{

font-size:30px;

font-weight:bold;

color:#0077ff;

}

.unit{

font-size:14px;

color:#777;

}

.status{

margin-top:20px;

padding:25px;

border-radius:18px;

background:white;

box-shadow:0 6px 18px rgba(0,0,0,.10);

text-align:center;

}

.status h2{

margin-bottom:10px;

}

.safe{

color:#0a9b45;

}

.danger{

color:#e53935;

}

.indicator{

width:18px;

height:18px;

border-radius:50%;

display:inline-block;

margin-right:8px;

}

.green{

background:#20c76a;

}

.red{

background:#ef3340;

}

.chart{

margin-top:20px;

background:white;

padding:20px;

border-radius:18px;

box-shadow:0 6px 18px rgba(0,0,0,.10);

}

.chart h2{

margin-bottom:15px;

}

canvas{

width:100%;

height:250px;

border-radius:10px;

background:#f8fcff;

}

.events{

margin-top:20px;

background:white;

padding:20px;

border-radius:18px;

box-shadow:0 6px 18px rgba(0,0,0,.10);

}

.event{

padding:12px;

border-bottom:1px solid #eee;

}

.footer{

text-align:center;

margin-top:20px;

padding:15px;

color:#777;

font-size:13px;

}

@media(max-width:500px){

.header h1{

font-size:22px;

}

.value{

font-size:25px;

}

}

</style>

</head>

<body>

<div class="container">

<div class="header">

<h1>💧 JalRakshak</h1>

<div class="connection">

Smart Water Leakage Detection System

<br>

<span class="online">
● ESP8266 Connected
</span>

&nbsp; | &nbsp;

IP: 192.168.4.1

</div>

</div>


<div class="cards">

<div class="card">

<h3>💧 Flow Sensor 1</h3>

<div class="value" id="flow1">
0.0
</div>

<div class="unit">
L/min
</div>

</div>


<div class="card">

<h3>💧 Flow Sensor 2</h3>

<div class="value" id="flow2">
0.0
</div>

<div class="unit">
L/min
</div>

</div>


<div class="card">

<h3>📊 Flow Difference</h3>

<div class="value" id="difference">
0.0
</div>

<div class="unit">
L/min
</div>

</div>


<div class="card">

<h3>💦 Water Loss</h3>

<div class="value" id="loss">
0
</div>

<div class="unit">
%
</div>

</div>

</div>


<div class="status">

<h2>System Status</h2>

<h1 id="status">
SAFE
</h1>

<p id="message">
Flow Normal, No Leakage
</p>

</div>


<div class="cards" style="margin-top:20px;">


<div class="card">

<h3>🟢 Green LED</h3>

<div class="value" id="green">
ON
</div>

</div>


<div class="card">

<h3>🔴 Red LED</h3>

<div class="value" id="red">
OFF
</div>

</div>


<div class="card">

<h3>🔔 Buzzer</h3>

<div class="value" id="buzzer">
OFF
</div>

</div>


<div class="card">

<h3>📡 Device</h3>

<div class="value" style="font-size:20px;">
ESP8266
</div>

</div>


</div>


<div class="chart">

<h2>📈 Live Flow Monitoring</h2>

<canvas id="chart"
width="900"
height="250">
</canvas>

</div>


<div class="events">

<h2>📝 Event Log</h2>

<div id="events">

<div class="event">
System Started
</div>

</div>

</div>


<div class="footer">

JalRakshak © 2026

<br>

Save Water. Save Life.

</div>

</div>


<script>

const canvas =
document.getElementById("chart");

const ctx =
canvas.getContext("2d");

let flow1Data = [];

let flow2Data = [];

let eventAdded = false;


function drawChart(){

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);


let maxValue = 10;

for(let v of flow1Data){

if(v > maxValue)
maxValue = v;

}

for(let v of flow2Data){

if(v > maxValue)
maxValue = v;

}


function drawLine(data){

if(data.length < 2)
return;

ctx.beginPath();

for(let i=0;i<data.length;i++){

let x =
i * (canvas.width /
(data.length - 1));

let y =
canvas.height -
(data[i] / maxValue) *
(canvas.height - 20);

if(i === 0)
ctx.moveTo(x,y);

else
ctx.lineTo(x,y);

}

ctx.strokeStyle =
"#0077ff";

ctx.lineWidth = 3;

ctx.stroke();

}


drawLine(flow1Data);


ctx.beginPath();

for(let i=0;i<flow2Data.length;i++){

let x =
i * (canvas.width /
(flow2Data.length - 1));

let y =
canvas.height -
(flow2Data[i] / maxValue) *
(canvas.height - 20);

if(i === 0)
ctx.moveTo(x,y);

else
ctx.lineTo(x,y);

}

ctx.strokeStyle =
"#00a878";

ctx.lineWidth = 3;

ctx.stroke();

}


async function updateDashboard(){

try{

const response =
await fetch("/api/data");

const data =
await response.json();


document.getElementById("flow1")
.innerText =
data.flow1.toFixed(1);


document.getElementById("flow2")
.innerText =
data.flow2.toFixed(1);


document.getElementById("difference")
.innerText =
data.difference.toFixed(1);


document.getElementById("loss")
.innerText =
data.loss.toFixed(1);


const status =
document.getElementById("status");


if(data.leak){

status.innerText =
"🔴 LEAK DETECTED";

status.className =
"danger";

document.getElementById("message")
.innerText =
"Abnormal Flow Detected";

document.getElementById("red")
.innerText =
"ON";

document.getElementById("green")
.innerText =
"OFF";

document.getElementById("buzzer")
.innerText =
"ON";

if(!eventAdded){

const event =
document.createElement("div");

event.className =
"event";

event.innerText =
"🚨 Leakage Detected";

document.getElementById("events")
.prepend(event);

eventAdded = true;

}

}

else{

status.innerText =
"🟢 SAFE";

status.className =
"safe";

document.getElementById("message")
.innerText =
"Flow Normal, No Leakage";

document.getElementById("red")
.innerText =
"OFF";

document.getElementById("green")
.innerText =
"ON";

document.getElementById("buzzer")
.innerText =
"OFF";

eventAdded = false;

}


flow1Data.push(data.flow1);

flow2Data.push(data.flow2);


if(flow1Data.length > 30){

flow1Data.shift();

flow2Data.shift();

}


drawChart();

}

catch(error){

console.log(error);

}

}


setInterval(
updateDashboard,
1000
);

updateDashboard();

</script>

</body>

</html>

)rawliteral";


// ====================================================
// ROOT PAGE
// ====================================================

void handleRoot()
{
  server.send_P(
    200,
    "text/html",
    MAIN_PAGE
  );
}


// ====================================================
// API
// ====================================================

void handleData()
{

  String json = "{";

  json += "\"flow1\":";
  json += String(flowRate1, 2);

  json += ",";

  json += "\"flow2\":";
  json += String(flowRate2, 2);

  json += ",";

  json += "\"difference\":";
  json += String(difference, 2);

  json += ",";

  json += "\"loss\":";
  json += String(waterLoss, 2);

  json += ",";

  json += "\"leak\":";
  json += leakDetected ? "true" : "false";

  json += "}";

  server.send(
    200,
    "application/json",
    json
  );
}


// ====================================================
// SETUP
// ====================================================

void setup()
{

  Serial.begin(115200);


  // -------- Sensor --------

  pinMode(
    FLOW_SENSOR1,
    INPUT_PULLUP
  );

  pinMode(
    FLOW_SENSOR2,
    INPUT_PULLUP
  );


  // -------- Outputs --------

  pinMode(
    GREEN_LED,
    OUTPUT
  );

  pinMode(
    RED_LED,
    OUTPUT
  );

  pinMode(
    BUZZER,
    OUTPUT
  );


  digitalWrite(
    GREEN_LED,
    HIGH
  );

  digitalWrite(
    RED_LED,
    LOW
  );

  digitalWrite(
    BUZZER,
    LOW
  );


  // -------- LCD --------

  Wire.begin(D2, D1);

  lcd.init();

  lcd.backlight();

  lcd.clear();

  lcd.setCursor(0,0);

  lcd.print("JalRakshak");

  lcd.setCursor(0,1);

  lcd.print("Starting...");

  delay(2000);


  // -------- Access Point --------

  WiFi.mode(WIFI_AP);

  WiFi.softAP(
    ssid,
    password
  );


  Serial.println();

  Serial.println(
    "JalRakshak AP Started"
  );

  Serial.print(
    "IP Address: "
  );

  Serial.println(
    WiFi.softAPIP()
  );


  // -------- Web Server --------

  server.on(
    "/",
    handleRoot
  );

  server.on(
    "/api/data",
    handleData
  );

  server.begin();

  Serial.println(
    "Web Server Started"
  );


  // -------- Flow Interrupts --------

  attachInterrupt(
    digitalPinToInterrupt(FLOW_SENSOR1),
    flow1Counter,
    FALLING
  );

  attachInterrupt(
    digitalPinToInterrupt(FLOW_SENSOR2),
    flow2Counter,
    FALLING
  );


  previousMillis =
    millis();

}


// ====================================================
// LOOP
// ====================================================

void loop()
{

  server.handleClient();


  // Every 1 second

  if(
    millis() - previousMillis >= 1000
  )
  {

    detachInterrupt(
      digitalPinToInterrupt(
        FLOW_SENSOR1
      )
    );

    detachInterrupt(
      digitalPinToInterrupt(
        FLOW_SENSOR2
      )
    );


    // Calculate flow

    flowRate1 =
      pulse1 /
      calibrationFactor;

    flowRate2 =
      pulse2 /
      calibrationFactor;


    // Reset pulse counter

    pulse1 = 0;

    pulse2 = 0;


    // Attach interrupts again

    attachInterrupt(
      digitalPinToInterrupt(
        FLOW_SENSOR1
      ),
      flow1Counter,
      FALLING
    );

    attachInterrupt(
      digitalPinToInterrupt(
        FLOW_SENSOR2
      ),
      flow2Counter,
      FALLING
    );


    previousMillis =
      millis();


    // Difference

    difference =
      flowRate1 - flowRate2;


    if(difference < 0)
    {
      difference =
        -difference;
    }


    // Water Loss %

    if(flowRate1 > 0)
    {

      waterLoss =
        (difference /
        flowRate1) * 100;

    }

    else
    {

      waterLoss = 0;

    }


    // Limit

    if(waterLoss > 100)
      waterLoss = 100;


    // Leak Detection

    if(difference > 1.5)
    {

      leakDetected =
        true;

      digitalWrite(
        RED_LED,
        HIGH
      );

      digitalWrite(
        GREEN_LED,
        LOW
      );

      digitalWrite(
        BUZZER,
        HIGH
      );


      lcd.clear();

      lcd.setCursor(0,0);

      lcd.print("F1:");
      lcd.print(flowRate1,1);

      lcd.setCursor(9,0);

      lcd.print("F2:");
      lcd.print(flowRate2,1);

      lcd.setCursor(0,1);

      lcd.print("LEAK DETECTED");


      Serial.println(
        "LEAK DETECTED"
      );

    }

    else
    {

      leakDetected =
        false;

      digitalWrite(
        RED_LED,
        LOW
      );

      digitalWrite(
        GREEN_LED,
        HIGH
      );

      digitalWrite(
        BUZZER,
        LOW
      );


      lcd.clear();

      lcd.setCursor(0,0);

      lcd.print("F1:");
      lcd.print(flowRate1,1);

      lcd.setCursor(9,0);

      lcd.print("F2:");
      lcd.print(flowRate2,1);

      lcd.setCursor(0,1);

      lcd.print("SYSTEM NORMAL");


      Serial.println(
        "SYSTEM NORMAL"
      );

    }


    // Serial output

    Serial.print(
      "Flow1: "
    );

    Serial.print(
      flowRate1
    );

    Serial.print(
      " L/min"
    );


    Serial.print(
      " | Flow2: "
    );

    Serial.print(
      flowRate2
    );

    Serial.print(
      " L/min"
    );


    Serial.print(
      " | Difference: "
    );

    Serial.print(
      difference
    );

    Serial.print(
      " | Loss: "
    );

    Serial.print(
      waterLoss
    );

    Serial.println(
      "%"
    );

  }

}