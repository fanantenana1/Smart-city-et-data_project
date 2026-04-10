#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
📊 GUIDE D'UTILISATION - SYSTÈME DE GESTION INTELLIGENTE DES DÉCHETS
Fiharenana sy Fampanalana ny Tahiry Samihafa

Madagascar - 2026
"""

GUIDE = """
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        🚀 GUIDE D'UTILISATION COMPLET                         ║
║              Système de Gestion Intelligente des Déchets - Madagascar         ║
╚═══════════════════════════════════════════════════════════════════════════════╝

📁 FICHIERS CRÉÉS POUR CETTE PHASE
═══════════════════════════════════════════════════════════════════════════════

1. 📦 backend/generate_massive_data.py
   └─ Générateur de données massives réalistes
   └─ Crée 12+ poubelles avec 6 mois d'historique
   └─ Génère prédictions ML simples pour 30 jours

2. 🔍 backend/analyseur_dechets.py
   └─ Moteur d'analyse et de prédiction
   └─ Calcule statistiques détaillées
   └─ Génère rapports en Malagasy

3. 💻 frontend/src/components/ReportsPageMalagasy.jsx
   └─ Interface React pour visualisation rapports
   └─ Filtres temps (jour, semaine, mois, année)
   └─ Graphiques interactifs Recharts
   └─ Contenu complète en Malagasy

4. 🎨 frontend/src/styles/ReportsPage.css
   └─ Styles modernes et responsive
   └─ Adaptation mobile

5. 🔌 backend/app/main.py (modification)
   └─ Nouvel endpoint: GET /api/report
   └─ Paramètres: period, start_date, end_date
   └─ Retourne données d'analyse complète


🚀 ÉTAPES DE MISE EN ŒUVRE
═══════════════════════════════════════════════════════════════════════════════

ÉTAPE 1: GÉNÉRER LES DONNÉES MASSIVES
──────────────────────────────────────

Commande:
    cd backend
    python generate_massive_data.py

Résultat attendu:
    ✅ 12-14 poubelles générées
    ✅ 300-400 entrées d'historique de collecte
    ✅ 30+ prédictions pour chaque poubelle
    ✅ Toutes les données synchronisées avec MongoDB

Exemple de sortie:
    ============================================
    🚀 GÉNÉRATEUR DE DONNÉES MASSIVES
    ============================================
    🔗 URI: mongodb+srv://fafa000...
    
    📊 Génération des données...
    ✅ 14 poubelles générées
    
    📝 Génération de l'historique de collecte...
    ✅ 342 collectes générées
    
    🔮 Génération des prédictions...
    ✅ 420 prédictions générées
    
    ============================================
    📈 STATISTIQUES GÉNÉRÉES
    ============================================
    Poubelles: 14
    Historique: 342
    Prédictions: 420
    ✅ Données massives générées et synchronisées avec succès!


ÉTAPE 2: ANALYSER LES DONNÉES (OPTIONNEL)
───────────────────────────────────────

Commande:
    python analyseur_dechets.py

Le rapport inclut:
    📈 Analise Ankapobeny (Analyse générale)
    🗑️ Analise Isy ny Tahiry (Analyse par poubelle)
    🚨 Fampilaram-Pisalampi (Alertes prioritaires)
    🔮 Vinavinam-Pikarohana (Prédictions futures)

Les rapports sont exportés en JSON dans: backend/rapports/


ÉTAPE 3: AFFICHER LE DASHBOARD FRONTEND
────────────────────────────────────────

Accès à l'interface du rapport:
    Frontend URL: http://localhost:3001
    Route: /reports

Vérifier que:
    ✅ Le login fonctionne
    ✅ Les données des poubelles s'affichent
    ✅ Les graphiques se rendent correctement
    ✅ Les filtres temps fonctionnent (jour, mois, année)


📊 UTILISATION DE L'API /api/report
═══════════════════════════════════════════════════════════════════════════════

Endpoint: GET /api/report
Host: http://localhost:8000

Paramètres Query:
    - period: (day|week|month|year)  [default: month]
    - start_date: ISO format optional
    - end_date: ISO format optional
    - Authorization: Bearer TOKEN required

Exemple cURL:
    curl -H "Authorization: Bearer <token>" \\
         "http://localhost:8000/api/report?period=month"

Réponse JSON:
    {
      "statistiques": {
        "total_collectes": 342,
        "volume_total": 65430,
        "volume_moyen": 191,
        "volume_max": 280,
        "volume_min": 85,
        "poubelles_actives": 14
      },
      "historique": [
        {
          "date": "2026-04-01",
          "collectes": 12,
          "volume": 2450,
          "poubelles_pleines": 2
        },
        ...
      ],
      "poubelles_top": [
        {
          "id": "PBL-ANT-004",
          "location": "Gare Routière",
          "collectes": 35,
          "volume_total": 9100
        },
        ...
      ],
      "alertes": [
        {
          "bin_id": "PBL-ANT-001",
          "location": "Avenue de l'Indépendance",
          "fill_level": 95,
          "severity": "CRITIQUE"
        },
        ...
      ],
      "predictions": [
        {
          "date": "2026-05-10",
          "collectes_predites": 8,
          "confiance": 82
        },
        ...
      ]
    }


🎯 FONCTIONNALITÉS DE LA PAGE DE RAPPORT
═══════════════════════════════════════════════════════════════════════════════

1. 🔔 SÉLECTEUR DE PÉRIODE
   └─ Boutons: Andro | Herinandro | Volana | Taona
   └─ Input de date pour période personnalisée
   └─ Mise à jour dynamique des graphiques

2. 📊 CARTES STATISTIQUES
   └─ Isan\'ny Fiangon\'ny Farany (Total collectes)
   └─ Volan\'ny Fiterin\'ny Kateza (Volume total)
   └─ Vola Afovoany (Volume moyen)
   └─ Tahiry Kritika (Poubelles critiques)

3. 📈 GRAPHIQUES INTERACTIFS
   └─ Ligne: Chronologie collectes vs volume
   └─ Barres: Top poubelles par volume
   └─ Barres: Prédictions collectes futures
   └─ Format Recharts (responsive, hover details)

4. 🚨 ALERTES PRIORITAIRES
   └─ Code couleur: Rouge (CRITIQUE), Orange (URGENT), Jaune (IMPORTANT)
   └─ Affichage: Localisation, % remplissage, niveau batterie
   └─ Top prioritaires: Tri automatique

5. 🔮 PRÉDICTIONS ML
   └─ Basées sur historique 30 derniers jours
   └─ Affichage: Date, nombre collectes prévues, confiance
   └─ Horizon: 10 jours à venir

6. 📝 RÉSUMÉ EN MALAGASY
   └─ Synthèse des trouvailles clés
   └─ Recommandations d'actions


📁 STRUCTURE DES DONNÉES MongoDB
═══════════════════════════════════════════════════════════════════════════════

Collection: poubelles
├──ields:
│  ├─ bin_id: "PBL-ANT-001"
│  ├─ location: "Avenue de l'Indépendance"
│  ├─ address: "Antananarivo Centre"
│  ├─ fill_level: 45.5
│  ├─ capacity: 240
│  ├─ current_volume: 109
│  ├─ battery: 78.5
│  ├─ temperature: 26.3
│  ├─ signal_quality: "Bon"
│  ├─ status: "normal"
│  ├─ latitude: -18.8792
│  ├─ longitude: 47.5079
│  └─ last_update: "2026-04-09T10:30:00"

Collection: historiques
├─ Fields:
│  ├─ bin_id: "PBL-ANT-001"
│  ├─ location: "Avenue de l'Indépendance"
│  ├─ operator: "Jean Collector"
│  ├─ volume_collected: 180
│  ├─ percentage: 75.0
│  ├─ timestamp: "2026-04-05T14:20:00"
│  ├─ duration_minutes: 12
│  └─ notes: "Collecte normale"

Collection: predictions
├─ Fields:
│  ├─ bin_id: "PBL-ANT-001"
│  ├─ location: "Avenue de l'Indépendance"
│  ├─ prediction_date: "2026-04-15T00:00:00"
│  ├─ predicted_fill_level: 72.5
│  ├─ confidence: 82.5
│  ├─ recommended_collection: "Non"
│  └─ generated_at: "2026-04-09T10:30:00"


💡 EXEMPLES DE CAS D'USAGE
═══════════════════════════════════════════════════════════════════════════════

SCÉNARIO 1: Vue Mensuelle
─────────────────────────
Admin clique sur 'Volana' (Mois) → Sélectionne avril 2026
→ Affiche:
  ✅ 342 collectes en avril
  ✅ 65.4K litres collectés
  ✅ Volume moyen: 191 litres/collecte
  ✅ Top 5 poubelles les plus actives
  ✅ 3 alertes critiques actuelles
  ✅ Prédictions pour les 10 prochains jours


SCÉNARIO 2: Identification de Problèmes
──────────────────────────────────────
System affiche:
  🚨 "Avenue de l'Indépendance" - 95% CRITIQUE
  → Collector assigné reçoit alerte
  → Rapport recommande collecte immédiate


SCÉNARIO 3: Planification à Terme
──────────────────────────────────
View 'Taona' (Année) 2026:
  ✅ Tendance annuelle des volumes
  ✅ Pics saisonniers identifiés
  ✅ Poubelles surchargeables prédites
  → Manager peut planifier ressources futures


🛠️ DÉPANNAGE
═══════════════════════════════════════════════════════════════════════════════

❌ "Cannot read property 'historique' of null"
→ Vérifier que generate_massive_data.py a été exécuté
→ Vérifier MongoDB connexion: python test_mongo.py
→ Re lancer: python generate_massive_data.py

❌ "Graphiques ne s'affichent pas"
→ Vérifier navigateur F12 > Console
→ Vérifier que API /api/report renvoie données
→ Vérifier CORS config dans main.py

❌ "Alertes ne s'actualisent pas"
→ Frontend utilise cache - Ctrl+F5 pour forcer rafraîchissement
→ Vérifier que WebSocket /ws est fonctionnel

❌ "Données ne correspondent pas à période"
→ Vérifier paramètre query: ?period=month
→ Vérifier que dates historiques existent dans MongoDB
→ Regénérer avec: python generate_massive_data.py


📈 MÉTRIQUES DE SUCCÈS
═══════════════════════════════════════════════════════════════════════════════

✅ Générer 300+ entrées d'historique
✅ Créer 14+ poubelles réalistes avec localisation
✅ Générer 400+ prédictions avec confiance > 75%
✅ Afficher rapport complet en < 2 secondes
✅ Graphiques responsifs sur mobile et desktop
✅ Filtrage temps (jour/mois/année) fonctionnel
✅ Alertes prioritaires triées correctement
✅ All UI content in Malagasy


🚀 PROCHAINES ÉTAPES RECOMMANDÉES
═══════════════════════════════════════════════════════════════════════════════

1. 📊 Intégrer prédictions ML avancées (LSTM/Prophet)
2. 📤 Exporter rapports en PDF/Excel
3. 📧 Email automatiques de rapports mensuels
4. 🔔 Notifications push alertes critiques
5. 🗺️ Améliorer heatmap collectes par quartier
6. 💰 Estimer coûts collecte par période
7. 🎯 Tableau de bord KPI macro


═══════════════════════════════════════════════════════════════════════════════
Pour plus d'informations: Consulter README.md et documentation Malagasy
═══════════════════════════════════════════════════════════════════════════════
"""

if __name__ == "__main__":
    print(GUIDE)
    
    # Créer un fichier README automatique
    import os
    with open('GUIDE_UTILISATION_RAPPORTS.txt', 'w', encoding='utf-8') as f:
        f.write(GUIDE)
    
    print("\n✅ Guide sauvegardé dans: GUIDE_UTILISATION_RAPPORTS.txt")
