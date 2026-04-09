
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== CONFIGURATION À MODIFIER =====
const char* ssid = "F";
const char* password = "00000000@1";
const char* serverUrl = "http://192.168.12.1:8000/api/bin/update"; // Remplacer X par l'IP du serveur

// Configuration Poubelle
const String BIN_ID = "BIN-047";
const String LOCATION = "Avenue de l'Indépendance";
const String ADDRESS = "Avenue de l'Indépendance, Isotry, Fianarantsoa";
const int CAPACITY = 240; // Litres
const float LATITUDE = -21.4531;
const float LONGITUDE = 47.0856;

// Pins GPIO (Adapter selon votre branchement)
const int TRIGGER_PIN = 23;  // Pin D23 (GPIO23) du ESP32
const int ECHO_PIN = 22;     // Pin D22 (GPIO22) du ESP32
const int BATTERY_PIN = A0;  // Pin A0 pour la batterie
const int POTENTIOMETER_PIN_1 = 34;  // Pin A34 pour le potentiomètre n°1 (Ultrasonic)
const int POTENTIOMETER_PIN_2 = 35;  // Pin A35 pour le potentiomètre n°2 (Tension)

// Timing
unsigned long lastUpdate = 0;
const unsigned long UPDATE_INTERVAL = 10000; // 10 secondes pour les tests

void setup() {
  // Initialiser la communication série
  Serial.begin(115200);
  delay(1000);
  
  // Set ADC attenuation to 11 dB (up to ~3.3V input)
  analogSetAttenuation(ADC_11db);
  
  Serial.println("\n\n========================================");
  Serial.println("      SmartWaste ESP32 - STARTUP");
  Serial.println("========================================");
  
  // Initialiser les pins
  pinMode(TRIGGER_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BATTERY_PIN, INPUT);
  pinMode(POTENTIOMETER_PIN_1, INPUT);
  pinMode(POTENTIOMETER_PIN_2, INPUT);
  
  Serial.println("✓ Pins GPIO configurés");
  Serial.print("  - TRIGGER_PIN: ");
  Serial.println(TRIGGER_PIN);
  Serial.print("  - ECHO_PIN: ");
  Serial.println(ECHO_PIN);
  Serial.print("  - BATTERY_PIN: ");
  Serial.println(BATTERY_PIN);
  Serial.print("  - POTENTIOMETER_PIN_1 (Ultrasonic): ");
  Serial.println(POTENTIOMETER_PIN_1);
  Serial.print("  - POTENTIOMETER_PIN_2 (Tension): ");
  Serial.println(POTENTIOMETER_PIN_2);
  
  // Connecter au WiFi
  Serial.println("\nConnexion WiFi en cours...");
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
    Serial.println("\n✓ WiFi connecté!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n✗ Impossible de se connecter au WiFi");
    Serial.println("Assurez-vous que SSID et PASSWORD sont corrects");
  }
  
  Serial.println("\n✓ Setup terminé - Prêt à envoyer des données\n");
}

// ===== FONCTIONS DE LECTURE DES CAPTEURS =====

float floatMap(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

float readPotentiometer1UltrasonicCalibration() {
  // Lire le potentiomètre n°1 pour calibrage ultrasonic
  int analogValue = analogRead(POTENTIOMETER_PIN_1);
  // Rescale to potentiometer's voltage (from 0V to 3.3V):
  float voltage = floatMap(analogValue, 0, 4095, 0, 3.3);
  
  Serial.print("Potentiomètre n°1 (Ultrasonic) - Analog: ");
  Serial.print(analogValue);
  Serial.print(", Voltage: ");
  Serial.print(voltage);
  Serial.println("V");
  
  return voltage;
}

float readPotentiometer2TensionCalibration() {
  // Lire le potentiomètre n°2 pour calibrage tension
  int analogValue = analogRead(POTENTIOMETER_PIN_2);
  // Rescale to potentiometer's voltage (from 0V to 3.3V):
  float voltage = floatMap(analogValue, 0, 4095, 0, 3.3);
  
  Serial.print("Potentiomètre n°2 (Tension) - Analog: ");
  Serial.print(analogValue);
  Serial.print(", Voltage: ");
  Serial.print(voltage);
  Serial.println("V");
  
  return voltage;
}

float measureDistance() {
  // Envoyer une impulsion ultrasonique
  digitalWrite(TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER_PIN, LOW);
  
  // Lire la durée de l'écho
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  
  // Convertir en centimètres: distance = (duration * speed) / 2
  // speed = 0.034 cm/µs
  float distance = duration * 0.034 / 2;
  
  // Lire le potentiomètre n°1 pour adapter la distance via calibrage
  float potentiometer1Voltage = readPotentiometer1UltrasonicCalibration();
  
  // Adapter la distance en fonction du potentiomètre (0-3.3V permet d'ajuster la mesure)
  // Par exemple: multiplier la distance par un facteur basé sur le potentiomètre
  float calibrationFactor = floatMap(potentiometer1Voltage, 0, 3.3, 0.8, 1.2); // 0.8x à 1.2x
  distance = distance * calibrationFactor;
  
  Serial.print("Distance mesurée (brute): ");
  Serial.print(duration * 0.034 / 2);
  Serial.print(" cm, Facteur calibrage Pot1: ");
  Serial.print(calibrationFactor);
  Serial.print(", Distance ajustée: ");
  Serial.print(distance);
  Serial.println(" cm");
  
  return distance;
}

float calculateFillLevel(float distance) {
  // Calibrage: 50 cm = 0%, 10 cm = 100%
  // À AJUSTER selon votre poubelle physique
  float maxDistance = 50.0;  // Distance quand la poubelle est vide
  float minDistance = 10.0;  // Distance quand la poubelle est pleine
  
  if (distance > maxDistance) return 0.0;
  if (distance < minDistance) return 100.0;
  
  float fillLevel = ((maxDistance - distance) / (maxDistance - minDistance)) * 100;
  return fillLevel;
}

float readTemperature() {
  // IMPORTANT: À implémenter avec votre capteur réel
  // Exemple avec DHT22:
  // float temp = dht.readTemperature();
  // return (isnan(temp)) ? 25.0 : temp;
  
  // POUR LES TESTS: générateur de nombres aléatoires
  float baseTemp = 25.0;
  float variation = random(-20, 20) * 0.5;  // ±5°C
  return baseTemp + variation;
}

float readBatteryLevel() {
  // Lire la valeur analogique du pin de batterie
  int rawValue = analogRead(BATTERY_PIN);
  
  // Lire le potentiomètre n°2 pour adapter la tension
  float potentiometer2Voltage = readPotentiometer2TensionCalibration();
  
  // Convertir en tension via floatMap (supposant 3.3V = 4095)
  float voltage = floatMap(rawValue, 0, 4095, 0, 3.3);
  
  // Adapter la tension en fonction du potentiomètre n°2
  // Le potentiomètre permet d'ajuster dynamiquement le calibrage
  float adjustedVoltage = floatMap(potentiometer2Voltage, 0, 3.3, voltage * 0.9, voltage * 1.1);
  
  // Convertir en pourcentage (4.2V = 100%, 3.0V = 0%)
  float percentage = floatMap(adjustedVoltage, 3.0, 4.2, 0, 100);
  percentage = constrain(percentage, 0, 100);
  
  Serial.print("Batterie - Raw: ");
  Serial.print(rawValue);
  Serial.print(", Voltage: ");
  Serial.print(voltage);
  Serial.print("V, Adjusted via Pot2: ");
  Serial.print(adjustedVoltage);
  Serial.print("V, Percentage: ");
  Serial.print(percentage);
  Serial.println("%");
  
  return percentage;
}

int getSignalQuality() {
  return WiFi.RSSI();  // Retourner la valeur brute en dBm
}

String getSignalQualityString(int rssi) {
  if (rssi >= -50) {
    return "Excellent (" + String(-rssi) + " dBm)";
  } else if (rssi >= -70) {
    return "Bon (" + String(-rssi) + " dBm)";
  } else if (rssi >= -85) {
    return "Moyen (" + String(-rssi) + " dBm)";
  } else {
    return "Faible (" + String(-rssi) + " dBm)";
  }
}

// ===== FONCTION PRINCIPALE D'ENVOI =====

void sendDataToServer() {
  Serial.println("\n========================================");
  Serial.println("  LECTURE ET ENVOI DES DONNÉES");
  Serial.println("========================================");
  
  // Vérifier la connexion WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ WiFi déconnecté!");
    return;
  }
  
  Serial.println("✓ WiFi connecté");
  
  // Lire les capteurs
  float distance = measureDistance();
  float fillLevel = calculateFillLevel(distance);
  int currentVolume = (int)((fillLevel / 100.0) * CAPACITY);
  float temperature = readTemperature();
  float battery = readBatteryLevel();
  int signalRssi = getSignalQuality();
  String signalQuality = getSignalQualityString(signalRssi);
  
  // Déterminer le statut
  String status = "normal";
  if (fillLevel >= 95) {
    status = "critical";
  } else if (fillLevel >= 80) {
    status = "attention";
  }
  
  // Afficher un résumé
  Serial.println("\n--- DONNÉES COLLECTÉES ---");
  Serial.print("Bin ID: ");
  Serial.println(BIN_ID);
  Serial.print("Remplissage: ");
  Serial.print(fillLevel);
  Serial.println("%");
  Serial.print("Volume: ");
  Serial.print(currentVolume);
  Serial.print("/");
  Serial.print(CAPACITY);
  Serial.println(" L");
  Serial.print("Température: ");
  Serial.print(temperature);
  Serial.println("°C");
  Serial.print("Signal WiFi: ");
  Serial.println(signalQuality);
  Serial.print("Statut: ");
  Serial.println(status);
  
  // Créer le JSON
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
  
  // Afficher le JSON pour le débogage
  Serial.println("\n--- JSON À ENVOYER ---");
  Serial.println(jsonString);
  
  // Envoyer via HTTP POST
  Serial.println("\n--- ENVOI HTTP ---");
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  Serial.print("URL: ");
  Serial.println(serverUrl);
  Serial.println("POST en cours...");
  
  int httpResponseCode = http.POST(jsonString);
  
  Serial.print("HTTP Response Code: ");
  Serial.println(httpResponseCode);
  
  if (httpResponseCode == 200) {
    Serial.println("✓ Données envoyées avec succès!");
  } else if (httpResponseCode > 0) {
    Serial.println("✗ Erreur HTTP: " + String(httpResponseCode));
    String response = http.getString();
    Serial.println("Réponse: " + response);
  } else {
    Serial.println("✗ Erreur de connexion");
  }
  
  http.end();
  Serial.println("========================================\n");
}

// ===== LOOP PRINCIPAL =====

void loop() {
  unsigned long currentMillis = millis();
  
  // Envoyer les données tous les UPDATE_INTERVAL millisecondes
  if (currentMillis - lastUpdate >= UPDATE_INTERVAL) {
    lastUpdate = currentMillis;
    sendDataToServer();
  }
  
  delay(100);
}