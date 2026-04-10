#!/usr/bin/env python3
"""
Script de diagnostic pour tester la connexion à MongoDB et les endpoints
"""
import requests
import json

API_BASE = "http://localhost:8000"

def test_health():
    """Test l'endpoint de santé"""
    print("\n" + "="*60)
    print(" TEST 1: Health Check")
    print("="*60)
    try:
        response = requests.get(f"{API_BASE}/api/health", timeout=5)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f" Serveur actif")
            print(f"   - Bins count: {data.get('bins_count', 0)}")
            print(f"   - Alerts count: {data.get('alerts_count', 0)}")
            print(f"   - Connections: {data.get('connections', 0)}")
            return True
        else:
            print(f" Erreur: {response.status_code}")
            return False
    except Exception as e:
        print(f" Erreur de connexion: {e}")
        return False

def test_bins():
    """Test l'endpoint des poubelles"""
    print("\n" + "="*60)
    print(" TEST 2: Récupération des Poubelles")
    print("="*60)
    try:
        response = requests.get(f"{API_BASE}/api/bins", timeout=5)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            bins = response.json()
            print(f" {len(bins)} poubelles récupérées")
            if bins:
                print("\nDétails des poubelles:")
                for bin_data in bins[:3]:  # Afficher seulement les 3 premières
                    print(f"\n   📍 {bin_data.get('bin_id', 'N/A')}")
                    print(f"      Location: {bin_data.get('location', 'N/A')}")
                    print(f"      Fill Level: {bin_data.get('fill_level', 0)}%")
                    print(f"      Status: {bin_data.get('status', 'N/A')}")
                if len(bins) > 3:
                    print(f"\n   ... et {len(bins) - 3} autres poubelles")
                return True
            else:
                print("  Liste vide retournée")
                return False
        else:
            print(f" Erreur: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f" Erreur: {e}")
        return False

def test_statistics():
    """Test l'endpoint des statistiques"""
    print("\n" + "="*60)
    print(" TEST 3: Récupération des Statistiques")
    print("="*60)
    try:
        response = requests.get(f"{API_BASE}/api/statistics", timeout=5)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            stats = response.json()
            print(f" Statistiques récupérées:")
            print(f"   - Total bins: {stats.get('total_bins', 0)}")
            print(f"   - Active bins: {stats.get('active_bins', 0)}")
            print(f"   - Total collections: {stats.get('total_collections', 0)}")
            print(f"   - Active alerts: {stats.get('active_alerts', 0)}")
            print(f"   - Efficiency: {stats.get('efficiency', 0)}%")
            print(f"   - Avg fill rate: {stats.get('avg_fill_rate', 0)}%")
            return True
        else:
            print(f" Erreur: {response.status_code}")
            return False
    except Exception as e:
        print(f" Erreur: {e}")
        return False

def test_seed():
    """Test le seeding des données"""
    print("\n" + "="*60)
    print(" TEST 4: Seeding des Données")
    print("="*60)
    try:
        response = requests.post(f"{API_BASE}/api/seed", timeout=10)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f" {result.get('message', 'Done')}")
            return True
        else:
            print(f" Erreur: {response.status_code}")
            return False
    except Exception as e:
        print(f" Erreur: {e}")
        return False

def main():
    print("\n" + "="*60)
    print(" DIAGNOSTIC API SMARTWASTE")
    print("="*60)
    
    # Test 1: Health check
    if not test_health():
        print("\n Le serveur ne répond pas. Vérifiez qu'il est démarré.")
        return
    
    # Test 2: Bins
    bins_ok = test_bins()
    
    # Si pas de bins, essayer de seed
    if not bins_ok:
        print("\n  Aucune poubelle trouvée. Tentative de seeding...")
        if test_seed():
            print("\n Nouvelle tentative de récupération des poubelles...")
            bins_ok = test_bins()
    
    # Test 3: Statistics
    test_statistics()
    
    # Résumé
    print("\n" + "="*60)
    print(" RÉSUMÉ")
    print("="*60)
    if bins_ok:
        print("L'API fonctionne correctement")
        print("\nPour déboguer le frontend:")
        print("1. Ouvrez la console du navigateur (F12)")
        print("2. Vérifiez les erreurs réseau dans l'onglet 'Network'")
        print("3. Vérifiez les erreurs JavaScript dans l'onglet 'Console'")
    else:
        print(" L'API ne retourne pas de données")
        print("\nActions recommandées:")
        print("1. Vérifiez les logs du serveur FastAPI")
        print("2. Vérifiez la connexion MongoDB")
        print("3. Vérifiez le fichier cle.txt")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()