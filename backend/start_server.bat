@echo off
REM Script de démarrage du serveur SmartWaste sur l'IP locale du réseau

echo.
echo ============================================================
echo    SmartWaste API Server - Startup Script
echo ============================================================
echo.

REM Obtenir l'IP locale
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find /i "ipv4"') do (
    set LOCAL_IP=%%a
)
set LOCAL_IP=%LOCAL_IP: =%

if "%LOCAL_IP%"=="" (
    set LOCAL_IP=127.0.0.1
    echo Attention: Impossible de récupérer l'IP locale, utilisation par défaut
)

echo [*] IP locale détectée: %LOCAL_IP%
echo [*] Port: 8000
echo.

REM Définir les variables d'environnement
set SERVER_HOST=%LOCAL_IP%
set SERVER_PORT=8000
set PYTHONUNBUFFERED=1

echo [+] Variables d'environnement configurées
echo     SERVER_HOST=%SERVER_HOST%
echo     SERVER_PORT=%SERVER_PORT%
echo.

echo [*] Démarrage du serveur...
echo.
echo ============================================================
echo    Serveur disponible à: http://%LOCAL_IP%:8000
echo    Frontend doit utiliser: http://%LOCAL_IP%:8000
echo    ESP32 doit utiliser: http://%LOCAL_IP%:8000
echo ============================================================
echo.

REM Lancer le serveur
python run_server.py

pause
