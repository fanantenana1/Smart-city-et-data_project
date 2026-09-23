# Guide Complet ETL SmartWaste - Gestion des Données

## 🎯 Vue d'ensemble

Ce guide explique la chaîne de traitement complète des données SmartWaste :

```
Données Brutes (JSON, CSV, Parquet)
         ↓
    EXTRACTION
         ↓
   TRANSFORMATION
         ↓
   ENRICHISSEMENT
         ↓
    VALIDATION
         ↓
Fichier Excel Multi-onglets
         ↓
Visualisation & Rapports
```

---

## 📦 Partie 1 : Formats de Données Brutes Avant ETL

### 1.1 Format JSON (Structure en arborescence)

**Fichier:** `raw_bins_data.json`

```json
{
  "bins": [
    {
      "bin_id": "BIN_001",
      "location": "Rue Principale, Fianarantsoa",
      "latitude": -21.4545,
      "longitude": 47.5333,
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
        "timestamp": "2026-04-14T10:30:00Z",
        "operator_id": "OP_001",
        "volume_collected": 150,
        "notes": "Collecte normale"
      },
      "assignment": {
        "zone": "Zone_Nord",
        "responsible_id": "USER_001",
        "assignment_date": "2026-01-01"
      }
    },
    {
      "bin_id": "BIN_002",
      "location": "Marché Central",
      "latitude": -21.45,
      "longitude": 47.54,
      "capacity": 240,
      "status": "attention",
      "sensors": {
        "fill_level": 78,
        "temperature": 31.2,
        "humidity": 68,
        "battery": 45,
        "signal_strength": -72
      },
      "last_collection": null,
      "assignment": {
        "zone": "Zone_Centre",
        "responsible_id": "USER_002",
        "assignment_date": "2026-01-05"
      }
    }
  ],
  "extraction_timestamp": "2026-04-15T08:00:00Z",
  "metadata": {
    "total_bins": 2,
    "last_sync": "2026-04-15T08:00:00Z"
  }
}
```

**Caractéristiques JSON :**
- ✅ Hiérarchie imbriquée (sensors, last_collection, assignment)
- ✅ Types mixtes (numbers, strings, objects, null)
- ✅ Flexible et extensible
- ❌ Redondance possible
- ❌ Volumineux en taille

---

### 1.2 Format CSV (Structure plate)

**Fichier:** `raw_bins_data.csv`

```csv
bin_id,location,latitude,longitude,capacity,status,fill_level,temperature,humidity,battery,signal_strength,last_collection_timestamp,operator_id,volume_collected,zone,responsible_id,assignment_date
BIN_001,Rue Principale Fianarantsoa,-21.4545,47.5333,240,normal,65,28.5,72,85,-65,2026-04-14T10:30:00Z,OP_001,150,Zone_Nord,USER_001,2026-01-01
BIN_002,Marché Central,-21.45,47.54,240,attention,78,31.2,68,45,-72,,,,Zone_Centre,USER_002,2026-01-05
BIN_003,Quartier Sud,-21.46,47.52,120,critical,95,33.1,65,20,-78,2026-04-15T06:45:00Z,OP_002,100,Zone_Sud,USER_003,2026-01-10
```

**Caractéristiques CSV :**
- ✅ Format simple et universel
- ✅ Léger et rapide
- ✅ Lisible en texte brut
- ❌ Données nulles difficiles à gérer
- ❌ Pas de structure hiérarchique

---

### 1.3 Format Parquet (Format colonnaire)

**Fichier:** `raw_bins_data.parquet`

Le format Parquet stocke les données de manière colonnaire (optimisé pour l'analytique) :

```
Structure binaire optimisée:
┌─────────────────────────────────────┐
│ Métadonnées du Parquet              │
├─────────────────────────────────────┤
│ Colonnes (compressées):             │
│  - bin_id [BIN_001, BIN_002, ...]   │
│  - location [Rue Principale, ...]   │
│  - fill_level [65, 78, 95, ...]     │
│  - battery [85, 45, 20, ...]        │
│  ... (autres colonnes)              │
└─────────────────────────────────────┘
```

**Caractéristiques Parquet :**
- ✅ Compression excellente
- ✅ Très rapide pour les requêtes analytiques
- ✅ Schéma fort avec types
- ❌ Moins lisible en texte
- ❌ Nécessite des outils spécialisés

---

## 🔄 Partie 2 : Processus ETL (Extract, Transform, Load)

### 2.1 EXTRACTION (Extract)

**Étape 1 : Lire les données brutes**

```python
import pandas as pd
import json
from pyarrow import parquet as pq

# Extraction depuis JSON
def extract_from_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    bins_list = []
    for bin_data in data['bins']:
        flat_bin = {
            'bin_id': bin_data['bin_id'],
            'location': bin_data['location'],
            'latitude': bin_data['latitude'],
            'longitude': bin_data['longitude'],
            'capacity': bin_data['capacity'],
            'status': bin_data['status'],
            'fill_level': bin_data['sensors']['fill_level'],
            'temperature': bin_data['sensors']['temperature'],
            'humidity': bin_data['sensors']['humidity'],
            'battery': bin_data['sensors']['battery'],
            'signal_strength': bin_data['sensors']['signal_strength'],
            'last_collection_timestamp': bin_data['last_collection']['timestamp'] if bin_data['last_collection'] else None,
            'volume_collected': bin_data['last_collection']['volume_collected'] if bin_data['last_collection'] else None,
            'operator_id': bin_data['last_collection']['operator_id'] if bin_data['last_collection'] else None,
            'zone': bin_data['assignment']['zone'],
            'responsible_id': bin_data['assignment']['responsible_id'],
            'assignment_date': bin_data['assignment']['assignment_date']
        }
        bins_list.append(flat_bin)
    
    return pd.DataFrame(bins_list)

# Extraction depuis CSV
def extract_from_csv(file_path):
    return pd.read_csv(file_path)

# Extraction depuis Parquet
def extract_from_parquet(file_path):
    return pd.read_parquet(file_path)

# Utilisation
df_bins = extract_from_json('raw_bins_data.json')
print(f"✓ Extraction: {len(df_bins)} poubelles chargées")
```

### 2.2 TRANSFORMATION (Transform)

**Étape 2 : Nettoyer et standardiser les données**

```python
def transform_data(df):
    df = df.copy()
    
    # 1. NETTOYAGE : Traiter les valeurs nulles
    df['last_collection_timestamp'] = pd.to_datetime(df['last_collection_timestamp'], errors='coerce')
    df['volume_collected'].fillna(0, inplace=True)
    df['operator_id'].fillna('UNASSIGNED', inplace=True)
    
    # 2. VALIDATION DE TYPES
    df['fill_level'] = pd.to_numeric(df['fill_level'], errors='coerce').fillna(0)
    df['battery'] = pd.to_numeric(df['battery'], errors='coerce').fillna(0)
    df['temperature'] = pd.to_numeric(df['temperature'], errors='coerce').fillna(0)
    df['humidity'] = pd.to_numeric(df['humidity'], errors='coerce').fillna(0)
    
    # 3. VALIDATION DE PLAGE
    # Vérifier que fill_level est entre 0-100%
    df.loc[df['fill_level'] < 0, 'fill_level'] = 0
    df.loc[df['fill_level'] > 100, 'fill_level'] = 100
    
    # Vérifier que battery est entre 0-100%
    df.loc[df['battery'] < 0, 'battery'] = 0
    df.loc[df['battery'] > 100, 'battery'] = 100
    
    # 4. STANDARDISATION DE FORMAT
    df['location'] = df['location'].str.strip().str.title()
    df['zone'] = df['zone'].str.upper()
    df['status'] = df['status'].str.lower()
    
    # 5. SUPPRESSION DE DOUBLONS
    df = df.drop_duplicates(subset=['bin_id'], keep='first')
    
    print(f"✓ Transformation: {len(df)} enregistrements valides")
    
    return df

df_transformed = transform_data(df_bins)
```

### 2.3 ENRICHISSEMENT (Enrich)

**Étape 3 : Ajouter des champs calculés et contexte**

```python
from datetime import datetime, timedelta
import numpy as np

def enrich_data(df):
    df = df.copy()
    
    # 1. CHAMPS CALCULÉS - Statut basé sur le remplissage
    def get_status_from_fill(fill_level):
        if fill_level >= 90:
            return 'CRITIQUE'
        elif fill_level >= 70:
            return 'ATTENTION'
        else:
            return 'NORMAL'
    
    df['status_calculated'] = df['fill_level'].apply(get_status_from_fill)
    
    # 2. JOURS DEPUIS DERNIÈRE COLLECTE
    now = pd.Timestamp.now()
    df['days_since_collection'] = (now - df['last_collection_timestamp']).dt.days
    df['days_since_collection'].fillna(999, inplace=True)  # Jamais collecté
    
    # 3. URGENCE DE COLLECTE
    def get_urgency(fill_level, days_since):
        if fill_level >= 90 or days_since > 7:
            return 'URGENT'
        elif fill_level >= 70 or days_since > 3:
            return 'PRIORITAIRE'
        else:
            return 'NORMAL'
    
    df['urgency_level'] = df.apply(
        lambda row: get_urgency(row['fill_level'], row['days_since_collection']),
        axis=1
    )
    
    # 4. SCORE DE SANTÉ DU CAPTEUR
    # Basé sur : fill_level, battery, signal_strength
    df['sensor_health_score'] = (
        (100 - df['fill_level']) * 0.3 +  # Remplissage faible = meilleur
        df['battery'] * 0.4 +               # Batterie élevée = meilleur
        (df['signal_strength'] + 100) * 0.3  # Signal fort = meilleur
    ) / 100
    df['sensor_health_score'] = df['sensor_health_score'].clip(0, 100)
    
    # 5. CATÉGORIE DE TEMPÉRATURE
    def temp_category(temp):
        if temp < 20:
            return 'Froid'
        elif temp < 30:
            return 'Modéré'
        else:
            return 'Chaud'
    
    df['temperature_category'] = df['temperature'].apply(temp_category)
    
    # 6. DENSITÉ ESTIMÉE (volume collecté / capacity)
    df['density_estimate'] = (df['volume_collected'] / df['capacity'] * 100).round(1)
    df['density_estimate'].fillna(0, inplace=True)
    
    # 7. TIMESTAMP DE CRÉATION
    df['data_extracted_at'] = pd.Timestamp.now()
    
    print(f"✓ Enrichissement: {len(df)} enregistrements enrichis")
    
    return df

df_enriched = enrich_data(df_transformed)

# Afficher un exemple
print("\n📊 Exemple de données enrichies:")
print(df_enriched[['bin_id', 'fill_level', 'status_calculated', 'urgency_level', 'sensor_health_score']].head())
```

### 2.4 QUALITÉ DE DONNÉES (Data Quality)

**Étape 4 : Valider et rapporter la qualité**

```python
def validate_quality(df):
    report = {
        'total_records': len(df),
        'valid_records': 0,
        'issues': []
    }
    
    # Vérifier les colonnes essentielles
    required_cols = ['bin_id', 'location', 'fill_level', 'battery', 'latitude', 'longitude']
    missing_cols = [col for col in required_cols if col not in df.columns]
    
    if missing_cols:
        report['issues'].append(f"Colonnes manquantes: {missing_cols}")
    
    # Vérifier les valeurs nulles
    null_counts = df[required_cols].isnull().sum()
    for col, count in null_counts.items():
        if count > 0:
            report['issues'].append(f"Valeurs nulles dans '{col}': {count}")
    
    # Vérifier les plages de valeurs
    if (df['fill_level'] > 100).any() or (df['fill_level'] < 0).any():
        report['issues'].append("Fill_level hors plage 0-100")
    
    if (df['battery'] > 100).any() or (df['battery'] < 0).any():
        report['issues'].append("Battery hors plage 0-100")
    
    # Vérifier les coordonnées GPS valides
    invalid_gps = df[(df['latitude'] < -90) | (df['latitude'] > 90) | 
                      (df['longitude'] < -180) | (df['longitude'] > 180)]
    if len(invalid_gps) > 0:
        report['issues'].append(f"Coordonnées GPS invalides: {len(invalid_gps)}")
    
    report['valid_records'] = len(df) - len(invalid_gps)
    report['quality_score'] = (report['valid_records'] / report['total_records'] * 100) if report['total_records'] > 0 else 0
    
    print(f"\n✅ Rapport de qualité:")
    print(f"   - Enregistrements valides: {report['valid_records']}/{report['total_records']}")
    print(f"   - Score de qualité: {report['quality_score']:.1f}%")
    if report['issues']:
        print(f"   - Problèmes détectés:")
        for issue in report['issues']:
            print(f"     • {issue}")
    
    return report

quality_report = validate_quality(df_enriched)
```

---

## 📊 Partie 3 : Données du Personnel

### 3.1 Structurer les données du personnel

```python
# Personnel data brutes (CSV)
personnel_raw = """
user_id,first_name,last_name,phone,email,cin,vehicle_id,vehicle_type,zone_assigned,assigned_bins,total_collections,last_collection_date,status
USER_001,Jean,Dupont,+261341234567,jean.dupont@smartwaste.mg,123456789,VEH_001,Camion,Zone_Nord,"BIN_001,BIN_004,BIN_007",234,2026-04-15,Actif
USER_002,Marie,Martin,+261342345678,marie.martin@smartwaste.mg,987654321,VEH_002,Tricycle,Zone_Centre,"BIN_002,BIN_005",156,2026-04-14,Actif
USER_003,Paul,Bernard,+261343456789,paul.bernard@smartwaste.mg,555666777,VEH_003,Camion,Zone_Sud,"BIN_003,BIN_006,BIN_008",198,2026-04-15,Actif
USER_004,Sophie,Lefevre,+261344567890,sophie.lefevre@smartwaste.mg,111222333, ,Vélo,Zone_Nord,"BIN_001,BIN_009",89,2026-04-12,Semi-actif
"""

# Lire et traiter le personnel
from io import StringIO

df_personnel = pd.read_csv(StringIO(personnel_raw))

def enrich_personnel(df):
    df = df.copy()
    
    # 1. Diviser les poubelles assignées
    df['bins_list'] = df['assigned_bins'].str.split(',').apply(lambda x: [b.strip() for b in x] if pd.notna(x) else [])
    df['number_of_bins'] = df['bins_list'].apply(len)
    
    # 2. Calculer la moyenne de collectes par poubelle
    df['avg_collections_per_bin'] = df['total_collections'] / df['number_of_bins']
    df['avg_collections_per_bin'] = df['avg_collections_per_bin'].round(1)
    
    # 3. Jours depuis dernière collecte
    df['last_collection_date'] = pd.to_datetime(df['last_collection_date'], errors='coerce')
    df['days_inactive'] = (pd.Timestamp.now() - df['last_collection_date']).dt.days
    df['days_inactive'].fillna(999, inplace=True)
    
    # 4. Performance score
    def calculate_performance(total_col, days_inactive):
        if total_col == 0:
            return 0
        if days_inactive > 7:
            return 30  # Bas si inactif
        elif days_inactive > 3:
            return 60  # Moyen
        else:
            return min(100, total_col / 2)  # Bon
    
    df['performance_score'] = df.apply(
        lambda row: calculate_performance(row['total_collections'], row['days_inactive']),
        axis=1
    ).round(1)
    
    # 5. Statut d'activité
    df['activity_status'] = df['days_inactive'].apply(
        lambda x: 'Actif' if x <= 3 else 'Semi-actif' if x <= 7 else 'Inactif'
    )
    
    return df

df_personnel_enriched = enrich_personnel(df_personnel)
print("\n👥 Personnel chargé et enrichi:")
print(df_personnel_enriched[['user_id', 'first_name', 'last_name', 'total_collections', 'performance_score']].head())
```

---

## 📁 Partie 4 : Création du Fichier Excel Multi-onglets

### 4.1 Générer le fichier Excel final

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils.dataframe import dataframe_to_rows

def create_excel_report(df_bins, df_personnel, output_path):
    """
    Crée un fichier Excel multi-onglets avec tous les rapports
    """
    
    # Créer le workbook
    wb = Workbook()
    
    # ===== ONGLET 1 : POUBELLES =====
    ws_bins = wb.active
    ws_bins.title = "Poubelles"
    
    # Sélectionner les colonnes clés
    bins_export = df_bins[[
        'bin_id', 'location', 'latitude', 'longitude', 
        'capacity', 'status_calculated', 'fill_level', 'battery',
        'temperature', 'humidity', 'urgency_level', 'days_since_collection',
        'sensor_health_score', 'zone', 'responsible_id'
    ]]
    
    # Renommer les colonnes
    bins_export.columns = [
        'ID Poubelle', 'Localisation', 'Latitude', 'Longitude',
        'Capacité (L)', 'Statut', 'Remplissage (%)', 'Batterie (%)',
        'Température (°C)', 'Humidité (%)', 'Urgence', 'Jours sans collecte',
        'Score Capteur', 'Zone', 'Responsable'
    ]
    
    # Écrire les données
    for r_idx, row in enumerate(dataframe_to_rows(bins_export, index=False, header=True), 1):
        for c_idx, value in enumerate(row, 1):
            cell = ws_bins.cell(row=r_idx, column=c_idx, value=value)
            
            # Formattage : En-tête
            if r_idx == 1:
                cell.font = Font(bold=True, color="FFFFFF")
                cell.fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
            
            # Formattage : Urgence rouge/orange/vert
            if c_idx == 11:  # Colonne Urgence
                if value == 'URGENT':
                    cell.fill = PatternFill(start_color="FF0000", end_color="FF0000", fill_type="solid")
                    cell.font = Font(color="FFFFFF", bold=True)
                elif value == 'PRIORITAIRE':
                    cell.fill = PatternFill(start_color="FFA500", end_color="FFA500", fill_type="solid")
                    cell.font = Font(color="FFFFFF", bold=True)
            
            # Alignement
            cell.alignment = Alignment(horizontal="center", vertical="center")
    
    # Ajuster les largeurs
    ws_bins.column_dimensions['A'].width = 12
    ws_bins.column_dimensions['B'].width = 25
    ws_bins.column_dimensions['C'].width = 12
    ws_bins.column_dimensions['D'].width = 12
    
    # ===== ONGLET 2 : PERSONNEL =====
    ws_staff = wb.create_sheet("Personnel")
    
    staff_export = df_personnel_enriched[[
        'user_id', 'first_name', 'last_name', 'phone', 'email',
        'cin', 'vehicle_type', 'zone_assigned', 'number_of_bins',
        'total_collections', 'avg_collections_per_bin', 'performance_score', 'activity_status'
    ]]
    
    staff_export.columns = [
        'ID Personnel', 'Prénom', 'Nom', 'Téléphone', 'Email',
        'CIN', 'Type Véhicule', 'Zone Assignée', 'Nombre Poubelles',
        'Total Collectes', 'Moy. par Poubelle', 'Score Performance (%)', 'Statut'
    ]
    
    for r_idx, row in enumerate(dataframe_to_rows(staff_export, index=False, header=True), 1):
        for c_idx, value in enumerate(row, 1):
            cell = ws_staff.cell(row=r_idx, column=c_idx, value=value)
            
            # Formattage : En-tête
            if r_idx == 1:
                cell.font = Font(bold=True, color="FFFFFF")
                cell.fill = PatternFill(start_color="2F5233", end_color="2F5233", fill_type="solid")
            
            # Colorer le score de performance
            if c_idx == 12 and r_idx > 1:  # Colonne Performance
                if value >= 80:
                    cell.fill = PatternFill(start_color="92D050", end_color="92D050", fill_type="solid")
                elif value >= 50:
                    cell.fill = PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid")
                else:
                    cell.fill = PatternFill(start_color="FF7F50", end_color="FF7F50", fill_type="solid")
            
            cell.alignment = Alignment(horizontal="center", vertical="center")
    
    ws_staff.column_dimensions['A'].width = 12
    ws_staff.column_dimensions['B'].width = 15
    ws_staff.column_dimensions['C'].width = 15
    
    # ===== ONGLET 3 : STATISTIQUES GLOBALES =====
    ws_stats = wb.create_sheet("Statistiques")
    
    stats_data = [
        ['INDICATEUR', 'VALEUR', 'UNITÉ', 'REMARQUE'],
        ['', '', '', ''],
        ['POUBELLES', '', '', ''],
        ['Total des poubelles', len(df_bins), 'unités', ''],
        ['Poubelles normales', len(df_bins[df_bins['status_calculated'] == 'NORMAL']), 'unités', ''],
        ['Poubelles en attention', len(df_bins[df_bins['status_calculated'] == 'ATTENTION']), 'unités', ''],
        ['Poubelles critiques', len(df_bins[df_bins['status_calculated'] == 'CRITIQUE']), 'unités', ''],
        ['Remplissage moyen', f"{df_bins['fill_level'].mean():.1f}", '%', ''],
        ['', '', '', ''],
        ['PERSONNEL', '', '', ''],
        ['Total personnel', len(df_personnel_enriched), 'personnes', ''],
        ['Personnel actif', len(df_personnel_enriched[df_personnel_enriched['activity_status'] == 'Actif']), 'personnes', ''],
        ['Total collectes', df_personnel_enriched['total_collections'].sum(), 'opérations', ''],
        ['', '', '', ''],
        ['CAPTEURS', '', '', ''],
        ['Batterie moyenne', f"{df_bins['battery'].mean():.1f}", '%', ''],
        ['Température moyenne', f"{df_bins['temperature'].mean():.1f}", '°C', ''],
        ['Humidité moyenne', f"{df_bins['humidity'].mean():.1f}", '%', ''],
        ['Score santé moyen', f"{df_bins['sensor_health_score'].mean():.1f}", '/100', '']
    ]
    
    for r_idx, row in enumerate(stats_data, 1):
        for c_idx, value in enumerate(row, 1):
            cell = ws_stats.cell(row=r_idx, column=c_idx, value=value)
            
            if r_idx == 1 or row[0] in ['POUBELLES', 'PERSONNEL', 'CAPTEURS']:
                cell.font = Font(bold=True, color="FFFFFF", size=12)
                cell.fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
            
            cell.alignment = Alignment(horizontal="left", vertical="center")
    
    ws_stats.column_dimensions['A'].width = 30
    ws_stats.column_dimensions['B'].width = 15
    
    # Sauvegarder le fichier
    wb.save(output_path)
    print(f"\n✅ Fichier Excel créé: {output_path}")
    return output_path

# Générer le fichier Excel
output_file = 'rapport_smartwaste_complet.xlsx'
create_excel_report(df_enriched, df_personnel_enriched, output_file)
```

---

## 📈 Partie 5 : Utilisation pour Visualisation et Rapports

### 5.1 Charger et visualiser les données Excel

```python
import matplotlib.pyplot as plt
import seaborn as sns

# Charger le fichier Excel
excel_file = pd.ExcelFile('rapport_smartwaste_complet.xlsx')
df_bins_viz = pd.read_excel(excel_file, 'Poubelles')
df_personnel_viz = pd.read_excel(excel_file, 'Personnel')

# Graphique 1 : Distribution du remplissage
fig, axes = plt.subplots(2, 2, figsize=(15, 10))

# Histogramme du remplissage
axes[0, 0].hist(df_bins_viz['Remplissage (%)'], bins=10, color='steelblue', edgecolor='black')
axes[0, 0].set_title('Distribution du Remplissage des Poubelles', fontsize=12, fontweight='bold')
axes[0, 0].set_xlabel('Remplissage (%)')
axes[0, 0].set_ylabel('Nombre de poubelles')
axes[0, 0].grid(True, alpha=0.3)

# Pie chart : Statut des poubelles
status_counts = df_bins_viz['Statut'].value_counts()
colors = ['#92D050', '#FFA500', '#FF0000']
axes[0, 1].pie(status_counts.values, labels=status_counts.index, autopct='%1.1f%%', colors=colors)
axes[0, 1].set_title('Répartition par Statut', fontsize=12, fontweight='bold')

# Graphique batterie vs remplissage
axes[1, 0].scatter(df_bins_viz['Remplissage (%)'], df_bins_viz['Batterie (%)'], 
                   c=df_bins_viz['Score Capteur'], cmap='RdYlGn', s=100, alpha=0.6)
axes[1, 0].set_xlabel('Remplissage (%)')
axes[1, 0].set_ylabel('Batterie (%)')
axes[1, 0].set_title('Corrélation Remplissage / Batterie', fontsize=12, fontweight='bold')
axes[1, 0].grid(True, alpha=0.3)

# Barplot : Performance du personnel
top_staff = df_personnel_viz.nlargest(5, 'Score Performance (%)')
axes[1, 1].barh(top_staff['Prénom'], top_staff['Score Performance (%)'], color='seagreen')
axes[1, 1].set_title('Top 5 Personnel - Score Performance', fontsize=12, fontweight='bold')
axes[1, 1].set_xlabel('Score Performance (%)')

plt.tight_layout()
plt.savefig('analyses_smartwaste.png', dpi=300, bbox_inches='tight')
print("✅ Graphiques sauvegardés: analyses_smartwaste.png")
plt.show()
```

### 5.2 Générer un rapport textuel

```python
def generate_text_report(df_bins, df_personnel, output_file):
    """Générer un rapport en texte"""
    
    report = f"""
{'='*80}
RAPPORT D'ANALYSE SMARTWASTE
Généré le: {pd.Timestamp.now().strftime('%d/%m/%Y %H:%M:%S')}
{'='*80}

1. RÉSUMÉ EXÉCUTIF
{'-'*80}
Total de poubelles: {len(df_bins)}
Total de personnel: {len(df_personnel)}
Poubelles critiques: {len(df_bins[df_bins['status_calculated'] == 'CRITIQUE'])}
Personnel actif: {len(df_personnel[df_personnel['activity_status'] == 'Actif'])}

2. ÉTAT DES CAPTEURS
{'-'*80}
Remplissage moyen: {df_bins['fill_level'].mean():.1f}%
Batterie moyenne: {df_bins['battery'].mean():.1f}%
Température moyenne: {df_bins['temperature'].mean():.1f}°C
Humidité moyenne: {df_bins['humidity'].mean():.1f}%
Score santé moyen: {df_bins['sensor_health_score'].mean():.1f}/100

3. POUBILLES CRITIQUES - ACTION REQUISE
{'-'*80}
"""
    
    critical_bins = df_bins[df_bins['urgency_level'] == 'URGENT']
    for idx, row in critical_bins.iterrows():
        report += f"\n• {row['bin_id']} ({row['location']})\n"
        report += f"  Remplissage: {row['fill_level']}% | Batterie: {row['battery']}%\n"
        report += f"  Jours sans collecte: {row['days_since_collection']}\n"
    
    report += f"\n\n4. PERFORMANCE DU PERSONNEL\n{'-'*80}\n"
    top_performers = df_personnel.nlargest(5, 'total_collections')
    for idx, row in top_performers.iterrows():
        report += f"\n{row['first_name']} {row['last_name']}\n"
        report += f"  Collectes: {row['total_collections']} | Score: {row['performance_score']:.1f}%\n"
        report += f"  Zone: {row['zone_assigned']} | Statut: {row['activity_status']}\n"
    
    report += f"\n\n{'='*80}\n"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"✅ Rapport textuel généré: {output_file}")

# Générer le rapport
generate_text_report(df_enriched, df_personnel_enriched, 'rapport_smartwaste.txt')
```

---

## 🔗 Partie 6 : Pipeline Complet ETL

```python
def smartwaste_etl_pipeline(json_file, csv_personnel_file, output_excel, output_report):
    """
    Pipeline ETL complète SmartWaste
    """
    
    print("🚀 Démarrage du pipeline ETL SmartWaste...\n")
    
    # EXTRACTION
    print("📥 EXTRACTION")
    df_bins = extract_from_json(json_file)
    print(f"   ✓ {len(df_bins)} poubelles extraites\n")
    
    # TRANSFORMATION
    print("🔄 TRANSFORMATION")
    df_bins = transform_data(df_bins)
    print(f"   ✓ Données transformées et validées\n")
    
    # ENRICHISSEMENT
    print("✨ ENRICHISSEMENT")
    df_bins = enrich_data(df_bins)
    print(f"   ✓ Données enrichies avec calculs\n")
    
    # QUALITÉ
    print("🔍 VALIDATION QUALITÉ")
    quality_report = validate_quality(df_bins)
    print()
    
    # Personnel
    print("👥 TRAITEMENT DU PERSONNEL")
    df_personnel = pd.read_csv(csv_personnel_file)
    df_personnel = enrich_personnel(df_personnel)
    print(f"   ✓ {len(df_personnel)} employés traités\n")
    
    # LOAD
    print("💾 CHARGEMENT - FICHIERS DE SORTIE")
    create_excel_report(df_bins, df_personnel, output_excel)
    generate_text_report(df_bins, df_personnel, output_report)
    
    print("\n✅ Pipeline ETL complète avec succès!\n")
    
    return df_bins, df_personnel

# Exécuter le pipeline
# bins_final, personnel_final = smartwaste_etl_pipeline(
#     'raw_bins_data.json',
#     'raw_personnel.csv',
#     'rapport_final.xlsx',
#     'rapport_final.txt'
# )
```

---

## 📋 Résumé de la Structure Excel Finale

```
rapport_smartwaste_complet.xlsx
├── 📊 Onglet 1 : POUBELLES
│   ├── Colonnes : ID, Localisation, GPS, Capacité, Statut
│   ├── Statut : Calculé (Normal/Attention/Critique)
│   ├── Urgence : Calculée (Normal/Prioritaire/Urgent)
│   └── Couleurs : Codes couleur de santé
│
├── 👥 Onglet 2 : PERSONNEL
│   ├── Colonnes : ID, Prénom, Nom, Contact, CIN
│   ├── Assignation : Zone, Poubelles, Véhicule
│   ├── Performance : Score, Collectes, Statut
│   └── Couleurs : Score performance (Vert/Orange/Rouge)
│
├── 📈 Onglet 3 : STATISTIQUES
│   ├── Résumé global des KPIs
│   ├── Moyennes des capteurs
│   ├── Distribution des statuts
│   └── Indicateurs de performance
│
└── 📅 Onglet 4 : COLLECTES (Optionnel)
    ├── Historique détaillé
    ├── Opérateur responsable
    ├── Dates et volumes
    └── Géolocalisation
```

---

## 🎯 Bénéfices du Processus ETL

✅ **Données cohérentes** : Uniformité du format et des types  
✅ **Enrichissement** : Calculs automatiques et champs dérivés  
✅ **Validation** : Détection des anomalies et erreurs  
✅ **Traçabilité** : Audit complet de chaque transformation  
✅ **Performance** : Requêtes analytiques optimisées  
✅ **Décisions** : Métriques et indicateurs clairs  

---

## 📚 Technologies Utilisées

- **Python 3.8+**
- **Pandas** : Manipulation de données
- **OpenPyXL** : Création de fichiers Excel
- **Parquet** : Stockage columnar (optionnel)
- **Matplotlib/Seaborn** : Visualisation

