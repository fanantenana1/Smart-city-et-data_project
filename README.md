# SmartWaste - Système de Gestion Intelligente des Poubelles

Application web complète pour la gestion et le suivi des poubelles intelligentes avec capteurs IoT.

## 🎯 Fonctionnalités

- 📊 Dashboard en temps réel avec visualisation des poubelles
- 🔔 Système d'alertes pour poubelles critiques
- 📱 Interface responsive (desktop & mobile)
- 👥 Gestion des utilisateurs et rôles
- 📈 Statistiques et historique des collectes
- 🌐 Communication WebSocket en temps réel
- 🔐 Authentification JWT

## 🛠️ Stack Technique

### Backend
- **FastAPI** - Framework web asynchrone Python
- **MongoDB** - Base de données NoSQL
- **WebSocket** - Communication en temps réel
- **Pydantic** - Validation des données

### Frontend
- **React** - Interface utilisateur
- **Axios** - Client HTTP
- **Tailwind CSS** - Styling
- **WebSocket Client** - Communication temps réel

## 📋 Prérequis

- Python 3.8+
- Node.js 14+
- MongoDB (optionnel - fallback JSON)
- npm ou yarn

## 🚀 Installation et Démarrage

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Le backend démarre sur `http://localhost:8000`

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Le frontend démarre sur `http://localhost:3001`

## 📁 Structure du Projet

```
SmartWaste/
├── backend/
│   ├── app/
│   │   ├── main.py          # Endpoints FastAPI
│   │   ├── database.py      # Gestion MongoDB/JSON
│   │   └── send.py          # Envoi d'emails
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Composant principal
│   │   ├── api.js           # Configuration Axios
│   │   ├── config.js        # Configuration API
│   │   └── pages/           # Pages de l'app
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔌 API Endpoints Principaux

- `GET /api/bins` - Lister toutes les poubelles
- `POST /api/bin/update` - Mettre à jour une poubelle
- `GET /api/alerts` - Récupérer les alertes
- `POST /api/collection/record` - Enregistrer une collecte
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/statistics` - Statistiques

## 🐳 Docker

```bash
docker-compose up
```

## 🔑 Configuration

Créez un fichier `.env` dans le backend:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

## 📝 Logs et Débogage

Les logs du serveur s'affichent directement dans le terminal lors du démarrage avec `--reload`.

Activez le debug côté frontend en définissant:
```env
REACT_APP_DEBUG=true
```

## 🤝 Support

Pour les problèmes de connexion:
1. Vérifier que les deux serveurs sont lancés
2. Vérifier la configuration de l'adresse IP dans `frontend/src/config.js`
3. Consulter les logs du navigateur (F12)

## 📄 Licence

MIT - Voir [LICENSE.md](LICENSE.md)

---

**Développé avec ❤️**
# Smart-city-et-data_project
