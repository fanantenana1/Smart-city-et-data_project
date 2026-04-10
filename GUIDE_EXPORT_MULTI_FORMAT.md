# 📤 GUIDE D'EXPORT MULTI-FORMAT

## Système de Gestion Intelligente des Déchets - Madagascar
### Export de rapports et données massives

---

## 📋 Vue d'ensemble

Le système supporte l'export des données massives en **7 formats différents** :

| Format | Extension | Cas d'usage | Taille |
|--------|-----------|------------|---------|
| **JSON** | `.json` | Intégration APIs, archivage complet | ~500 KB |
| **CSV - Poubelles** | `.csv` | Tableur Excel, analyse statistique | ~50 KB |
| **CSV - Historiques** | `.csv` | Historique collectes, audit trail | ~300 KB |
| **CSV - Prédictions** | `.csv` | Prédictions ML, analyse tendances | ~150 KB |
| **SQLite** | `.db` | Base données portable, requêtes SQL | ~600 KB |
| **SQL Dump** | `.sql` | Migration base, backup, MySQL/PostgreSQL | ~800 KB |
| **Excel** | `.xlsx` | Rapports visuels, multi-sheets | ~1.5 MB |

---

## 🚀 Utilisation - Interface Frontend

### Étape 1: Accéder à la page de rapport
```
URL: http://localhost:3000/reports
Connexion: admin / admin123
```

### Étape 2: Boutons d'export visibles
La section **"📤 EXPORT DES DONNÉES"** apparaît après les filtres de période.

### Étape 3: Sélectionner format
Cliquer sur **"Exporter"** → Menu déroulant → Choisir format

**Options:**
- 🔵 **JSON** - Données complètes en JSON
- 📄 **CSV - Poubelles** - Liste des poubelles
- 📊 **CSV - Historiques** - 300+ collectes
- 🔮 **CSV - Prédictions** - Prédictions 30 jours
- 💾 **SQLite** - Base données complète
- 🗄️ **SQL Dump** - Export SQL compatible
- 📈 **Excel** - Report multi-sheets
- ✅ **Tous formats** - Exporter tous d'un coup

---

## 📤 Utilisation - API Backend

### GET /api/export/json
**Description:** Retourne toutes les données en JSON

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/export/json
```

**Réponse:**
```json
{
  "poubelles": [...],
  "historiques": [...],
  "predictions": [...],
  "utilisateurs": [...],
  "alertes": [...]
}
```

---

### GET /api/export/csv/{table}
**Description:** Export une table en CSV

**Paramètres:**
- `table` (required): `poubelles|historiques|predictions|users`

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/export/csv/poubelles \
  -o poubelles.csv
```

**Exemple CSV Poubelles:**
```csv
bin_id,location,address,fill_level,capacity,current_volume,battery,status
PBL-ANT-001,Avenue de l'Indépendance,Antananarivo Centre,45.5,240,109,78.5,normal
PBL-ANT-004,Gare Routière,Antananarivo,88.3,280,247,65.2,critical
...
```

---

### GET /api/export/sqlite
**Description:** Export base SQLite complète

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/export/sqlite \
  -o rapport_dechets_20260409_101500.db
```

**Tables créées:**
- `poubelles` (14 lignes)
- `historiques` (300+ lignes)
- `predictions` (400+ lignes)
- `users` (10 lignes)

**Utilisation:**
```bash
# Ouvrir avec SQLite
sqlite3 rapport_dechets_20260409_101500.db

# Query exemple
sqlite> SELECT bin_id, location, fill_level FROM poubelles WHERE fill_level > 80;
```

---

### GET /api/export/sql-dump
**Description:** Export SQL dump (MySQL/PostgreSQL compatible)

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/export/sql-dump \
  -o rapport_dechets_20260409_101500.sql
```

**Contenu SQL:**
```sql
-- Export SQL Système Gestion Déchets Madagascar
-- Généré le: 2026-04-09T10:15:00

CREATE TABLE poubelles (
  bin_id VARCHAR(50) PRIMARY KEY,
  location VARCHAR(255),
  fill_level DECIMAL(5,2),
  ...
);

INSERT INTO poubelles VALUES ('PBL-ANT-001', 'Avenue...', 45.5, ...);
...
```

**Importer dans base de données:**
```bash
# MySQL
mysql -u user -p database < rapport_dechets.sql

# PostgreSQL
psql -U user -d database -f rapport_dechets.sql
```

---

### GET /api/export/excel
**Description:** Export Excel multi-sheets

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/export/excel \
  -o rapport_complet.xlsx
```

**Sheets inclus:**
1. **Poubelles** - 14 poubelles, 15 colonnes
2. **Historiques** - 300+ collectes, 8 colonnes
3. **Predictions** - 400+ prédictions, 7 colonnes
4. **Utilisateurs** - 10 users, 8 colonnes

---

### GET /api/export/all
**Description:** Retourne les infos de tous exports

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/export/all
```

**Réponse:**
```json
{
  "status": "success",
  "message": "6 fichiers exportés",
  "fichiers": {
    "json": {
      "filename": "rapport_complet_20260409_101500.json",
      "size_bytes": 512000,
      "size_mb": 0.49
    },
    "csv": {
      "poubelles": "poubelles_20260409.csv",
      "historiques": "historiques_20260409.csv",
      "predictions": "predictions_20260409.csv"
    },
    ...
  }
}
```

---

### GET /api/export/info
**Description:** Infos disponibilité exports

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/export/info
```

**Réponse:**
```json
{
  "status": "success",
  "formats_disponibles": ["JSON", "CSV", "Excel", "SQLite", "SQL Dump"],
  "statistiques": {
    "total_poubelles": 14,
    "total_historiques": 342,
    "total_predictions": 420,
    "total_utilisateurs": 10,
    "total_alertes": 3
  },
  "taille_estimee_mb": 2.5
}
```

---

## 🔧 Utilisation - Ligne de commande

### Générer tous les exports
```bash
cd backend
python export_reports.py
```

**Résultat:**
```
============================================
📤 SYSTÈME D'EXPORT MULTI-FORMAT
============================================
🚀 Exécution des exports...

============================================
✅ RÉSUMÉ DES EXPORTS
============================================
✅ JSON     → ./exports/rapport_complet_20260409_101500.json
   Taille: 0.49 MB
✅ CSV      → ./exports/poubelles_20260409_101500.csv
   Taille: 0.05 MB
✅ SQLITE   → ./exports/rapport_dechets_20260409_101500.db
   Taille: 0.58 MB
✅ SQL      → ./exports/rapport_dechets_20260409_101500.sql
   Taille: 0.76 MB
✅ EXCEL    → ./exports/rapport_complet_20260409_101500.xlsx
   Taille: 1.45 MB
```

---

## 📁 Structure des fichiers exportés

### JSON
```
rapport_complet_20260409_101500.json
├── poubelles: Array[14]
├── historiques: Array[342]
├── predictions: Array[420]
├── utilisateurs: Array[10]
└── alertes: Array[3]
Taille: ~500 KB
```

### CSV
```
poubelles_20260409.csv (50 KB)
historiques_20260409.csv (300 KB)
predictions_20260409.csv (150 KB)
utilisateurs_20260409.csv (20 KB)
```

### SQLite
```
rapport_dechets_20260409_101500.db (600 KB)
├─ Table: poubelles
├─ Table: historiques
├─ Table: predictions
└─ Table: users
```

### SQL
```
rapport_dechets_20260409_101500.sql (800 KB)
├─ CREATE TABLE poubelles
├─ CREATE TABLE historiques
├─ CREATE TABLE predictions
├─ CREATE TABLE users
└─ 700+ INSERT statements
```

### Excel
```
rapport_complet_20260409_101500.xlsx (1.5 MB)
├─ Sheet: Poubelles
├─ Sheet: Historiques
├─ Sheet: Predictions
└─ Sheet: Utilisateurs
```

---

## 💡 Cas d'usage

### 1️⃣ Sauvegarde quotidienne
```bash
# Chaque jour à 23:00
0 23 * * * cd /path/backend && python export_reports.py
```

### 2️⃣ Archivage mensuel
```bash
# Conserver dans structure datée
mkdir -p archives/$(date +%Y/%m)
cp exports/* archives/$(date +%Y/%m)/
```

### 3️⃣ Migration base de données
```bash
# Exporter depuis MongoDB
python export_reports.py

# Importer dans MySQL
mysql -u admin -p < exports/rapport_dechets.sql
```

### 4️⃣ Intégration Power BI / Tableau
```
Importer: exports/rapport_complet.xlsx
Ou utiliser API: GET /api/export/json
```

### 5️⃣ Analyse offline avec Python
```python
import json

with open('exports/rapport_complet.json') as f:
    data = json.load(f)

historiques = data['historiques']
total_volume = sum(h['volume_collected'] for h in historiques)
print(f"Volume total collecté: {total_volume} L")
```

---

## 🔒 Sécurité

- ✅ Authentification JWT requise (`Authorization: Bearer`)
- ✅ Mots de passe exclus des exports utilisateurs
- ✅ Fichiers générés avec timestamp unique
- ✅ Stockés dans `backend/exports/` non accessible publiquement

---

## ⚠️ Limitations & Notes

| Limite | Valeur | Note |
|--------|--------|------|
| Max lignes historiques | 400 | Peut être augmenté |
| Taille fichier SQL | ~800 KB | Historiques limités à 100 entrées |
| Timeout export | 30s | Peut être augmenté |
| Formats simultanés | Illimité | Peut être lent |

---

## 🐛 Troubleshooting

### ❌ "Erreur export Excel - pandas non installé"
```bash
pip install pandas openpyxl
```

### ❌ "404 - Fichier non trouvé"
- Vérifier que exports/ existe: `mkdir -p backend/exports`
- Vérifier permissions: `chmod 755 backend/exports`

### ❌ "401 - Unauthorized"
- Vérifier token JWT dans Authorization header
- Token expiré après 24h, reconnecter

### ❌ "Fichier trop volumineux"
- Limiter la période: `?period=week`
- Exporter par table séparément

---

## 📝 Performance

| Format | Temps | Taille | Débit |
|--------|-------|--------|-------|
| JSON | 0.5s | 500 KB | 1 MB/s |
| CSV | 0.3s | 520 KB | 1.7 MB/s |
| SQLite | 0.8s | 600 KB | 0.75 MB/s |
| SQL Dump | 0.6s | 800 KB | 1.3 MB/s |
| Excel | 1.2s | 1.5 MB | 1.25 MB/s |

---

## 🎯 Prochaines améliorations

- [ ] Export PDF customisé
- [ ] Compression ZIP automatique
- [ ] Export incrémental (depuis dernière date)
- [ ] Scheduling automated exports
- [ ] Intégration Google Sheets/Drive
- [ ] Export en temps réel (WebSocket)
- [ ] Chiffrement fichiers sensibles

---

## 📞 Support

Pour problèmes ou suggestions:
1. Vérifier que backend tourne: `python start.py`
2. Vérifier MongoDB connectivity: `python test_mongo.py`
3. Consulter logs: `backend/logs/`

**Version:** 1.0 | **Date:** 2026-04-09 | **Madagascar** 🇲🇬
