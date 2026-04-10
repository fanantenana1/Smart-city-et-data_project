#!/usr/bin/env python3
"""
Générateur de données massives avec historiques et prédictions
Système de Gestion Intelligente des Déchets - Madagascar
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
import random
import json
from pymongo import MongoClient
from urllib.parse import quote_plus

# Import des données Malagasy
from data_malagasy import BINS_DATA, OPERATORS_MALAGASY, COLLECTION_NOTES, GENERATION_CONFIG

# Configuration MongoDB
def get_mongodb_uri():
    cle_path = os.path.join(os.path.dirname(__file__), 'cle.txt')
    if os.path.exists(cle_path):
        with open(cle_path, 'r', encoding='utf-8') as f:
            for line in f:
                if 'mongodb' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        return parts[1].strip()
    return None

MONGODB_URI = get_mongodb_uri()
DB_NAME = 'DaB_Poubelles'
BINS_COLLECTION = 'poubelles'
HISTORY_COLLECTION = 'historiques'
PREDICTIONS_COLLECTION = 'predictions'

# Utilise les données du fichier séparé
LOCATIONS_MADAGASCAR = BINS_DATA

def generate_bins_data():
    """Génère les données des poubelles avec capteurs"""
    bins = []
    for loc in LOCATIONS_MADAGASCAR:
        bin_data = {
            "bin_id": loc["id"],
            "location": loc["location"],
            "address": loc["address"],
            "capacity": loc["capacity"],
            "latitude": loc["lat"],
            "longitude": loc["lon"],
            "fill_level": random.uniform(20, 95),
            "current_volume": 0,
            "battery": random.uniform(50, 100),
            "temperature": random.uniform(20, 35),
            "signal_quality": random.choice(["Excellent", "Bon", "Moyen", "Faible"]),
            "last_collection": (datetime.now() - timedelta(days=random.randint(1, 7))).isoformat(),
            "status": "normal",
            "created_at": (datetime.now() - timedelta(days=random.randint(30, 180))).isoformat(),
            "last_update": datetime.now().isoformat(),
        }
        bin_data["current_volume"] = int((bin_data["fill_level"] / 100.0) * bin_data["capacity"])
        bins.append(bin_data)
    return bins

def generate_collection_history(bins_data):
    """Génère l'historique de collecte pour les 6 derniers mois avec noms Malagasy"""
    history = []
    start_date = datetime.now() - timedelta(days=GENERATION_CONFIG['start_date_days_ago'])
    
    # Utilise les opérateurs du fichier de données
    malagasy_operators = OPERATORS_MALAGASY
    
    # Utilise les notes du fichier de données
    collection_notes = COLLECTION_NOTES
    
    for bin_data in bins_data:
        bin_id = bin_data["id"]
        capacity = bin_data["capacity"]
        
        # Générer collectes selon la config
        min_collections, max_collections = GENERATION_CONFIG['collections_per_bin']
        num_collections = random.randint(min_collections, max_collections)
        for i in range(num_collections):
            collection_date = start_date + timedelta(days=random.randint(0, GENERATION_CONFIG['start_date_days_ago']))
            volume_collected = random.randint(int(capacity * 0.6), int(capacity * 0.95))
            percentage = (volume_collected / capacity) * 100
            
            history.append({
                "bin_id": bin_id,
                "location": bin_data["location"],
                "operator": random.choice(malagasy_operators),
                "volume_collected": volume_collected,
                "percentage": round(percentage, 2),
                "timestamp": collection_date.isoformat(),
                "duration_minutes": random.randint(5, 25),
                "notes": random.choice(collection_notes)
            })
    
    # Trier par date
    history.sort(key=lambda x: x["timestamp"])
    return history

def generate_predictions(bins_data, history):
    """Génère des prédictions basées sur les données historiques"""
    predictions = []
    
    for bin_data in bins_data:
        bin_id = bin_data["bin_id"]
        bin_history = [h for h in history if h["bin_id"] == bin_id]
        
        if bin_history:
            # Calculer les statistiques
            volumes = [h["volume_collected"] for h in bin_history]
            avg_volume = sum(volumes) / len(volumes)
            max_volume = max(volumes)
            min_volume = min(volumes)
            
            # Calculer la fréquence de collecte moyenne
            if len(bin_history) > 1:
                dates = sorted([datetime.fromisoformat(h["timestamp"]) for h in bin_history])
                intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
                avg_days_between = sum(intervals) / len(intervals)
            else:
                avg_days_between = 7
            
            # Générer prédictions pour les 30 jours à venir
            for day in range(1, 31):
                pred_date = datetime.now() + timedelta(days=day)
                # Formule de prédiction simple : base + tendance + aléatoire
                predicted_fill = 30 + (avg_volume / bin_data["capacity"]) * 100 + random.uniform(-10, 10)
                predicted_fill = max(0, min(100, predicted_fill))
                
                predictions.append({
                    "bin_id": bin_id,
                    "location": bin_data["location"],
                    "prediction_date": pred_date.isoformat(),
                    "predicted_fill_level": round(predicted_fill, 2),
                    "confidence": round(random.uniform(75, 95), 2),
                    "recommended_collection": "Oui" if predicted_fill > 80 else "Non",
                    "average_volume": round(avg_volume, 2),
                    "estimated_days_until_full": max(1, int((100 - bin_data["fill_level"]) / ((predicted_fill - bin_data["fill_level"]) / day)) if day > 0 else 7),
                    "generated_at": datetime.now().isoformat()
                })
    
    return predictions

def save_to_mongodb(bins, history, predictions):
    """Sauvegarde les données dans MongoDB"""
    print("Connexion à MongoDB...")
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
        client.admin.command('ping')
        print(" Connecté à MongoDB")
        
        db = client[DB_NAME]
        
        # Mettre à jour les poubelles
        print(f"\n Insertion de {len(bins)} poubelles...")
        bins_col = db[BINS_COLLECTION]
        for bin_data in bins:
            bins_col.update_one(
                {"bin_id": bin_data["bin_id"]},
                {"$set": bin_data},
                upsert=True
            )
        print(f" {len(bins)} poubelles insérées/mises à jour")
        
        # Insérer l'historique
        print(f"\n Insertion de {len(history)} enregistrements d'historique...")
        history_col = db[HISTORY_COLLECTION]
        history_col.delete_many({})  # Nettoyer avant
        if history:
            history_col.insert_many(history)
        print(f"{len(history)} enregistrements d'historique insérés")
        
        # Insérer les prédictions
        print(f"\n Insertion de {len(predictions)} prédictions...")
        pred_col = db[PREDICTIONS_COLLECTION]
        pred_col.delete_many({})  # Nettoyer avant
        if predictions:
            pred_col.insert_many(predictions)
        print(f" {len(predictions)} prédictions insérées")
        
        # Statistiques
        print("\n" + "="*60)
        print(" STATISTIQUES GÉNÉRÉES")
        print("="*60)
        print(f"Poubelles: {bins_col.count_documents({})}")
        print(f"Historique: {history_col.count_documents({})}")
        print(f"Prédictions: {pred_col.count_documents({})}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f" Erreur MongoDB: {e}")
        return False

if __name__ == "__main__":
    print("\n" + "="*60)
    print(" GÉNÉRATEUR DE DONNÉES MASSIVES")
    print("Système de Gestion Intelligente des Déchets - Madagascar")
    print("="*60)
    
    if not MONGODB_URI:
        print(" Impossible de lire MongoDB URI depuis cle.txt")
        sys.exit(1)
    
    print(f" URI: {MONGODB_URI[:50]}...")
    
    # Générer les données
    print("\n Génération des données...")
    bins_data = generate_bins_data()
    print(f" {len(bins_data)} poubelles générées")
    
    print("\n Génération de l'historique de collecte...")
    collection_history = generate_collection_history(bins_data)
    print(f" {len(collection_history)} collectes générées")
    
    print("\n Génération des prédictions...")
    predictions = generate_predictions(bins_data, collection_history)
    print(f" {len(predictions)} prédictions générées")
    
    # Sauvegarder dans MongoDB
    if save_to_mongodb(bins_data, collection_history, predictions):
        print("\n Données massives générées et synchronisées avec succès!")
    else:
        print("\n Erreur lors de la synchronisation")
        sys.exit(1)
