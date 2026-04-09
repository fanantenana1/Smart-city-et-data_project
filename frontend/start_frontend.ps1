# Script de démarrage du Frontend SmartWaste avec IP locale

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "    SmartWaste Frontend - Startup Script" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Obtenir l'IP locale
$ipInfo = ipconfig | Select-String "IPv4"
$LOCAL_IP = $ipInfo -replace '.*: ', ''

if (-not $LOCAL_IP) {
    $LOCAL_IP = "127.0.0.1"
    Write-Host "[!] Attention: Impossible de récupérer l'IP locale" -ForegroundColor Yellow
}

Write-Host "[*] IP locale détectée: $LOCAL_IP" -ForegroundColor Green
Write-Host "[*] Port par défaut: 3000" -ForegroundColor Green
Write-Host ""

# Configurer les variables d'environnement
$env:REACT_APP_API_BASE = "http://$($LOCAL_IP):8000"
$env:REACT_APP_API_PORT = "8000"
$env:REACT_APP_DEBUG = "true"
$env:HOST = "0.0.0.0"

Write-Host "[+] Variables d'environnement configurées:" -ForegroundColor Green
Write-Host "    REACT_APP_API_BASE=$env:REACT_APP_API_BASE" -ForegroundColor Gray
Write-Host "    REACT_APP_DEBUG=true" -ForegroundColor Gray
Write-Host ""

Write-Host "[*] Dépendances NPM..." -ForegroundColor Yellow
Write-Host ""

# Vérifier que nous sommes dans le répertoire frontend
if (-not (Test-Path "package.json")) {
    Write-Host "[!] Erreur: package.json non trouvé!" -ForegroundColor Red
    Write-Host "    Assurez-vous d'être dans le répertoire frontend" -ForegroundColor Red
    exit 1
}

Write-Host "[*] Démarrage du serveur frontend..." -ForegroundColor Green
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "    Frontend disponible à: http://127.0.0.1:3000" -ForegroundColor Cyan
Write-Host "    API disponible à: http://$($LOCAL_IP):8000" -ForegroundColor Cyan
Write-Host "    Configuration réseau:" -ForegroundColor Cyan
Write-Host "      - IP locale: $LOCAL_IP" -ForegroundColor Cyan
Write-Host "      - Frontend: Localhost (http://127.0.0.1:3000)" -ForegroundColor Cyan
Write-Host "      - API: IP du réseau (http://$($LOCAL_IP):8000)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Lancer npm start
npm start

Write-Host ""
Write-Host "[*] Serveur frontend arrêté" -ForegroundColor Yellow
