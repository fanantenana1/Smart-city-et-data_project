"""
Script pour assigner des poubelles aux utilisateurs de test
À exécuter après le démarrage du serveur pour créer des assignations de test
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"

def login_as_admin():
    """Se connecte en tant qu'admin et retourne le token"""
    response = requests.post(
        f"{BASE_URL}/login",
        json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Connexion admin réussie")
        return data["access_token"]
    else:
        print(f"❌ Erreur de connexion: {response.status_code}")
        print(response.text)
        return None

def get_all_bins(token):
    """Récupère toutes les poubelles disponibles"""
    response = requests.get(
        f"{BASE_URL}/bins",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        bins = response.json()
        print(f"✅ {len(bins)} poubelles trouvées")
        return bins
    else:
        print(f"❌ Erreur récupération poubelles: {response.status_code}")
        return []

def assign_bin_to_user(token, username, bin_id):
    """Assigne une poubelle à un utilisateur"""
    response = requests.post(
        f"{BASE_URL}/users/{username}/bins/{bin_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        print(f"  ✓ {bin_id} assignée à {username}")
        return True
    else:
        print(f"  ✗ Erreur assignation {bin_id} à {username}: {response.status_code}")
        return False

def main():
    """Fonction principale"""
    print("\n" + "="*60)
    print("SCRIPT D'ASSIGNATION DES POUBELLES AUX UTILISATEURS")
    print("="*60 + "\n")
    
    # 1. Connexion admin
    token = login_as_admin()
    if not token:
        print("Impossible de continuer sans token admin")
        return
    
    # 2. Récupérer toutes les poubelles
    bins = get_all_bins(token)
    if not bins:
        print("Aucune poubelle disponible")
        return
    
    # Créer une liste des bin_ids
    bin_ids = [bin["bin_id"] for bin in bins]
    print(f"\nPoubelles disponibles: {', '.join(bin_ids[:10])}{'...' if len(bin_ids) > 10 else ''}")
    
    # 3. Définir les assignations
    assignations = {
        "simpleuser1": bin_ids[0:3] if len(bin_ids) >= 3 else bin_ids,  # 3 premières poubelles
        "user1": bin_ids[3:6] if len(bin_ids) >= 6 else bin_ids[1:4],    # 3 suivantes
        "user2": bin_ids[6:9] if len(bin_ids) >= 9 else bin_ids[2:5],    # 3 suivantes
        "da": bin_ids[0:5] if len(bin_ids) >= 5 else bin_ids,            # 5 premières
        "collector1": bin_ids[0:10] if len(bin_ids) >= 10 else bin_ids,  # 10 premières
        "collector2": bin_ids[10:20] if len(bin_ids) >= 20 else bin_ids[5:], # 10 suivantes
    }
    
    print(f"\n" + "="*60)
    print("ASSIGNATIONS PRÉVUES:")
    print("="*60)
    for username, bins_to_assign in assignations.items():
        print(f"\n👤 {username}: {len(bins_to_assign)} poubelles")
        print(f"   Poubelles: {', '.join(bins_to_assign)}")
    
    # 4. Effectuer les assignations
    print(f"\n" + "="*60)
    print("EXÉCUTION DES ASSIGNATIONS:")
    print("="*60 + "\n")
    
    success_count = 0
    fail_count = 0
    
    for username, bins_to_assign in assignations.items():
        print(f"\n📌 Assignation pour {username}:")
        for bin_id in bins_to_assign:
            if assign_bin_to_user(token, username, bin_id):
                success_count += 1
            else:
                fail_count += 1
    
    # 5. Résumé
    print(f"\n" + "="*60)
    print("RÉSUMÉ:")
    print("="*60)
    print(f"✅ Assignations réussies: {success_count}")
    print(f"❌ Assignations échouées: {fail_count}")
    print(f"📊 Total: {success_count + fail_count}")
    print("\n" + "="*60 + "\n")
    
    # 6. Vérification pour un utilisateur
    print("🔍 Vérification pour 'simpleuser1':")
    print("="*60)
    
    # Se connecter en tant que simpleuser1
    response = requests.post(
        f"{BASE_URL}/login",
        json={"username": "simpleuser1", "password": "password"}
    )
    
    if response.status_code == 200:
        user_token = response.json()["access_token"]
        
        # Récupérer ses poubelles assignées
        response = requests.get(
            f"{BASE_URL}/user/assigned-bins",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        if response.status_code == 200:
            assigned = response.json()
            print(f"✅ simpleuser1 a {len(assigned)} poubelles assignées:")
            for bin in assigned:
                print(f"   - {bin['bin_id']}: {bin['location']} ({bin['fill_level']}%)")
        else:
            print(f"❌ Erreur récupération poubelles: {response.status_code}")
    else:
        print(f"❌ Erreur connexion simpleuser1: {response.status_code}")
    
    print("\n" + "="*60)
    print("SCRIPT TERMINÉ")
    print("="*60 + "\n")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ ERREUR FATALE: {e}")
        import traceback
        traceback.print_exc()