"""
Script pour insérer les données d'exemple dans MongoDB
- Administrateur et utilisateurs simples dans collection "users"
- Poubelles dans collection "poubelles"
"""

import os
import sys
from datetime import datetime
from pymongo import MongoClient
from urllib.parse import urlsplit, urlunsplit, quote_plus

def read_mongo_uri():
    """Lire l'URI MongoDB depuis cle.txt"""
    try:
        cle_path = os.path.join(os.path.dirname(__file__), 'cle.txt')
        if os.path.exists(cle_path):
            with open(cle_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if 'mongodb' in line.lower():
                        parts = line.split(':', 1)
                        if len(parts) == 2:
                            return parts[1].strip()
                        return line.strip()
    except Exception as e:
        print(f"Erreur lecture cle.txt: {e}")
    return None

def main():
    uri = read_mongo_uri()
    if not uri:
        print("❌ Erreur: URI MongoDB non trouvé dans cle.txt")
        sys.exit(1)

    print("📚 Connexion à MongoDB...")
    
    try:
        # Encoder les credentials si nécessaire
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
        except Exception as e:
            print(f"⚠️ Erreur encoding: {e}")

        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("✅ Connexion réussie!")
        
        db = client['DaB_Poubelles']
        
        # ===== COLLECTION UTILISATEURS =====
        users_col = db['users']
        if 'users' in db.list_collection_names():
            print("⚠️ Collection 'users' existe. Suppression...")
            users_col.drop()
        
        admin_user = {
            'username': 'admin',
            'email': 'admin@smartwaste.com',
            'password_hash': 'admin123',
            'full_name': 'Administrateur System',
            'role': 'admin',
            'is_active': True,
            'is_approved': True,
            'created_at': datetime.now().isoformat(),
            'last_login': None,
            'assigned_bins': []
        }
        
        simple_users = [
            {
                'username': 'collector1',
                'email': 'collector1@smartwaste.com',
                'password_hash': 'collector123',
                'full_name': 'Jean Collector',
                'role': 'collector',
                'is_active': True,
                'is_approved': True,
                'created_at': datetime.now().isoformat(),
                'last_login': None,
                'assigned_bins': []
            },
            {
                'username': 'collector2',
                'email': 'collector2@smartwaste.com',
                'password_hash': 'collector123',
                'full_name': 'Marie Collector',
                'role': 'collector',
                'is_active': True,
                'is_approved': True,
                'created_at': datetime.now().isoformat(),
                'last_login': None,
                'assigned_bins': []
            },
            {
                'username': 'user1',
                'email': 'user1@smartwaste.com',
                'password_hash': 'user123',
                'full_name': 'Robert User',
                'role': 'simple_user',
                'is_active': True,
                'is_approved': True,
                'created_at': datetime.now().isoformat(),
                'last_login': None,
                'assigned_bins': []
            },
            {
                'username': 'user2',
                'email': 'user2@smartwaste.com',
                'password_hash': 'user123',
                'full_name': 'Sophie User',
                'role': 'simple_user',
                'is_active': True,
                'is_approved': False,
                'created_at': datetime.now().isoformat(),
                'last_login': None,
                'assigned_bins': []
            }
        ]
        
        admin_result = users_col.insert_one(admin_user)
        print(f"✅ Administrateur inséré: admin")
        
        users_result = users_col.insert_many(simple_users)
        print(f"✅ {len(users_result.inserted_ids)} utilisateurs insérés")
        
        # ===== COLLECTION POUBELLES =====
        bins_col = db['poubelles']
        if 'poubelles' in db.list_collection_names():
            print("⚠️ Collection 'poubelles' existe. Suppression...")
            bins_col.drop()
        
        sample_bins = [
            {
                'bin_id': 'PBL-1',
                'location': "Avenue de l'Indépendance",
                'address': "Avenue de l'Indépendance, Isotry, Fianarantsoa",
                'fill_level': 100.0,
                'capacity': 240,
                'current_volume': 240,
                'battery': 0.0,
                'temperature': 28.5,
                'signal_quality': 'Bon (+51 dBm)',
                'latitude': -21.4531,
                'longitude': 47.0856,
                'last_collection': None,
                'status': 'critical',
                'last_update': datetime.now().isoformat()
            },
            {
                'bin_id': 'PBL-2',
                'location': 'Quartier Ankadifotsy',
                'address': 'Quartier Ankadifotsy, Fianarantsoa',
                'fill_level': 65.0,
                'capacity': 240,
                'current_volume': 156,
                'battery': 45.0,
                'temperature': 27.0,
                'signal_quality': 'Bon (+38 dBm)',
                'latitude': -21.4512,
                'longitude': 47.0923,
                'last_collection': None,
                'status': 'normal',
                'last_update': datetime.now().isoformat()
            },
            {
                'bin_id': 'PBL-3',
                'location': 'Rue Rainandriamampandry',
                'address': 'Rue Rainandriamampandry, Fianarantsoa',
                'fill_level': 95.0,
                'capacity': 240,
                'current_volume': 228,
                'battery': 82.0,
                'temperature': 29.0,
                'signal_quality': 'Excellent (+42 dBm)',
                'latitude': -21.4445,
                'longitude': 47.0812,
                'last_collection': None,
                'status': 'normal',
                'last_update': datetime.now().isoformat()
            },
            {
                'bin_id': 'PBL-4',
                'location': 'Gare Routière',
                'address': 'Gare Routière centrale, Fianarantsoa',
                'fill_level': 45.0,
                'capacity': 240,
                'current_volume': 108,
                'battery': 92.0,
                'temperature': 26.0,
                'signal_quality': 'Bon (+40 dBm)',
                'latitude': -21.449,
                'longitude': 47.078,
                'last_collection': None,
                'status': 'normal',
                'last_update': datetime.now().isoformat()
            },
            {
                'bin_id': 'PBL-5',
                'location': 'Marché Zoma',
                'address': 'Rue Zanahary, Marché Zoma, Fianarantsoa',
                'fill_level': 72.0,
                'capacity': 240,
                'current_volume': 173,
                'battery': 55.0,
                'temperature': 31.0,
                'signal_quality': 'Moyen (+32 dBm)',
                'latitude': -21.4505,
                'longitude': 47.0895,
                'last_collection': None,
                'status': 'normal',
                'last_update': datetime.now().isoformat()
            }
        ]
        
        bins_result = bins_col.insert_many(sample_bins)
        print(f"✅ {len(bins_result.inserted_ids)} poubelles insérées")
        
        # ===== AFFICHER RÉSUMÉ =====
        print("\n" + "="*60)
        print("📊 RÉSUMÉ DES DONNÉES INSÉRÉES")
        print("="*60)
        
        print(f"\n👥 Utilisateurs ({users_col.count_documents({})}):")
        for user in users_col.find({}, {'_id': 0, 'password_hash': 0}):
            role = user.get('role', 'user')
            approved = "✅" if user.get('is_approved') else "❌"
            print(f"  {approved} {user['username']} ({role}) - {user['full_name']}")
        
        print(f"\n🗑️ Poubelles ({bins_col.count_documents({})}):")
        for bin_data in bins_col.find({}, {'_id': 0}):
            print(f"  • {bin_data['bin_id']} - {bin_data['location']} ({bin_data['status']})")
        
        print("\n" + "="*60)
        print("✅ DONNÉES INSÉRÉES AVEC SUCCÈS!")
        print("="*60)
        
        print("\n🔐 IDENTIFIANTS POUR LES TESTS:")
        print("  Admin:       admin / admin123")
        print("  Collector:   collector1 / collector123")
        print("  Utilisateur: user1 / user123")
        print("\n⚠️  Note: user2 n'est PAS approuvé et ne peut pas se connecter")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
