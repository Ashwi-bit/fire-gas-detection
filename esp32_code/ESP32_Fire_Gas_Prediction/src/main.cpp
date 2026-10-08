#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"
#include <time.h>

// WiFi
#define WIFI_SSID "Me"
#define WIFI_PASSWORD "12345678"

// Firebase URL
String firebaseHost = "https://fire-gas-detection-7189b-default-rtdb.firebaseio.com";

// Sensors
#define DHT_PIN 4
#define DHTTYPE DHT11
#define MQ2_PIN 34
#define FLAME_PIN 5

// NTP Server for accurate time
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 19800;  // IST (UTC +5:30)
const int daylightOffset_sec = 0;

DHT dht(DHT_PIN, DHTTYPE);

// Function prototypes
String getTimestamp();
String getDate();
String getTime();

void setup() {
  Serial.begin(115200);
  dht.begin();

  pinMode(FLAME_PIN, INPUT);

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }

  Serial.println("\n✅ WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Initialize NTP for accurate time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("⏰ Getting time from NTP server...");

  int attempts = 0;
  while (time(nullptr) < 100000 && attempts < 20) {
    Serial.print(".");
    delay(500);
    attempts++;
  }

  if (time(nullptr) > 100000) {
    Serial.println("\n✅ Time synced successfully!");
  } else {
    Serial.println("\n⚠️ Using millis() as fallback for timestamps");
  }
}

void loop() {
  // Read sensors
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  int gas = analogRead(MQ2_PIN);

  // ✅ FIXED: Invert flame reading (Active LOW sensor)
  int flameRaw = digitalRead(FLAME_PIN);
  int flame = !flameRaw;  // 1 = Flame detected, 0 = No flame

  if (isnan(temp) || isnan(humidity)) {
    Serial.println("❌ DHT Sensor Error");
    delay(2000);
    return;
  }

  // Get current timestamp
  String timestamp = getTimestamp();
  String date = getDate();
  String time = getTime();

  Serial.println("------ SENSOR DATA ------");
  Serial.print("📅 Date: "); Serial.println(date);
  Serial.print("🕐 Time: "); Serial.println(time);
  Serial.print("🌡️ Temp: "); Serial.println(temp);
  Serial.print("💧 Humidity: "); Serial.println(humidity);
  Serial.print("💨 Gas: "); Serial.println(gas);
  Serial.print("🔥 Flame (final): "); Serial.println(flame);
  Serial.print("   Raw pin value: "); Serial.println(flameRaw);
  Serial.print("   Status: "); Serial.println(flame == 1 ? "DETECTED" : "None");

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    // --- STORE HISTORICAL DATA ---
    String basePath = "/sensor/readings/" + date + "/" + time + "/";

    http.begin(firebaseHost + basePath + "temp.json");
    http.PUT(String(temp));
    http.end();

    http.begin(firebaseHost + basePath + "humidity.json");
    http.PUT(String(humidity));
    http.end();

    http.begin(firebaseHost + basePath + "gas.json");
    http.PUT(String(gas));
    http.end();

    http.begin(firebaseHost + basePath + "flame.json");
    http.PUT(String(flame));
    http.end();

    // --- ALSO UPDATE LATEST VALUES (REAL-TIME) ---
    http.begin(firebaseHost + "/sensor/latest/temp.json");
    http.PUT(String(temp));
    http.end();

    http.begin(firebaseHost + "/sensor/latest/humidity.json");
    http.PUT(String(humidity));
    http.end();

    http.begin(firebaseHost + "/sensor/latest/gas.json");
    http.PUT(String(gas));
    http.end();

    http.begin(firebaseHost + "/sensor/latest/flame.json");
    http.PUT(String(flame));
    http.end();

    // ✅ NEW: Send lastUpdate timestamp for stale detection
    http.begin(firebaseHost + "/sensor/lastUpdate.json");
    http.PUT("\"" + timestamp + "\"");
    http.end();

    Serial.println("✅ All data sent to Firebase");
  } else {
    Serial.println("❌ WiFi not connected!");
  }

  delay(5000);
}

// ------- HELPER FUNCTIONS -------

String getTimestamp() {
  time_t now = time(nullptr);
  if (now < 100000) {
    return String(millis());
  }
  struct tm timeinfo;
  localtime_r(&now, &timeinfo);
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buffer);
}

String getDate() {
  time_t now = time(nullptr);
  if (now < 100000) {
    return "1970-01-01";
  }
  struct tm timeinfo;
  localtime_r(&now, &timeinfo);
  char buffer[15];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d", &timeinfo);
  return String(buffer);
}

String getTime() {
  time_t now = time(nullptr);
  if (now < 100000) {
    return "00:00:00";
  }
  struct tm timeinfo;
  localtime_r(&now, &timeinfo);
  char buffer[15];
  strftime(buffer, sizeof(buffer), "%H:%M:%S", &timeinfo);
  return String(buffer);
}