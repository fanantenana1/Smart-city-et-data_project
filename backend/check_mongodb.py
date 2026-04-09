#!/usr/bin/env python
"""
Configuration et Vérification de MongoDB
"""

import os
from urllib.parse import urlsplit, urlunsplit, quote_plus
from pymongo import MongoClient

def get_mongodb_uri():
    """
    Récupère l'URI MongoDB depuis plusieurs sources:
    1. Variable d'environnement MONGODB_URI
    2. Fichier cle.txt
    3. MongoDB Atlas par défaut
    """
    # Essayer d'abord les variables d'environnement
    uri = os.getenv('MONGODB_URI')
    if uri:
        print(f"✓ MongoDB URI trouvé dans MONGODB_URI")
        return uri
    
    # Essayer le fichier cle.txt
    try:
        base = os.path.dirname(os.path.dirname(__file__))
        cle_path = os.path.join(base, 'cle.txt')
        if os.path.exists(cle_path):
            with open(cle_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if 'mongodb' in line.lower():
                        parts = line.split(':', 1)
                        if len(parts) == 2:
                            uri = parts[1].strip()
                        else:
                            uri = line.strip()
                        if uri:
                            print(f"✓ MongoDB URI trouvé dans cle.txt")
                            return uri
    except Exception as e:
        print(f"⚠ Erreur lors de la lecture de cle.txt: {e}")
    
    # URI par défaut (local)
    default_uri = "mongodb://localhost:27017"
    print(f"⚠ Aucun URI trouvé, utilisation par défaut: {default_uri}")
    return default_uri


def test_mongodb_connection():
    """
    Teste la connexion à MongoDB et affiche les informations
    """
    uri = get_mongodb_uri()
    
    try:
        # Masquer le mot de passe pour affichage
        parts = urlsplit(uri)
        if parts.password:
            display_uri = urlunsplit((
                parts.scheme,
                f"{parts.username}:{'*' * len(parts.password)}@{parts.hostname}:{parts.port}",
                parts.path,
                parts.query,
                parts.fragment
            ))
        else:
            display_uri = uri
        
        print(f"\n🔗 Connexion à MongoDB: {display_uri}")
        
        # Tenter la connexion
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        
        # Vérifier que la connexion est établie
        client.admin.command('ping')
        print("✅ Connexion à MongoDB réussie!")
        
        # Afficher les informations du serveur
        server_info = client.server_info()
        print(f"   Version MongoDB: {server_info.get('version', 'Unknown')}")
        
        # Lister les bases de données
        databases = client.list_database_names()
        db_name = os.getenv('MONGODB_DB', 'Data_Poubelles')
        print(f"   Bases de données: {', '.join(databases)}")
        
        if db_name in databases:
            print(f"   ✓ Base '{db_name}' existe")
            db = client[db_name]
            collections = db.list_collection_names()
            print(f"   Collections: {', '.join(collections)}")
        else:
            print(f"   ⚠ Base '{db_name}' n'existe pas (sera créée automatiquement)")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Erreur de connexion à MongoDB: {e}")
        print("\n📋 Solutions possibles:")
        print("   1. Vérifier que MongoDB est démarré")
        print("   2. Vérifier que l'URI MongoDB est correct")
        print("   3. Vérifier les identifiants si authentification requise")
        print("   4. Vérifier que le réseau permet la connexion")
        return False


if __name__ == "__main__":
    print("\n" + "="*60)
    print("   Vérification de la Configuration MongoDB")
    print("="*60 + "\n")
    
    success = test_mongodb_connection()
    
    print("\n" + "="*60 + "\n")
    
    if success:
        print("✅ Configuration MongoDB: OK")
    else:
        print("❌ Configuration MongoDB: ÉCHOUÉE")
        print("\n⚠ L'application utilisera le fallback fichier JSON jusqu'à résolution")
