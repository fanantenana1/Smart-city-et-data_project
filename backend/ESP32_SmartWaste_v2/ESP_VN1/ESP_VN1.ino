#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== CONFIGURATION À MODIFIER =====
const char* ssid = "F";
const char* password = "00000000@1";
const char* serverUrl = "http://10.110.65.194:8000/api/bin/update";

// ===== CHOISIR LA POUBELLE (Décommenter UNE SEULE ligne) =====
// #define USE_PBL_1    // ESP32 #1 → PBL-1 (Avenue de l'Indépendance)
// #define USE_PBL_2    // ESP32 #2 → PBL-2 (Quartier Ankadifotsy)
// #define USE_PBL_3    // ESP32 #3 → PBL-3 (Rue Rainandriamampandry)
// #define USE_PBL_4    // ESP32 #4 → PBL-4 (Gare Routière)
#define USE_PBL_5    // ESP32 #5 → PBL-5 (Marché Zoma)

// ===== CONFIGURATION AUTOMATIQUE DES POUBELLES =====
#ifdef USE_PBL_1
  const String BIN_ID = "PBL-1";
  const String LOCATION = "Zoma Fianarantsoa";
  const String ADDRESS = "Zoma, Fianarantsoa";
  const int CAPACITY = 240;
  const float LATITUDE = -21.455213;
  const float LONGITUDE = 47.084115;
#endif

#ifdef USE_PBL_2
  const String BIN_ID = "PBL-2";
  const String LOCATION = "Quartier Ankadifotsy";
  const String ADDRESS = "Quartier Ankadifotsy, Fianarantsoa";
  const int CAPACITY = 240;
  const float LATITUDE = -21.4485;
  const float LONGITUDE = 47.0890;
#endif

#ifdef USE_PBL_3
  const String BIN_ID = "PBL-3";
  const String LOCATION = "Rue Rainandriamampandry";
  const String ADDRESS = "Rue Rainandriamampandry, Fianarantsoa";
  const int CAPACITY = 240;
  const float LATITUDE = -21.4560;
  const float LONGITUDE = 47.0875;
#endif

#ifdef USE_PBL_4
  const String BIN_ID = "PBL-4";
  const String LOCATION = "Gare Routière";
  const String ADDRESS = "Gare Routière centrale, Fianarantsoa";
  const int CAPACITY = 240;
  const float LATITUDE = -21.4520;
  const float LONGITUDE = 47.0845;
#endif

#ifdef USE_PBL_5
  const String BIN_ID = "PBL-5";
  const String LOCATION = "Akazondrano Fianarantsoa";
  const String ADDRESS = "Rue Akazondrano Fianarantsoa";
  const int CAPACITY = 240;
  const float LATITUDE = -21.451877;
  const float LONGITUDE = 47.090951;
#endif

// ===== PINS GPIO - POTENTIOMÈTRES =====
const int POT_FILL_LEVEL = 34;   // GPIO34 - Remplissage (0-100%)
const int POT_BATTERY = 35;      // GPIO35 - Batterie (0-100%)
const int POT_TEMPERATURE = 32;  // GPIO32 - Température (10-50°C)

// Timing
unsigned long lastUpdate = 0;
const unsigned long UPDATE_INTERVAL = 3000; // 3 secondes

// Historique pour détecter les changements
float lastFillLevel = 0;
float lastBattery = 0;
float lastTemperature = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  analogSetAttenuation(ADC_11db);
  analogReadResolution(12);
  
  Serial.println("\n\n========================================");
  Serial.println("   SmartWaste ESP32 - MULTI POUBELLES");
  Serial.println("========================================");
  Serial.print("🗑️  Poubelle: ");
  Serial.println(BIN_ID);
  Serial.print("📍 Localisation: ");
  Serial.println(LOCATION);
  Serial.println("========================================");
  
  pinMode(POT_FILL_LEVEL, INPUT);
  pinMode(POT_BATTERY, INPUT);
  pinMode(POT_TEMPERATURE, INPUT);
  
  Serial.println("\n✓ Pins GPIO configurés:");
  Serial.println("  - GPIO34: Remplissage 📊");
  Serial.println("  - GPIO35: Batterie 🔋");
  Serial.println("  - GPIO32: Température 🌡️");
  
  // Connexion WiFi
  Serial.println("\n📡 Connexion WiFi...");
  Serial.print("SSID: ");
  Serial.println(ssid);
  
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
    Serial.print("Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n❌ WiFi non connecté!");
  }
  
  Serial.println("\n✓ Setup terminé - Prêt!");
  Serial.println("📊 Tournez les potentiomètres\n");
}

// ===== FONCTIONS DE LECTURE =====

float floatMap(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

float readFillLevelFromPot() {
  int analogValue = analogRead(POT_FILL_LEVEL);
  float fillLevel = floatMap(analogValue, 0, 4095, 0, 100);
  fillLevel = constrain(fillLevel, 0, 100);
  
  Serial.print("📊 Remplissage: ");
  Serial.print(analogValue);
  Serial.print(" → ");
  Serial.print(fillLevel, 1);
  Serial.println("%");
  
  return fillLevel;
}

float readBatteryFromPot() {
  int analogValue = analogRead(POT_BATTERY);
  float battery = floatMap(analogValue, 0, 4095, 0, 100);
  battery = constrain(battery, 0, 100);
  
  Serial.print("🔋 Batterie: ");
  Serial.print(analogValue);
  Serial.print(" → ");
  Serial.print(battery, 1);
  Serial.println("%");
  
  return battery;
}

float readTemperatureFromPot() {
  int analogValue = analogRead(POT_TEMPERATURE);
  float temperature = floatMap(analogValue, 0, 4095, 10, 50);
  temperature = constrain(temperature, 10, 50);
  
  Serial.print("🌡️  Température: ");
  Serial.print(analogValue);
  Serial.print(" → ");
  Serial.print(temperature, 1);
  Serial.println("°C");
  
  return temperature;
}

String getSignalQualityString(int rssi) {
  if (rssi >= -50) return "Excellent";
  else if (rssi >= -70) return "Bon";
  else if (rssi >= -85) return "Moyen";
  else return "Faible";
}

// ===== ENVOI DES DONNÉES =====

void sendDataToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi déconnecté!");
    WiFi.reconnect();
    return;
  }
  
  // Lire les potentiomètres
  float fillLevel = readFillLevelFromPot();
  float battery = readBatteryFromPot();
  float temperature = readTemperatureFromPot();
  
  int currentVolume = (int)((fillLevel / 100.0) * CAPACITY);
  int signalRssi = WiFi.RSSI();
  String signalQuality = getSignalQualityString(signalRssi);
  
  // Déterminer le statut
  String status = "normal";
  String statusIcon = "🟢";
  if (fillLevel >= 95) {
    status = "critical";
    statusIcon = "🔴";
  } else if (fillLevel >= 80) {
    status = "attention";
    statusIcon = "🟡";
  }
  
  // Détecter changements significatifs
  bool hasChanged = (abs(fillLevel - lastFillLevel) > 1.0) || 
                    (abs(battery - lastBattery) > 1.0) || 
                    (abs(temperature - lastTemperature) > 0.5);
  
  if (hasChanged) {
    Serial.println("\n========================================");
    Serial.println("  📤 ENVOI DONNÉES");
    Serial.println("========================================");
    Serial.print("🗑️  ID: ");
    Serial.println(BIN_ID);
    Serial.print(statusIcon);
    Serial.print(" Statut: ");
    Serial.println(status);
    Serial.print("📊 Remplissage: ");
    Serial.print(fillLevel, 1);
    Serial.print("% (");
    Serial.print(currentVolume);
    Serial.print("/");
    Serial.print(CAPACITY);
    Serial.println("L)");
    Serial.print("🔋 Batterie: ");
    Serial.print(battery, 1);
    Serial.println("%");
    Serial.print("🌡️  Température: ");
    Serial.print(temperature, 1);
    Serial.println("°C");
    
    lastFillLevel = fillLevel;
    lastBattery = battery;
    lastTemperature = temperature;
  }
  
  // Créer JSON
  StaticJsonDocument<512> doc;
  doc["bin_id"] = BIN_ID;
  doc["location"] = LOCATION;
  doc["address"] = ADDRESS;
  doc["fill_level"] = fillLevel;
  doc["capacity"] = CAPACITY;
  doc["current_volume"] = currentVolume;
  doc["battery"] = battery;
  doc["temperature"] = temperature;
  doc["signal_quality"] = signalQuality;
  doc["latitude"] = LATITUDE;
  doc["longitude"] = LONGITUDE;
  doc["status"] = status;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Envoyer HTTP POST
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode == 200) {
    if (hasChanged) {
      Serial.println("✅ Données envoyées!");
      
      if (fillLevel >= 95) {
        Serial.println("\n🚨🚨🚨 ALERTE CRITIQUE 🚨🚨🚨");
        Serial.print("📧 Email → Admin + Utilisateurs de ");
        Serial.println(BIN_ID);
        Serial.println("🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨\n");
      } else if (fillLevel >= 80) {
        Serial.println("\n⚠️  ALERTE ATTENTION");
        Serial.print("📧 Email → Utilisateurs de ");
        Serial.println(BIN_ID);
      }
      
      Serial.println("========================================\n");
    }
  } else if (httpResponseCode > 0) {
    Serial.print("❌ HTTP: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.println("❌ Connexion serveur");
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

/*
 * ═══════════════════════════════════════════════════════════
 *  GUIDE D'UTILISATION - 5 POUBELLES
 * ═══════════════════════════════════════════════════════════
 * 
 * ÉTAPE 1: Configuration pour chaque ESP32
 * -----------------------------------------
 * 
 * ESP32 #1 → PBL-1:
 *   1. Décommenter: #define USE_PBL_1
 *   2. Téléverser le code
 *   3. Brancher 3 potentiomètres (GPIO 34, 35, 32)
 * 
 * ESP32 #2 → PBL-2:
 *   1. Commenter USE_PBL_1, décommenter: #define USE_PBL_2
 *   2. Téléverser le code
 *   3. Brancher 3 potentiomètres (GPIO 34, 35, 32)
 * 
 * ESP32 #3 → PBL-3:
 *   1. Décommenter: #define USE_PBL_3
 *   2. Téléverser le code
 *   3. Brancher 3 potentiomètres
 * 
 * ESP32 #4 → PBL-4:
 *   1. Décommenter: #define USE_PBL_4
 *   2. Téléverser le code
 *   3. Brancher 3 potentiomètres
 * 
 * ESP32 #5 → PBL-5:
 *   1. Décommenter: #define USE_PBL_5
 *   2. Téléverser le code
 *   3. Brancher 3 potentiomètres
 * 
 * 
 * ÉTAPE 2: Branchement identique pour tous
 * -----------------------------------------
 * 
 * POT1 (Remplissage):
 *   Pin gauche  → GND
 *   Pin milieu  → GPIO 34
 *   Pin droite  → 3.3V
 * 
 * POT2 (Batterie):
 *   Pin gauche  → GND
 *   Pin milieu  → GPIO 35
 *   Pin droite  → 3.3V
 * 
 * POT3 (Température):
 *   Pin gauche  → GND
 *   Pin milieu  → GPIO 32
 *   Pin droite  → 3.3V
 * 
 * 
 * ÉTAPE 3: Test
 * -------------
 * 
 * 1. Démarrer backend: python start.py
 * 2. Démarrer frontend: npm start
 * 3. Connecter les 5 ESP32 en USB (un par un pour voir les logs)
 * 4. Tourner les potentiomètres
 * 5. Vérifier l'interface: les 5 poubelles se mettent à jour
 * 
 * 
 * EXEMPLE UTILISATION:
 * --------------------
 * 
 * Scénario: Simuler PBL-1 pleine et PBL-5 normale
 * 
 * Sur ESP32 #1 (PBL-1):
 *   - Tourner POT1 au MAX → 100% → CRITIQUE 🔴
 *   - Email envoyé aux utilisateurs assignés à PBL-1
 * 
 * Sur ESP32 #5 (PBL-5):
 *   - Tourner POT1 à 50% → 50% → NORMAL 🟢
 *   - Pas d'email
 * 
 * Interface affiche:
 *   - PBL-1: Rouge, 100%, alerte critique
 *   - PBL-2: État actuel MongoDB
 *   - PBL-3: État actuel MongoDB
 *   - PBL-4: État actuel MongoDB
 *   - PBL-5: Vert, 50%, normal
 * 
 * 
 * ASSIGNATION UTILISATEURS:
 * -------------------------
 * 
 * Dans l'interface admin:
 *   1. Aller à "Gestion des Utilisateurs"
 *   2. Cliquer sur chevron (▼) d'un utilisateur
 *   3. Assigner PBL-1, PBL-2, etc.
 *   4. L'utilisateur recevra les emails pour ces poubelles
 * 
 * ═══════════════════════════════════════════════════════════
 */