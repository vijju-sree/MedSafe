# ==============================================================================
# MedSafe Flask + SQLite One-Click Windows Deployment Script
# Supports: Docker Compose or Native Waitress/Flask WSGI
# ==============================================================================

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "   MEDSAFE FLASK + SQLITE - ONE-CLICK WINDOWS DEPLOYMENT            " -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

# 1. Check or create environment file
if (-not (Test-Path "flask_backend\.env")) {
    if (Test-Path "flask_backend\.env.production.example") {
        Write-Host "[!] flask_backend\.env not found. Copying from .env.production.example..." -ForegroundColor Yellow
        Copy-Item "flask_backend\.env.production.example" "flask_backend\.env"
    }
}

# 2. Check for Docker
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCmd) {
    Write-Host "[✓] Docker detected. Launching MedSafe via Docker Compose with persistent volume..." -ForegroundColor Green
    docker compose up -d --build

    Write-Host "[*] Checking container health at http://localhost:5000/health..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get -TimeoutSec 10
        Write-Host "====================================================================" -ForegroundColor Green
        Write-Host "[✓] MedSafe Flask + SQLite is running in Docker!" -ForegroundColor Green
        Write-Host "    Status:   $($res.status)"
        Write-Host "    Database: $($res.database.status) ($($res.database.type))"
        Write-Host "    URL:      http://localhost:5000"
        Write-Host "====================================================================" -ForegroundColor Green
        exit 0
    } catch {
        Write-Host "[!] Container started. Access at http://localhost:5000" -ForegroundColor Yellow
        exit 0
    }
}

# 3. Fallback: Native Python with Waitress WSGI
Write-Host "[!] Docker not detected. Proceeding with Native Windows Python deploy..." -ForegroundColor Yellow
Set-Location "$ProjectDir\flask_backend"

# Ensure data directory exists
if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
}

$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    $pythonCmd = Get-Command py -ErrorAction SilentlyContinue
}

if (-not $pythonCmd) {
    Write-Host "[✗] Python is required but was not found on PATH." -ForegroundColor Red
    Write-Host "    Please install Python 3 or run via Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "[*] Initializing SQLite database schema..." -ForegroundColor Cyan
& $pythonCmd.Source init_db.py

Write-Host "[*] Starting production server on port 5000..." -ForegroundColor Cyan
$env:PORT = "5000"
$env:FLASK_ENV = "production"
$env:MEDSAFE_DB_PATH = "$ProjectDir\flask_backend\data\medsafe.db"

Write-Host "====================================================================" -ForegroundColor Green
Write-Host "[✓] Starting MedSafe Flask..." -ForegroundColor Green
Write-Host "    API URL:      http://localhost:5000" -ForegroundColor Green
Write-Host "    Health Check: http://localhost:5000/health" -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Green

& $pythonCmd.Source -c "from waitress import serve; from app import app; print('Serving on http://0.0.0.0:5000...'); serve(app, host='0.0.0.0', port=5000)"
