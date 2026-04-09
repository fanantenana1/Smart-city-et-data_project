#!/usr/bin/env python
"""Script de démarrage simplifié pour SmartWaste"""
import sys
import os

# Ajouter le backend au path
sys.path.insert(0, os.path.dirname(__file__))

# Importer FastAPI manuellement
from app.main import app

if __name__ == "__main__":
    import uvicorn
    print("🚀 Démarrage du serveur SmartWaste...")
    print("📡 Backend sur http://127.0.0.1:8000")
    print("📚 API Docs sur http://127.0.0.1:8000/docs")
    
    # Démarrer sans reload et sans multiprocessing
    try:
        uvicorn.run(
            app,
            host="127.0.0.1",  # Écouter sur localhost,  host="10.171.58.1",  # Écouter sur localhost
            port=8000,
            reload=False,  # Désactiver le reload pour éviter les problèmes multiprocessing
            workers=1,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n\n❌ Serveur arrêté")
