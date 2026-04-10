from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json
import asyncio
import os
import io
import random
from .database import (
    initialize_database,
    get_all_bins,
    get_bin as db_get_bin,
    create_bin as db_create_bin,
    update_bin as db_update_bin,
    delete_bin as db_delete_bin,
    search_bins as db_search_bins,
    initialize_users,
    get_all_users,
    get_user as db_get_user,
    create_user as db_create_user,
    update_user as db_update_user,
    delete_user as db_delete_user,
    approve_user as db_approve_user,
    reject_user as db_reject_user,
    seed_bins,
    initialize_alerts,
    initialize_collections,
    get_all_alerts,
    create_alert,
    update_alert,
    delete_alert,
    delete_multiple_alerts,
    get_all_collections,
    create_collection
)
from .send import send_alert_email_async
from jose import JWTError, jwt
from typing import Dict
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from statistics import mean, median
from collections import defaultdict
# Simple JWT settings (override via env if needed)
SECRET_KEY = "supersecret_smartwaste_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
# Simple in-memory passwords for demo users (in production use hashed passwords)
user_passwords: Dict[str, str] = {}
app = FastAPI(title="SmartWaste API")
# Configuration CORS pour React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://0.0.0.0:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Initialiser la base de donnees au startup event (async-safe)
# Initialisé dans startup_event pour éviter les problèmes d'asyncio
# Modèles de données
class BinData(BaseModel):
    bin_id: str
    location: str
    address: str
    fill_level: float  # Pourcentage de remplissage
    capacity: int  # Capacité totale en litres
    current_volume: Optional[int] = None  # Volume actuel en litres
    battery: float  # Pourcentage de batterie
    temperature: float  # Température en °C
    signal_quality: str  # Qualité du signal
    latitude: float
    longitude: float
    last_collection: Optional[str] = None
    status: str = "normal"  # normal, attention, critical, offline
class CollectionHistory(BaseModel):
    bin_id: str
    operator: str
    volume_collected: int
    percentage: float
    timestamp: str
class Alert(BaseModel):
    bin_id: str
    type: str  # urgent, important, info
    title: str
    description: str
    location: str
    assigned_to: Optional[str] = None
    timestamp: str
    status: str = "active"  # active, resolved
class User(BaseModel):
    id: str
    name: str
    email: str
    role: str  # admin, operator, viewer
    active: bool = True
class UserRegistration(BaseModel):
    username: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    password: str
class TokenRequest(BaseModel):
    username: str
    password: str
def create_access_token(data: dict, expires_delta: Optional[int] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + timedelta(minutes=expires_delta)
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
# Security dependency
http_bearer = HTTPBearer()
async def jwt_required(credentials: HTTPAuthorizationCredentials = Depends(http_bearer)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return {"username": username}
# Stockage en mémoire (pour la démo)
bins_data = {}  # Will be populated from database
users_data = {}
active_connections: List[WebSocket] = []
# WebSocket pour les mises à jour en temps réel
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)
async def broadcast_update(data: dict):
    """Envoie les mises à jour à tous les clients connectés"""
    for connection in active_connections:
        try:
            await connection.send_json(data)
        except:
            if connection in active_connections:
                active_connections.remove(connection)
# Endpoints pour l'ESP32
@app.post("/api/bin/update")
async def update_bin_data(data: BinData):
    """Reçoit les données des capteurs ESP32"""
    from .database import _cache
    from .send import send_alert_email_async
    bin_dict = data.dict()
    bin_dict["last_update"] = datetime.now().isoformat()
    # Calculer le volume si nécessaire
    if bin_dict.get("current_volume") is None:
        bin_dict["current_volume"] = int((data.fill_level / 100.0) * data.capacity)
    bins_data[data.bin_id] = bin_dict
    # Mise à jour du statut selon le niveau de remplissage
    print("VOLUM == ",bin_dict["current_volume"])
    if data.fill_level >= 95:
        bins_data[data.bin_id]["status"] = "critical"
        # Créer une alerte urgente si elle n'existe pas
        existing_urgent = [a for a in get_all_alerts() if a["bin_id"] == data.bin_id and a["type"] == "urgent" and a["status"] == "active"]
        #print("INFO == ", existing_urgent)
        if not existing_urgent:
            alert = Alert(
                bin_id=data.bin_id,
                type="urgent",
                title=f"Poubelle en surcharge critique",
                description=f"{data.location} - Niveau: {data.fill_level}% - Risque de débordement imminent",
                location=data.location,
                timestamp=datetime.now().isoformat()
            )
            create_alert(alert.dict())
            await broadcast_update({"type": "alert", "data": alert.dict()})
            #  NOUVEAU: Envoyer email à l'admin ET aux utilisateurs assignés
            try:
                # Email à l'admin
                await send_alert_email_async(data.bin_id, data.location, data.fill_level, "critical")
                # Email aux utilisateurs assignés à cette poubelle
                all_users = get_all_users()
                for username, user_data in all_users.items():
                    if user_data.get('assigned_bins') and data.bin_id in user_data['assigned_bins']:
                        if user_data.get('email'):
                            print(f" Envoi email alerte critique à {username} ({user_data['email']}) pour {data.bin_id}")
                            await send_alert_email_async(data.bin_id, data.location, data.fill_level, "critical", user_data['email'])
            except Exception as e:
                print(f"Erreur envoi email: {e}")
    elif data.fill_level >= 85:
        bins_data[data.bin_id]["status"] = "attention"
        # Créer une alerte importante si elle n'existe pas
        existing_important = [a for a in get_all_alerts() if a["bin_id"] == data.bin_id and a["type"] == "important" and a["status"] == "active"]
        if not existing_important:
            alert = Alert(
                bin_id=data.bin_id,
                type="important",
                title=f"Poubelle pleine - Collecte requise",
                description=f"{data.location} - Niveau: {data.fill_level}%",
                location=data.location,
                timestamp=datetime.now().isoformat()
            )
            create_alert(alert.dict())
            await broadcast_update({"type": "alert", "data": alert.dict()})
            # Envoyer email aux utilisateurs assignés
            try:
                all_users = get_all_users()
                for username, user_data in all_users.items():
                    if user_data.get('assigned_bins') and data.bin_id in user_data['assigned_bins']:
                        if user_data.get('email'):
                            print(f" Envoi email alerte importante à {username} pour {data.bin_id}")
                            await send_alert_email_async(data.bin_id, data.location, data.fill_level, "important", user_data['email'])
            except Exception as e:
                print(f"Erreur envoi email: {e}")
    else:
        bins_data[data.bin_id]["status"] = "normal"
    # Sauvegarder en base de données
    db_update_bin(data.bin_id, bin_dict)
    # Diffusion aux clients WebSocket
    await broadcast_update({"type": "bin_update", "data": bin_dict})
    return {"status": "ok", "bin_id": data.bin_id}
@app.get("/api/bins")
async def get_bins():
    """Retourne toutes les poubelles"""
    return list(bins_data.values())
@app.get("/api/bins/{bin_id}")
async def get_bin(bin_id: str):
    """Retourne les détails d'une poubelle spécifique"""
    if bin_id in bins_data:
        return bins_data[bin_id]
    raise HTTPException(status_code=404, detail="Poubelle non trouvée")
@app.post("/api/bins")
async def create_bin(bin: BinData):
    """Crée une nouvelle poubelle"""
    if bin.bin_id in bins_data:
        raise HTTPException(status_code=400, detail="Cette poubelle existe déjà")
    bin_dict = bin.dict()
    bin_dict["last_update"] = datetime.now().isoformat()
    # Calculer le volume actuel si non fourni
    if bin_dict.get("current_volume") is None:
        bin_dict["current_volume"] = int((bin.fill_level / 100.0) * bin.capacity)
    # Tenter d'enregistrer dans MongoDB
    success = db_create_bin(bin_dict)
    if not success:
        print(f" Avertissement: La poubelle {bin.bin_id} n'a pas pu être enregistrée dans MongoDB")
        # On peut choisir de lever une exception ou de continuer
        # raise HTTPException(status_code=500, detail="Erreur lors de l'enregistrement dans la base de données")
    else:
        print(f" Poubelle {bin.bin_id} enregistrée avec succès dans MongoDB")
    # Ajouter au cache en mémoire (pour la session en cours)
    bins_data[bin.bin_id] = bin_dict
    # Diffuser la mise à jour
    await broadcast_update({"type": "bin_created", "data": bin_dict})
    return {
        "status": "created", 
        "bin": bin_dict,
        "message": f"Poubelle {bin.bin_id} créée avec succès" + (" et enregistrée dans MongoDB" if success else " (uniquement en mémoire)")
    }
@app.put("/api/bins/{bin_id}")
async def update_bin(bin_id: str, bin: BinData):
    """Met à jour une poubelle existante"""
    if bin_id not in bins_data:
        raise HTTPException(status_code=404, detail="Poubelle non trouvée")
    bin_dict = bin.dict()
    bin_dict["last_update"] = datetime.now().isoformat()
    bins_data[bin_id] = bin_dict
    db_update_bin(bin_id, bin_dict)
    await broadcast_update({"type": "bin_updated", "data": bin_dict})
    return {"status": "updated", "bin": bin_dict}
@app.delete("/api/bins/{bin_id}")
async def delete_bin(bin_id: str):
    """Supprime une poubelle"""
    if bin_id not in bins_data:
        raise HTTPException(status_code=404, detail="Poubelle non trouvée")
    del bins_data[bin_id]
    db_delete_bin(bin_id)
    await broadcast_update({"type": "bin_deleted", "bin_id": bin_id})
    return {"status": "deleted", "bin_id": bin_id}
# Routes alternatives sans 's' pour compatibilité avec le frontend
@app.get("/api/bin/{bin_id}")
async def get_bin_alt(bin_id: str):
    """Retourne les détails d'une poubelle spécifique (route alternative)"""
    if bin_id in bins_data:
        return bins_data[bin_id]
    raise HTTPException(status_code=404, detail="Poubelle non trouvée")
@app.put("/api/bin/{bin_id}")
async def update_bin_alt(bin_id: str, bin: BinData):
    """Met à jour une poubelle existante (route alternative)"""
    if bin_id not in bins_data:
        raise HTTPException(status_code=404, detail="Poubelle non trouvée")
    bin_dict = bin.dict()
    bin_dict["last_update"] = datetime.now().isoformat()
    # Calculer le volume actuel si non fourni
    if bin_dict.get("current_volume") is None:
        bin_dict["current_volume"] = int((bin.fill_level / 100.0) * bin.capacity)
    bins_data[bin_id] = bin_dict
    db_update_bin(bin_id, bin_dict)
    await broadcast_update({"type": "bin_updated", "data": bin_dict})
    return {"status": "updated", "bin": bin_dict}
@app.delete("/api/bin/{bin_id}")
async def delete_bin_alt(bin_id: str):
    """Supprime une poubelle (route alternative)"""
    if bin_id not in bins_data:
        raise HTTPException(status_code=404, detail="Poubelle non trouvée")
    del bins_data[bin_id]
    db_delete_bin(bin_id)
    await broadcast_update({"type": "bin_deleted", "bin_id": bin_id})
    return {"status": "deleted", "bin_id": bin_id}
# Endpoints pour les alertes
@app.get("/api/alerts")
async def get_alerts():
    """Retourne toutes les alertes"""
    return get_all_alerts()
@app.post("/api/alerts")
async def create_new_alert(alert: Alert):
    """Crée une nouvelle alerte"""
    alert_dict = alert.dict()
    create_alert(alert_dict)
    await broadcast_update({"type": "alert", "data": alert_dict})
    return {"status": "created", "alert": alert_dict}
@app.put("/api/alerts/{alert_id}")
async def update_existing_alert(alert_id: str, alert: Alert):
    """Met à jour une alerte existante"""
    alert_dict = alert.dict()
    update_alert(alert_id, alert_dict)
    await broadcast_update({"type": "alert_updated", "data": alert_dict})
    return {"status": "updated", "alert": alert_dict}
@app.delete("/api/alerts/{alert_id}")
async def delete_existing_alert(alert_id: str):
    """Supprime une alerte"""
    delete_alert(alert_id)
    await broadcast_update({"type": "alert_deleted", "alert_id": alert_id})
    return {"status": "deleted", "alert_id": alert_id}
@app.post("/api/alerts/delete-multiple")
async def delete_multiple_alerts_endpoint(alert_indices: List[int]):
    """Supprime plusieurs alertes par leurs indices.
    Args:
        alert_indices: Liste des indices des alertes à supprimer
    Returns:
        Résultat de la suppression avec le nombre d'alertes supprimées
    """
    if not alert_indices:
        raise HTTPException(status_code=400, detail="Aucun indice fourni")
    try:
        result = delete_multiple_alerts(alert_indices)
        await broadcast_update({
            "type": "alerts_deleted_multiple", 
            "indices": alert_indices,
            "count": result['total_deleted']
        })
        return {
            "status": "success",
            "message": f"{result['total_deleted']} alerte(s) supprimée(s)",
            "deleted_count": result['total_deleted'],
            "details": result
        }
    except Exception as e:
        print(f" Erreur lors de la suppression multiple: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")
# Endpoints pour l'historique des collectes
@app.get("/api/collections")
async def get_collections():
    """Retourne l'historique des collectes"""
    return get_all_collections()
@app.post("/api/collections")
async def add_collection(collection: CollectionHistory):
    """Enregistre une nouvelle collecte"""
    collection_dict = collection.dict()
    create_collection(collection_dict)
    # Mettre à jour la dernière collecte de la poubelle
    if collection.bin_id in bins_data:
        bins_data[collection.bin_id]["last_collection"] = collection.timestamp
        db_update_bin(collection.bin_id, bins_data[collection.bin_id])
    await broadcast_update({"type": "collection_added", "data": collection_dict})
    return {"status": "created", "collection": collection_dict}
# Endpoints pour les statistiques
@app.get("/api/statistics")
async def get_statistics():
    """Calcule et retourne les statistiques globales"""
    total_bins = len(bins_data)
    active_bins = len([b for b in bins_data.values() if b.get("status") != "offline"])
    # Statistiques par statut
    bins_by_status = {
        "normal": len([b for b in bins_data.values() if b.get("status") == "normal"]),
        "attention": len([b for b in bins_data.values() if b.get("status") == "attention"]),
        "critical": len([b for b in bins_data.values() if b.get("status") == "critical"]),
        "offline": len([b for b in bins_data.values() if b.get("status") == "offline"])
    }
    # Niveau moyen de remplissage
    fill_levels = [b.get("fill_level", 0) for b in bins_data.values()]
    avg_fill_rate = sum(fill_levels) / len(fill_levels) if fill_levels else 0
    # Collectes
    collections = get_all_collections()
    total_collections = len(collections)
    total_volume = sum([c.get("volume_collected", 0) for c in collections])
    # Efficacité (exemple simplifié)
    efficiency = 100 - (bins_by_status["critical"] * 10) - (bins_by_status["attention"] * 5)
    efficiency = max(0, min(100, efficiency))
    return {
        "total_bins": total_bins,
        "active_bins": active_bins,
        "bins_by_status": bins_by_status,
        "avg_fill_rate": round(avg_fill_rate, 1),
        "total_collections": total_collections,
        "total_volume": total_volume,
        "efficiency": round(efficiency, 1)
    }
# User Authentication Endpoints
@app.post("/api/auth/register")
async def register_user(user_data: UserRegistration):
    """Register a new user"""
    existing_user = db_get_user(user_data.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    # Check if email exists
    all_users = get_all_users()
    for _, u in all_users.items():
        if u.get('email') == user_data.email:
            raise HTTPException(status_code=400, detail="Email already exists")
    # Create user with pending approval
    new_user = {
        'username': user_data.username,
        'email': user_data.email,
        'full_name': user_data.full_name,
        'phone_number': user_data.phone_number,
        'password_hash': user_data.password,  # In production, hash this!
        'role': 'operator',  # default role
        'is_active': False,
        'is_approved': False,
        'created_at': datetime.now().isoformat(),
        'last_login': None,
        'assigned_bins': []
    }
    db_create_user(new_user)
    return {"status": "success", "message": "Registration submitted. Awaiting admin approval."}
@app.post("/api/auth/login")
async def login(credentials: TokenRequest):
    """Login and get access token"""
    user = db_get_user(credentials.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    # Check if approved
    if not user.get('is_approved', False):
        raise HTTPException(status_code=403, detail="Account pending approval")
    # Check if active
    if not user.get('is_active', True):
        raise HTTPException(status_code=403, detail="Account is inactive")
    # Check password (in production, compare hashed passwords)
    if user.get('password_hash') != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    # Update last login
    db_update_user(credentials.username, {'last_login': datetime.now().isoformat()})
    # Create token
    token_data = {
        "sub": credentials.username,
        "role": user.get('role', 'operator'),
        "user_id": user.get('_id') or credentials.username
    }
    token = create_access_token(token_data)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": credentials.username,
            "role": user.get('role'),
            "full_name": user.get('full_name')
        }
    }
@app.get("/api/auth/me")
async def get_current_user(current_user: dict = Depends(jwt_required)):
    """Get current user info"""
    user = db_get_user(current_user['username'])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "username": user.get('username'),
        "email": user.get('email'),
        "full_name": user.get('full_name'),
        "role": user.get('role'),
        "phone_number": user.get('phone_number'),
        "is_active": user.get('is_active'),
        "assigned_bins": user.get('assigned_bins', [])
    }
# Admin User Management Endpoints
@app.post("/api/users/register")
async def admin_create_user(user_data: dict, current_user: dict = Depends(jwt_required)):
    """Créer un utilisateur par l'admin (approuvé automatiquement)"""
    requester = db_get_user(current_user['username'])
    if not requester or requester.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    username = user_data.get('username')
    password = user_data.get('password')
    email = user_data.get('email')
    if not username or not password or not email:
        raise HTTPException(status_code=422, detail="username, password et email sont obligatoires")
    if db_get_user(username):
        raise HTTPException(status_code=400, detail=f"L'utilisateur '{username}' existe déjà")
    all_users = get_all_users()
    for _, u in all_users.items():
        if u.get('email') == email:
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    role_map = {
        'simple_user': 'operator',
        'operator': 'operator',
        'collector': 'operator',
        'admin': 'admin',
    }
    role = role_map.get(user_data.get('role', 'simple_user'), 'operator')
    new_user = {
        'username': username,
        'email': email,
        'full_name': user_data.get('full_name', ''),
        'phone_number': user_data.get('phone_number', ''),
        'password_hash': password,
        'role': role,
        'is_active': True,
        'is_approved': True,
        'created_at': datetime.now().isoformat(),
        'last_login': None,
        'assigned_bins': [],
        'profile_image': user_data.get('profile_image', None)
    }
    db_create_user(new_user)
    return {
        "status": "success",
        "message": f"Utilisateur '{username}' créé avec succès.",
        "user": {
            "username": username,
            "email": email,
            "role": role,
            "is_approved": True,
            "is_active": True,
            "profile_image": new_user.get('profile_image')
        }
    }
@app.get("/api/users")
async def list_users(current_user: dict = Depends(jwt_required)):
    """List all users (admin only)"""
    user = db_get_user(current_user['username'])
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    all_users = get_all_users()
    users_list = []
    for username, user_data in all_users.items():
        users_list.append({
            "username": username,
            "email": user_data.get('email'),
            "full_name": user_data.get('full_name'),
            "role": user_data.get('role'),
            "is_active": user_data.get('is_active'),
            "is_approved": user_data.get('is_approved'),
            "created_at": user_data.get('created_at'),
            "last_login": user_data.get('last_login'),
            "assigned_bins": user_data.get('assigned_bins', []),
            "profile_image": user_data.get('profile_image', None)
        })
    return users_list
@app.post("/api/users/{username}/approve")
async def approve_user(username: str, current_user: dict = Depends(jwt_required)):
    """Approve a pending user (admin only)"""
    user = db_get_user(current_user['username'])
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    target_user = db_get_user(username)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_approve_user(username)
    return {"status": "success", "message": f"User {username} approved"}
@app.post("/api/users/{username}/reject")
async def reject_user(username: str, current_user: dict = Depends(jwt_required)):
    """Reject a pending user (admin only)"""
    user = db_get_user(current_user['username'])
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    target_user = db_get_user(username)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_reject_user(username)
    return {"status": "success", "message": f"User {username} rejected"}
@app.put("/api/users/{username}")
async def update_user(username: str, updates: dict, current_user: dict = Depends(jwt_required)):
    """Update user information (admin only)"""
    user = db_get_user(current_user['username'])
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    target_user = db_get_user(username)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_update_user(username, updates)
    return {"status": "success", "message": f"User {username} updated"}
@app.delete("/api/users/{username}")
async def delete_user(username: str, current_user: dict = Depends(jwt_required)):
    """Delete a user (admin only)"""
    user = db_get_user(current_user['username'])
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    if username == current_user['username']:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    success = db_delete_user(username)
    if success:
        return {"status": "success", "message": f"User {username} deleted"}
    else:
        raise HTTPException(status_code=404, detail="User not found")
# Endpoints pour la gestion des assignations de poubelles aux utilisateurs
#  NOUVEAU ENDPOINT: Récupère les poubelles assignées de l'utilisateur connecté
@app.get("/api/user/assigned-bins")
async def get_my_assigned_bins(current_user: dict = Depends(jwt_required)):
    """Récupère les poubelles assignées à l'utilisateur connecté"""
    user = db_get_user(current_user['username'])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    assigned_bins = user.get('assigned_bins', [])
    result_bins = []
    for bin_id in assigned_bins:
        bin_data = bins_data.get(bin_id)
        if bin_data:
            result_bins.append(bin_data)
        else:
            print(f" Warning: Bin {bin_id} assigned to {current_user['username']} but not found in database")
    return result_bins
@app.get("/api/users/{username}/bins")
async def get_user_assigned_bins(username: str, current_user: dict = Depends(jwt_required)):
    """Récupère les poubelles assignées à un utilisateur (admin only)"""
    user = db_get_user(current_user['username'])
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    target_user = db_get_user(username)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    assigned_bins = target_user.get('assigned_bins', [])
    result_bins = []
    for bin_id in assigned_bins:
        bin_data = bins_data.get(bin_id)
        if bin_data:
            result_bins.append(bin_data)
    return result_bins
@app.post("/api/users/{username}/bins/{bin_id}")
async def assign_bin_to_user(username: str, bin_id: str, current_user: dict = Depends(jwt_required)):
    """Assigne une poubelle à un utilisateur (admin only)"""
    user = db_get_user(current_user['username'])
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    if bin_id not in bins_data:
        raise HTTPException(status_code=404, detail="Bin not found")
    target_user = db_get_user(username)
    if not target_user:
        # Create user if not exists
        target_user = {
            'username': username,
            'email': f'{username}@smartwaste.mg',
            'full_name': username.capitalize(),
            'password_hash': '1234',
            'role': 'operator',
            'is_active': True,
            'is_approved': True,
            'created_at': datetime.now().isoformat(),
            'last_login': None,
            'assigned_bins': []
        }
        from .database import create_user
        create_user(target_user)
    # Send email notifications for active alerts on this bin
    active_alerts = [a for a in get_all_alerts() if a['bin_id'] == bin_id and a['status'] == 'active']
    for alert in active_alerts:
        if target_user.get('email'):
            from .send import send_alert_email
            send_alert_email(alert['bin_id'], alert['location'], bins_data[bin_id].get('fill_level', 0), alert['type'], target_user['email'])
    assigned_bins = target_user.get('assigned_bins', [])
    if bin_id not in assigned_bins:
        assigned_bins.append(bin_id)
        db_update_user(username, {'assigned_bins': assigned_bins})
    return {"status": "success", "message": f"Bin {bin_id} assigned to user {username}"}
@app.delete("/api/users/{username}/bins/{bin_id}")
async def unassign_bin_from_user(username: str, bin_id: str, current_user: dict = Depends(jwt_required)):
    """Retire l'assignation d'une poubelle à un utilisateur (admin only)"""
    user = db_get_user(current_user['username'])
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    target_user = db_get_user(username)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    assigned_bins = target_user.get('assigned_bins', [])
    if bin_id in assigned_bins:
        assigned_bins.remove(bin_id)
        db_update_user(username, {'assigned_bins': assigned_bins})
    return {"status": "success", "message": f"Bin {bin_id} unassigned from user {username}"}
# Health Check
@app.get("/api/health")
async def health_check():
    """Vérification de l'état du serveur"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "bins_count": len(get_all_bins()),
        "alerts_count": len([a for a in get_all_alerts() if a["status"] == "active"]),
        "connections": len(active_connections)
    }
@app.get("/api/bin/{bin_id}/config")
async def get_bin_config(bin_id: str):
    bin_data = db_get_bin(bin_id)
    if not bin_data:
        raise HTTPException(status_code=404, detail="Bin not found")
    config = {
        "bin_id": bin_data["bin_id"],
        "location": bin_data["location"],
        "address": bin_data["address"],
        "capacity": bin_data["capacity"],
        "latitude": bin_data["latitude"],
        "longitude": bin_data["longitude"]
    }
    return config
@app.post("/api/seed")
async def seed_data():
    seed_bins()
    return {"status": "success", "message": "Bins seeded"}

#  ENDPOINT DE RAPPORT EN MALAGASY
@app.get("/api/report")
async def get_analysis_report(
    period: str = Query("month", pattern="^(day|week|month|year)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(jwt_required)
):
    """Génère un rapport d'analyse complet avec données Malagasy"""
    from .database import _mongo_collection
    
    # Connexion à MongoDB
    db = None
    if _mongo_collection:
        db = _mongo_collection.database
    
    if not db:
        return {
            "statistiques": {},
            "historique": [],
            "poubelles_top": [],
            "alertes": [],
            "predictions": []
        }
    
    # Parser les dates
    date_end = datetime.now()
    if period == "day":
        date_start = date_end - timedelta(days=1)
    elif period == "week":
        date_start = date_end - timedelta(weeks=1)
    elif period == "month":
        date_start = date_end - timedelta(days=30)
    elif period == "year":
        date_start = date_end - timedelta(days=365)
    else:
        date_start = date_end - timedelta(days=30)
    
    # Récupérer les historiques
    history_col = db['historiques']
    history_data = list(history_col.find({
        'timestamp': {
            '$gte': date_start.isoformat(),
            '$lte': date_end.isoformat()
        }
    }))
    
    # Calculer les statistiques
    statistiques = {
        'total_collectes': len(history_data),
        'volume_total': sum(h.get('volume_collected', 0) for h in history_data),
        'volume_moyen': 0,
        'volume_max': 0,
        'volume_min': 0,
        'poubelles_actives': len(set(h.get('bin_id') for h in history_data)),
    }
    
    if history_data:
        volumes = [h.get('volume_collected', 0) for h in history_data]
        statistiques['volume_moyen'] = int(mean(volumes))
        statistiques['volume_max'] = max(volumes)
        statistiques['volume_min'] = min(volumes)
    
    # Top poubelles
    bins_stats = defaultdict(lambda: {'collectes': 0, 'volume_total': 0, 'location': ''})
    for h in history_data:
        bin_id = h.get('bin_id')
        if bin_id:
            bins_stats[bin_id]['collectes'] += 1
            bins_stats[bin_id]['volume_total'] += h.get('volume_collected', 0)
            bins_stats[bin_id]['location'] = h.get('location', '')
    
    poubelles_top = sorted(
        [{'id': k, **v} for k, v in bins_stats.items()],
        key=lambda x: x['volume_total'],
        reverse=True
    )[:5]
    
    # Alertes actuelles
    bins_col = db['poubelles']
    all_bins = list(bins_col.find({}))
    alertes = []
    for b in all_bins:
        fill = b.get('fill_level', 0)
        if fill >= 85:
            severity = 'CRITIQUE' if fill >= 95 else 'URGENT' if fill >= 85 else 'IMPORTANT'
            alertes.append({
                'bin_id': b['bin_id'],
                'location': b['location'],
                'fill_level': fill,
                'severity': severity,
                'volume': b.get('current_volume', 0),
            })
    
    alertes.sort(key=lambda x: x['fill_level'], reverse=True)
    
    # Générer l'historique par jour pour graphique
    historique = []
    current = date_start
    while current <= date_end:
        day_data = [h for h in history_data if h['timestamp'].startswith(current.strftime('%Y-%m-%d'))]
        historique.append({
            'date': current.strftime('%Y-%m-%d'),
            'collectes': len(day_data),
            'volume': sum(h.get('volume_collected', 0) for h in day_data),
            'poubelles_pleines': len([h for h in day_data if h.get('percentage', 0) > 80])
        })
        current += timedelta(days=1)
    
    # Prédictions simples
    predictions = []
    for _ in range(10):
        future = date_end + timedelta(days=_+1)
        predictions.append({
            'date': future.strftime('%Y-%m-%d'),
            'collectes_predites': statistiques['volume_moyen'] // 150 if statistiques['volume_moyen'] else 5,
            'confiance': 75 + random.randint(5, 15)
        })
    
    return {
        'statistiques': statistiques,
        'historique': historique[-30:],  # Dernier 30 jours
        'poubelles_top': poubelles_top,
        'alertes': alertes,
        'predictions': predictions,
        'periode': {
            'start': date_start.isoformat(),
            'end': date_end.isoformat(),
            'type': period,
        }
    }

#  ENDPOINTS D'EXPORT MULTI-FORMAT
@app.get("/api/export/json")
async def export_json(current_user: dict = Depends(jwt_required)):
    """Exporte toutes les données en JSON"""
    try:
        from . import export_reports
        exporteur = export_reports.ExporteurRapports()
        data = exporteur.recuperer_donnees()
        data = exporteur.nettoyer_donnees(data)
        
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur export JSON: {str(e)}")

@app.get("/api/export/csv/{table}")
async def export_csv(table: str = Path(..., pattern="^(poubelles|historiques|predictions|users|utilisateurs)$"), current_user: dict = Depends(jwt_required)):
    """Exporte une table en CSV"""
    try:
        from . import export_reports
        exporteur = export_reports.ExporteurRapports()
        table_key = 'utilisateurs' if table in ['users', 'utilisateurs'] else table
        csv_data = exporteur.exporter_en_memoire_csv(table_key)
        
        if not csv_data:
            raise HTTPException(status_code=404, detail=f"Aucune donnée pour {table}")
        
        # Créer un fichier temporaire
        filename = f"{table}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        temp_path = os.path.join(os.path.dirname(__file__), '..', 'exports', filename)
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        
        with open(temp_path, 'w', encoding='utf-8') as f:
            f.write(csv_data)
        
        return FileResponse(
            path=temp_path,
            media_type='text/csv',
            filename=filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur export CSV: {str(e)}")

@app.get("/api/export/sqlite")
async def export_sqlite(current_user: dict = Depends(jwt_required)):
    """Exporte toutes les données en SQLite"""
    try:
        from . import export_reports
        exporteur = export_reports.ExporteurRapports()
        filepath = exporteur.exporter_sqlite()
        
        if not os.path.exists(filepath):
            raise HTTPException(status_code=500, detail="Erreur création fichier SQLite")
        
        return FileResponse(
            path=filepath,
            media_type='application/x-sqlite3',
            filename=os.path.basename(filepath)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur export SQLite: {str(e)}")

@app.get("/api/export/sql-dump")
async def export_sql_dump(current_user: dict = Depends(jwt_required)):
    """Exporte en SQL dump"""
    try:
        from . import export_reports
        exporteur = export_reports.ExporteurRapports()
        filepath = exporteur.exporter_sql_dump()
        
        if not os.path.exists(filepath):
            raise HTTPException(status_code=500, detail="Erreur création fichier SQL")
        
        return FileResponse(
            path=filepath,
            media_type='text/plain',
            filename=os.path.basename(filepath)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur export SQL: {str(e)}")

@app.get("/api/export/excel")
async def export_excel(current_user: dict = Depends(jwt_required)):
    """Exporte en Excel"""
    try:
        from . import export_reports
        exporteur = export_reports.ExporteurRapports()
        filepath = exporteur.exporter_excel()
        
        if not filepath or not os.path.exists(filepath):
            raise HTTPException(status_code=500, detail="Erreur export Excel - pandas/openpyxl peut ne pas être installé")
        
        return FileResponse(
            path=filepath,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            filename=os.path.basename(filepath)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur export Excel: {str(e)}")

@app.get("/api/export/all")
async def export_all(current_user: dict = Depends(jwt_required)):
    """Exporte tous les formats disponibles et retourne les chemins"""
    try:
        from . import export_reports
        exporteur = export_reports.ExporteurRapports()
        resultats = exporteur.exporter_tous_formats()
        
        # Retourner les informations des fichiers créés
        fichiers_info = {}
        for format_name, filepath in resultats.items():
            if filepath and os.path.exists(filepath):
                size = os.path.getsize(filepath)
                fichiers_info[format_name] = {
                    'path': filepath,
                    'filename': os.path.basename(filepath),
                    'size_bytes': size,
                    'size_mb': round(size / (1024 * 1024), 2),
                    'timestamp': exporteur.timestamp
                }
        
        return {
            'status': 'success',
            'message': f'{len(fichiers_info)} fichiers exportés',
            'fichiers': fichiers_info,
            'export_directory': os.path.join(os.path.dirname(__file__), '..', 'exports')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur exports multiples: {str(e)}")

@app.get("/api/export/info")
async def export_info(current_user: dict = Depends(jwt_required)):
    """Récupère les informations sur les exports disponibles"""
    try:
        from . import export_reports
        exporteur = export_reports.ExporteurRapports()
        donnees = exporteur.recuperer_donnees()
        
        return {
            'status': 'success',
            'formats_disponibles': ['JSON', 'CSV', 'Excel', 'SQLite', 'SQL Dump'],
            'statistiques': {
                'total_poubelles': len(donnees.get('poubelles', [])),
                'total_historiques': len(donnees.get('historiques', [])),
                'total_predictions': len(donnees.get('predictions', [])),
                'total_utilisateurs': len(donnees.get('utilisateurs', [])),
                'total_alertes': len(donnees.get('alertes', [])),
            },
            'taille_estimee_mb': sum(
                len(donnees.get(k, [])) * 0.001 
                for k in ['historiques', 'predictions']
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur info exports: {str(e)}")

# Initialisation avec des données de test
@app.on_event("startup")
def startup_event():
    global bins_data
    try:
        print("Initialisation de la base de donnees...")
        initialize_database()
        initialize_users()
        initialize_alerts()
        initialize_collections()
        seed_bins()
        all_bins = get_all_bins()
        bins_data = all_bins
        # Create alerts for bins with critical status ET envoyer emails
        for bin_id, bin_data in all_bins.items():
            fill_level = bin_data.get('fill_level', 0)
            status = bin_data.get('status', 'normal')
            location = bin_data.get('location', 'Unknown')
            if fill_level >= 95 or status == 'critical':
                alert_type = 'urgent' if fill_level >= 95 else 'important'
                alert_title = f"Poubelle en surcharge critique" if fill_level >= 95 else f"Poubelle pleine - Collecte requise"
                alert_desc = f"{location} - Niveau: {fill_level}%"
                # Check if alert already exists
                existing_alerts = get_all_alerts()
                existing = [a for a in existing_alerts if a['bin_id'] == bin_id and a['type'] == alert_type and a['status'] == 'active']
                if not existing:
                    alert = {
                        'bin_id': bin_id,
                        'type': alert_type,
                        'title': alert_title,
                        'description': alert_desc,
                        'location': location,
                        'timestamp': datetime.now().isoformat(),
                        'status': 'active'
                    }
                    create_alert(alert)
                    #  NOUVEAU: Envoyer emails au démarrage pour alertes critiques
                    if alert_type == 'urgent':
                        from .send import send_alert_email
                        # Email à l'admin
                        send_alert_email(bin_id, location, fill_level, alert_type)
                        # Email aux utilisateurs assignés
                        all_users = get_all_users()
                        for username, user_data in all_users.items():
                            if user_data.get('assigned_bins') and bin_id in user_data['assigned_bins']:
                                if user_data.get('email'):
                                    print(f" Envoi email startup à {username} pour {bin_id}")
                                    send_alert_email(bin_id, location, fill_level, alert_type, user_data['email'])
                    print(f"Created alert for {bin_id}: {alert_title}")
        print(f"\n{'='*60}")
        print(f"Application demarree - {len(all_bins)} poubelles chargees - {len(get_all_alerts())} alertes actives")
        print(f"{'='*60}")
        # Afficher les noms et emplacements des poubelles
        if all_bins:
            print("\n LISTE DES POUBELLES ENREGISTREES:")
            print(f"{'='*60}")
            for bin_id, bin_data in sorted(all_bins.items()):
                location = bin_data.get('location', 'N/A')
                address = bin_data.get('address', 'N/A')
                fill_level = bin_data.get('fill_level', 0)
                status = bin_data.get('status', 'unknown')
                battery = bin_data.get('battery', 0)
                print(f"\n  {bin_id}")
                print(f"    Localisation: {location}")
                print(f"    Adresse: {address}")
                print(f"    Niveau de remplissage: {fill_level}%")
                print(f"     Statut: {status}")
                print(f"    Batterie: {battery}%")
            print(f"\n{'='*60}\n")
        else:
            print("  Aucune poubelle enregistrée dans la base de données\n")
        # Afficher les utilisateurs et leurs assignations
        all_users = get_all_users()
        if all_users:
            print("\n LISTE DES UTILISATEURS:")
            print(f"{'='*60}")
            for username, user_data in all_users.items():
                assigned = user_data.get('assigned_bins', [])
                print(f"\n {username} ({user_data.get('role', 'N/A')})")
                print(f"    Email: {user_data.get('email', 'N/A')}")
                print(f"    Approuvé: {user_data.get('is_approved', False)}")
                print(f"     Poubelles assignées: {', '.join(assigned) if assigned else 'Aucune'}")
            print(f"\n{'='*60}\n")
    except Exception as e:
        print(f"Erreur lors du startup: {e}")
        import traceback
        traceback.print_exc()
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)