#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Module d'export multi-format pour rapports de déchets
Supports: CSV, JSON, Excel, SQLite, SQL Dump

Système de Gestion Intelligente des Déchets - Madagascar
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import json
import csv
import sqlite3
from datetime import datetime, timedelta
from pymongo import MongoClient
from typing import List, Dict, Optional
import io

# Configuration
def get_mongodb_uri():
    cle_path = os.path.join(os.path.dirname(__file__), '..', 'cle.txt')
    if os.path.exists(cle_path):
        with open(cle_path, 'r', encoding='utf-8') as f:
            for line in f:
                if 'mongodb' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        return parts[1].strip()
    return None

DB_NAME = 'DaB_Poubelles'
EXPORT_DIR = os.path.join(os.path.dirname(__file__), 'exports')
os.makedirs(EXPORT_DIR, exist_ok=True)

class ExporteurRapports:
    """Exporte les données de déchets en multiples formats"""
    
    def __init__(self):
        self.client = None
        self.db = None
        # Plus besoin de connexion MongoDB directe - on utilise database.py
        self.timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    def connect(self):
        """Connexion à MongoDB"""
        uri = get_mongodb_uri()
        if uri:
            try:
                # Encoder les credentials comme dans database.py
                from urllib.parse import urlsplit, urlunsplit, quote_plus
                try:
                    parts = urlsplit(uri)
                    if parts.netloc and '@' in parts.netloc:
                        userinfo, host = parts.netloc.rsplit('@', 1)
                        if ':' in userinfo:
                            user, pwd = userinfo.split(':', 1)
                            user_enc = quote_plus(user)
                            pwd_enc = quote_plus(pwd)
                            new_netloc = f"{user_enc}:{pwd_enc}@{host}"
                            uri = urlunsplit((parts.scheme, new_netloc, parts.path, parts.query, parts.fragment))
                except Exception:
                    pass
                
                self.client = MongoClient(uri, serverSelectionTimeoutMS=10000, connectTimeoutMS=10000)
                self.client.admin.command('ping')
                self.db = self.client[DB_NAME]
                print(" Connecté à MongoDB pour exports")
            except Exception as e:
                print(f" Erreur connexion MongoDB: {e}")
    
    def recuperer_donnees(self) -> Dict:
        """Récupère toutes les données en utilisant les fonctions database.py existantes"""
        try:
            from .database import get_all_bins, get_all_users, get_all_alerts, get_all_collections
            
            # Récupérer les données via les fonctions existantes
            bins_dict = get_all_bins()
            bins = list(bins_dict.values()) if isinstance(bins_dict, dict) else bins_dict
            
            users = get_all_users()
            alerts = get_all_alerts()
            collections = get_all_collections()
            
            # Pour les historiques et prédictions, utiliser directement MongoDB si disponible
            historiques = []
            predictions = []
            
            if self.db:
                try:
                    historiques = list(self.db['historiques'].find({}))
                    predictions = list(self.db['predictions'].find({}))
                except Exception:
                    pass
            
            return {
                'poubelles': bins,
                'historiques': historiques,
                'predictions': predictions,
                'utilisateurs': users,
                'alertes': alerts,
                'collections': collections,
            }
        except Exception as e:
            print(f"Erreur récupération données: {e}")
            return {}
    
    def nettoyer_donnees(self, data: Dict) -> Dict:
        """Nettoie les ObjectId MongoDB"""
        def clean_obj(obj):
            if isinstance(obj, dict):
                return {k: clean_obj(v) for k, v in obj.items() if k != '_id'}
            elif isinstance(obj, list):
                return [clean_obj(item) for item in obj]
            else:
                return str(obj) if hasattr(obj, '__class__') and 'ObjectId' in str(obj.__class__) else obj
        
        return clean_obj(data)
    
    # ========== EXPORT JSON ==========
    def exporter_json(self, pretty=True) -> str:
        """Exporte toutes les données en JSON"""
        donnees = self.recuperer_donnees()
        donnees = self.nettoyer_donnees(donnees)
        
        filename = os.path.join(EXPORT_DIR, f'rapport_complet_{self.timestamp}.json')
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(donnees, f, ensure_ascii=False, indent=2 if pretty else None)
        
        print(f" JSON exporté: {filename}")
        return filename
    
    # ========== EXPORT CSV PAR TABLE ==========
    def exporter_csv(self) -> Dict[str, str]:
        """Exporte chaque collection en CSV séparé"""
        donnees = self.recuperer_donnees()
        donnees = self.nettoyer_donnees(donnees)
        
        fichiers = {}
        
        # Export Poubelles
        if donnees['poubelles']:
            filename = os.path.join(EXPORT_DIR, f'poubelles_{self.timestamp}.csv')
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=donnees['poubelles'][0].keys())
                writer.writeheader()
                writer.writerows(donnees['poubelles'])
            fichiers['poubelles'] = filename
            print(f" CSV Poubelles: {filename}")
        
        # Export Historiques
        if donnees['historiques']:
            filename = os.path.join(EXPORT_DIR, f'historiques_{self.timestamp}.csv')
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=donnees['historiques'][0].keys())
                writer.writeheader()
                writer.writerows(donnees['historiques'])
            fichiers['historiques'] = filename
            print(f" CSV Historiques: {filename}")
        
        # Export Prédictions
        if donnees['predictions']:
            filename = os.path.join(EXPORT_DIR, f'predictions_{self.timestamp}.csv')
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=donnees['predictions'][0].keys())
                writer.writeheader()
                writer.writerows(donnees['predictions'])
            fichiers['predictions'] = filename
            print(f" CSV Prédictions: {filename}")
        
        # Export Utilisateurs (sans pwd)
        if donnees['utilisateurs']:
            filename = os.path.join(EXPORT_DIR, f'utilisateurs_{self.timestamp}.csv')
            users_clean = [{k: v for k, v in u.items() if k != 'password_hash'} for u in donnees['utilisateurs']]
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=users_clean[0].keys())
                writer.writeheader()
                writer.writerows(users_clean)
            fichiers['utilisateurs'] = filename
            print(f" CSV Utilisateurs: {filename}")
        
        return fichiers
    
    # ========== EXPORT EXCEL ==========
    def exporter_excel(self) -> str:
        """Exporte en Excel avec plusieurs sheets"""
        try:
            import openpyxl
            from openpyxl.utils.dataframe import dataframe_to_rows
            import pandas as pd
        except ImportError:
            print(" openpyxl/pandas non installé. Utilisez 'pip install openpyxl pandas'")
            return None
        
        donnees = self.recuperer_donnees()
        donnees = self.nettoyer_donnees(donnees)
        
        filename = os.path.join(EXPORT_DIR, f'rapport_complet_{self.timestamp}.xlsx')
        
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            if donnees['poubelles']:
                df = pd.DataFrame(donnees['poubelles'])
                df.to_excel(writer, sheet_name='Poubelles', index=False)
            
            if donnees['historiques']:
                df = pd.DataFrame(donnees['historiques'])
                df.to_excel(writer, sheet_name='Historiques', index=False)
            
            if donnees['predictions']:
                df = pd.DataFrame(donnees['predictions'])
                df.to_excel(writer, sheet_name='Predictions', index=False)
            
            if donnees['utilisateurs']:
                df = pd.DataFrame(donnees['utilisateurs'])
                df = df.drop(columns=['password_hash'], errors='ignore')
                df.to_excel(writer, sheet_name='Utilisateurs', index=False)
        
        print(f" Excel exporté: {filename}")
        return filename
    
    # ========== EXPORT SQLITE ==========
    def exporter_sqlite(self) -> str:
        """Exporte en base SQLite"""
        donnees = self.recuperer_donnees()
        donnees = self.nettoyer_donnees(donnees)
        
        filename = os.path.join(EXPORT_DIR, f'rapport_dechets_{self.timestamp}.db')
        
        conn = sqlite3.connect(filename)
        cursor = conn.cursor()
        
        # Table Poubelles
        if donnees['poubelles']:
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS poubelles (
                    bin_id TEXT PRIMARY KEY,
                    location TEXT,
                    address TEXT,
                    fill_level REAL,
                    capacity INTEGER,
                    current_volume INTEGER,
                    battery REAL,
                    temperature REAL,
                    signal_quality TEXT,
                    status TEXT,
                    latitude REAL,
                    longitude REAL,
                    last_collection TEXT,
                    last_update TEXT,
                    created_at TEXT
                )
            ''')
            
            for p in donnees['poubelles']:
                cursor.execute('''
                    INSERT OR REPLACE INTO poubelles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    p.get('bin_id'), p.get('location'), p.get('address'),
                    p.get('fill_level'), p.get('capacity'), p.get('current_volume'),
                    p.get('battery'), p.get('temperature'), p.get('signal_quality'),
                    p.get('status'), p.get('latitude'), p.get('longitude'),
                    p.get('last_collection'), p.get('last_update'), p.get('created_at')
                ))
        
        # Table Historiques
        if donnees['historiques']:
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS historiques (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bin_id TEXT,
                    location TEXT,
                    operator TEXT,
                    volume_collected INTEGER,
                    percentage REAL,
                    timestamp TEXT,
                    duration_minutes INTEGER,
                    notes TEXT
                )
            ''')
            
            for h in donnees['historiques']:
                cursor.execute('''
                    INSERT INTO historiques (bin_id, location, operator, volume_collected, percentage, timestamp, duration_minutes, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    h.get('bin_id'), h.get('location'), h.get('operator'),
                    h.get('volume_collected'), h.get('percentage'), h.get('timestamp'),
                    h.get('duration_minutes'), h.get('notes')
                ))
        
        # Table Prédictions
        if donnees['predictions']:
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS predictions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bin_id TEXT,
                    location TEXT,
                    prediction_date TEXT,
                    predicted_fill_level REAL,
                    confidence REAL,
                    recommended_collection TEXT,
                    generated_at TEXT
                )
            ''')
            
            for pr in donnees['predictions']:
                cursor.execute('''
                    INSERT INTO predictions (bin_id, location, prediction_date, predicted_fill_level, confidence, recommended_collection, generated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    pr.get('bin_id'), pr.get('location'), pr.get('prediction_date'),
                    pr.get('predicted_fill_level'), pr.get('confidence'),
                    pr.get('recommended_collection'), pr.get('generated_at')
                ))
        
        # Table Utilisateurs
        if donnees['utilisateurs']:
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    username TEXT PRIMARY KEY,
                    email TEXT,
                    full_name TEXT,
                    role TEXT,
                    is_active BOOLEAN,
                    is_approved BOOLEAN,
                    created_at TEXT,
                    phone_number TEXT
                )
            ''')
            
            for u in donnees['utilisateurs']:
                cursor.execute('''
                    INSERT OR REPLACE INTO users (username, email, full_name, role, is_active, is_approved, created_at, phone_number)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    u.get('username'), u.get('email'), u.get('full_name'),
                    u.get('role'), u.get('is_active'), u.get('is_approved'),
                    u.get('created_at'), u.get('phone_number')
                ))
        
        conn.commit()
        conn.close()
        
        print(f" SQLite exporté: {filename}")
        return filename
    
    # ========== EXPORT SQL DUMP ==========
    def exporter_sql_dump(self) -> str:
        """Exporte en SQL dump format (compatible MySQL/PostgreSQL)"""
        donnees = self.recuperer_donnees()
        donnees = self.nettoyer_donnees(donnees)
        
        filename = os.path.join(EXPORT_DIR, f'rapport_dechets_{self.timestamp}.sql')
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write("-- Export SQL Système Gestion Déchets Madagascar\n")
            f.write(f"-- Généré le: {datetime.now().isoformat()}\n")
            f.write("-- Compatible: MySQL, PostgreSQL, SQLite\n\n")
            
            # Create Tables
            f.write("-- ===== TABLES =====\n\n")
            
            f.write("""
CREATE TABLE IF NOT EXISTS poubelles (
    bin_id VARCHAR(50) PRIMARY KEY,
    location VARCHAR(255),
    address VARCHAR(255),
    fill_level DECIMAL(5,2),
    capacity INTEGER,
    current_volume INTEGER,
    battery DECIMAL(5,2),
    temperature DECIMAL(5,2),
    signal_quality VARCHAR(50),
    status VARCHAR(50),
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    last_collection TIMESTAMP,
    last_update TIMESTAMP,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historiques (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    bin_id VARCHAR(50),
    location VARCHAR(255),
    operator VARCHAR(100),
    volume_collected INTEGER,
    percentage DECIMAL(5,2),
    timestamp TIMESTAMP,
    duration_minutes INTEGER,
    notes TEXT,
    FOREIGN KEY (bin_id) REFERENCES poubelles(bin_id)
);

CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    bin_id VARCHAR(50),
    location VARCHAR(255),
    prediction_date TIMESTAMP,
    predicted_fill_level DECIMAL(5,2),
    confidence DECIMAL(5,2),
    recommended_collection VARCHAR(10),
    generated_at TIMESTAMP,
    FOREIGN KEY (bin_id) REFERENCES poubelles(bin_id)
);

CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    phone_number VARCHAR(20)
);
""")
            
            # Insert Data
            f.write("\n-- ===== DONNÉES =====\n\n")
            
            if donnees['poubelles']:
                f.write("-- Poubelles\n")
                for p in donnees['poubelles']:
                    values = [
                        p.get('bin_id'), p.get('location'), p.get('address'),
                        p.get('fill_level'), p.get('capacity'), p.get('current_volume'),
                        p.get('battery'), p.get('temperature'), p.get('signal_quality'),
                        p.get('status'), p.get('latitude'), p.get('longitude'),
                        p.get('last_collection'), p.get('last_update'), p.get('created_at')
                    ]
                    values_str = ', '.join([f"'{v}'" if isinstance(v, str) else str(v) if v is not None else 'NULL' for v in values])
                    f.write(f"INSERT INTO poubelles VALUES ({values_str});\n")
            
            if donnees['historiques']:
                f.write("\n-- Historiques\n")
                for h in donnees['historiques'][:100]:  # Limiter pour taille fichier
                    values = [
                        h.get('bin_id'), h.get('location'), h.get('operator'),
                        h.get('volume_collected'), h.get('percentage'), h.get('timestamp'),
                        h.get('duration_minutes'), h.get('notes')
                    ]
                    values_str = ', '.join([f"'{v}'" if isinstance(v, str) else str(v) if v is not None else 'NULL' for v in values])
                    f.write(f"INSERT INTO historiques (bin_id, location, operator, volume_collected, percentage, timestamp, duration_minutes, notes) VALUES ({values_str});\n")
        
        print(f" SQL Dump exporté: {filename}")
        return filename
    
    # ========== EXPORT TOUS LES FORMATS ==========
    def exporter_tous_formats(self) -> Dict[str, str]:
        """Exporte dans tous les formats disponibles"""
        resultats = {
            'json': self.exporter_json(),
            'csv': self.exporter_csv(),
            'sqlite': self.exporter_sqlite(),
            'sql': self.exporter_sql_dump(),
        }
        
        # Essayer Excel
        try:
            resultats['excel'] = self.exporter_excel()
        except Exception as e:
            print(f"  Excel non disponible: {e}")
        
        return resultats
    
    def exporter_en_memoire_json(self) -> str:
        """Retourne JSON en tant que string (pour API)"""
        donnees = self.recuperer_donnees()
        donnees = self.nettoyer_donnees(donnees)
        return json.dumps(donnees, ensure_ascii=False, indent=2)
    
    def exporter_en_memoire_csv(self, table: str) -> str:
        """Retourne un CSV en tant que string"""
        donnees = self.recuperer_donnees()
        donnees = self.nettoyer_donnees(donnees)
        
        if table not in donnees or not donnees[table]:
            return ""
        
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=donnees[table][0].keys())
        writer.writeheader()
        writer.writerows(donnees[table])
        
        return output.getvalue()

def main():
    print("\n" + "="*70)
    print(" SYSTÈME D'EXPORT MULTI-FORMAT - GESTION DES DÉCHETS")
    print("="*70)
    
    exporteur = ExporteurRapports()
    
    if not exporteur.db:
        print(" Impossible de se connecter à MongoDB")
        sys.exit(1)
    
    print("\n Exécution des exports...")
    resultats = exporteur.exporter_tous_formats()
    
    print("\n" + "="*70)
    print(" RÉSUMÉ DES EXPORTS")
    print("="*70)
    
    for format_name, filepath in resultats.items():
        if filepath:
            size = os.path.getsize(filepath) if os.path.exists(filepath) else 0
            size_mb = size / (1024 * 1024)
            print(f" {format_name.upper():8} → {filepath}")
            print(f"   Taille: {size_mb:.2f} MB")

if __name__ == "__main__":
    main()
