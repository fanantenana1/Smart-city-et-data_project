# 🚀 SmartWaste ETL Pipeline - Guide Rapide d'Utilisation

## 📋 Vue d'ensemble

Ce pipeline ETL automatise la gestion complète des données SmartWaste :

```
JSON/CSV Brut → Extraction → Transformation → Enrichissement → Validation → Excel
```

---

## 🔧 Installation

### Prérequis

```bash
Python 3.8+
pip install pandas openpyxl numpy
```

### Installer les dépendances

```bash
cd /path/to/FastApi
pip install -r requirements.txt
```

---

## ▶️ Exécution Rapide

### Option 1 : Exécuter le Pipeline Complet

```bash
python pipeline_etl_smartwaste.py
```

**Sortie :**
- ✅ `RAPPORT_SMARTWASTE_COMPLET.xlsx` - Fichier multi-onglets
- ✅ `RAPPORT_SMARTWASTE.txt` - Rapport textuel
- ✅ `raw_bins_data.json` - Données brutes JSON
- ✅ `raw_personnel.csv` - Données brutes CSV

### Option 2 : Utiliser dans votre code

```python
from pipeline_etl_smartwaste import (
    extract_from_json,
    transform_data,
    enrich_data,
    validate_quality,
    create_excel_report
)

# Charger vos propres données
df_bins = extract_from_json('votre_fichier.json')

# Transformer
df_bins = transform_data(df_bins)

# Enrichir
df_bins = enrich_data(df_bins)

# Valider
quality = validate_quality(df_bins)

# Exporter
create_excel_report(df_bins, df_personnel, 'mon_rapport.xlsx')
```

---

## 📊 Structure du Fichier Excel Généré

### 🗂️ Onglet 1 : POUBELLES

| ID Poubelle | Localisation | Latitude | Longitude | Capacité | Statut | Remplissage | Batterie | Urgence |
|---|---|---|---|---|---|---|---|---|
| BIN_001 | Rue Principale | -21.454 | 47.533 | 240 | NORMAL | 65% | 85% | NORMAL |
| BIN_002 | Marché Central | -21.450 | 47.540 | 240 | ATTENTION | 78% | 45% | PRIORITAIRE |
| BIN_003 | Quartier Sud | -21.460 | 47.520 | 120 | CRITIQUE | 95% | 20% | **URGENT** |

**Colonnes disponibles :**
- `ID Poubelle` - Identifiant unique
- `Localisation` - Adresse
- `Latitude / Longitude` - Coordonnées GPS
- `Capacité` - Volume total en litres
- `Statut` - Normal/Attention/Critique (calculé)
- `Remplissage (%)` - Niveau actuel
- `Batterie (%)` - État batterie capteur
- `Température/Humidité` - Conditions environnementales
- `Urgence` - NORMAL/PRIORITAIRE/URGENT
- `Jours sans collecte` - Nombre de jours depuis dernière collecte
- `Score Capteur` - Santé globale du capteur (0-100)

**Codage couleur :**
- 🟢 Vert = NORMAL
- 🟠 Orange = PRIORITAIRE
- 🔴 Rouge = URGENT

---

### 👥 Onglet 2 : PERSONNEL

| ID | Prénom | Nom | Téléphone | Email | Zone | Poubelles | Collectes | Performance |
|---|---|---|---|---|---|---|---|---|
| USER_001 | Jean | Dupont | +261341234567 | jean@... | Zone_Nord | 3 | 234 | **95%** |
| USER_002 | Marie | Martin | +261342345678 | marie@... | Zone_Centre | 2 | 156 | **78%** |
| USER_003 | Paul | Bernard | +261343456789 | paul@... | Zone_Sud | 3 | 198 | **88%** |

**Colonnes disponibles :**
- `ID` - Identifiant agent
- `Prénom / Nom` - Identité
- `Téléphone / Email` - Contact
- `CIN` - Numéro d'identité
- `Véhicule` - Type de véhicule assigné
- `Zone Assignée` - Zone de couverture
- `Poubelles` - Nombre assigné
- `Collectes` - Total opérations
- `Moy/Poubelle` - Moyenne par poubelle
- `Performance (%)` - Score de performance
- `Statut` - Actif/Semi-actif/Inactif

**Codage couleur Performance :**
- 🟢 ≥ 80% = Excellent
- 🟡 50-79% = Bon
- 🔴 < 50% = Insuffisant

---

### 📈 Onglet 3 : STATISTIQUES

**Indicateurs clés :**

| Section | Métrique | Valeur | Unité |
|---|---|---|---|
| **RÉSUMÉ** | Total poubelles | 12 | unités |
| | Poubelles normales | 7 | unités |
| | Poubelles critiques | 1 | unités |
| | Remplissage moyen | 68.3 | % |
| **PERSONNEL** | Total agents | 4 | personnes |
| | Actifs | 3 | personnes |
| | Total collectes | 678 | opérations |
| **CAPTEURS** | Batterie moyenne | 62.5 | % |
| | Température moyenne | 30.2 | °C |
| | Humidité moyenne | 68.5 | % |

---

## 🔄 Processus ETL Détaillé

### 1️⃣ EXTRACTION

Lit les données brutes depuis :
- **JSON** : Structure hiérarchique (sensors, assignment, collection)
- **CSV** : Format tabulaire plat
- **Parquet** : Format colonnaire optimisé

```python
df = extract_from_json('raw_bins_data.json')
# Résultat : DataFrame pandas avec toutes les colonnes plates
```

### 2️⃣ TRANSFORMATION

Nettoie et standardise les données :

```
✓ Conversion de types (string → number, null → 0)
✓ Validation de plage (0-100% pour fill_level, battery)
✓ Standardisation de format (MAJUSCULES pour zones, Title Case pour locations)
✓ Suppression des doublons
✓ Traitement des valeurs nulles
```

### 3️⃣ ENRICHISSEMENT

Ajoute des champs calculés :

```
✓ Statut basé sur remplissage (Normal/Attention/Critique)
✓ Jours depuis dernière collecte
✓ Niveau d'urgence (Urgent/Prioritaire/Normal)
✓ Score de santé du capteur
✓ Catégorie de température (Froid/Modéré/Chaud)
✓ Densité estimée (volume / capacité)
✓ Timestamp d'extraction
```

### 4️⃣ VALIDATION

Vérifie la qualité des données :

```
✓ Présence des colonnes essentielles
✓ Plages de valeurs valides
✓ Coordonnées GPS valides (-90 à 90 latitude, -180 à 180 longitude)
✓ Génératio d'un rapport de qualité (score %)
```

### 5️⃣ CHARGEMENT (LOAD)

Exporte vers :
- **Excel** (.xlsx) - Multi-onglets avec formatage
- **Texte** (.txt) - Rapport lisible

---

## 📂 Structure des Données d'Entrée

### Format JSON

```json
{
  "bins": [
    {
      "bin_id": "BIN_001",
      "location": "Adresse",
      "latitude": -21.454,
      "longitude": 47.533,
      "capacity": 240,
      "status": "normal",
      "sensors": {
        "fill_level": 65,
        "temperature": 28.5,
        "humidity": 72,
        "battery": 85,
        "signal_strength": -65
      },
      "last_collection": {
        "timestamp": "2026-04-15T10:00:00Z",
        "operator_id": "OP_001",
        "volume_collected": 150
      },
      "assignment": {
        "zone": "Zone_Nord",
        "responsible_id": "USER_001",
        "assignment_date": "2026-01-01"
      }
    }
  ]
}
```

### Format CSV

```csv
bin_id,location,latitude,longitude,capacity,status,fill_level,battery,...
BIN_001,Rue Principale,-21.454,47.533,240,normal,65,85,...
BIN_002,Marché Central,-21.450,47.540,240,attention,78,45,...
```

### Format CSV Personnel

```csv
user_id,first_name,last_name,phone,email,cin,vehicle_type,zone_assigned,assigned_bins,total_collections,last_collection_date
USER_001,Jean,Dupont,+261341234567,jean@mail.mg,123456789,Camion,Zone_Nord,"BIN_001,BIN_004",234,2026-04-15
```

---

## 🎯 Cas d'Utilisation

### 📊 Visualisation et Graphiques

```python
import matplotlib.pyplot as plt
import pandas as pd

# Charger l'Excel
excel_file = pd.ExcelFile('RAPPORT_SMARTWASTE_COMPLET.xlsx')
df = pd.read_excel(excel_file, 'Poubelles')

# Graphique remplissage
plt.hist(df['Remplissage (%)'], bins=10)
plt.title('Distribution Remplissage Poubelles')
plt.xlabel('Remplissage (%)')
plt.ylabel('Nombre')
plt.show()

# Pie chart statut
df['Statut'].value_counts().plot.pie(autopct='%1.1f%%')
plt.title('Répartition par Statut')
plt.show()
```

### 📈 Export pour BI Tools

Le fichier Excel peut être importé dans :
- Excel (natif)
- Power BI
- Tableau
- Google Data Studio
- Looker
- Apache Superset

### 💾 Export vers Base de Données

```python
import sqlite3

conn = sqlite3.connect('smartwaste.db')

df_bins.to_sql('bins', conn, if_exists='replace', index=False)
df_personnel.to_sql('personnel', conn, if_exists='replace', index=False)

conn.close()
```

---

## 🔍 Dépannage

### Problème : "ModuleNotFoundError: No module named 'pandas'"

**Solution :**
```bash
pip install pandas openpyxl numpy
```

### Problème : Fichier Excel corrompu

**Vérifier :**
- Les noms de colonnes ne contiennent pas de caractères spéciaux
- Les données ne contiennent pas de valeurs NaN infinies

### Problème : Encodage UTF-8 incorrect

**Solution :**
```python
df = pd.read_csv('file.csv', encoding='utf-8')
# ou
df = pd.read_csv('file.csv', encoding='latin-1')
```

---

## 📊 Métriques Clés Calculées

| Métrique | Formule | Utilité |
|---|---|---|
| **Urgence** | fill_level ≥ 90 OU days_since > 7 | Identifier priorités |
| **Performance** | (collectes / bins) × 100 | Évaluer agents |
| **Score Capteur** | (100-fill) × 0.3 + battery × 0.4 + signal × 0.3 | Santé globale |
| **Opérationnalité** | (active_bins / total_bins) × 100 | Taux de fonctionnement |

---

## 📝 Format de Sortie Finale

Après exécution complète :

```
📁 Dossier de sortie
├── RAPPORT_SMARTWASTE_COMPLET.xlsx ← Excel multi-onglets
│   ├── Onglet 1 : Poubelles (15 colonnes)
│   ├── Onglet 2 : Personnel (13 colonnes)
│   └── Onglet 3 : Statistiques (KPIs)
├── RAPPORT_SMARTWASTE.txt ← Rapport texte lisible
├── raw_bins_data.json ← Source JSON
└── raw_personnel.csv ← Source CSV
```

---

## 🚀 Prochaines Étapes

1. ✅ Exécuter le pipeline
2. ✅ Vérifier la qualité des données
3. ✅ Importer dans votre BI tool
4. ✅ Créer des dashboards
5. ✅ Automatiser via cron/scheduler

```bash
# Exemple : Exécuter quotidiennement à 2h du matin
0 2 * * * cd /path/to/FastApi && python pipeline_etl_smartwaste.py
```

---

## 📞 Support

Pour toute question ou problème :

1. Consulter le guide complet : `GUIDE_ETL_SMARTWASTE.md`
2. Vérifier les logs du pipeline
3. Valider le format des données source

---

**Version:** 1.0  
**Date:** 15 avril 2026  
**SmartWaste Team** 🌍
