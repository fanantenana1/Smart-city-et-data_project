#!/usr/bin/env python3
"""
Fichier de configuration des données Malagasy pour SmartWaste
Ce fichier contient toutes les données statiques pour faciliter l'ajout/suppression
"""

# ===== DONNÉES UTILISATEURS =====
USERS_DATA = [
    {
        'username': 'admin',
        'email': 'admin@smartwaste.mg',
        'password_hash': 'admin123',
        'full_name': 'Administrateur Système',
        'role': 'admin',
        'is_active': True,
        'is_approved': True,
        'assigned_bins': []
    },
    {
        'username': 'rakoto_jean',
        'email': 'rakoto.jean@smartwaste.mg',
        'password_hash': 'collector123',
        'full_name': 'Rakoto Jean',
        'role': 'collector',
        'is_active': True,
        'is_approved': True,
        'assigned_bins': ['PBL-TANA-001', 'PBL-TANA-002']
    },
    {
        'username': 'rabe_paul',
        'email': 'rabe.paul@smartwaste.mg',
        'password_hash': 'collector123',
        'full_name': 'Rabe Paul',
        'role': 'collector',
        'is_active': True,
        'is_approved': True,
        'assigned_bins': ['PBL-FIANA-001', 'PBL-FIANA-002']
    },
    {
        'username': 'andria_marie',
        'email': 'andria.marie@smartwaste.mg',
        'password_hash': 'operator123',
        'full_name': 'Andria Marie',
        'role': 'operator',
        'is_active': True,
        'is_approved': True,
        'assigned_bins': ['PBL-TOAM-001']
    },
    {
        'username': 'razafy_sophie',
        'email': 'razafy.sophie@smartwaste.mg',
        'password_hash': 'operator123',
        'full_name': 'Razafy Sophie',
        'role': 'operator',
        'is_active': True,
        'is_approved': True,
        'assigned_bins': ['PBL-MAHA-001', 'PBL-TOLI-001']
    }
]

# ===== DONNÉES POUBELLES MALAGASY =====
BINS_DATA = [
    # Antananarivo (Tananarive)
    {"id": "PBL-TANA-001", "location": "Avenue de l'Indépendance", "address": "Antananarivo Centre - Tananarive", "lat": -18.8792, "lon": 47.5079, "capacity": 240, "district": "Analamanga"},
    {"id": "PBL-TANA-002", "location": "Quartier Ankadifotsy", "address": "Ankadifotsy - Tananarive", "lat": -18.8950, "lon": 47.5200, "capacity": 200, "district": "Analamanga"},
    {"id": "PBL-TANA-003", "location": "Rue Rainandriamampandry", "address": "Rainandriamampandry - Tananarive", "lat": -18.8850, "lon": 47.5150, "capacity": 220, "district": "Analamanga"},
    {"id": "PBL-TANA-004", "location": "Gare Routière d'Antananarivo", "address": "Gare Routière - Tananarive", "lat": -18.9020, "lon": 47.5300, "capacity": 280, "district": "Analamanga"},
    {"id": "PBL-TANA-005", "location": "Marché Zoma", "address": "Zoma - Tananarive", "lat": -18.8900, "lon": 47.5100, "capacity": 260, "district": "Analamanga"},

    # Fianarantsoa
    {"id": "PBL-FIANA-001", "location": "Anjoma - Fianarantsoa", "address": "Anjoma - Fianarantsoa", "lat": -21.4500, "lon": 47.0833, "capacity": 220, "district": "Haute Matsiatra"},
    {"id": "PBL-FIANA-002", "location": "Quartier Ankadifotsy", "address": "Ankadifotsy - Fianarantsoa", "lat": -21.4550, "lon": 47.0850, "capacity": 200, "district": "Haute Matsiatra"},
    {"id": "PBL-FIANA-003", "location": "Tanambao Fianarantsoa", "address": "Rue Tanambao - Fianarantsoa", "lat": -21.4600, "lon": 47.0900, "capacity": 240, "district": "Haute Matsiatra"},
    {"id": "PBL-FIANA-004", "location": "Soatsihadino Fianarantsoa", "address": "Soatsihadino - Fianarantsoa", "lat": -21.4650, "lon": 47.0950, "capacity": 180, "district": "Haute Matsiatra"},
    {"id": "PBL-FIANA-005", "location": "Marché de Fianarantsoa", "address": "Marché Central - Fianarantsoa", "lat": -21.4500, "lon": 47.0800, "capacity": 260, "district": "Haute Matsiatra"},

    # Toamasina (Tamatave)
    {"id": "PBL-TOAM-001", "location": "Port de Toamasina", "address": "Port - Toamasina", "lat": -18.1667, "lon": 49.3833, "capacity": 280, "district": "Analanjirofo"},
    {"id": "PBL-TOAM-002", "location": "Marché de Toamasina", "address": "Marché Central - Toamasina", "lat": -18.1700, "lon": 49.3850, "capacity": 240, "district": "Analanjirofo"},
    {"id": "PBL-TOAM-003", "location": "Quartier Tanambao", "address": "Tanambao - Toamasina", "lat": -18.1750, "lon": 49.3900, "capacity": 200, "district": "Analanjirofo"},

    # Mahajanga
    {"id": "PBL-MAHA-001", "location": "Port de Mahajanga", "address": "Port - Mahajanga", "lat": -15.7167, "lon": 46.3167, "capacity": 260, "district": "Boeny"},
    {"id": "PBL-MAHA-002", "location": "Marché de Mahajanga", "address": "Marché Central - Mahajanga", "lat": -15.7200, "lon": 46.3200, "capacity": 220, "district": "Boeny"},

    # Toliara (Tuléar)
    {"id": "PBL-TOLI-001", "location": "Plage de Toliara", "address": "Plage - Toliara", "lat": -23.3644, "lon": 43.6671, "capacity": 180, "district": "Atsimo-Andrefana"},
    {"id": "PBL-TOLI-002", "location": "Marché de Toliara", "address": "Marché Central - Toliara", "lat": -23.3700, "lon": 43.6700, "capacity": 200, "district": "Atsimo-Andrefana"},

    # Antsiranana (Diego-Suarez)
    {"id": "PBL-ANTS-001", "location": "Port d'Antsiranana", "address": "Port - Antsiranana", "lat": -12.2667, "lon": 49.2833, "capacity": 240, "district": "Diana"},
    {"id": "PBL-ANTS-002", "location": "Marché d'Antsiranana", "address": "Marché Central - Antsiranana", "lat": -12.2700, "lon": 49.2850, "capacity": 210, "district": "Diana"},

    # Nosy-Bé
    {"id": "PBL-NOSY-001", "location": "Centre Nosy-Bé", "address": "Hell-Ville - Nosy-Bé", "lat": -13.3923, "lon": 48.2708, "capacity": 150, "district": "Diana"},
    {"id": "PBL-NOSY-002", "location": "Plage d'Ambatoloaka", "address": "Ambatoloaka - Nosy-Bé", "lat": -13.3950, "lon": 48.2750, "capacity": 160, "district": "Diana"},

    # Régions supplémentaires
    {"id": "PBL-ANTSIRABE-001", "location": "Lac Andraikiba", "address": "Antsirabe", "lat": -19.8667, "lon": 47.0333, "capacity": 200, "district": "Vakinankaratra"},
    {"id": "PBL-MORONDAVA-001", "location": "Baie de Morondava", "address": "Morondava", "lat": -20.2833, "lon": 44.2833, "capacity": 180, "district": "Menabe"},
    {"id": "PBL-SAMBAVA-001", "location": "Port de Sambava", "address": "Sambava", "lat": -14.2667, "lon": 50.1667, "capacity": 220, "district": "Sava"},
    {"id": "PBL-MANANARA-001", "location": "Rivière Mananara", "address": "Mananara-Nord", "lat": -16.1667, "lon": 49.7667, "capacity": 190, "district": "Analanjirofo"},
]

# ===== OPÉRATEURS MALAGASY =====
OPERATORS_MALAGASY = [
    "Rakoto Jean", "Rabe Paul", "Andria Marie", "Razafy Sophie", "Randria Michel",
    "Ramanantsoa Pierre", "Razafindrakoto Lucie", "Andriamanitra Jacques", "Ravoahangy Claire",
    "Rasolofomanana Thomas", "Rajaonarivelo Anne", "Andrianarivo Henri", "Razanakoto Béatrice",
    "Randrianasolo Daniel", "Rabeharisoa Joséphine", "Andriantsilavo Marc", "Razafindramanitra Louise",
    "Ramanandraibe Robert", "Andriambelosoa Nathalie", "Razafimahefa André", "Ratsimbazafy Christine",
    "Andrianantenaina Georges", "Razakanirina Marguerite", "Ramananjato Philippe", "Andriamanjato Eliane"
]

# ===== NOTES DE COLLECTE EN MALAGASY =====
COLLECTION_NOTES = [
    "Collecte normale - Tsara ny fanadiovana",
    "Urgence - Feno be loatra - Collecte urgente",
    "Maintenance effectuée - Fanamboarana vita",
    "Capteur vérifié - Capteur voamarina",
    "Remplacement batterie - Fanoloana bateria",
    "Problème technique résolu - Olana teknika voavaha",
    "Collecte complète - Fanadiovana feno",
    "Zone difficile d'accès - Toerana sarotra hiditra",
    "Temps pluvieux - Andro oram-panala",
    "Collecte nocturne - Fanadiovana alina",
    "Nouveau quartier - Toerana vaovao",
    "Demande spéciale - Fangatahana manokana",
    "Équipement défaillant - Fitaovana simba",
    "Route bloquée - Lalambe voasakana",
    "Client satisfait - Mpanjifa faly",
    "Collecte anticipée - Fanadiovana aloha",
    "Vérification GPS - Fanamarinana GPS",
    "Formation nouvelle équipe - Fanofanana ekipa vaovao",
    "Maintenance préventive - Fanamboarana mialoha",
    "Incident signalé - Zava-mitranga voamarina"
]

# ===== CONFIGURATION GÉNÉRATION =====
GENERATION_CONFIG = {
    'num_bins': len(BINS_DATA),  # Utilise toutes les poubelles définies
    'collections_per_bin': (30, 50),  # Min-Max collectes par poubelle
    'start_date_days_ago': 180,  # 6 mois d'historique
    'predictions_days': 30,  # Prédictions sur 30 jours
}