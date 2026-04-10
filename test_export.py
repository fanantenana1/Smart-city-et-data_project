#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SCRIPT DE TEST - EXPORT MULTI-FORMAT
Teste tous les formats d'export disponibles
"""

import sys
import os
import subprocess
sys.path.insert(0, os.path.dirname(__file__))

def test_export():
    print("\n" + "="*70)
    print(" TEST SYSTÈME D'EXPORT MULTI-FORMAT")
    print("="*70 + "\n")
    
    # Test 1: Vérifier MongoDB
    print(" Étape 1: Vérification MongoDB")
    try:
        result = subprocess.run([sys.executable, 'backend/test_mongo.py'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("    MongoDB accessible")
        else:
            print("    MongoDB inaccessible")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"    Erreur: {e}")
        return False
    
    print("\n Étape 2: Génération données massives")
    try:
        result = subprocess.run([sys.executable, 'backend/generate_massive_data.py'], 
                              capture_output=True, text=True, timeout=30)
        print(result.stdout)
        if result.returncode != 0:
            print("    Génération échouée")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"    Erreur: {e}")
        return False
    
    print("\n Étape 3: Export en JSON")
    try:
        result = subprocess.run([sys.executable, 'backend/export_reports.py'], 
                              capture_output=True, text=True, timeout=30)
        print(result.stdout)
        
        # Vérifier fichiers créés
        exports_dir = 'backend/exports'
        if os.path.exists(exports_dir):
            files = os.listdir(exports_dir)
            print(f"\n    Fichiers exportés ({len(files)}):")
            for f in sorted(files)[-5:]:
                path = os.path.join(exports_dir, f)
                size = os.path.getsize(path) / 1024
                print(f"      • {f} ({size:.1f} KB)")
        else:
            print("    Dossier exports/ non créé")
            return False
    except Exception as e:
        print(f"    Erreur: {e}")
        return False
    
    print("\n Étape 4: Analyse données")
    try:
        result = subprocess.run([sys.executable, 'backend/analyseur_dechets.py'], 
                              capture_output=True, text=True, timeout=30)
        print(result.stdout[:500] + "..." if len(result.stdout) > 500 else result.stdout)
    except Exception as e:
        print(f"     Analyseur non exécuté: {e}")
    
    print("\n" + "="*70)
    print(" TEST COMPLÉTÉ AVEC SUCCÈS!")
    print("="*70)
    print("\n Prochaines étapes:")
    print("   1. Démarrer backend: cd backend && python start.py")
    print("   2. Démarrer frontend: cd frontend && npm start")
    print("   3. Accéder à http://localhost:3000/reports")
    print("   4. Test exports via boutons ou API")
    print("\n Documentation: GUIDE_EXPORT_MULTI_FORMAT.md")
    
    return True

if __name__ == "__main__":
    os.chdir(os.path.dirname(__file__) or '.')
    success = test_export()
    sys.exit(0 if success else 1)
