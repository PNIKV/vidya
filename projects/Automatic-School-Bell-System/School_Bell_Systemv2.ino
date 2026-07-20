/*
  ============================================================================
  SCHOOL BELL & ANNOUNCEMENT CONTROL SYSTEM  —  Arduino UNO R4 WiFi + DFPlayer
  ============================================================================
  Features:
    - Professional tabbed web dashboard (Dashboard / Manual / Schedule / Settings)
    - NTP time sync using the onboard RTC (RA4M1) so time survives resets
      (keeps ticking even if WiFi drops, re-syncs automatically once a day)
    - Bell/announcement SCHEDULER: add/edit/delete/enable/disable time slots,
      each tied to a specific day-of-week pattern and a specific audio track
    - Persistent storage of the schedule in the UNO R4's emulated EEPROM
      (survives power loss / reset)
    - Manual "Broadcast Now" grid for all 16 announcements
    - Volume control + manual re-sync button

  REQUIRED LIBRARIES (Arduino IDE > Library Manager):
    - DFRobotDFPlayerMini  (by DFRobot)
    - NTPClient            (by Fabrice Weinberg / arduino-libraries)
    "RTC.h" and "WiFiS3.h" ship automatically with the "Arduino UNO R4 Boards" core.

  IMPORTANT — SD CARD FILE NAMING:
    The DFPlayer Mini's playMp3Folder() call requires files inside a folder
    named "mp3" on the SD card, named with 4-digit numbers:
        /mp3/0001.mp3
        /mp3/0002.mp3
        ...
        /mp3/0016.mp3
    Your uploaded files must be renamed into that scheme. Based on the files
    you gave me, I mapped them in upload order to tracks 1-16 below. If your
    SD card is in a different order, just re-order the ANNOUNCEMENT_NAMES
    array (and rename the physical files on the SD card) to match — nothing
    else in the code needs to change.

      Track  SD file name                         Suggested display name
      -----  -----------------------------------  ------------------------------
        1    Attendance-Instruction.mp3            Attendance Instructions
        2    Attendance-Instruction3.mp3            Attendance Instructions (2)
        3    Bell-1.mp3                             Bell Tone 1
        4    Bell-2.mp3                              Bell Tone 2
        5    Bell-3.mp3                              Bell Tone 3
        6    Cleanliness.mp3                        Cleanliness Reminder
        7    Exam-Related.mp3                       Exam Related Notice
        8    Follow_Instuction_of_Teacher.mp3       Follow Teacher's Instructions
        9    Gm___go_to_classroom.mp3               Good Morning - Go to Class
       10    Gm___going_to_classroom.mp3            Good Morning - Proceed to Class
       11    Have_a_Good_Day.mp3                    Have a Good Day
       12    Heavy_Rain.mp3                          Heavy Rain Notice
       13    Holiday_News.mp3                        Holiday Announcement
       14    Home_Work.mp3                           Homework Reminder
       15    School_Leave_related.mp3                School Leave Notice
       16    Silent_Instruction.mp3                  Silence Instruction

  ============================================================================
*/

#include <WiFiS3.h>
#include <WiFiUdp.h>
#include <NTPClient.h>
#include "RTC.h"
#include <EEPROM.h>
#include <DFRobotDFPlayerMini.h>

// ============================== USER CONFIG ================================

const char* ssid     = "STEM";
const char* password = "STEM@123";

// Time zone offset from UTC, IN SECONDS. India Standard Time = UTC+5:30
const long GMT_OFFSET_SECONDS = 5 * 3600 + 30 * 60;   // change if not in India

// DFPlayer volume 0-30
const uint8_t DEFAULT_VOLUME = 25;

// Track to play automatically the instant the board powers on.
// Per the mapping table in the README, Bell-1.mp3 is track 3.
// Set to 0 to disable the boot chime.
#define BOOT_CHIME_TRACK 3

// Friendly names for the 16 tracks on the SD card (see mapping table above).
// EDIT THESE FREELY — this list only affects labels shown in the dashboard.
const char* ANNOUNCEMENT_NAMES[16] = {
  "Attendance Instructions",          // 1
  "Attendance Instructions (2)",      // 2
  "Bell Tone 1",                      // 3
  "Bell Tone 2",                      // 4
  "Bell Tone 3",                      // 5
  "Cleanliness Reminder",             // 6
  "Exam Related Notice",              // 7
  "Follow Teacher's Instructions",    // 8
  "Good Morning - Go to Class",       // 9
  "Good Morning - Proceed to Class",  // 10
  "Have a Good Day",                  // 11
  "Heavy Rain Notice",                // 12
  "Holiday Announcement",             // 13
  "Homework Reminder",                // 14
  "School Leave Notice",              // 15
  "Silence Instruction"               // 16
};
#define NUM_TRACKS 16

// Maximum number of scheduled bell entries that can be stored
#define MAX_SCHEDULE 30

// =============================== GLOBALS ====================================

WiFiServer server(80);
WiFiUDP    ntpUDP;
NTPClient  timeClient(ntpUDP, "pool.ntp.org", GMT_OFFSET_SECONDS, 0);
DFRobotDFPlayerMini myDFPlayer;

struct ScheduleEntry {
  uint8_t hour;      // 0-23
  uint8_t minute;    // 0-59
  uint8_t daysMask;  // bit0=Mon, bit1=Tue, bit2=Wed, bit3=Thu, bit4=Fri, bit5=Sat, bit6=Sun
  uint8_t track;     // 1-16
  uint8_t enabled;   // 0 or 1
};

ScheduleEntry schedule[MAX_SCHEDULE];
uint8_t scheduleCount = 0;
uint8_t currentVolume = DEFAULT_VOLUME;

int lastCheckedMinuteOfDay = -1;   // prevents double-triggering within same minute
unsigned long lastNtpSyncMillis = 0;
const unsigned long NTP_RESYNC_INTERVAL_MS = 24UL * 60UL * 60UL * 1000UL; // once/day

#define EEPROM_MAGIC_ADDR   0
#define EEPROM_COUNT_ADDR   1
#define EEPROM_VOLUME_ADDR  2
#define EEPROM_DATA_ADDR    3
#define EEPROM_MAGIC_VALUE  0xB7

// =========================== TIME HELPER STRUCTS ============================

struct NowInfo {
  int year, month, day, hour, minute, second;
  int dowMon;              // 0=Monday ... 6=Sunday
  unsigned long epoch;
};

const char* DAY_NAMES[7] = {"Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"};
const char* DAY_SHORT[7] = {"Mon","Tue","Wed","Thu","Fri","Sat","Sun"};

// ---- Howard Hinnant's civil_from_days algorithm (days since 1970-01-01 -> Y/M/D) ----
void civilFromDays(long z, int &y, int &m, int &d) {
  z += 719468;
  long era = (z >= 0 ? z : z - 146096) / 146097;
  unsigned long doe = (unsigned long)(z - era * 146097);              // [0, 146096]
  unsigned long yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365; // [0, 399]
  long yy = (long)yoe + era * 400;
  unsigned long doy = doe - (365 * yoe + yoe / 4 - yoe / 100);        // [0, 365]
  unsigned long mp = (5 * doy + 2) / 153;                             // [0, 11]
  d = (int)(doy - (153 * mp + 2) / 5 + 1);                            // [1, 31]
  m = (int)(mp + (mp < 10 ? 3 : -9));                                 // [1, 12]
  y = (int)(yy + (m <= 2));
}

void epochToDateTime(unsigned long epoch, int &year, int &month, int &day, int &hour, int &minute, int &second) {
  second = epoch % 60;
  unsigned long rem = epoch / 60;
  minute = rem % 60;
  rem /= 60;
  hour = rem % 24;
  long days = (long)(rem / 24);
  civilFromDays(days, year, month, day);
}

Month monthFromInt(int m) {
  static const Month months[12] = {
    Month::JANUARY, Month::FEBRUARY, Month::MARCH, Month::APRIL,
    Month::MAY, Month::JUNE, Month::JULY, Month::AUGUST,
    Month::SEPTEMBER, Month::OCTOBER, Month::NOVEMBER, Month::DECEMBER
  };
  if (m < 1) m = 1; if (m > 12) m = 12;
  return months[m - 1];
}

DayOfWeek dowSunFromInt(int d) { // d: 0=Sunday..6=Saturday
  static const DayOfWeek days[7] = {
    DayOfWeek::SUNDAY, DayOfWeek::MONDAY, DayOfWeek::TUESDAY, DayOfWeek::WEDNESDAY,
    DayOfWeek::THURSDAY, DayOfWeek::FRIDAY, DayOfWeek::SATURDAY
  };
  return days[d % 7];
}

// Get "now" from the RTC, expressed with Monday=0 weekday convention
NowInfo getNow() {
  RTCTime t;
  RTC.getTime(t);
  NowInfo n;
  n.year   = t.getYear();
  n.month  = Month2int(t.getMonth());
  n.day    = t.getDayOfMonth();
  n.hour   = t.getHour();
  n.minute = t.getMinutes();
  n.second = t.getSeconds();
  n.epoch  = (unsigned long)t.getUnixTime();
  long days = (long)(n.epoch / 86400UL);
  n.dowMon = (int)((days + 3) % 7); // epoch day 0 = Thursday(3) with Mon=0 base
  if (n.dowMon < 0) n.dowMon += 7;
  return n;
}

bool syncTimeFromNTP() {
  timeClient.begin();
  bool ok = false;
  for (int i = 0; i < 5 && !ok; i++) {
    ok = timeClient.forceUpdate();
    if (!ok) delay(400);
  }
  if (!ok) return false;

  unsigned long epoch = timeClient.getEpochTime(); // already local (offset applied)
  int y, mo, d, h, mi, s;
  epochToDateTime(epoch, y, mo, d, h, mi, s);
  int dowSun = (int)(((epoch / 86400UL) + 4) % 7); // 0=Sunday baseline

  RTCTime newTime(d, monthFromInt(mo), y, h, mi, s, dowSunFromInt(dowSun), SaveLight::SAVING_TIME_INACTIVE);
  RTC.setTime(newTime);
  lastNtpSyncMillis = millis();
  return true;
}

// ============================ EEPROM PERSISTENCE ============================

void saveScheduleToEEPROM() {
  EEPROM.update(EEPROM_MAGIC_ADDR, EEPROM_MAGIC_VALUE);
  EEPROM.update(EEPROM_COUNT_ADDR, scheduleCount);
  EEPROM.update(EEPROM_VOLUME_ADDR, currentVolume);
  int addr = EEPROM_DATA_ADDR;
  for (uint8_t i = 0; i < scheduleCount; i++) {
    EEPROM.put(addr, schedule[i]);
    addr += sizeof(ScheduleEntry);
  }
}

void loadScheduleFromEEPROM() {
  uint8_t magic = EEPROM.read(EEPROM_MAGIC_ADDR);
  if (magic != EEPROM_MAGIC_VALUE) {
    // First boot / no valid data yet
    scheduleCount = 0;
    currentVolume = DEFAULT_VOLUME;
    saveScheduleToEEPROM();
    return;
  }
  scheduleCount = EEPROM.read(EEPROM_COUNT_ADDR);
  if (scheduleCount > MAX_SCHEDULE) scheduleCount = MAX_SCHEDULE;
  currentVolume = EEPROM.read(EEPROM_VOLUME_ADDR);
  if (currentVolume > 30) currentVolume = DEFAULT_VOLUME;
  int addr = EEPROM_DATA_ADDR;
  for (uint8_t i = 0; i < scheduleCount; i++) {
    EEPROM.get(addr, schedule[i]);
    addr += sizeof(ScheduleEntry);
  }
}

// =============================== SETUP ======================================

void setup() {
  Serial.begin(115200);
  Serial1.begin(9600);
  delay(1500); // DFPlayer Mini needs a moment after power-up before it responds

  Serial.println(F("\n[BOOT] Initializing DFPlayer Mini..."));
  bool dfOk = false;
  for (int attempt = 1; attempt <= 5 && !dfOk; attempt++) {
    dfOk = myDFPlayer.begin(Serial1, /*isACK=*/true, /*doReset=*/true);
    if (!dfOk) {
      Serial.print(F("[WARN] DFPlayer not responding (attempt "));
      Serial.print(attempt);
      Serial.println(F("/5). Retrying..."));
      delay(1000);
    }
  }

  if (!dfOk) {
    Serial.println(F("[ERROR] DFPlayer Mini not found after 5 attempts."));
    Serial.println(F("Checklist:"));
    Serial.println(F("  1. DFPlayer TX -> Arduino pin 0 (RX1), DFPlayer RX -> Arduino pin 1 (TX1) via a ~1k resistor"));
    Serial.println(F("  2. DFPlayer VCC -> 5V, GND -> GND (shared ground with Arduino)"));
    Serial.println(F("  3. A working micro-SD card is inserted, formatted FAT32, with a top-level 'mp3' folder"));
    Serial.println(F("  4. A speaker (or amp) is wired to SPK_1 / SPK_2"));
    while (true) delay(1000);
  }
  Serial.println(F("[BOOT] DFPlayer Mini Online."));

  loadScheduleFromEEPROM();
  myDFPlayer.volume(currentVolume);
  delay(200);

  if (BOOT_CHIME_TRACK > 0) {
    Serial.print(F("[BOOT] Playing boot chime, track "));
    Serial.println(BOOT_CHIME_TRACK);
    myDFPlayer.playMp3Folder(BOOT_CHIME_TRACK);
  }

  Serial.print(F("[BOOT] Connecting to WiFi: "));
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED || WiFi.localIP() == IPAddress(0, 0, 0, 0)) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print(F("[BOOT] WiFi connected. Dashboard: http://"));
  Serial.println(WiFi.localIP());

  RTC.begin();
  Serial.println(F("[BOOT] Syncing time from NTP..."));
  if (syncTimeFromNTP()) {
    Serial.println(F("[BOOT] Time synced successfully."));
  } else {
    Serial.println(F("[WARN] NTP sync failed - RTC may show incorrect time."));
  }

  server.begin();
  Serial.println(F("[BOOT] Web server started."));
}

// =============================== MAIN LOOP ==================================

void loop() {
  // Daily automatic re-sync so the RTC never drifts far from real time
  if (millis() - lastNtpSyncMillis > NTP_RESYNC_INTERVAL_MS) {
    syncTimeFromNTP();
  }

  checkSchedule();
  checkDFPlayerDiagnostics();

  WiFiClient client = server.available();
  if (!client) return;

  String request = readHttpRequest(client);
  if (request.length() == 0) { client.stop(); return; }

  routeRequest(client, request);

  while (client.available()) client.read();
  client.stop();
}

// ========================= DFPLAYER DIAGNOSTICS =============================
// Prints plain-English status/error messages from the DFPlayer to Serial so
// you can see exactly why audio isn't playing (missing SD card, bad file
// number, busy, etc.) instead of just silence.

void checkDFPlayerDiagnostics() {
  if (!myDFPlayer.available()) return;
  uint8_t type = myDFPlayer.readType();
  int value = myDFPlayer.read();

  switch (type) {
    case TimeOut:
      Serial.println(F("[DFPlayer] Time out - check wiring (TX/RX may be swapped or disconnected).")); break;
    case WrongStack:
      Serial.println(F("[DFPlayer] Wrong data received - check baud rate / wiring.")); break;
    case DFPlayerCardInserted:
      Serial.println(F("[DFPlayer] SD card inserted.")); break;
    case DFPlayerCardRemoved:
      Serial.println(F("[DFPlayer] SD card removed!")); break;
    case DFPlayerCardOnline:
      Serial.println(F("[DFPlayer] SD card ready.")); break;
    case DFPlayerPlayFinished:
      Serial.print(F("[DFPlayer] Finished playing track "));
      Serial.println(value);
      break;
    case DFPlayerError:
      Serial.print(F("[DFPlayer] ERROR: "));
      switch (value) {
        case Busy:            Serial.println(F("No SD card found, or card not readable.")); break;
        case Sleeping:        Serial.println(F("Module is sleeping.")); break;
        case SerialWrongStack:Serial.println(F("Serial communication error.")); break;
        case CheckSumNotMatch:Serial.println(F("Checksum mismatch (noisy wiring?).")); break;
        case FileIndexOut:    Serial.println(F("Track number does not exist on the SD card.")); break;
        case FileMismatch:    Serial.println(F("File/folder structure mismatch - check /mp3/0001.mp3 naming.")); break;
        case Advertise:       Serial.println(F("Advertise error.")); break;
        default:              Serial.println(value); break;
      }
      break;
    default:
      break;
  }
}

// ========================= SCHEDULE TRIGGER LOGIC ===========================

void checkSchedule() {
  NowInfo n = getNow();
  int nowMinuteOfDay = n.hour * 60 + n.minute;
  if (n.second != 0) return;                     // only evaluate once per minute
  if (lastCheckedMinuteOfDay == nowMinuteOfDay) return;
  lastCheckedMinuteOfDay = nowMinuteOfDay;

  for (uint8_t i = 0; i < scheduleCount; i++) {
    if (!schedule[i].enabled) continue;
    if (schedule[i].hour == n.hour && schedule[i].minute == n.minute &&
        (schedule[i].daysMask & (1 << n.dowMon))) {
      Serial.print(F("[BELL] Triggering track "));
      Serial.println(schedule[i].track);
      myDFPlayer.playMp3Folder(schedule[i].track);
    }
  }
}

// ============================ HTTP REQUEST READING ===========================

String readHttpRequest(WiFiClient &client) {
  String req = "";
  unsigned long start = millis();
  bool headerDone = false;

  while (client.connected() && millis() - start < 3000) {
    if (client.available()) {
      String line = client.readStringUntil('\n');
      req += line + "\n";
      start = millis();
      if (line == "\r" || line.length() == 0) { headerDone = true; break; }
    }
  }
  if (!headerDone) return req;

  int clIdx = req.indexOf("Content-Length:");
  if (clIdx >= 0) {
    int valStart = clIdx + 15;
    int valEnd = req.indexOf('\r', valStart);
    int len = req.substring(valStart, valEnd).toInt();
    if (len > 0) {
      String body = "";
      unsigned long t2 = millis();
      while ((int)body.length() < len && millis() - t2 < 3000) {
        if (client.available()) body += (char)client.read();
      }
      req += body;
    }
  }
  return req;
}

String getParam(const String &req, const String &key) {
  String search = key + "=";
  int idx = req.indexOf(search);
  if (idx < 0) return "";
  idx += search.length();
  int stopPos = req.length();
  int amp = req.indexOf('&', idx);
  int sp  = req.indexOf(' ', idx);
  int cr  = req.indexOf('\r', idx);
  if (amp >= 0 && amp < stopPos) stopPos = amp;
  if (sp  >= 0 && sp  < stopPos) stopPos = sp;
  if (cr  >= 0 && cr  < stopPos) stopPos = cr;
  return req.substring(idx, stopPos);
}

// =============================== ROUTING ====================================

void routeRequest(WiFiClient &client, const String &request) {
  if      (request.indexOf("GET /api/status") >= 0)          handleStatus(client);
  else if (request.indexOf("GET /api/play?") >= 0)           handlePlay(client, request);
  else if (request.indexOf("GET /api/schedule/delete?") >= 0) handleScheduleDelete(client, request);
  else if (request.indexOf("GET /api/schedule/toggle?") >= 0) handleScheduleToggle(client, request);
  else if (request.indexOf("GET /api/schedule") >= 0)         handleScheduleList(client);
  else if (request.indexOf("POST /api/schedule/add") >= 0)    handleScheduleAdd(client, request);
  else if (request.indexOf("GET /api/resync") >= 0)          handleResync(client);
  else if (request.indexOf("GET /api/volume?") >= 0)         handleVolume(client, request);
  else if (request.indexOf("GET / ") >= 0 || request.indexOf("GET /index.html") >= 0) sendDashboard(client);
  else {
    client.println("HTTP/1.1 404 Not Found");
    client.println("Connection: close");
    client.println();
  }
}

void sendJsonHeader(WiFiClient &client) {
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: application/json");
  client.println("Connection: close");
  client.println("Access-Control-Allow-Origin: *");
  client.println();
}

void sendPlainOk(WiFiClient &client, bool ok) {
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: text/plain");
  client.println("Connection: close");
  client.println();
  client.println(ok ? "OK" : "FAIL");
}

// ------------------------------ /api/status ---------------------------------
void handleStatus(WiFiClient &client) {
  NowInfo n = getNow();
  sendJsonHeader(client);
  String json = "{";
  json += "\"hour\":" + String(n.hour) + ",";
  json += "\"minute\":" + String(n.minute) + ",";
  json += "\"second\":" + String(n.second) + ",";
  json += "\"dow\":" + String(n.dowMon) + ",";
  json += "\"dayName\":\"" + String(DAY_NAMES[n.dowMon]) + "\",";
  json += "\"day\":" + String(n.day) + ",";
  json += "\"month\":" + String(n.month) + ",";
  json += "\"year\":" + String(n.year) + ",";
  json += "\"rssi\":" + String(WiFi.RSSI()) + ",";
  json += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
  json += "\"volume\":" + String(currentVolume);
  json += "}";
  client.print(json);
}

// ------------------------------- /api/play -----------------------------------
void handlePlay(WiFiClient &client, const String &request) {
  int track = getParam(request, "id").toInt();
  bool ok = (track >= 1 && track <= NUM_TRACKS);
  if (ok) {
    Serial.print(F("[MANUAL] Playing track "));
    Serial.println(track);
    myDFPlayer.playMp3Folder(track);
  }
  sendPlainOk(client, ok);
}

// ------------------------------ /api/volume ----------------------------------
void handleVolume(WiFiClient &client, const String &request) {
  int level = getParam(request, "level").toInt();
  bool ok = (level >= 0 && level <= 30);
  if (ok) {
    currentVolume = level;
    myDFPlayer.volume(level);
    saveScheduleToEEPROM();
  }
  sendPlainOk(client, ok);
}

// ------------------------------ /api/resync -----------------------------------
void handleResync(WiFiClient &client) {
  bool ok = syncTimeFromNTP();
  sendPlainOk(client, ok);
}

// ---------------------------- /api/schedule (list) -----------------------------
void handleScheduleList(WiFiClient &client) {
  sendJsonHeader(client);
  String json = "[";
  for (uint8_t i = 0; i < scheduleCount; i++) {
    if (i > 0) json += ",";
    json += "{";
    json += "\"id\":" + String(i) + ",";
    json += "\"hour\":" + String(schedule[i].hour) + ",";
    json += "\"minute\":" + String(schedule[i].minute) + ",";
    json += "\"daysMask\":" + String(schedule[i].daysMask) + ",";
    json += "\"track\":" + String(schedule[i].track) + ",";
    json += "\"label\":\"" + String(ANNOUNCEMENT_NAMES[schedule[i].track - 1]) + "\",";
    json += "\"enabled\":" + String(schedule[i].enabled);
    json += "}";
  }
  json += "]";
  client.print(json);
}

// --------------------------- /api/schedule/add (POST) --------------------------
void handleScheduleAdd(WiFiClient &client, const String &request) {
  int hour   = getParam(request, "hour").toInt();
  int minute = getParam(request, "minute").toInt();
  int days   = getParam(request, "days").toInt();
  int track  = getParam(request, "track").toInt();

  bool ok = (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 &&
             days >= 1 && days <= 127 && track >= 1 && track <= NUM_TRACKS &&
             scheduleCount < MAX_SCHEDULE);

  if (ok) {
    schedule[scheduleCount].hour = hour;
    schedule[scheduleCount].minute = minute;
    schedule[scheduleCount].daysMask = days;
    schedule[scheduleCount].track = track;
    schedule[scheduleCount].enabled = 1;
    scheduleCount++;
    saveScheduleToEEPROM();
  }
  sendPlainOk(client, ok);
}

// -------------------------- /api/schedule/delete -------------------------------
void handleScheduleDelete(WiFiClient &client, const String &request) {
  int id = getParam(request, "id").toInt();
  bool ok = (id >= 0 && id < scheduleCount);
  if (ok) {
    for (int i = id; i < scheduleCount - 1; i++) schedule[i] = schedule[i + 1];
    scheduleCount--;
    saveScheduleToEEPROM();
  }
  sendPlainOk(client, ok);
}

// -------------------------- /api/schedule/toggle -------------------------------
void handleScheduleToggle(WiFiClient &client, const String &request) {
  int id = getParam(request, "id").toInt();
  bool ok = (id >= 0 && id < scheduleCount);
  if (ok) {
    schedule[id].enabled = schedule[id].enabled ? 0 : 1;
    saveScheduleToEEPROM();
  }
  sendPlainOk(client, ok);
}

// ============================ DASHBOARD WEB PAGE =============================

void sendDashboard(WiFiClient &client) {
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: text/html");
  client.println("Connection: close");
  client.println();

  client.println(F("<!DOCTYPE html><html><head><meta charset='utf-8'>"));
  client.println(F("<meta name='viewport' content='width=device-width, initial-scale=1.0'>"));
  client.println(F("<title>School Bell &amp; Announcement Control</title>"));
  sendStyles(client);
  client.println(F("</head><body>"));
  sendHeader(client);
  sendTabs(client);
  sendDashboardTab(client);
  sendManualTab(client);
  sendScheduleTab(client);
  sendSettingsTab(client);
  client.println(F("<div class='footer'>SYSTEM NODE ONLINE &nbsp;//&nbsp; ARDUINO UNO R4 WIFI CONTROL PANEL</div>"));
  sendScript(client);
  client.println(F("</body></html>"));
}

void sendStyles(WiFiClient &client) {
  client.println(F("<style>"));
  client.println(F(":root{--acc:#00f0ff;--acc2:#00a8ff;--bg1:#0d1527;--bg2:#030712;--line:#005577;--card:rgba(10,25,47,0.7);--txt:#e2e8f0;--muted:#64748b;}"));
  client.println(F("*{box-sizing:border-box;}"));
  client.println(F("body{background:radial-gradient(circle at bottom right,var(--bg1) 0%,var(--bg2) 100%);color:var(--txt);font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;margin:0;padding:20px;min-height:100vh;display:flex;flex-direction:column;align-items:center;}"));
  client.println(F("h1{color:var(--acc);font-weight:300;text-transform:uppercase;letter-spacing:3px;text-shadow:0 0 15px rgba(0,240,255,.6);margin:0;text-align:center;}"));
  client.println(F(".subtitle{color:var(--muted);letter-spacing:2px;font-size:.8rem;text-transform:uppercase;margin-top:4px;}"));
  client.println(F(".header{width:100%;max-width:1200px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;border-bottom:2px solid var(--line);padding-bottom:16px;margin-bottom:20px;}"));
  client.println(F(".clock-box{text-align:right;}"));
  client.println(F(".clock{font-size:2.2rem;color:#fff;font-weight:300;letter-spacing:2px;}"));
  client.println(F(".dateline{color:var(--acc2);font-size:.85rem;letter-spacing:1px;}"));
  client.println(F(".tabs{display:flex;gap:8px;max-width:1200px;width:100%;margin-bottom:20px;flex-wrap:wrap;}"));
  client.println(F(".tab-btn{flex:1;min-width:120px;background:transparent;border:1px solid var(--line);color:var(--txt);padding:12px;border-radius:6px;cursor:pointer;text-transform:uppercase;letter-spacing:1px;font-size:.85rem;transition:.2s;}"));
  client.println(F(".tab-btn.active{background:var(--acc);color:#030712;border-color:var(--acc);box-shadow:0 0 15px var(--acc);}"));
  client.println(F(".tab-page{display:none;max-width:1200px;width:100%;}"));
  client.println(F(".tab-page.active{display:block;}"));
  client.println(F(".grid-container{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;width:100%;}"));
  client.println(F(".panel-card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:20px;display:flex;flex-direction:column;justify-content:space-between;align-items:center;box-shadow:0 0 15px rgba(0,0,0,.5),inset 0 0 10px rgba(0,240,255,.05);transition:.3s;position:relative;overflow:hidden;}"));
  client.println(F(".panel-card::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;background:var(--acc);opacity:.5;}"));
  client.println(F(".panel-card:hover{border-color:var(--acc);box-shadow:0 0 20px rgba(0,240,255,.3);transform:translateY(-2px);}"));
  client.println(F(".track-num{font-size:.8rem;color:var(--acc2);font-weight:bold;align-self:flex-start;margin-bottom:8px;letter-spacing:1px;}"));
  client.println(F(".announcement-title{font-size:1.05rem;font-weight:500;text-align:center;margin-bottom:15px;color:#fff;min-height:44px;display:flex;align-items:center;}"));
  client.println(F(".trigger-btn{background:transparent;border:1px solid var(--acc);color:var(--acc);padding:10px 24px;font-size:.85rem;text-transform:uppercase;font-weight:600;letter-spacing:1px;border-radius:4px;cursor:pointer;transition:.2s;width:85%;}"));
  client.println(F(".trigger-btn:hover{background:var(--acc);color:#030712;box-shadow:0 0 15px var(--acc);}"));
  client.println(F(".trigger-btn:active{transform:scale(.96);}"));
  client.println(F(".info-card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:20px;margin-bottom:20px;}"));
  client.println(F(".info-card h3{margin:0 0 12px 0;color:var(--acc);font-weight:400;text-transform:uppercase;letter-spacing:2px;font-size:.9rem;}"));
  client.println(F(".stat-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:.9rem;}"));
  client.println(F(".stat-row span:last-child{color:#fff;font-weight:600;}"));
  client.println(F("table{width:100%;border-collapse:collapse;margin-top:10px;}"));
  client.println(F("th,td{padding:10px;text-align:left;border-bottom:1px solid rgba(255,255,255,.08);font-size:.85rem;}"));
  client.println(F("th{color:var(--acc2);text-transform:uppercase;letter-spacing:1px;font-size:.75rem;}"));
  client.println(F(".badge{padding:3px 10px;border-radius:12px;font-size:.75rem;letter-spacing:1px;}"));
  client.println(F(".badge.on{background:rgba(0,240,255,.15);color:var(--acc);border:1px solid var(--acc);}"));
  client.println(F(".badge.off{background:rgba(255,255,255,.05);color:var(--muted);border:1px solid var(--muted);}"));
  client.println(F(".mini-btn{background:transparent;border:1px solid var(--line);color:var(--txt);padding:5px 12px;border-radius:4px;cursor:pointer;font-size:.75rem;margin-right:6px;}"));
  client.println(F(".mini-btn:hover{border-color:var(--acc);color:var(--acc);}"));
  client.println(F(".mini-btn.danger:hover{border-color:#ff4d6d;color:#ff4d6d;}"));
  client.println(F(".form-row{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px;}"));
  client.println(F(".field{display:flex;flex-direction:column;gap:6px;}"));
  client.println(F(".field label{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;}"));
  client.println(F("input,select{background:#0a1526;border:1px solid var(--line);color:var(--txt);padding:9px 12px;border-radius:4px;font-size:.9rem;}"));
  client.println(F(".days-picker{display:flex;gap:6px;}"));
  client.println(F(".day-chip{padding:8px 10px;border:1px solid var(--line);border-radius:4px;cursor:pointer;font-size:.75rem;user-select:none;}"));
  client.println(F(".day-chip.sel{background:var(--acc);color:#030712;border-color:var(--acc);}"));
  client.println(F(".add-btn{background:var(--acc);color:#030712;border:none;padding:10px 26px;border-radius:4px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;}"));
  client.println(F("input[type=range]{width:220px;}"));
  client.println(F(".footer{margin-top:40px;padding-top:20px;color:#475569;font-size:.8rem;letter-spacing:1px;text-align:center;}"));
  client.println(F(".next-bell{font-size:1.3rem;color:#fff;font-weight:300;}"));
  client.println(F(".next-bell b{color:var(--acc);}"));
  client.println(F("@media(max-width:600px){.clock{font-size:1.6rem;}.header{flex-direction:column;align-items:flex-start;}}"));
  client.println(F("</style>"));
}

void sendHeader(WiFiClient &client) {
  client.println(F("<div class='header'>"));
  client.println(F("<div><h1>School Bell &amp; Announcement</h1><div class='subtitle'>Automated Scheduling Dashboard</div></div>"));
  client.println(F("<div class='clock-box'><div class='clock' id='clockDisplay'>--:--:--</div><div class='dateline' id='dateDisplay'>Loading...</div></div>"));
  client.println(F("</div>"));
}

void sendTabs(WiFiClient &client) {
  client.println(F("<div class='tabs'>"));
  client.println(F("<button class='tab-btn active' onclick=\"showTab('dashboard',this)\">Dashboard</button>"));
  client.println(F("<button class='tab-btn' onclick=\"showTab('manual',this)\">Manual Control</button>"));
  client.println(F("<button class='tab-btn' onclick=\"showTab('schedule',this)\">Schedule</button>"));
  client.println(F("<button class='tab-btn' onclick=\"showTab('settings',this)\">Settings</button>"));
  client.println(F("</div>"));
}

void sendDashboardTab(WiFiClient &client) {
  client.println(F("<div class='tab-page active' id='page-dashboard'>"));
  client.println(F("<div class='info-card'><h3>Next Scheduled Bell</h3><div class='next-bell' id='nextBellText'>Calculating...</div></div>"));
  client.println(F("<div class='grid-container'>"));
  client.println(F("<div class='info-card'><h3>System Status</h3>"));
  client.println(F("<div class='stat-row'><span>Wi-Fi Signal</span><span id='statRssi'>--</span></div>"));
  client.println(F("<div class='stat-row'><span>IP Address</span><span id='statIp'>--</span></div>"));
  client.println(F("<div class='stat-row'><span>Volume Level</span><span id='statVol'>--</span></div>"));
  client.println(F("</div>"));
  client.println(F("<div class='info-card'><h3>Schedule Summary</h3>"));
  client.println(F("<div class='stat-row'><span>Total Bell Times</span><span id='statTotal'>--</span></div>"));
  client.println(F("<div class='stat-row'><span>Active</span><span id='statActive'>--</span></div>"));
  client.println(F("<div class='stat-row'><span>Disabled</span><span id='statDisabled'>--</span></div>"));
  client.println(F("</div></div>"));
  client.println(F("<div class='info-card' style='margin-top:20px;'><h3>Today's Bells</h3><table><thead><tr><th>Time</th><th>Announcement</th><th>Status</th></tr></thead><tbody id='todayTableBody'></tbody></table></div>"));
  client.println(F("</div>"));
}

void sendManualTab(WiFiClient &client) {
  client.println(F("<div class='tab-page' id='page-manual'>"));
  client.println(F("<div class='grid-container'>"));
  for (int i = 0; i < NUM_TRACKS; i++) {
    int fileNumber = i + 1;
    client.print(F("<div class='panel-card'><div class='track-num'>TRACK #"));
    if (fileNumber < 10) client.print("0");
    client.print(fileNumber);
    client.print(F("</div><div class='announcement-title'>"));
    client.print(ANNOUNCEMENT_NAMES[i]);
    client.print(F("</div><button class='trigger-btn' onclick='triggerAudio("));
    client.print(fileNumber);
    client.println(F(")'>Broadcast</button></div>"));
  }
  client.println(F("</div></div>"));
}

void sendScheduleTab(WiFiClient &client) {
  client.println(F("<div class='tab-page' id='page-schedule'>"));
  client.println(F("<div class='info-card'>"));
  client.println(F("<h3>Add New Bell Time</h3>"));
  client.println(F("<div class='form-row'>"));
  client.println(F("<div class='field'><label>Time</label><input type='time' id='newTime'></div>"));
  client.println(F("<div class='field'><label>Announcement</label><select id='newTrack'>"));
  for (int i = 0; i < NUM_TRACKS; i++) {
    client.print(F("<option value='"));
    client.print(i + 1);
    client.print(F("'>"));
    client.print(ANNOUNCEMENT_NAMES[i]);
    client.println(F("</option>"));
  }
  client.println(F("</select></div>"));
  client.println(F("<div class='field'><label>Repeat On</label><div class='days-picker' id='dayPicker'>"));
  const char* dayShort[7] = {"Mon","Tue","Wed","Thu","Fri","Sat","Sun"};
  for (int i = 0; i < 7; i++) {
    client.print(F("<div class='day-chip' data-bit='"));
    client.print(i);
    client.print(F("' onclick='toggleDayChip(this)'>"));
    client.print(dayShort[i]);
    client.println(F("</div>"));
  }
  client.println(F("</div></div>"));
  client.println(F("<div class='field'><label>&nbsp;</label><button class='add-btn' onclick='addSchedule()'>Add Bell</button></div>"));
  client.println(F("</div></div>"));

  client.println(F("<div class='info-card' style='margin-top:20px;'>"));
  client.println(F("<h3>All Scheduled Bells</h3>"));
  client.println(F("<table><thead><tr><th>Time</th><th>Days</th><th>Announcement</th><th>Status</th><th>Actions</th></tr></thead><tbody id='scheduleTableBody'></tbody></table>"));
  client.println(F("</div></div>"));
}

void sendSettingsTab(WiFiClient &client) {
  client.println(F("<div class='tab-page' id='page-settings'>"));
  client.println(F("<div class='grid-container'>"));
  client.println(F("<div class='info-card'><h3>Volume Control</h3>"));
  client.print(F("<input type='range' min='0' max='30' id='volSlider' value='"));
  client.print(currentVolume);
  client.println(F("' oninput='document.getElementById(\"volVal\").innerText=this.value'>"));
  client.print(F("<div style='margin:10px 0;'>Level: <b id='volVal'>"));
  client.print(currentVolume);
  client.println(F("</b> / 30</div>"));
  client.println(F("<button class='add-btn' onclick='applyVolume()'>Apply Volume</button></div>"));
  client.println(F("<div class='info-card'><h3>Time Sync</h3><p style='color:var(--muted);font-size:.85rem;'>Manually force a re-sync with the NTP time server.</p>"));
  client.println(F("<button class='add-btn' onclick='forceResync()'>Re-Sync Time Now</button></div>"));
  client.println(F("</div></div>"));
}

void sendScript(WiFiClient &client) {
  client.println(F("<script>"));
  client.println(F("let scheduleData=[];let selectedDays=new Set();"));
  client.println(F("function showTab(name,btn){document.querySelectorAll('.tab-page').forEach(p=>p.classList.remove('active'));document.getElementById('page-'+name).classList.add('active');document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}"));
  client.println(F("function triggerAudio(id){fetch('/api/play?id='+id).catch(e=>console.error(e));}"));
  client.println(F("function toggleDayChip(el){el.classList.toggle('sel');let bit=parseInt(el.dataset.bit);if(selectedDays.has(bit))selectedDays.delete(bit);else selectedDays.add(bit);}"));
  client.println(F("function addSchedule(){let t=document.getElementById('newTime').value;if(!t){alert('Pick a time');return;}let parts=t.split(':');let hour=parts[0];let minute=parts[1];let track=document.getElementById('newTrack').value;let mask=0;selectedDays.forEach(b=>mask|=(1<<b));if(mask===0){alert('Select at least one day');return;}"));
  client.println(F("fetch('/api/schedule/add',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'hour='+hour+'&minute='+minute+'&days='+mask+'&track='+track}).then(()=>{loadSchedule();selectedDays.clear();document.querySelectorAll('.day-chip').forEach(c=>c.classList.remove('sel'));});}"));
  client.println(F("function deleteSchedule(id){if(!confirm('Delete this bell time?'))return;fetch('/api/schedule/delete?id='+id).then(()=>loadSchedule());}"));
  client.println(F("function toggleSchedule(id){fetch('/api/schedule/toggle?id='+id).then(()=>loadSchedule());}"));
  client.println(F("function applyVolume(){let v=document.getElementById('volSlider').value;fetch('/api/volume?level='+v);}"));
  client.println(F("function forceResync(){fetch('/api/resync').then(r=>r.text()).then(t=>alert(t==='OK'?'Time synced successfully.':'Sync failed. Check WiFi.'));}"));
  client.println(F("const DAY_NAMES=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];"));
  client.println(F("function daysMaskToText(mask){if(mask===127)return 'Every Day';if(mask===63)return 'Mon-Sat';if(mask===31)return 'Mon-Fri';let out=[];for(let i=0;i<7;i++)if(mask&(1<<i))out.push(DAY_NAMES[i]);return out.join(', ');}"));
  client.println(F("function pad(n){return n<10?'0'+n:''+n;}"));
  client.println(F("function loadSchedule(){fetch('/api/schedule').then(r=>r.json()).then(data=>{scheduleData=data;renderScheduleTable();renderTodayTable();renderNextBell();renderStats();});}"));
  client.println(F("function renderScheduleTable(){let body=document.getElementById('scheduleTableBody');body.innerHTML='';scheduleData.forEach(s=>{let row=document.createElement('tr');row.innerHTML=`<td>${pad(s.hour)}:${pad(s.minute)}</td><td>${daysMaskToText(s.daysMask)}</td><td>${s.label}</td><td><span class='badge ${s.enabled?\"on\":\"off\"}'>${s.enabled?'ACTIVE':'OFF'}</span></td><td><button class='mini-btn' onclick='toggleSchedule(${s.id})'>${s.enabled?'Disable':'Enable'}</button><button class='mini-btn danger' onclick='deleteSchedule(${s.id})'>Delete</button></td>`;body.appendChild(row);});}"));
  client.println(F("function renderTodayTable(){let body=document.getElementById('todayTableBody');body.innerHTML='';let today=currentDow;let todays=scheduleData.filter(s=>s.daysMask&(1<<today)).sort((a,b)=>(a.hour*60+a.minute)-(b.hour*60+b.minute));if(todays.length===0){body.innerHTML='<tr><td colspan=3 style=\"color:var(--muted);\">No bells scheduled for today.</td></tr>';return;}todays.forEach(s=>{let row=document.createElement('tr');row.innerHTML=`<td>${pad(s.hour)}:${pad(s.minute)}</td><td>${s.label}</td><td><span class='badge ${s.enabled?\"on\":\"off\"}'>${s.enabled?'ACTIVE':'OFF'}</span></td>`;body.appendChild(row);});}"));
  client.println(F("function renderStats(){document.getElementById('statTotal').innerText=scheduleData.length;document.getElementById('statActive').innerText=scheduleData.filter(s=>s.enabled).length;document.getElementById('statDisabled').innerText=scheduleData.filter(s=>!s.enabled).length;}"));
  client.println(F("function renderNextBell(){let active=scheduleData.filter(s=>s.enabled);if(active.length===0){document.getElementById('nextBellText').innerHTML='No active bells scheduled.';return;}let best=null,bestDelta=Infinity;let nowMinutes=currentHour*60+currentMinute;for(let d=0;d<8;d++){let dow=(currentDow+d)%7;active.forEach(s=>{if(s.daysMask&(1<<dow)){let mins=s.hour*60+s.minute;let delta=d*1440+mins-(d===0?nowMinutes:0);if(d===0&&mins<=nowMinutes)return;if(delta<bestDelta){bestDelta=delta;best=s;}}});if(best)break;}"));
  client.println(F("if(!best){document.getElementById('nextBellText').innerHTML='No upcoming bells found.';return;}let hrs=Math.floor(bestDelta/60);let mins=bestDelta%60;document.getElementById('nextBellText').innerHTML=`<b>${pad(best.hour)}:${pad(best.minute)}</b> — ${best.label} <span style='color:var(--muted);'>(in ${hrs>0?hrs+'h ':''}${mins}m)</span>`;}"));
  client.println(F("let currentHour=0,currentMinute=0,currentSecond=0,currentDow=0;"));
  client.println(F("function tickClock(){currentSecond++;if(currentSecond>=60){currentSecond=0;currentMinute++;if(currentMinute>=60){currentMinute=0;currentHour++;if(currentHour>=24){currentHour=0;currentDow=(currentDow+1)%7;}renderNextBell();renderTodayTable();}}document.getElementById('clockDisplay').innerText=pad(currentHour)+':'+pad(currentMinute)+':'+pad(currentSecond);}"));
  client.println(F("function loadStatus(){fetch('/api/status').then(r=>r.json()).then(d=>{currentHour=d.hour;currentMinute=d.minute;currentSecond=d.second;currentDow=d.dow;document.getElementById('dateDisplay').innerText=d.dayName+', '+pad(d.day)+'/'+pad(d.month)+'/'+d.year;document.getElementById('statRssi').innerText=d.rssi+' dBm';document.getElementById('statIp').innerText=d.ip;document.getElementById('statVol').innerText=d.volume+' / 30';});}"));
  client.println(F("loadStatus();loadSchedule();setInterval(tickClock,1000);setInterval(loadStatus,30000);"));
  client.println(F("</script>"));
}
