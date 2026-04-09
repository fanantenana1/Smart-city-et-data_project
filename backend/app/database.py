"""Module de gestion de la base de données
Utilise MongoDB si disponible, sinon conserve un fallback fichier JSON.
"""
import os
import json
from datetime import datetime
from typing import Dict, Optional, List
from pymongo import MongoClient
from pymongo.collection import Collection
from urllib.parse import urlsplit, urlunsplit, quote_plus
from bson import ObjectId
# cache en mémoire
_cache = {
    'bins': {},
    'alerts': [],
    'collections': [],
    'users': {},
}
# settings par défaut
MONGO_DB_NAME = os.getenv('MONGODB_DB', 'DaB_Poubelles')
MONGO_COLLECTION_NAME = os.getenv('MONGODB_COLLECTION', 'poubelles')
_mongo_client: Optional[MongoClient] = None
_mongo_collection: Optional[Collection] = None
def _read_mongo_uri_from_cle() -> Optional[str]:
    try:
        base = os.path.dirname(os.path.dirname(__file__))
        cle_path = os.path.join(base, 'cle.txt')
        if os.path.exists(cle_path):
            with open(cle_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if 'mongodb' in line:
                        # la ligne peut être: clé: mongodb+srv://...
                        parts = line.split(':', 1)
                        if len(parts) == 2:
                            return parts[1].strip()
                        return line.strip()
    except Exception:
        return None
    return None
def connect_mongo():
    """Tente de se connecter à MongoDB et initialise la collection."""
    global _mongo_client, _mongo_collection
    if _mongo_client is not None:
        return
    uri = os.getenv('MONGODB_URI') or _read_mongo_uri_from_cle()
    if not uri:
        return
    try:
        # s'assurer que username/password sont correctement encodés
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
        _mongo_client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        db = _mongo_client[MONGO_DB_NAME]
        _mongo_collection = db[MONGO_COLLECTION_NAME]
        print(f"✅ Connexion MongoDB réussie - DB: {MONGO_DB_NAME}, Collection: {MONGO_COLLECTION_NAME}")
    except Exception as e:
        print(f"❌ Erreur connexion MongoDB: {e}")
        _mongo_client = None
        _mongo_collection = None
def initialize_database():
    """Initialise le cache en chargeant les données depuis MongoDB ou fallback JSON."""
    global _cache
    connect_mongo()
    if _mongo_collection is not None:
        try:
            docs = list(_mongo_collection.find({}))
            bins = {}
            for d in docs:
                # convertir l'objet Mongo en dict utilisable
                bin_id = d.get('bin_id') or str(d.get('_id'))
                d.pop('_id', None)
                bins[bin_id] = d
            _cache['bins'] = bins
            print(f"📦 Chargé {len(bins)} poubelles depuis MongoDB")
            return _cache['bins']
        except Exception as e:
            print(f"❌ Erreur lecture MongoDB: {e}")
    # Fallback: charger depuis data/bins.json si présent
    data_file = os.path.join(os.path.dirname(__file__), 'data', 'bins.json')
    try:
        if os.path.exists(data_file):
            with open(data_file, 'r', encoding='utf-8') as f:
                payload = json.load(f)
                bins = payload.get('bins', {})
                _cache['bins'] = bins
                print(f"📦 Chargé {len(bins)} poubelles depuis fichier JSON")
                return _cache['bins']
    except Exception as e:
        print(f"❌ Erreur lecture fichier fallback: {e}")
    _cache['bins'] = {}
    return _cache['bins']
def _upsert_mongo_bin(bin_id: str, bin_data: Dict):
    connect_mongo()
    if _mongo_collection is None:
        print(f"⚠️ Pas de connexion MongoDB pour upsert {bin_id}")
        return False
    try:
        result = _mongo_collection.update_one(
            {'bin_id': bin_id}, 
            {'$set': bin_data}, 
            upsert=True
        )
        print(f"✅ MongoDB upsert {bin_id}: matched={result.matched_count}, modified={result.modified_count}")
        return True
    except Exception as e:
        print(f"❌ Erreur upsert MongoDB pour {bin_id}: {e}")
        return False
def get_all_bins() -> Dict:
    return _cache['bins']
def get_bin(bin_id: str) -> Optional[Dict]:
    return _cache['bins'].get(bin_id)
def create_bin(bin_data: Dict) -> bool:
    bin_id = bin_data.get('bin_id')
    if not bin_id or bin_id in _cache['bins']:
        return False
    bin_data['last_update'] = datetime.now().isoformat()
    if 'current_volume' not in bin_data:
        bin_data['current_volume'] = int((bin_data.get('fill_level', 0) / 100.0) * bin_data.get('capacity', 240))
    _cache['bins'][bin_id] = bin_data
    return _upsert_mongo_bin(bin_id, bin_data)
def update_bin(bin_id: str, bin_data: Dict) -> bool:
    if bin_id not in _cache['bins']:
        return False
    old = _cache['bins'][bin_id]
    bin_data['last_update'] = datetime.now().isoformat()
    if 'last_collection' not in bin_data and 'last_collection' in old:
        bin_data['last_collection'] = old['last_collection']
    if 'current_volume' not in bin_data or bin_data.get('current_volume') == 0:
        bin_data['current_volume'] = int((bin_data.get('fill_level', 0) / 100.0) * bin_data.get('capacity', 240))
    _cache['bins'][bin_id] = bin_data
    return _upsert_mongo_bin(bin_id, bin_data)
def delete_bin(bin_id: str) -> bool:
    """Supprime une poubelle - DIRECTEMENT DE MONGODB, PAS DE CONDITION SUR LE CACHE"""
    print(f"🗑️ === DÉBUT SUPPRESSION {bin_id} ===")
    # Supprimer du cache si présent (sans bloquer)
    if bin_id in _cache['bins']:
        del _cache['bins'][bin_id]
        print(f"✅ {bin_id} supprimé du cache")
    else:
        print(f"ℹ️ {bin_id} absent du cache")
    # TOUJOURS tenter la suppression MongoDB
    connect_mongo()
    if _mongo_collection is None:
        print(f"❌ Pas de connexion MongoDB!")
        return False
    try:
        print(f"🔍 Recherche MongoDB de '{bin_id}'...")
        # Supprimer directement
        result = _mongo_collection.delete_one({'bin_id': bin_id})
        print(f"📊 MongoDB delete_one result: deleted_count={result.deleted_count}")
        if result.deleted_count > 0:
            print(f"✅ {bin_id} SUPPRIMÉ DE MONGODB!")
            print(f"🗑️ === FIN SUPPRESSION {bin_id} - SUCCÈS ===\n")
            return True
        else:
            print(f"⚠️ delete_one a retourné 0, tentative delete_many...")
            force = _mongo_collection.delete_many({'bin_id': bin_id})
            print(f"📊 MongoDB delete_many result: deleted_count={force.deleted_count}")
            if force.deleted_count > 0:
                print(f"✅ {bin_id} SUPPRIMÉ avec delete_many!")
                print(f"🗑️ === FIN SUPPRESSION {bin_id} - SUCCÈS ===\n")
                return True
            else:
                print(f"❌ {bin_id} introuvable dans MongoDB")
                print(f"🗑️ === FIN SUPPRESSION {bin_id} - ÉCHEC ===\n")
                return False
    except Exception as e:
        print(f"❌ Erreur MongoDB delete: {e}")
        print(f"🗑️ === FIN SUPPRESSION {bin_id} - ERREUR ===\n")
        return False
def search_bins(query: str) -> Dict:
    """Recherche des poubelles par bin_id, location ou address"""
    results = {}
    query_lower = query.lower()
    for bin_id, bin_data in _cache['bins'].items():
        if (query_lower in bin_id.lower() or
            query_lower in bin_data.get('location', '').lower() or
            query_lower in bin_data.get('address', '').lower()):
            results[bin_id] = bin_data
    return results
def get_users_collection():
    """Retourne la collection MongoDB pour les utilisateurs."""
    connect_mongo()
    if _mongo_client is not None:
        db = _mongo_client[MONGO_DB_NAME]
        return db['users']
    return None
def initialize_users():
    """Initialise les utilisateurs depuis MongoDB."""
    users_collection = get_users_collection()
    if users_collection is not None:
        try:
            users_docs = list(users_collection.find({}))
            users = {}
            for user in users_docs:
                username = user.get('username')
                if username:
                    user.pop('_id', None)
                    users[username] = user
            _cache['users'] = users
            print(f"👥 Chargé {len(users)} utilisateurs depuis MongoDB")
        except Exception as e:
            print(f"❌ Erreur chargement utilisateurs MongoDB: {e}")
def get_all_users() -> Dict:
    return _cache['users']
def get_user(username: str) -> Optional[Dict]:
    return _cache['users'].get(username)
def create_user(user_data: Dict) -> bool:
    username = user_data.get('username')
    if not username or username in _cache['users']:
        return False
    user_data['created_at'] = datetime.now().isoformat()
    user_data['last_login'] = None
    user_data['is_active'] = True
    user_data['is_approved'] = False
    _cache['users'][username] = user_data
    # Sauvegarder dans MongoDB
    users_collection = get_users_collection()
    if users_collection is not None:
        try:
            users_collection.insert_one(user_data.copy())
            print(f"✅ Utilisateur {username} créé dans MongoDB")
        except Exception as e:
            print(f"❌ Erreur création utilisateur MongoDB: {e}")
    return True
def update_user(username: str, user_data: Dict) -> bool:
    if username not in _cache['users']:
        return False
    # Mettre à jour le cache
    for key, value in user_data.items():
        _cache['users'][username][key] = value
    # Mettre à jour dans MongoDB
    users_collection = get_users_collection()
    if users_collection is not None:
        try:
            users_collection.update_one({'username': username}, {'$set': user_data})
        except Exception as e:
            print(f"❌ Erreur mise à jour utilisateur MongoDB: {e}")
    return True
def delete_user(username: str) -> bool:
    if username not in _cache['users']:
        return False
    del _cache['users'][username]
    # Supprimer dans MongoDB
    users_collection = get_users_collection()
    if users_collection is not None:
        try:
            result = users_collection.delete_one({'username': username})
            print(f"✅ Utilisateur {username} supprimé de MongoDB (deleted_count={result.deleted_count})")
        except Exception as e:
            print(f"❌ Erreur suppression utilisateur MongoDB: {e}")
    return True
def approve_user(username: str) -> bool:
    """Approuve un utilisateur pour qu'il puisse se connecter."""
    return update_user(username, {'is_approved': True})
def reject_user(username: str) -> bool:
    """Rejette un utilisateur."""
    return update_user(username, {'is_approved': False, 'is_active': False})
def get_alerts_collection():
    """Retourne la collection MongoDB pour les alertes."""
    connect_mongo()
    if _mongo_client is not None:
        db = _mongo_client[MONGO_DB_NAME]
        return db['alerts']
    return None
def get_collections_collection():
    """Retourne la collection MongoDB pour les collections."""
    connect_mongo()
    if _mongo_client is not None:
        db = _mongo_client[MONGO_DB_NAME]
        return db['collections']
    return None
def initialize_alerts():
    """Initialise les alertes depuis MongoDB."""
    alerts_collection = get_alerts_collection()
    if alerts_collection is not None:
        try:
            alerts_docs = list(alerts_collection.find({}))
            alerts = []
            for alert in alerts_docs:
                alert.pop('_id', None)
                alerts.append(alert)
            _cache['alerts'] = alerts
            print(f"🚨 Chargé {len(alerts)} alertes depuis MongoDB")
        except Exception as e:
            print(f"❌ Erreur chargement alertes MongoDB: {e}")
def initialize_collections():
    """Initialise les collections depuis MongoDB."""
    collections_collection = get_collections_collection()
    if collections_collection is not None:
        try:
            collections_docs = list(collections_collection.find({}))
            collections = []
            for col in collections_docs:
                col.pop('_id', None)
                collections.append(col)
            _cache['collections'] = collections
            print(f"🗑️ Chargé {len(collections)} historiques de collecte depuis MongoDB")
        except Exception as e:
            print(f"❌ Erreur chargement collections MongoDB: {e}")
def get_all_alerts():
    """Retourne toutes les alertes en convertissant les ObjectId en string."""
    from bson import ObjectId
    cleaned_alerts = []
    for alert in _cache['alerts']:
        # Copier l'alerte pour ne pas modifier l'original
        clean_alert = {}
        # Nettoyer tous les champs
        for key, value in alert.items():
            if key == '_id':
                continue  # Ignorer _id
            elif isinstance(value, ObjectId):
                clean_alert[key] = str(value)
            else:
                clean_alert[key] = value
        cleaned_alerts.append(clean_alert)
    return cleaned_alerts
def create_alert(alert_data):
    _cache['alerts'].append(alert_data)
    alerts_collection = get_alerts_collection()
    if alerts_collection is not None:
        try:
            alerts_collection.insert_one(alert_data)
        except Exception as e:
            print(f"❌ Erreur sauvegarde alerte MongoDB: {e}")
def update_alert(index, alert_data):
    if 0 <= index < len(_cache['alerts']):
        _cache['alerts'][index] = alert_data
        # Pour MongoDB, il faudrait un ID, mais pour simplicité, on ne met pas à jour
def delete_alert(index):
    """Supprime une alerte par son index."""
    if 0 <= index < len(_cache['alerts']):
        alert = _cache['alerts'].pop(index)
        alerts_collection = get_alerts_collection()
        if alerts_collection is not None:
            try:
                result = alerts_collection.delete_one({'bin_id': alert['bin_id'], 'timestamp': alert['timestamp']})
                print(f"✅ Alerte supprimée de MongoDB (deleted_count={result.deleted_count})")
            except Exception as e:
                print(f"❌ Erreur suppression alerte MongoDB: {e}")
def delete_multiple_alerts(indices: List[int]) -> dict:
    """Supprime plusieurs alertes par leurs indices.
    Args:
        indices: Liste des indices des alertes à supprimer
    Returns:
        dict: Résultat avec le nombre d'alertes supprimées
    """
    print(f"🗑️ === DÉBUT SUPPRESSION MULTIPLE DE {len(indices)} ALERTES ===")
    # Trier les indices en ordre décroissant pour éviter les problèmes d'indexation
    sorted_indices = sorted(indices, reverse=True)
    deleted_from_cache = 0
    deleted_from_mongo = 0
    alerts_to_delete = []
    # Collecter les alertes à supprimer
    for index in sorted_indices:
        if 0 <= index < len(_cache['alerts']):
            alerts_to_delete.append(_cache['alerts'][index])
    # Supprimer du cache
    for index in sorted_indices:
        if 0 <= index < len(_cache['alerts']):
            _cache['alerts'].pop(index)
            deleted_from_cache += 1
    print(f"✅ {deleted_from_cache} alertes supprimées du cache")
    # Supprimer de MongoDB
    alerts_collection = get_alerts_collection()
    if alerts_collection is not None and alerts_to_delete:
        try:
            # Construire un filtre pour supprimer toutes les alertes en une seule opération
            for alert in alerts_to_delete:
                result = alerts_collection.delete_one({
                    'bin_id': alert['bin_id'], 
                    'timestamp': alert['timestamp']
                })
                deleted_from_mongo += result.deleted_count
            print(f"✅ {deleted_from_mongo} alertes supprimées de MongoDB")
        except Exception as e:
            print(f"❌ Erreur suppression multiple alertes MongoDB: {e}")
    print(f"🗑️ === FIN SUPPRESSION MULTIPLE - {deleted_from_cache} cache / {deleted_from_mongo} MongoDB ===\n")
    return {
        'deleted_from_cache': deleted_from_cache,
        'deleted_from_mongo': deleted_from_mongo,
        'total_deleted': deleted_from_cache
    }
def get_all_collections():
    return _cache['collections']
def create_collection(collection_data):
    _cache['collections'].append(collection_data)
    collections_collection = get_collections_collection()
    if collections_collection is not None:
        try:
            collections_collection.insert_one(collection_data)
        except Exception as e:
            print(f"❌ Erreur sauvegarde collection MongoDB: {e}")
def seed_bins():
    """Ajoute les poubelles par défaut si la collection est vide."""
    global _cache
    # Check if we already have bins cached
    if _cache.get('bins') and len(_cache['bins']) > 0:
        return  # Cache already populated
    # Try MongoDB first
    if _mongo_collection is not None:
        try:
            docs = list(_mongo_collection.find({}))
            if not docs:
                # seed
                data_file = os.path.join(os.path.dirname(__file__), 'data', 'bins.json')
                try:
                    if os.path.exists(data_file):
                        with open(data_file, 'r', encoding='utf-8') as f:
                            payload = json.load(f)
                            bins = payload.get('bins', {})
                            for bin_id, bin_data in bins.items():
                                bin_data['bin_id'] = bin_id
                                _mongo_collection.insert_one(bin_data)
                            # update cache
                            docs = list(_mongo_collection.find({}))
                            bins = {}
                            for d in docs:
                                bin_id = d.get('bin_id') or str(d.get('_id'))
                                d.pop('_id', None)
                                bins[bin_id] = d
                            _cache['bins'] = bins
                            print(f"🌱 Seeded {len(bins)} bins to MongoDB and cache")
                except Exception as e:
                    print(f"❌ Erreur seeding: {e} (will use JSON fallback)")
                    # Fallback to JSON loading
                    data_file = os.path.join(os.path.dirname(__file__), 'data', 'bins.json')
                    if os.path.exists(data_file):
                        try:
                            with open(data_file, 'r', encoding='utf-8') as f:
                                payload = json.load(f)
                                _cache['bins'] = payload.get('bins', {})
                                print(f"📦 Loaded {len(_cache['bins'])} bins from JSON fallback")
                        except Exception as je:
                            print(f"❌ Error loading JSON fallback: {je}")
        except Exception as e:
            print(f"❌ Impossible de queryer MongoDB pour seed_bins: {e} (fallback to JSON)")
            # Fallback: load from JSON
            data_file = os.path.join(os.path.dirname(__file__), 'data', 'bins.json')
            if os.path.exists(data_file):
                try:
                    with open(data_file, 'r', encoding='utf-8') as f:
                        payload = json.load(f)
                        _cache['bins'] = payload.get('bins', {})
                        print(f"📦 Loaded {len(_cache['bins'])} bins from JSON fallback")
                except Exception as je:
                    print(f"❌ Error loading JSON fallback: {je}")
    else:
        # No MongoDB connection, load from JSON
        data_file = os.path.join(os.path.dirname(__file__), 'data', 'bins.json')
        if os.path.exists(data_file):
            try:
                with open(data_file, 'r', encoding='utf-8') as f:
                    payload = json.load(f)
                    _cache['bins'] = payload.get('bins', {})
                    print(f"📦 Loaded {len(_cache['bins'])} bins from JSON (no MongoDB)")
            except Exception as je:
                print(f"❌ Error loading JSON: {je}")