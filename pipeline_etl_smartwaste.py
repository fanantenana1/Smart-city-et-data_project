#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 SmartWaste ETL Pipeline - Extraction, Transformation, Chargement
Pipeline complète pour gérer les données de gestion intelligente des déchets

Auteur: SmartWaste Team
Date: 2026-04-15
"""

import pandas as pd
import json
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
from io import StringIO
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils.dataframe import dataframe_to_rows

# ============================================================================
# PARTIE 1 : DONNÉES DE DÉMONSTRATION
# ============================================================================

def create_sample_json_data():
    """Créer un fichier JSON de démonstration"""
    data = {
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
                "last_collection": None,
                "assignment": {
                    "zone": "Zone_Centre",
                    "responsible_id": "USER_002",
                    "assignment_date": "2026-01-05"
                }
            },
            {
                "bin_id": "BIN_003",
                "location": "Quartier Sud",
                "latitude": -21.46,
                "longitude": 47.52,
                "capacity": 120,
                "status": "critical",
                "sensors": {
                    "fill_level": 95,
                    "temperature": 33.1,
                    "humidity": 65,
                    "battery": 20,
                    "signal_strength": -78
                },
                "last_collection": {
                    "timestamp": "2026-04-15T06:45:00Z",
                    "operator_id": "OP_002",
                    "volume_collected": 100,
                    "notes": "Urgence"
                },
                "assignment": {
                    "zone": "Zone_Sud",
                    "responsible_id": "USER_003",
                    "assignment_date": "2026-01-10"
                }
            }
        ],
        "extraction_timestamp": "2026-04-15T08:00:00Z",
        "metadata": {
            "total_bins": 3,
            "last_sync": "2026-04-15T08:00:00Z"
        }
    }
    
    with open('raw_bins_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    return data

def create_sample_personnel_csv():
    """Créer un fichier CSV de personnel de démonstration"""
    personnel_csv = """user_id,first_name,last_name,phone,email,cin,vehicle_id,vehicle_type,zone_assigned,assigned_bins,total_collections,last_collection_date,status
USER_001,Jean,Dupont,+261341234567,jean.dupont@smartwaste.mg,123456789,VEH_001,Camion,Zone_Nord,"BIN_001,BIN_004,BIN_007",234,2026-04-15,Actif
USER_002,Marie,Martin,+261342345678,marie.martin@smartwaste.mg,987654321,VEH_002,Tricycle,Zone_Centre,"BIN_002,BIN_005",156,2026-04-14,Actif
USER_003,Paul,Bernard,+261343456789,paul.bernard@smartwaste.mg,555666777,VEH_003,Camion,Zone_Sud,"BIN_003,BIN_006,BIN_008",198,2026-04-15,Actif
USER_004,Sophie,Lefevre,+261344567890,sophie.lefevre@smartwaste.mg,111222333,,Vélo,Zone_Nord,"BIN_001,BIN_009",89,2026-04-12,Semi-actif"""
    
    with open('raw_personnel.csv', 'w', encoding='utf-8') as f:
        f.write(personnel_csv)
    
    return personnel_csv

# ============================================================================
# PARTIE 2 : EXTRACTION
# ============================================================================

def extract_from_json(file_path):
    """Extraire les données depuis un fichier JSON"""
    print(f"📥 Extraction depuis JSON: {file_path}")
    
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
    
    df = pd.DataFrame(bins_list)
    print(f"   ✓ {len(df)} enregistrements extraits\n")
    
    return df

def extract_from_csv(file_path):
    """Extraire les données depuis un fichier CSV"""
    print(f"📥 Extraction depuis CSV: {file_path}")
    df = pd.read_csv(file_path)
    print(f"   ✓ {len(df)} enregistrements extraits\n")
    return df

# ============================================================================
# PARTIE 3 : TRANSFORMATION
# ============================================================================

def transform_data(df):
    """Nettoyer et standardiser les données"""
    print("🔄 TRANSFORMATION - Nettoyage des données")
    df = df.copy()
    
    # 1. CONVERSION DE TYPES
    df['last_collection_timestamp'] = pd.to_datetime(df['last_collection_timestamp'], errors='coerce', utc=True)
    df['volume_collected'] = pd.to_numeric(df['volume_collected'], errors='coerce').fillna(0)
    df['fill_level'] = pd.to_numeric(df['fill_level'], errors='coerce').fillna(0)
    df['battery'] = pd.to_numeric(df['battery'], errors='coerce').fillna(0)
    df['temperature'] = pd.to_numeric(df['temperature'], errors='coerce').fillna(0)
    df['humidity'] = pd.to_numeric(df['humidity'], errors='coerce').fillna(0)
    
    # 2. REMPLISSAGE DES VALEURS NULLES
    df['operator_id'] = df['operator_id'].fillna('UNASSIGNED')
    
    # 3. VALIDATION DE PLAGE
    df.loc[df['fill_level'] < 0, 'fill_level'] = 0
    df.loc[df['fill_level'] > 100, 'fill_level'] = 100
    
    df.loc[df['battery'] < 0, 'battery'] = 0
    df.loc[df['battery'] > 100, 'battery'] = 100
    
    # 4. STANDARDISATION DE FORMAT
    df['location'] = df['location'].str.strip().str.title()
    df['zone'] = df['zone'].str.upper()
    df['status'] = df['status'].str.lower()
    
    # 5. SUPPRESSION DE DOUBLONS
    df = df.drop_duplicates(subset=['bin_id'], keep='first')
    
    print(f"   ✓ Transformation complétée: {len(df)} enregistrements valides\n")
    
    return df

# ============================================================================
# PARTIE 4 : ENRICHISSEMENT
# ============================================================================

def enrich_data(df):
    """Ajouter des champs calculés et du contexte"""
    print("✨ ENRICHISSEMENT - Ajout de champs calculés")
    df = df.copy()
    
    # 1. STATUT CALCULÉ BASÉ SUR REMPLISSAGE
    def get_status_from_fill(fill_level):
        if fill_level >= 90:
            return 'CRITIQUE'
        elif fill_level >= 70:
            return 'ATTENTION'
        else:
            return 'NORMAL'
    
    df['status_calculated'] = df['fill_level'].apply(get_status_from_fill)
    
    # 2. JOURS DEPUIS DERNIÈRE COLLECTE
    now = pd.Timestamp.now(tz='UTC')
    # Convertir les timestamps tz-aware et tz-naive
    df['last_collection_timestamp'] = pd.to_datetime(df['last_collection_timestamp'], utc=True)
    df['days_since_collection'] = (now - df['last_collection_timestamp']).dt.days
    df['days_since_collection'] = df['days_since_collection'].fillna(999)
    
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
    df['sensor_health_score'] = (
        (100 - df['fill_level']) * 0.3 +
        df['battery'] * 0.4 +
        (df['signal_strength'] + 100) * 0.3
    ) / 100
    df['sensor_health_score'] = df['sensor_health_score'].clip(0, 100).round(1)
    
    # 5. CATÉGORIE DE TEMPÉRATURE
    def temp_category(temp):
        if temp < 20:
            return 'Froid'
        elif temp < 30:
            return 'Modéré'
        else:
            return 'Chaud'
    
    df['temperature_category'] = df['temperature'].apply(temp_category)
    
    # 6. DENSITÉ ESTIMÉE
    df['density_estimate'] = (df['volume_collected'] / df['capacity'] * 100).round(1)
    df['density_estimate'] = df['density_estimate'].fillna(0)
    
    # 7. TIMESTAMP
    df['data_extracted_at'] = pd.Timestamp.now()
    
    print(f"   ✓ Enrichissement complété: {len(df)} enregistrements enrichis\n")
    
    return df

# ============================================================================
# PARTIE 5 : VALIDATION DE QUALITÉ
# ============================================================================

def validate_quality(df):
    """Valider la qualité des données"""
    print("🔍 VALIDATION QUA LITÉ")
    report = {
        'total_records': len(df),
        'valid_records': len(df),
        'issues': []
    }
    
    # Vérifier les colonnes essentielles
    required_cols = ['bin_id', 'location', 'fill_level', 'battery', 'latitude', 'longitude']
    missing_cols = [col for col in required_cols if col not in df.columns]
    
    if missing_cols:
        report['issues'].append(f"Colonnes manquantes: {missing_cols}")
    
    # Vérifier les plages de valeurs
    if (df['fill_level'] > 100).any() or (df['fill_level'] < 0).any():
        report['issues'].append("Fill_level hors plage 0-100")
    
    if (df['battery'] > 100).any() or (df['battery'] < 0).any():
        report['issues'].append("Battery hors plage 0-100")
    
    # Vérifier le GPS
    invalid_gps = df[(df['latitude'] < -90) | (df['latitude'] > 90) | 
                      (df['longitude'] < -180) | (df['longitude'] > 180)]
    if len(invalid_gps) > 0:
        report['issues'].append(f"Coordonnées GPS invalides: {len(invalid_gps)}")
    
    report['valid_records'] = len(df) - len(invalid_gps)
    report['quality_score'] = (report['valid_records'] / report['total_records'] * 100) if report['total_records'] > 0 else 0
    
    print(f"   ✓ Enregistrements valides: {report['valid_records']}/{report['total_records']}")
    print(f"   ✓ Score de qualité: {report['quality_score']:.1f}%")
    if report['issues']:
        print(f"   ⚠ Problèmes détectés:")
        for issue in report['issues']:
            print(f"     • {issue}")
    print()
    
    return report

# ============================================================================
# PARTIE 6 : TRAITEMENT DU PERSONNEL
# ============================================================================

def enrich_personnel(df):
    """Enrichir les données du personnel"""
    print("👥 ENRICHISSEMENT - Personnel")
    df = df.copy()
    
    # 1. Diviser les poubelles assignées
    def parse_bins(bins_str):
        if pd.isna(bins_str) or bins_str == '':
            return []
        return [b.strip() for b in str(bins_str).split(',')]
    
    df['bins_list'] = df['assigned_bins'].apply(parse_bins)
    df['number_of_bins'] = df['bins_list'].apply(len)
    
    # 2. Moyenne de collectes par poubelle
    df['avg_collections_per_bin'] = (df['total_collections'] / df['number_of_bins']).round(1)
    df['avg_collections_per_bin'] = df['avg_collections_per_bin'].replace([np.inf, -np.inf], 0)
    
    # 3. Jours depuis dernière collecte
    df['last_collection_date'] = pd.to_datetime(df['last_collection_date'], errors='coerce', utc=True)
    now = pd.Timestamp.now(tz='UTC')
    df['days_inactive'] = (now - df['last_collection_date']).dt.days
    df['days_inactive'] = df['days_inactive'].fillna(999)
    
    # 4. Score de performance
    def calculate_performance(total_col, days_inactive):
        if total_col == 0:
            return 0
        if days_inactive > 7:
            return 30
        elif days_inactive > 3:
            return 60
        else:
            return min(100, total_col / 2)
    
    df['performance_score'] = df.apply(
        lambda row: calculate_performance(row['total_collections'], row['days_inactive']),
        axis=1
    ).round(1)
    
    # 5. Statut d'activité
    df['activity_status'] = df['days_inactive'].apply(
        lambda x: 'Actif' if x <= 3 else 'Semi-actif' if x <= 7 else 'Inactif'
    )
    
    print(f"   ✓ {len(df)} employés enrichis\n")
    
    return df

# ============================================================================
# PARTIE 7 : CRÉATION FICHIER EXCEL
# ============================================================================

def create_excel_report(df_bins, df_personnel, output_path):
    """Créer un fichier Excel multi-onglets"""
    print(f"💾 CRÉATION FICHIER EXCEL: {output_path}")
    
    wb = Workbook()
    
    # ===== ONGLET 1 : POUBELLES =====
    ws_bins = wb.active
    ws_bins.title = "Poubelles"
    
    bins_export = df_bins[[
        'bin_id', 'location', 'latitude', 'longitude', 
        'capacity', 'status_calculated', 'fill_level', 'battery',
        'temperature', 'humidity', 'urgency_level', 'days_since_collection',
        'sensor_health_score', 'zone', 'responsible_id'
    ]].copy()
    
    bins_export.columns = [
        'ID Poubelle', 'Localisation', 'Latitude', 'Longitude',
        'Capacité (L)', 'Statut', 'Remplissage (%)', 'Batterie (%)',
        'Température (°C)', 'Humidité (%)', 'Urgence', 'Jours sans collecte',
        'Score Capteur', 'Zone', 'Responsable'
    ]
    
    for r_idx, row in enumerate(dataframe_to_rows(bins_export, index=False, header=True), 1):
        for c_idx, value in enumerate(row, 1):
            cell = ws_bins.cell(row=r_idx, column=c_idx, value=value)
            
            if r_idx == 1:
                cell.font = Font(bold=True, color="FFFFFF")
                cell.fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
            
            if c_idx == 11 and r_idx > 1:  # Colonne Urgence
                if value == 'URGENT':
                    cell.fill = PatternFill(start_color="FF0000", end_color="FF0000", fill_type="solid")
                    cell.font = Font(color="FFFFFF", bold=True)
                elif value == 'PRIORITAIRE':
                    cell.fill = PatternFill(start_color="FFA500", end_color="FFA500", fill_type="solid")
                    cell.font = Font(color="FFFFFF", bold=True)
                else:
                    cell.fill = PatternFill(start_color="92D050", end_color="92D050", fill_type="solid")
            
            cell.alignment = Alignment(horizontal="center", vertical="center")
    
    # Ajuster largeurs
    ws_bins.column_dimensions['A'].width = 12
    ws_bins.column_dimensions['B'].width = 30
    ws_bins.column_dimensions['C'].width = 12
    
    # ===== ONGLET 2 : PERSONNEL =====
    ws_staff = wb.create_sheet("Personnel")
    
    staff_export = df_personnel[[
        'user_id', 'first_name', 'last_name', 'phone', 'email',
        'cin', 'vehicle_type', 'zone_assigned', 'number_of_bins',
        'total_collections', 'avg_collections_per_bin', 'performance_score', 'activity_status'
    ]].copy()
    
    staff_export.columns = [
        'ID', 'Prénom', 'Nom', 'Téléphone', 'Email',
        'CIN', 'Véhicule', 'Zone', 'Poubelles',
        'Collectes', 'Moy/Poubelle', 'Performance (%)', 'Statut'
    ]
    
    for r_idx, row in enumerate(dataframe_to_rows(staff_export, index=False, header=True), 1):
        for c_idx, value in enumerate(row, 1):
            cell = ws_staff.cell(row=r_idx, column=c_idx, value=value)
            
            if r_idx == 1:
                cell.font = Font(bold=True, color="FFFFFF")
                cell.fill = PatternFill(start_color="2F5233", end_color="2F5233", fill_type="solid")
            
            if c_idx == 12 and r_idx > 1:  # Performance
                if value >= 80:
                    cell.fill = PatternFill(start_color="92D050", end_color="92D050", fill_type="solid")
                elif value >= 50:
                    cell.fill = PatternFill(start_color="FFEB9C", end_color="FFEB9C", fill_type="solid")
                else:
                    cell.fill = PatternFill(start_color="FF7F50", end_color="FF7F50", fill_type="solid")
            
            cell.alignment = Alignment(horizontal="center", vertical="center")
    
    ws_staff.column_dimensions['A'].width = 12
    ws_staff.column_dimensions['B'].width = 15
    
    # ===== ONGLET 3 : STATISTIQUES =====
    ws_stats = wb.create_sheet("Statistiques")
    
    stats_data = [
        ['INDICATEUR', 'VALEUR', 'UNITÉ'],
        ['', '', ''],
        ['RÉSUMÉ GLOBAL', '', ''],
        ['Total poubelles', len(df_bins), 'unités'],
        ['Poubelles normales', len(df_bins[df_bins['status_calculated'] == 'NORMAL']), 'unités'],
        ['Poubelles critiques', len(df_bins[df_bins['status_calculated'] == 'CRITIQUE']), 'unités'],
        ['Remplissage moyen', f"{df_bins['fill_level'].mean():.1f}", '%'],
        ['', '', ''],
        ['PERSONNEL', '', ''],
        ['Total agents', len(df_personnel), 'personnes'],
        ['Actifs', len(df_personnel[df_personnel['activity_status'] == 'Actif']), 'personnes'],
        ['Total collectes', df_personnel['total_collections'].sum(), 'opérations'],
        ['', '', ''],
        ['CAPTEURS', '', ''],
        ['Batterie moyenne', f"{df_bins['battery'].mean():.1f}", '%'],
        ['Température moyenne', f"{df_bins['temperature'].mean():.1f}", '°C']
    ]
    
    for r_idx, row in enumerate(stats_data, 1):
        for c_idx, value in enumerate(row, 1):
            cell = ws_stats.cell(row=r_idx, column=c_idx, value=value)
            
            if row[0] in ['RÉSUMÉ GLOBAL', 'PERSONNEL', 'CAPTEURS']:
                cell.font = Font(bold=True, color="FFFFFF", size=11)
                cell.fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
            elif r_idx == 1:
                cell.font = Font(bold=True, color="FFFFFF")
                cell.fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
            
            cell.alignment = Alignment(horizontal="left", vertical="center")
    
    ws_stats.column_dimensions['A'].width = 30
    ws_stats.column_dimensions['B'].width = 15
    
    # Sauvegarder
    wb.save(output_path)
    print(f"   ✓ Fichier créé avec succès\n")

# ============================================================================
# PARTIE 8 : RAPPORT TEXTUEL
# ============================================================================

def generate_text_report(df_bins, df_personnel, output_file):
    """Générer un rapport en texte"""
    print(f"📄 GÉNÉRATION RAPPORT TEXTE: {output_file}")
    
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

3. POUBELLES CRITIQUES - ACTION REQUISE
{'-'*80}
"""
    
    critical_bins = df_bins[df_bins['urgency_level'] == 'URGENT']
    if len(critical_bins) > 0:
        for idx, row in critical_bins.iterrows():
            report += f"\n• {row['bin_id']} ({row['location']})\n"
            report += f"  Remplissage: {row['fill_level']}% | Batterie: {row['battery']}%\n"
            report += f"  Jours sans collecte: {row['days_since_collection']}\n"
    else:
        report += "\nAucune poubelle en état critique.\n"
    
    report += f"\n\n4. TOP 5 PERSONNEL - PERFORMANCE\n{'-'*80}\n"
    top_performers = df_personnel.nlargest(5, 'total_collections')
    for idx, (i, row) in enumerate(top_performers.iterrows(), 1):
        report += f"\n{idx}. {row['first_name']} {row['last_name']}\n"
        report += f"   Collectes: {int(row['total_collections'])} | Score: {row['performance_score']:.1f}%\n"
        report += f"   Zone: {row['zone_assigned']} | Statut: {row['activity_status']}\n"
    
    report += f"\n\n{'='*80}\nFin du rapport\n{'='*80}\n"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"   ✓ Rapport généré\n")

# ============================================================================
# FONCTION POUR DONNÉES POUBELLES ET PERSONNEL SEULEMENT
# ============================================================================

def create_bins_personnel_excel(df_bins, df_personnel, output_file="DONNEES_POUBELLES_PERSONNEL.xlsx"):
    """
    Créer un fichier Excel avec seulement les données des poubelles et du personnel
    Deux onglets : "Données des poubelles : Tableau 1" et "Informations du personnel : Tableau 1"
    """
    print(f"📊 Création Excel données poubelles/personnel: {output_file}")

    wb = Workbook()

    # ===== ONGLET 1: DONNÉES DES POUBELLES =====
    ws_bins = wb.active
    ws_bins.title = "Données des poubelles"

    # En-têtes pour les poubelles
    headers_bins = [
        'ID Poubelle', 'Localisation', 'Latitude', 'Longitude', 'Capacité (L)',
        'Statut', 'Remplissage (%)', 'Batterie (%)', 'Température (°C)', 'Humidité (%)',
        'Urgence', 'Jours sans collecte', 'Zone', 'Responsable'
    ]

    # Style des en-têtes
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="2E8B57", end_color="2E8B57", fill_type="solid")  # Vert foncé
    header_alignment = Alignment(horizontal="center", vertical="center")

    for col_num, header in enumerate(headers_bins, 1):
        cell = ws_bins.cell(row=1, column=col_num, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment

    # Données des poubelles
    for row_num, (_, row) in enumerate(df_bins.iterrows(), 2):
        ws_bins.cell(row=row_num, column=1, value=row.get('bin_id', ''))
        ws_bins.cell(row=row_num, column=2, value=row.get('location', ''))
        ws_bins.cell(row=row_num, column=3, value=row.get('latitude', ''))
        ws_bins.cell(row=row_num, column=4, value=row.get('longitude', ''))
        ws_bins.cell(row=row_num, column=5, value=row.get('capacity', ''))
        ws_bins.cell(row=row_num, column=6, value=row.get('status_calculated', ''))
        ws_bins.cell(row=row_num, column=7, value=row.get('fill_level', ''))
        ws_bins.cell(row=row_num, column=8, value=row.get('battery', ''))
        ws_bins.cell(row=row_num, column=9, value=row.get('temperature', ''))
        ws_bins.cell(row=row_num, column=10, value=row.get('humidity', ''))
        ws_bins.cell(row=row_num, column=11, value=row.get('urgency_level', ''))
        ws_bins.cell(row=row_num, column=12, value=row.get('days_since_collection', ''))
        ws_bins.cell(row=row_num, column=13, value=row.get('zone', ''))
        ws_bins.cell(row=row_num, column=14, value=row.get('responsible_id', ''))

    # Ajuster la largeur des colonnes pour l'onglet poubelles
    column_widths_bins = [15, 30, 12, 12, 15, 12, 15, 12, 15, 12, 12, 18, 12, 15]
    for i, width in enumerate(column_widths_bins, 1):
        ws_bins.column_dimensions[chr(64 + i)].width = width

    # ===== ONGLET 2: INFORMATIONS DU PERSONNEL =====
    ws_personnel = wb.create_sheet("Informations du personnel")

    # En-têtes pour le personnel
    headers_personnel = [
        'ID', 'Prénom', 'Nom', 'Téléphone', 'Email', 'CIN',
        'Véhicule', 'Zone assignée', 'Poubelles assignées',
        'Total collectes', 'Performance (%)', 'Statut activité'
    ]

    # Appliquer les styles aux en-têtes du personnel
    for col_num, header in enumerate(headers_personnel, 1):
        cell = ws_personnel.cell(row=1, column=col_num, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment

    # Données du personnel
    for row_num, (_, row) in enumerate(df_personnel.iterrows(), 2):
        ws_personnel.cell(row=row_num, column=1, value=row.get('user_id', ''))
        ws_personnel.cell(row=row_num, column=2, value=row.get('first_name', ''))
        ws_personnel.cell(row=row_num, column=3, value=row.get('last_name', ''))
        ws_personnel.cell(row=row_num, column=4, value=row.get('phone', ''))
        ws_personnel.cell(row=row_num, column=5, value=row.get('email', ''))
        ws_personnel.cell(row=row_num, column=6, value=row.get('cin', ''))
        ws_personnel.cell(row=row_num, column=7, value=row.get('vehicle_type', ''))
        ws_personnel.cell(row=row_num, column=8, value=row.get('zone_assigned', ''))
        ws_personnel.cell(row=row_num, column=9, value=row.get('assigned_bins', ''))
        ws_personnel.cell(row=row_num, column=10, value=row.get('total_collections', 0))
        ws_personnel.cell(row=row_num, column=11, value=row.get('performance_score', 0))
        ws_personnel.cell(row=row_num, column=12, value=row.get('activity_status', ''))

    # Ajuster la largeur des colonnes pour l'onglet personnel
    column_widths_personnel = [12, 15, 15, 18, 30, 15, 12, 15, 20, 15, 15, 15]
    for i, width in enumerate(column_widths_personnel, 1):
        ws_personnel.column_dimensions[chr(64 + i)].width = width

    # Sauvegarder le fichier
    wb.save(output_file)
    print(f"   ✓ Excel créé: {output_file} ({len(df_bins)} poubelles, {len(df_personnel)} personnels)")

# ============================================================================
# PARTIE 9 : PIPELINE PRINCIPAL MODIFIÉ
# ============================================================================

def smartwaste_etl_pipeline(mode="complete", output_file=None):
    """Pipeline ETL complète SmartWaste"""
    
    print("\n" + "="*80)
    print(" SMARTWASTE ETL PIPELINE - DÉMARRAGE")
    print("="*80 + "\n")
    
    # Créer les données de démonstration
    print(" Création des données de démonstration...")
    create_sample_json_data()
    create_sample_personnel_csv()
    print("   ✓ Fichiers créés: raw_bins_data.json, raw_personnel.csv\n")
    
    # EXTRACTION
    print("ÉTAPE 1/6: EXTRACTION")
    print("-" * 80)
    df_bins = extract_from_json('raw_bins_data.json')
    df_personnel = extract_from_csv('raw_personnel.csv')
    
    # TRANSFORMATION
    print("ÉTAPE 2/6: TRANSFORMATION")
    print("-" * 80)
    df_bins = transform_data(df_bins)
    
    # ENRICHISSEMENT
    print("ÉTAPE 3/6: ENRICHISSEMENT")
    print("-" * 80)
    df_bins = enrich_data(df_bins)
    df_personnel = enrich_personnel(df_personnel)
    
    # VALIDATION
    print("ÉTAPE 4/6: VALIDATION QUALITÉ")
    print("-" * 80)
    quality_report = validate_quality(df_bins)
    
    # LOAD - Fichier Excel selon le mode
    print("ÉTAPE 5/6: CRÉATION FICHIER EXCEL")
    print("-" * 80)
    
    if mode == "bins_personnel":
        # Mode données poubelles et personnel seulement
        if output_file:
            create_bins_personnel_excel(df_bins, df_personnel, output_file)
        else:
            create_bins_personnel_excel(df_bins, df_personnel, 'DONNEES_POUBELLES_PERSONNEL.xlsx')
    else:
        # Mode complet avec statistiques
        if output_file:
            create_excel_report(df_bins, df_personnel, output_file)
        else:
            create_excel_report(df_bins, df_personnel, 'RAPPORT_SMARTWASTE_COMPLET.xlsx')
    
    # RAPPORT TEXTE (seulement en mode complet)
    if mode == "complete":
        print("ÉTAPE 6/6: GÉNÉRATION RAPPORT TEXTE")
        print("-" * 80)
        generate_text_report(df_bins, df_personnel, 'RAPPORT_SMARTWASTE.txt')
    
    # Afficher un aperçu
    print("\n APERÇU DES DONNÉES FINALES")
    print("="*80)
    print("\n POUBELLES:")
    print(df_bins[['bin_id', 'location', 'fill_level', 'status_calculated', 'urgency_level']].to_string(index=False))
    
    print("\n\n PERSONNEL:")
    print(df_personnel[['first_name', 'last_name', 'total_collections', 'performance_score', 'activity_status']].to_string(index=False))
    
    print("\n" + "="*80)
    print(" PIPELINE ETL TERMINÉE AVEC SUCCÈS!")
    print("="*80)
    print("\n Fichiers générés:")
    if mode == "bins_personnel":
        print("   • DONNEES_POUBELLES_PERSONNEL.xlsx")
    else:
        print("   • RAPPORT_SMARTWASTE_COMPLET.xlsx")
        print("   • RAPPORT_SMARTWASTE.txt")
    print("   • raw_bins_data.json")
    print("   • raw_personnel.csv")
    print("\n")
    
    return df_bins, df_personnel

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import sys
    
    # Mode par défaut
    mode = "complete"
    
    # Vérifier les arguments de ligne de commande
    if len(sys.argv) > 1:
        if sys.argv[1] in ["complete", "bins_personnel"]:
            mode = sys.argv[1]
        else:
            print(" Mode invalide. Utiliser: complete ou bins_personnel")
            sys.exit(1)
    
    print(f" Mode sélectionné: {mode}")
    df_bins_final, df_personnel_final = smartwaste_etl_pipeline(mode=mode)
