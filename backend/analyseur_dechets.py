#!/usr/bin/env python3
"""
Module d'analyse et de prédiction des données de déchets
Avec visualisations en Malagasy
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
import json
from pymongo import MongoClient
from collections import defaultdict
from statistics import mean, median, stdev

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

DB_NAME = 'DaB_Poubelles'

class AnalyseurDechets:
    """Analyseur pour les données de déchets avec support Malagasy"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self):
        """Connexion à MongoDB"""
        uri = get_mongodb_uri()
        if uri:
            try:
                self.client = MongoClient(uri, serverSelectionTimeoutMS=10000)
                self.client.admin.command('ping')
                self.db = self.client[DB_NAME]
                print("✅ Connecté à MongoDB")
            except Exception as e:
                print(f"❌ Erreur connexion MongoDB: {e}")
    
    def analyser_par_periode(self, start_date=None, end_date=None):
        """Analyse les données par période"""
        if not self.db:
            return None
        
        if not start_date:
            start_date = datetime.now() - timedelta(days=180)
        if not end_date:
            end_date = datetime.now()
        
        history = self.db['historiques'].find({
            'timestamp': {
                '$gte': start_date.isoformat(),
                '$lte': end_date.isoformat()
            }
        })
        
        return list(history)
    
    def calculer_statistiques(self, data):
        """Calcule les statistiques détaillées"""
        if not data:
            return {}
        
        stats = {
            'total_collectes': len(data),
            'volume_total_litres': sum(d['volume_collected'] for d in data),
            'volume_moyen_litres': mean([d['volume_collected'] for d in data]),
            'volume_median_litres': median([d['volume_collected'] for d in data]),
            'volume_max_litres': max(d['volume_collected'] for d in data),
            'volume_min_litres': min(d['volume_collected'] for d in data),
        }
        
        volumes = [d['volume_collected'] for d in data]
        if len(volumes) > 1:
            stats['ecart_type_litres'] = stdev(volumes)
        
        return stats
    
    def analyser_par_poubelle(self):
        """Analyse détaillée par poubelle"""
        if not self.db:
            return {}
        
        bins = list(self.db['poubelles'].find({}))
        history = list(self.db['historiques'].find({}))
        
        analyse = {}
        for bin_data in bins:
            bin_id = bin_data['bin_id']
            bin_history = [h for h in history if h['bin_id'] == bin_id]
            
            if bin_history:
                stats = self.calculer_statistiques(bin_history)
                analyse[bin_id] = {
                    'location': bin_data['location'],
                    'address': bin_data['address'],
                    'capacity': bin_data['capacity'],
                    'current_fill_level': bin_data.get('fill_level', 0),
                    'current_volume': bin_data.get('current_volume', 0),
                    'statistics': stats,
                    'last_collection': bin_history[-1]['timestamp'] if bin_history else None,
                }
        
        return analyse
    
    def generer_alertes(self):
        """Génère les alertes prioritaires"""
        if not self.db:
            return []
        
        bins = list(self.db['poubelles'].find({}))
        alertes = []
        
        for bin_data in bins:
            fill_level = bin_data.get('fill_level', 0)
            
            if fill_level >= 95:
                severity = "CRITIQUE"
                priorite = 1
            elif fill_level >= 85:
                severity = "URGENT"
                priorite = 2
            elif fill_level >= 70:
                severity = "IMPORTANT"
                priorite = 3
            else:
                continue
            
            alertes.append({
                'bin_id': bin_data['bin_id'],
                'location': bin_data['location'],
                'fill_level': fill_level,
                'volume': bin_data.get('current_volume', 0),
                'capacity': bin_data['capacity'],
                'severity': severity,
                'priorite': priorite,
                'battery': bin_data.get('battery', 0),
                'timestamp': datetime.now().isoformat(),
            })
        
        # Trier par priorité
        alertes.sort(key=lambda x: x['priorite'])
        return alertes
    
    def predire_collectes(self, jours_avance=30):
        """Prédit les besoins de collecte pour les jours à venir"""
        if not self.db:
            return {}
        
        bins = list(self.db['poubelles'].find({}))
        history = list(self.db['historiques'].find({}))
        
        predictions = {}
        now = datetime.now()
        
        for bin_data in bins:
            bin_id = bin_data['bin_id']
            bin_history = [h for h in history if h['bin_id'] == bin_id]
            
            if len(bin_history) >= 3:
                # Calculer le taux de remplissage moyen par jour
                volumes = [h['volume_collected'] for h in bin_history[-10:]]
                taux_remplissage = mean(volumes) / bin_data['capacity'] * 100 / 7  # Par jour
                
                # Prédire les dates de collecte
                collectes_predites = []
                current_fill = bin_data.get('fill_level', 0)
                
                for jour in range(1, jours_avance + 1):
                    fill_pred = current_fill + (taux_remplissage * jour)
                    if fill_pred >= 90:
                        collectes_predites.append({
                            'date': (now + timedelta(days=jour)).isoformat(),
                            'fill_level_predicted': min(95, fill_pred),
                            'days_until': jour,
                        })
                        if len(collectes_predites) >= 3:
                            break
                
                predictions[bin_id] = {
                    'location': bin_data['location'],
                    'collectes_predites': collectes_predites,
                    'taux_remplissage_moyen': round(taux_remplissage, 2),
                }
        
        return predictions
    
    def generer_rapport_malagasy(self):
        """Génère un rapport complet en Malagasy"""
        rapport = {
            'titre': '📊 RAPPORT D\'ANALYSE - SYSTÈME DE GESTION DES DÉCHETS',
            'sous_titre': 'Fitentin\'ny Tahiry Samihafa - Fokontany sy Tanàna',
            'date_generation': datetime.now().isoformat(),
            'periode': {
                'start': (datetime.now() - timedelta(days=180)).isoformat(),
                'end': datetime.now().isoformat(),
                'description': 'Endriky ny 6 volana farany'
            },
            'sections': {}
        }
        
        # Section 1: Analyse générale
        all_data = self.analyser_par_periode()
        if all_data:
            stats = self.calculer_statistiques(all_data)
            rapport['sections']['analise_general'] = {
                'titre': '📈 ANALISE ANKAPOBENY',
                'description': 'Karazany momba ny fiangon\'ny fiangonana',
                'statistiques': {
                    'Isan\'ny fiangon\'ny tahiry': stats.get('total_collectes', 0),
                    'Volan\'ny fiterin\'ny kateza': f"{stats.get('volume_total_litres', 0):,.0f} L",
                    'Vola afovoany': f"{stats.get('volume_moyen_litres', 0):,.0f} L",
                    'Vola faran\'ny ambony': f"{stats.get('volume_max_litres', 0):,.0f} L",
                    'Vola faran\'ny ifampitsarana': f"{stats.get('volume_min_litres', 0):,.0f} L",
                }
            }
        
        # Section 2: Analyse par poubelle
        analyse_bins = self.analyser_par_poubelle()
        if analyse_bins:
            poubelles_list = []
            for bin_id, data in sorted(analyse_bins.items()):
                poubelles_list.append({
                    'id': bin_id,
                    'tokoa': data['location'],
                    'adiresy': data['address'],
                    'efitra': data['capacity'],
                    'feno_ankehitriny': f"{data['current_fill_level']:.1f}%",
                    'volana': data['current_volume'],
                    'isan\'ny fiangon\'ny farany': data['statistics'].get('total_collectes', 0),
                    'vola_feno_afovoany': f"{data['statistics'].get('volume_moyen_litres', 0):.0f} L",
                })
            
            rapport['sections']['analise_tahiry'] = {
                'titre': '🗑️ ANALISE ISY NY TAHIRY',
                'description': 'Karazambositra sy toe-drafitra roa avy',
                'poubelles': poubelles_list,
                'isan_poubelles': len(analyse_bins),
            }
        
        # Section 3: Alertes
        alertes = self.generer_alertes()
        if alertes:
            rapport['sections']['fampilalam-pisalampi'] = {
                'titre': '🚨 FAMPILARAM-PISALAMPI AORIAN\'NY FIKAMBANANA',
                'description': 'Famalisim-pisalampi mifototra amin\'ny strata feno',
                'alertes': []
            }
            
            for alerte in alertes[:10]:  # Top 10
                rapport['sections']['fampilaram-pisalampi']['alertes'].append({
                    'tahiry': alerte['location'],
                    'feno': f"{alerte['fill_level']:.1f}%",
                    'fahamafazana': alerte['severity'],
                    'vola_feno': f"{alerte['volume']} / {alerte['capacity']} L",
                })
        
        # Section 4: Prédictions
        predictions = self.predire_collectes()
        if predictions:
            predictions_list = []
            for bin_id, pred in list(predictions.items())[:10]:
                if pred['collectes_predites']:
                    predictions_list.append({
                        'tahiry': pred['location'],
                        'taux_remplissage': f"{pred['taux_remplissage_moyen']:.2f}% isan\'ariva",
                        'fiangon_aorian': pred['collectes_predites'][0]['date'].split('T')[0],
                    })
            
            rapport['sections']['vinavina'] = {
                'titre': '🔮 VINAVINAM-PIKAROHANA',
                'description': 'Vinavina momba ny fiangon\'ny tahiry amin\'ny androm-pikarohana',
                'predictions': predictions_list,
            }
        
        return rapport
    
    def exporter_rapport_json(self, rapport, filename=None):
        """Exporte le rapport en JSON"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"rapport_dechets_{timestamp}.json"
        
        filepath = os.path.join(os.path.dirname(__file__), 'rapports', filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(rapport, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Rapport exporté: {filepath}")
        return filepath

def main():
    print("\n" + "="*70)
    print("🔍 ANALYSEUR DE DONNÉES - SYSTÈME DE GESTION DES DÉCHETS")
    print("="*70)
    
    analyseur = AnalyseurDechets()
    
    if not analyseur.db:
        print("❌ Impossible de se connecter à MongoDB")
        sys.exit(1)
    
    # Générer le rapport
    print("\n📊 Génération du rapport d'analyse...")
    rapport = analyseur.generer_rapport_malagasy()
    
    # Afficher un aperçu
    print("\n" + "="*70)
    print(rapport['titre'])
    print(f"Date: {rapport['date_generation']}")
    print("="*70)
    
    for section_key, section in rapport['sections'].items():
        print(f"\n{section['titre']}")
        print(f"Description: {section['description']}")
        
        if section_key == 'analise_general' and 'statistiques' in section:
            for stat_key, stat_val in section['statistiques'].items():
                print(f"  • {stat_key}: {stat_val}")
        
        elif section_key == 'analise_tahiry' and 'poubelles' in section:
            print(f"  Isan\'ny tahiry: {section['isan_poubelles']}")
            for p in section['poubelles'][:3]:
                print(f"    - {p['tokoa']}: {p['feno_ankehitriny']} feno, {p['vola_feno_afovoany']} afovoany")
        
        elif section_key == 'fampilaram-pisalampi' and 'alertes' in section:
            for alerte in section['alertes'][:3]:
                print(f"    - {alerte['tahiry']}: {alerte['feno']} ({alerte['fahamafazana']})")
        
        elif section_key == 'vinavina' and 'predictions' in section:
            for pred in section['predictions'][:3]:
                print(f"    - {pred['tahiry']}: Fiangon\'y {pred['fiangon_aorian']}")
    
    # Exporter
    print("\n💾 Exportation du rapport...")
    analyseur.exporter_rapport_json(rapport)
    
    print("\n✅ Rapport généré avec succès!")

if __name__ == "__main__":
    main()
