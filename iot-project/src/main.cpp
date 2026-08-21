#include <Arduino.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>
#include <TinyGPS++.h>
#include <WiFi.h>
#include <Wire.h>

const char *WIFI_SSID = "vivov30";
const char *WIFI_PASSWORD = "1527750498";

const char *SERVER_URL =
    "https://8080-kode-ws-0a787a829.hebbale.academy/sensor-data";

#define DHT_PIN 4
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

#define SDA_PIN 21
#define SCL_PIN 22

TinyGPSPlus gps;
HardwareSerial GPS_Serial(2);

#define GPS_RX 16
#define GPS_TX 17

#define MPU_ADDR 0x68

#define WHO_AM_I_REG 0x75
#define PWR_MGMT_1_REG 0x6B

#define ACCEL_XOUT_H 0x3B
#define TEMP_OUT_H 0x41
#define GYRO_XOUT_H 0x43

bool motionSensorOK = false;

float dhtTemperature = 0.0;
float humidity = 0.0;

float ax = 0.0;
float ay = 0.0;
float az = 0.0;

float gx = 0.0;
float gy = 0.0;
float gz = 0.0;

float mpuTemperature = 0.0;

bool gpsFix = false;

double latitude = 0.0;
double longitude = 0.0;

int satellites = 0;

double altitude = 0.0;
double speed = 0.0;

unsigned long previousMillis = 0;

const unsigned long SENSOR_INTERVAL = 2000;

void writeRegister(byte reg, byte value) {
  Wire.beginTransmission(MPU_ADDR);

  Wire.write(reg);
  Wire.write(value);

  Wire.endTransmission();
}

bool readRegisters(byte reg, byte *buffer, byte length) {
  Wire.beginTransmission(MPU_ADDR);

  Wire.write(reg);

  if (Wire.endTransmission(false) != 0) {
    return false;
  }

  int received = Wire.requestFrom(MPU_ADDR, length);

  if (received != length) {
    return false;
  }

  for (byte i = 0; i < length; i++) {
    buffer[i] = Wire.read();
  }

  return true;
}

int16_t read16(byte reg) {
  byte buffer[2];

  if (!readRegisters(reg, buffer, 2)) {
    return 0;
  }

  return ((int16_t)buffer[0] << 8) | buffer[1];
}

bool initializeMotionSensor() {
  Wire.beginTransmission(MPU_ADDR);

  if (Wire.endTransmission() != 0) {
    return false;
  }

  byte whoAmI;

  if (!readRegisters(WHO_AM_I_REG, &whoAmI, 1)) {
    return false;
  }

  writeRegister(PWR_MGMT_1_REG, 0x00);

  delay(100);

  return true;
}

void readDHT11() {
  float temperature = dht.readTemperature();
  float hum = dht.readHumidity();

  if (!isnan(temperature)) {
    dhtTemperature = temperature;
  }

  if (!isnan(hum)) {
    humidity = hum;
  }
}

void readMotionSensor() {
  if (!motionSensorOK) {
    return;
  }

  int16_t rawAx = read16(ACCEL_XOUT_H);
  int16_t rawAy = read16(ACCEL_XOUT_H + 2);
  int16_t rawAz = read16(ACCEL_XOUT_H + 4);

  int16_t rawTemp = read16(TEMP_OUT_H);

  int16_t rawGx = read16(GYRO_XOUT_H);
  int16_t rawGy = read16(GYRO_XOUT_H + 2);
  int16_t rawGz = read16(GYRO_XOUT_H + 4);

  ax = (float)rawAx / 16384.0;
  ay = (float)rawAy / 16384.0;
  az = (float)rawAz / 16384.0;

  gx = (float)rawGx / 131.0;
  gy = (float)rawGy / 131.0;
  gz = (float)rawGz / 131.0;

  mpuTemperature = ((float)rawTemp / 340.0) + 36.53;
}

void readGPS() {
  while (GPS_Serial.available()) {
    char c = GPS_Serial.read();

    gps.encode(c);
  }

  if (gps.location.isValid()) {
    gpsFix = true;

    latitude = gps.location.lat();
    longitude = gps.location.lng();
  } else {
    gpsFix = false;
  }

  if (gps.satellites.isValid()) {
    satellites = gps.satellites.value();
  }

  if (gps.altitude.isValid()) {
    altitude = gps.altitude.meters();
  }

  if (gps.speed.isValid()) {
    speed = gps.speed.kmph();
  }
}

void connectWiFi() {
  Serial.println();
  Serial.println("Connecting to WiFi...");

  WiFi.mode(WIFI_STA);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);

    Serial.print(".");

    attempts++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected!");

    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connection failed.");
  }
}

void checkWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");

    WiFi.disconnect();

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long startTime = millis();

    while (WiFi.status() != WL_CONNECTED && millis() - startTime < 10000) {
      delay(500);
      Serial.print(".");
    }

    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("WiFi reconnected.");
      Serial.print("ESP32 IP: ");
      Serial.println(WiFi.localIP());
    }
  }
}

void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot send data: WiFi disconnected.");
    return;
  }

  HTTPClient http;

  http.begin(SERVER_URL);

  http.addHeader("Content-Type", "application/json");

  String json = "{";

  json += "\"temperature\":" + String(dhtTemperature, 2) + ",";
  json += "\"humidity\":" + String(humidity, 2) + ",";

  json += "\"acceleration_x\":" + String(ax, 3) + ",";
  json += "\"acceleration_y\":" + String(ay, 3) + ",";
  json += "\"acceleration_z\":" + String(az, 3) + ",";

  json += "\"gyro_x\":" + String(gx, 3) + ",";
  json += "\"gyro_y\":" + String(gy, 3) + ",";
  json += "\"gyro_z\":" + String(gz, 3) + ",";

  json += "\"mpu_temperature\":" + String(mpuTemperature, 2) + ",";

  json += "\"gps_fix\":" + String(gpsFix ? "true" : "false") + ",";

  json += "\"latitude\":" + String(latitude, 6) + ",";
  json += "\"longitude\":" + String(longitude, 6) + ",";

  json += "\"satellites\":" + String(satellites) + ",";

  json += "\"altitude\":" + String(altitude, 2) + ",";
  json += "\"speed\":" + String(speed, 2);

  json += "}";

  Serial.println();
  Serial.println("Sending sensor data...");

  int httpResponseCode = http.POST(json);

  if (httpResponseCode > 0) {
    Serial.print("Server response: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode == 200) {
      Serial.println("Data sent successfully.");
    }
  } else {
    Serial.print("HTTP error: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

void printSensorStatus() {
  Serial.println();
  Serial.println("========================================");
  Serial.println("          SENSOR DATA");
  Serial.println("========================================");

  Serial.print("DHT11 Temperature : ");
  Serial.print(dhtTemperature, 2);
  Serial.println(" °C");

  Serial.print("DHT11 Humidity    : ");
  Serial.print(humidity, 2);
  Serial.println(" %");

  Serial.println();

  Serial.print("Accel X           : ");
  Serial.print(ax, 3);
  Serial.println(" g");

  Serial.print("Accel Y           : ");
  Serial.print(ay, 3);
  Serial.println(" g");

  Serial.print("Accel Z           : ");
  Serial.print(az, 3);
  Serial.println(" g");

  Serial.print("Gyro X            : ");
  Serial.print(gx, 3);
  Serial.println(" deg/s");

  Serial.print("Gyro Y            : ");
  Serial.print(gy, 3);
  Serial.println(" deg/s");

  Serial.print("Gyro Z            : ");
  Serial.print(gz, 3);
  Serial.println(" deg/s");

  Serial.println();

  Serial.print("GPS Fix           : ");
  Serial.println(gpsFix ? "YES" : "NO");

  if (gpsFix) {
    Serial.print("Latitude          : ");
    Serial.println(latitude, 6);

    Serial.print("Longitude         : ");
    Serial.println(longitude, 6);
  }

  Serial.print("Satellites        : ");
  Serial.println(satellites);

  Serial.print("Altitude          : ");
  Serial.print(altitude, 2);
  Serial.println(" m");

  Serial.print("Speed             : ");
  Serial.print(speed, 2);
  Serial.println(" km/h");

  Serial.println();

  Serial.print("WiFi              : ");

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("CONNECTED - ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("DISCONNECTED");
  }

  Serial.println("========================================");
}

void setup() {
  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("ESP32 SENSOR SYSTEM");
  Serial.println("===================");

  dht.begin();

  Serial.println("DHT11 initialized");

  Wire.begin(SDA_PIN, SCL_PIN);

  delay(500);

  Serial.println("I2C initialized");

  motionSensorOK = initializeMotionSensor();

  if (motionSensorOK) {
    Serial.println("MPU6050 initialized");
  } else {
    Serial.println("MPU6050 NOT AVAILABLE");
  }

  GPS_Serial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  Serial.println("GPS initialized");

  connectWiFi();

  Serial.println();
  Serial.println("SYSTEM READY");
  Serial.println("===================");
}

void loop() {

  readGPS();

  checkWiFi();

  if (millis() - previousMillis >= SENSOR_INTERVAL) {
    previousMillis = millis();

    readDHT11();

    readMotionSensor();

    printSensorStatus();

    sendSensorData();
  }
}