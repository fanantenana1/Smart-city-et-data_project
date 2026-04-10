#!/usr/bin/env python3
"""
Script de vérification de l'installation - Suppression Multiple d'Alertes
Usage: python check_installation.py
"""

import sys
import os

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def print_success(text):
    print(f" {text}")

def print_error(text):
    print(f" {text}")

def print_warning(text):
    print(f"  {text}")

def check_python_version():
    print_header("1. Vérification de Python")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print_success(f"Python {version.major}.{version.minor}.{version.micro} - OK")
        return True
    else:
        print_error(f"Python {version.major}.{version.minor} - Version trop ancienne")
        print_warning("Python 3.8+ requis")
        return False

def check_database_py():
    print_header("2. Vérification de database.py")
    
    try:
        # Vérifier si le fichier existe
        if not os.path.exists('backend/database.py'):
            print_error("Fichier backend/database.py non trouvé")
            return False
        
        print_success("Fichier backend/database.py trouvé")
        
        # Vérifier la présence de la fonction
        with open('backend/database.py', 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'def delete_multiple_alerts' in content:
            print_success("Fonction delete_multiple_alerts() présente")
        else:
            print_error("Fonction delete_multiple_alerts() manquante")
            print_warning("Ajoutez la fonction depuis le fichier fourni")
            return False
            
        if 'from typing import List' in content or 'from typing import' in content:
            print_success("Import List présent")
        else:
            print_warning("Import 'from typing import List' peut-être manquant")
            
        return True
        
    except Exception as e:
        print_error(f"Erreur lors de la vérification: {e}")
        return False

def check_main_py():
    print_header("3. Vérification de main.py")
    
    try:
        if not os.path.exists('backend/main.py'):
            print_error("Fichier backend/main.py non trouvé")
            return False
        
        print_success("Fichier backend/main.py trouvé")
        
        with open('backend/main.py', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Vérifier l'import
        if 'delete_multiple_alerts' in content and 'from .database import' in content:
            print_success("Import delete_multiple_alerts présent")
        else:
            print_error("Import delete_multiple_alerts manquant")
            print_warning("Ajoutez 'delete_multiple_alerts,' dans les imports")
            return False
        
        # Vérifier l'endpoint
        if '@app.post("/api/alerts/delete-multiple")' in content:
            print_success("Endpoint /api/alerts/delete-multiple présent")
        else:
            print_error("Endpoint /api/alerts/delete-multiple manquant")
            print_warning("Ajoutez l'endpoint depuis MODIFICATIONS_MAIN_PY.txt")
            return False
            
        return True
        
    except Exception as e:
        print_error(f"Erreur lors de la vérification: {e}")
        return False

def check_alerts_page():
    print_header("4. Vérification de AlertsPage.jsx")
    
    try:
        if not os.path.exists('frontend/src/components/AlertsPage.jsx'):
            print_error("Fichier AlertsPage.jsx non trouvé")
            return False
        
        print_success("Fichier AlertsPage.jsx trouvé")
        
        with open('frontend/src/components/AlertsPage.jsx', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Vérifier les imports
        if 'CheckSquare' in content and 'Square' in content:
            print_success("Imports CheckSquare et Square présents")
        else:
            print_error("Imports CheckSquare/Square manquants")
            print_warning("Remplacez le fichier par AlertsPage.jsx fourni")
            return False
        
        # Vérifier les états
        if 'selectedAlerts' in content and 'useState' in content:
            print_success("État selectedAlerts présent")
        else:
            print_error("État selectedAlerts manquant")
            return False
        
        # Vérifier les fonctions
        if 'toggleSelectAlert' in content:
            print_success("Fonction toggleSelectAlert présente")
        else:
            print_error("Fonction toggleSelectAlert manquante")
            return False
            
        if 'handleMultipleDelete' in content:
            print_success("Fonction handleMultipleDelete présente")
        else:
            print_error("Fonction handleMultipleDelete manquante")
            return False
            
        return True
        
    except Exception as e:
        print_error(f"Erreur lors de la vérification: {e}")
        return False

def check_dependencies():
    print_header("5. Vérification des dépendances")
    
    # Vérifier Python packages
    try:
        import fastapi
        print_success("FastAPI installé")
    except ImportError:
        print_error("FastAPI non installé")
        print_warning("pip install fastapi")
        return False
    
    try:
        import pymongo
        print_success("PyMongo installé")
    except ImportError:
        print_error("PyMongo non installé")
        print_warning("pip install pymongo")
        return False
    
    # Vérifier Node.js (si package.json existe)
    if os.path.exists('frontend/package.json'):
        print_success("package.json trouvé")
        
        import json
        with open('frontend/package.json', 'r') as f:
            package = json.load(f)
        
        deps = package.get('dependencies', {})
        
        if 'lucide-react' in deps:
            print_success("lucide-react dans package.json")
        else:
            print_warning("lucide-react peut-être manquant")
            print_warning("npm install lucide-react")
    
    return True

def main():
    print("\n" + " VÉRIFICATION DE L'INSTALLATION".center(60))
    print("Suppression Multiple d'Alertes - SmartWaste v2.0\n")
    
    results = []
    
    results.append(check_python_version())
    results.append(check_database_py())
    results.append(check_main_py())
    results.append(check_alerts_page())
    results.append(check_dependencies())
    
    print_header("RÉSUMÉ")
    
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print_success(f"Tous les tests réussis ({passed}/{total})")
        print("\n Installation complète ! Vous pouvez démarrer les serveurs.\n")
        print("Backend:")
        print("  cd backend")
        print("  python -m uvicorn main:app --reload")
        print("\nFrontend:")
        print("  cd frontend")
        print("  npm start")
        return 0
    else:
        print_error(f"Certains tests ont échoué ({passed}/{total})")
        print("\n  Consultez les erreurs ci-dessus et corrigez-les.")
        print(" Voir GUIDE_INSTALLATION_SIMPLE.md pour les instructions.\n")
        return 1

if __name__ == '__main__':
    sys.exit(main())