#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ===== CONFIGURATION DHT22 =====
#define DHT_PIN 4           // GPIO4 pour le DHT22
#define DHT_TYPE DHT22      // Type de capteur DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// ===== CONFIGURATION WIFI =====
// ===== CONFIGURATION =====sudo create_ap wlp2s0 enp3s0 WIFA 00000000@1
const char* ssid = "WIFA";
const char* password = "00000000@1";
const char* serverUrl = "http://192.168.137.66:8000/api/bin/update";

// ===== CHOISIR LA POUBELLE =====
#define USE_PBL_5    // Exemple: ESP32 #5 → PBL-5

#ifdef USE_PBL_5
  const String BIN_ID = "PBL-5";
  const String LOCATION = "Tanambao Fianarantsoa";
  const String ADDRESS = "Rue Tanambao Fianarantsoa";
  const int CAPACITY = 240; 
  const float LATITUDE = -21.451877;
  const float LONGITUDE = 47.090951;
#endif

// ===== PINS GPIO - ULTRASONS =====
const int TRIG1 = 26;
const int ECHO1 = 27;
const int TRIG2 = 14;
const int ECHO2 = 12;

// Calibration distances (cm)
const float EMPTY_DISTANCE = 15.0;   // Distance quand la poubelle est vide
const float FULL_DISTANCE  = 4.5;    // Distance quand la poubelle est pleine

// Timing
unsigned long lastUpdate = 0;
const unsigned long UPDATE_INTERVAL = 3000;

// Historique
float lastFillLevel = 0;
float lastTemperature = 0;
float lastHumidity = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n========================================");
  Serial.println("   SmartWaste ESP32 - PROTOTYPE ULTRASONS + DHT22");
  Serial.println("========================================");
  Serial.print("🗑️  Poubelle: ");
  Serial.println(BIN_ID);
  Serial.print("📍 Localisation: ");
  Serial.println(LOCATION);
  Serial.println("========================================");
  
  // Configuration des pins ultrasons
  pinMode(TRIG1, OUTPUT);
  pinMode(ECHO1, INPUT);
  pinMode(TRIG2, OUTPUT);
  pinMode(ECHO2, INPUT);

  // Initialisation DHT22
  Serial.println("🌡️  Initialisation DHT22...");
  dht.begin();
  delay(2000); // Délai pour stabilisation du DHT22
  Serial.println("✅ DHT22 initialisé!");

  // Connexion WiFi
  Serial.println("\n📡 Connexion WiFi...");
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connecté!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {Moyen
    Serial.println("\n❌ WiFi non connecté!");
  }
  
  Serial.println("========================================");
  Serial.println("Configuration matérielle:");
  Serial.println("  • DHT22: GPIO 4");
  Serial.println("  • Ultrason 1: TRIG=26, ECHO=27");
  Serial.println("  • Ultrason 2: TRIG=14, ECHO=12");
  Serial.println("========================================\n");
}

// ===== FONCTIONS DHT22 =====
float readTemperature() {
  float temp = dht.readTemperature();
  
  // Vérification si la lecture a échoué
  if (isnan(temp)) {
    Serial.println("⚠️ Erreur lecture température DHT22!");
    return lastTemperature; // Retourner la dernière valeur valide
  }
  
  lastTemperature = temp;
  return temp;
}

float readHumidity() {
  float hum = dht.readHumidity();
  
  // Vérification si la lecture a échoué
  if (isnan(hum)) {
    Serial.println("⚠️ Erreur lecture humidité DHT22!");
    return lastHumidity; // Retourner la dernière valeur valide
  }
  
  lastHumidity = hum;
  return hum;
}

// ===== FONCTIONS ULTRASONS =====
float readUltrasonic(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000); 
  float distance = duration * 0.034 / 2; // cm
  return distance;
}

float getFillLevel() {
  float d1 = readUltrasonic(TRIG1, ECHO1);
  float d2 = readUltrasonic(TRIG2, ECHO2);

  // Optimisation: moyenne
  float distance = (d1 + d2) / 2.0;

  // Détection divergence
  if (abs(d1 - d2) > 2.0) {
    Serial.println("⚠️ Divergence détectée entre capteurs !");
  }

  // Calcul du pourcentage de remplissage avec calibration
  float fillLevel = ((EMPTY_DISTANCE - distance) / (EMPTY_DISTANCE - FULL_DISTANCE)) * 100.0;
  fillLevel = constrain(fillLevel, 0, 100);

  Serial.print("📊 Distances: ");
  Serial.print(d1); Serial.print(" cm, ");
  Serial.print(d2); Serial.print(" cm → ");
  Serial.print("Remplissage: ");
  Serial.print(fillLevel, 1);
  Serial.println("%");

  return fillLevel;
}

String getSignalQualityString(int rssi) {
  if (rssi >= -50) return "Excellent";
  else if (rssi >= -70) return "Bon";
  else if (rssi >= -85) return "Moyen";
  else return "Faible";
}

// ===== ENVOI DONNÉES =====
void sendDataToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi déconnecté!");
    WiFi.reconnect();
    return;
  }

  // Lecture des capteurs
  float fillLevel = getFillLevel();
  float temperature = readTemperature();
  float humidity = readHumidity();
  float battery = 100;       

  int currentVolume = (int)((fillLevel / 100.0) * CAPACITY);
  int signalRssi = WiFi.RSSI();
  String signalQuality = getSignalQualityString(signalRssi);

  String status = "normal";
  String statusIcon = "🟢";
  if (fillLevel >= 95) { status = "critical"; statusIcon = "🔴"; }
  else if (fillLevel >= 80) { status = "attention"; statusIcon = "🟡"; }

  bool hasChanged = (abs(fillLevel - lastFillLevel) > 1.0);

  if (hasChanged) {
    Serial.println("\n📤 ENVOI DONNÉES");
    Serial.print(statusIcon);
    Serial.print(" Statut: ");
    Serial.println(status);
    Serial.print("📊 Remplissage: ");
    Serial.print(fillLevel, 1);
    Serial.println("%");
    lastFillLevel = fillLevel;
  }

  // Affichage des données DHT22
  Serial.print("🌡️  Température: ");
  Serial.print(temperature, 1);
  Serial.println("°C");
  Serial.print("💧 Humidité: ");
  Serial.print(humidity, 1);
  Serial.println("%");

  // Création du JSON
  StaticJsonDocument<512> doc;
  doc["bin_id"] = BIN_ID;
  doc["location"] = LOCATION;
  doc["address"] = ADDRESS;
  doc["fill_level"] = fillLevel;
  doc["capacity"] = CAPACITY;
  doc["current_volume"] = currentVolume;
  doc["battery"] = battery;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;  // Ajout de l'humidité
  doc["signal_quality"] = signalQuality;
  doc["latitude"] = LATITUDE;
  doc["longitude"] = LONGITUDE;
  doc["status"] = status;

  String jsonString;
  serializeJson(doc, jsonString);

  // Envoi HTTP
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  int httpResponseCode = http.POST(jsonString);
  if (httpResponseCode == 200) {
    Serial.println("✅ Données envoyées!");
    Serial.println("─────────────────────────────────────");
  } else {
    Serial.print("❌ HTTP: ");
    Serial.println(httpResponseCode);
  }
  http.end();
}

void loop() {
  unsigned long currentMillis = millis();
  if (currentMillis - lastUpdate >= UPDATE_INTERVAL) {
    lastUpdate = currentMillis;
    sendDataToServer();
  }
  delay(50);
}
