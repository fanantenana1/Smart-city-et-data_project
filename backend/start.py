#!/usr/bin/env python
"""Script de démarrage simplifié pour SmartWaste"""
import sys
import os
import socket

# Ajouter le backend au path
sys.path.insert(0, os.path.dirname(__file__))

# Importer FastAPI manuellement
from app.main import app

if __name__ == "__main__":
    import uvicorn
    print(" Démarrage du serveur SmartWaste...")
    print(" Backend sur http://0.0.0.0:8000")
    print(" API Docs sur http://127.0.0.1:8000/docs")
    
    # Vérifier que le port est vraiment libre
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        sock.bind(('0.0.0.0', 8000))
        sock.close()
    except OSError as e:
        print(f" Le port 8000 est occupé: {e}")
        print("Utilisez: pkill -f 'python start.py' ou fuser -k 8000/tcp")
        sys.exit(1)
    
    # Démarrer sans reload et sans multiprocessing
    try:
        config = uvicorn.Config(
            app,
            host="0.0.0.0",
            port=8000,
            reload=False,
            workers=1,
            log_level="info",
            lifespan="on",
        )
        server = uvicorn.Server(config)
        server.run()
    except KeyboardInterrupt:
        print("\n\n Serveur arrêté")
    except Exception as e:
        print(f" Erreur: {e}")
        sys.exit(1)
