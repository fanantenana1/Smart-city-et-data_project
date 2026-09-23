# 🚀 Prochaines Étapes : Intégration ETL → FastAPI

## 📌 Plan d'Action

Vous avez maintenant :
- ✅ Pipeline ETL **fonctionnel et testé**
- ✅ Documentation **complète** (3 guides + index)
- ✅ Fichiers **Excel générés avec succès**

**Prochaine étape logique :** Intégrer le pipeline dans FastAPI

---

## 🎯 Objectifs

### Court Terme (Cette semaine)

1. **✓ CRÉER** endpoint FastAPI pour exporter rapports à la demande
   ```
   POST /api/export/etl
   {"format": "excel", "date_range": "month"}
   → Retourne: RAPPORT_SMARTWASTE_COMPLET.xlsx
   ```

2. **✓ TESTER** que les rapports utilisent les vraies données API (pas samples)

3. **✓ METTRE À JOUR** Frontend pour appeler nouvel endpoint

### Moyen Terme (Ce mois-ci)

4. **AJOUTER** job planifiée : Générer rapport automatique 2h du matin
   ```bash
   # Tous les jours à 2h00
   0 2 * * * cd /path/FastApi && python backend/etl_scheduler.py
   ```

5. **CRÉER** API endpoint : `/api/reports/list` (historique rapports)

6. **TESTER** intégration complète avec données réelles

---

## 💻 Étape 1 : Ajouter Endpoint FastAPI

### Fichier : `backend/app/main.py`

Ajouter après les imports existants :

```python
# ===== NOUVEAUX IMPORTS =====
# (Ajouter aux imports en haut du fichier)
import sys
from pathlib import Path
from fastapi.responses import FileResponse

# Ajouter le chemin du module ETL
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from pipeline_etl_smartwaste import smartwaste_etl_pipeline
except ImportError:
    print("⚠️  Pipeline ETL non disponible - endpoint /api/export/etl désactivé")
    smartwaste_etl_pipeline = None
```

### Endpoint pour Export à la Demande

Ajouter dans `main.py` après les autres routes (vers la fin) :

```python
@app.post("/api/export/etl")
async def export_etl_report(request: dict = None):
    """
    Génère un rapport ETL à partir des données en temps réel
    
    POST /api/export/etl
    {
        "format": "excel",  # ou "text", "json"
        "date_range": "month"  # ou "week", "year", "all"
    }
    
    Retourne: Fichier Excel/TXT à télécharger
    """
    
    if not smartwaste_etl_pipeline:
        raise HTTPException(
            status_code=501, 
            detail="Pipeline ETL non disponible"
        )
    
    try:
        # 1. Valider requête
        export_format = request.get("format", "excel") if request else "excel"
        date_range = request.get("date_range", "month") if request else "month"
        
        if export_format not in ["excel", "text", "json"]:
            raise HTTPException(
                status_code=400,
                detail=f"Format non supporté: {export_format}. Utiliser: excel, text, json"
            )
        
        # 2. Exécuter pipeline
        logger.info(f"🔄 Démarrage ETL pipeline - format:{export_format}, range:{date_range}")
        
        output_files = smartwaste_etl_pipeline(
            input_format="api",  # Nouvelle option: charger des vraies données
            output_format=export_format,
            date_range=date_range
        )
        
        # 3. Retourner le fichier généré
        if export_format == "excel":
            excel_path = output_files.get("excel_path")
            return FileResponse(
                path=excel_path,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                filename=f"RAPPORT_SMARTWASTE_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            )
        
        elif export_format == "text":
            text_path = output_files.get("text_path")
            return FileResponse(
                path=text_path,
                media_type="text/plain; charset=utf-8",
                filename=f"RAPPORT_SMARTWASTE_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            )
        
        else:  # json
            return {"status": "success", "files": output_files}
    
    except Exception as e:
        logger.error(f"❌ Erreur ETL: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur génération rapport: {str(e)}"
        )


@app.get("/api/export/status")
async def export_status():
    """État et statistiques des exports"""
    
    exports_dir = Path(__file__).parent.parent / "exports"
    
    if not exports_dir.exists():
        return {"status": "no_exports", "directory": str(exports_dir)}
    
    files = list(exports_dir.glob("RAPPORT_*"))
    
    return {
        "status": "ok",
        "total_files": len(files),
        "latest_export": max([f.stat().st_mtime for f in files]) if files else None,
        "files": [
            {
                "name": f.name,
                "size_kb": f.stat().st_size / 1024,
                "created": datetime.fromtimestamp(f.stat().st_mtime).isoformat()
            }
            for f in sorted(files, key=lambda x: x.stat().st_mtime, reverse=True)[:5]
        ]
    }
```

---

## 📝 Étape 2 : Modifier Pipeline pour Charger Vraies Données

### Fichier : `backend/pipeline_etl_smartwaste.py`

Remplacer la fonction `smartwaste_etl_pipeline()` pour accepter source "API" :

```python
def smartwaste_etl_pipeline(
    input_format="json",  # json, csv, parquet, API
    output_format="excel",  # Requis
    date_range="month"  # week, month, year, all
):
    """
    Pipeline ETL SmartWaste
    
    input_format:
    - "json": Charger raw_bins_data.json
    - "csv": Charger raw_personnel.csv
    - "api": Charger les vraies données via API (en mémoire)
    - "parquet": Non-implémenté
    """
    
    print("\n" + "="*80)
    print(f"🚀 PIPELINE ETL SMARTWASTE")
    print(f"   Mode: API | Format sortie: {output_format} | Plage: {date_range}")
    print("="*80)
    
    try:
        # ===== EXTRACTION =====
        if input_format == "api":
            # Charger depuis la pile Python en mémoire (globals)
            import app.main as main_app
            
            print("\n📥 EXTRACTION: Mode API (données en mémoire)")
            
            # Récupérer données stockées dans App.js / FastAPI
            bins_data = main_app.bins if hasattr(main_app, 'bins') else []
            personnel_data = main_app.users if hasattr(main_app, 'users') else []
            collections_data = main_app.collections if hasattr(main_app, 'collections') else []
            
            print(f"   ✓ Bins: {len(bins_data)} records")
            print(f"   ✓ Personnel: {len(personnel_data)} records")
            print(f"   ✓ Collections: {len(collections_data)} records")
            
            # Convertir en DataFrames
            df_bins = pd.DataFrame(bins_data) if bins_data else pd.DataFrame()
            df_personnel = pd.DataFrame(personnel_data) if personnel_data else pd.DataFrame()
            
        elif input_format == "json":
            df_bins = extract_from_json("raw_bins_data.json")
            df_personnel = pd.DataFrame()  # Optionnel pour JSON
            print(f"   ✓ JSON: {len(df_bins)} poubelles extraites")
            
        elif input_format == "csv":
            df_personnel = extract_from_csv("raw_personnel.csv")
            df_bins = pd.DataFrame()
            print(f"   ✓ CSV: {len(df_personnel)} personnels extraits")
        
        else:
            raise ValueError(f"Format source non supporté: {input_format}")
        
        # ===== FILTRAGE PAR PLAGE DATE =====
        if collections_data and date_range != "all":
            cutoff_days = {
                'week': 7,
                'month': 30,
                'year': 365
            }.get(date_range, 30)
            
            print(f"\n⏰ FILTRAGE: Derniers {cutoff_days} jours")
            
            # Filtrer collections
            now = pd.Timestamp.now(tz='UTC')
            collections_filtered = [
                c for c in collections_data
                if c.get('timestamp') and 
                (now - pd.to_datetime(c['timestamp'], utc=True)).days <= cutoff_days
            ]
            print(f"   ✓ Collectes avant: {len(collections_data)} → après: {len(collections_filtered)}")
            collections_data = collections_filtered
            
            # Filtrer poubelles (seulement celles avec collectes récentes)
            active_bin_ids = set(c.get('bin_id') for c in collections_data)
            df_bins = df_bins[df_bins['bin_id'].isin(active_bin_ids)] if not df_bins.empty else df_bins
            print(f"   ✓ Poubelles actives: {len(df_bins)}")
        
        # ===== TRANSFORMATION & ENRICHISSEMENT =====
        df_bins_transformed = transform_data(df_bins)
        df_bins_enriched = enrich_data(df_bins_transformed)
        df_personnel_enriched = enrich_personnel(df_personnel)
        
        # ===== VALIDATION =====
        quality_report = validate_quality(df_bins_enriched, df_personnel_enriched)
        
        # ===== RAPPORT =====
        output_files = {}
        
        if output_format == "excel":
            output_files["excel_path"] = create_excel_report(
                df_bins_enriched,
                df_personnel_enriched,
                quality_report
            )
        
        if output_format in ["text", "excel"]:  # Text aussi si Excel
            output_files["text_path"] = generate_text_report(
                df_bins_enriched,
                df_personnel_enriched,
                quality_report
            )
        
        print("\n✅ PIPELINE TERMINÉ AVEC SUCCÈS!\n")
        return output_files
    
    except Exception as e:
        print(f"\n❌ ERREUR: {str(e)}\n")
        raise
```

---

## 🎨 Étape 3 : Ajouter Bouton Frontend

### Fichier : `frontend/src/components/ReportsPage.jsx`

Ajouter nouveau bouton dans ExportButtons section :

```jsx
// Dans la section des boutons d'export (chercher ExportButtons)
<button
  onClick={handleExportDynamicETL}
  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r 
             from-purple-500 to-pink-500 hover:from-purple-600 
             hover:to-pink-600 text-white rounded-lg font-semibold 
             transition transform hover:scale-105 shadow-lg"
  title="Générer rapport ETL temps réel"
>
  <BarChart3 size={20} />
  <span>Rapport ETL</span>
  <ChevronDown size={16} />
</button>

{showETLMenu && (
  <div className="absolute right-0 mt-2 w-48 bg-white border 
                  border-gray-300 rounded-lg shadow-xl z-10">
    {['week', 'month', 'year'].map(range => (
      <button
        key={range}
        onClick={() => exportETLReport(range)}
        className="block w-full text-left px-4 py-2 hover:bg-purple-100"
      >
        Rapport {range === 'week' ? '7 jours' : 
                 range === 'month' ? '30 jours' : 
                 'Annuel'}
      </button>
    ))}
  </div>
)}
```

Handler function :

```jsx
const handleExportDynamicETL = () => {
  setShowETLMenu(!showETLMenu);
};

const exportETLReport = async (dateRange) => {
  try {
    setExportLoading(true);
    
    const response = await fetch(`${API_URL}/api/export/etl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sw_token')}`
      },
      body: JSON.stringify({
        format: 'excel',
        date_range: dateRange
      })
    });
    
    if (!response.ok) throw new Error('Export failed');
    
    // Télécharger fichier
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RAPPORT_SMARTWASTE_${dateRange}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('✅ Rapport généré avec succès!', 'success');
  } catch (error) {
    showNotification('❌ Erreur export: ' + error.message, 'error');
  } finally {
    setExportLoading(false);
    setShowETLMenu(false);
  }
};
```

---

## ⏰ Étape 4 : Ajouter Job Planifiée (Rapports Quotidiens)

### Fichier : `backend/etl_scheduler.py` (NOUVEAU)

```python
#!/usr/bin/env python
"""
Planificateur de rapports ETL SmartWaste
Génère les rapports avant 2h du matin
"""

import schedule
import time
from datetime import datetime
from pathlib import Path
import sys

# Import du pipeline
sys.path.insert(0, str(Path(__file__).parent))
from pipeline_etl_smartwaste import smartwaste_etl_pipeline

def generate_daily_report():
    """Génère le rapport quotidien"""
    
    print(f"\n{'='*80}")
    print(f"🌙 RAPPORT QUOTIDIEN - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*80}")
    
    try:
        output_files = smartwaste_etl_pipeline(
            input_format="api",
            output_format="excel",
            date_range="month"
        )
        
        print(f"✅ Rapport généré: {output_files.get('excel_path')}")
        
        # Optionnel: Envoyer par email
        # send_report_email(output_files)
        
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")

def schedule_jobs():
    """Configure les jobs planifiées"""
    
    # Tous les jours à 2h du matin
    schedule.every().day.at("02:00").do(generate_daily_report)
    
    # Optionnel: Test toutes les heures (commenter en prod)
    # schedule.every().hour.do(generate_daily_report)
    
    print("✅ Planificateur démarré")
    print("   - Rapport quotidien: 2h00")
    
    # Boucle infinie
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    try:
        schedule_jobs()
    except KeyboardInterrupt:
        print("\n🛑 Planificateur arrêté")
```

### Installation Scheduler

```bash
pip install schedule
```

### Démarrer comme Service Systemd

Créer `/etc/systemd/system/smartwaste-etl.service` :

```ini
[Unit]
Description=SmartWaste ETL Scheduler
After=network.target

[Service]
Type=simple
User=smartwaste
WorkingDirectory=/home/smartwaste/FastApi
ExecStart=/usr/bin/python3 /home/smartwaste/FastApi/backend/etl_scheduler.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Activer :

```bash
sudo systemctl daemon-reload
sudo systemctl enable smartwaste-etl
sudo systemctl start smartwaste-etl
```

---

## 🧪 Étape 5 : Tester l'Intégration

### Test 1: API en local

```bash
# Terminal 1: Démarrer backend
cd backend
python start.py

# Terminal 2: Tester endpoint
curl -X POST http://localhost:8000/api/export/etl \
  -H "Content-Type: application/json" \
  -d '{"format": "excel", "date_range": "month"}'

# Devrait télécharger .xlsx
```

### Test 2: Frontend

1. Redémarrer frontend : `npm start`
2. Aller à Rapports → cliquer "Rapport ETL"
3. Sélectionner plage → Télécharger Excel
4. Ouvrir Excel → Vérifier données réelles (ne sont plus samples)

### Test 3: Job Planifiée

```bash
# Vérifier service
sudo systemctl status smartwaste-etl

# Logs
sudo journalctl -u smartwaste-etl -f
```

---

## ✅ Checklist Implémentation

- [ ] Ajouter imports dans `main.py`
- [ ] Ajouter endpoint `/api/export/etl`
- [ ] Ajouter endpoint `/api/export/status`
- [ ] Modifier `pipeline_etl_smartwaste.py` pour mode "api"
- [ ] Ajouter bouton Frontend "Rapport ETL"
- [ ] Tester export API
- [ ] Tester frontend button
- [ ] Créer `etl_scheduler.py`
- [ ] Ajouter service systemd
- [ ] Tester job planifiée
- [ ] Documenter dans README
- [ ] Déployer en production

---

## 📊 Résultat Attendu

**Avant (Maintenance):**
```
Admin génère manuellement rapport Excel chaque jour ⏱️
Oublis occasionnels ❌
```

**Après (Automatisé):**
```
✅ 02:00 - Job lance pipeline
✅ 02:05 - Excel généré + téléchargeable
✅ 02:06 - Email automatique aux responsables
✅ Frontend button pour export à la demande
```

---

## 🎯 Commandes Rapides

```bash
# Installer dépendance
pip install schedule

# Tester pipeline en mode API
python -c "from pipeline_etl_smartwaste import smartwaste_etl_pipeline; smartwaste_etl_pipeline(input_format='api')"

# Voir logs backend
tail -f backend/logs/app.log

# Voir fichiers générés
ls -lah backend/exports/
```

---

**C'est parti! 🚀**

Bienvenue à la prochaine étape : ETL intégré en production!

