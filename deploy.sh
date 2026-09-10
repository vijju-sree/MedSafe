#!/usr/bin/env bash
# ==============================================================================
# MedSafe Flask + SQLite One-Click Production Deployment Script
# Supports: Docker Compose (preferred) or Native Python Gunicorn Daemon
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}====================================================================${NC}"
echo -e "${BLUE}   MEDSAFE FLASK + SQLITE - ONE-CLICK PRODUCTION DEPLOYMENT         ${NC}"
echo -e "${BLUE}====================================================================${NC}"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# 1. Check or create environment file
if [ ! -f "flask_backend/.env" ]; then
    if [ -f "flask_backend/.env.production.example" ]; then
        echo -e "${YELLOW}[!] flask_backend/.env not found. Creating from .env.production.example...${NC}"
        cp flask_backend/.env.production.example flask_backend/.env
    elif [ -f ".env.example" ]; then
        cp .env.example flask_backend/.env
    fi
fi

# 2. Check Deployment Method (Docker vs. Native Python)
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    echo -e "\n${GREEN}[✓] Docker and Docker Compose detected.${NC}"
    echo -e "${BLUE}[*] Launching MedSafe Flask + SQLite container with persistent volume...${NC}"

    docker compose up -d --build

    echo -e "${BLUE}[*] Waiting for container health probe...${NC}"
    ATTEMPTS=0
    MAX_ATTEMPTS=15
    HEALTHY=false

    until [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health || true)
        if [ "$STATUS" = "200" ]; then
            HEALTHY=true
            break
        fi
        ATTEMPTS=$((ATTEMPTS+1))
        echo -n "."
        sleep 2
    done

    echo ""
    if [ "$HEALTHY" = true ]; then
        echo -e "${GREEN}====================================================================${NC}"
        echo -e "${GREEN}[✓] MedSafe Flask + SQLite deployed successfully via Docker!        ${NC}"
        echo -e "${GREEN}====================================================================${NC}"
        echo -e "  API URL:           http://localhost:5000"
        echo -e "  Health Check:      http://localhost:5000/health"
        echo -e "  Persistent Volume: medsafe_sqlite_data (/app/data/medsafe.db)"
        echo -e "  View Logs:         docker compose logs -f medsafe-api"
        echo -e "  Stop Service:      docker compose down"
        exit 0
    else
        echo -e "${RED}[✗] Healthcheck timed out. Checking container logs:${NC}"
        docker compose logs --tail=30 medsafe-api
        exit 1
    fi
fi

# 3. Fallback: Native Python Virtualenv Deployment
echo -e "\n${YELLOW}[!] Docker not found. Proceeding with native Python deployment...${NC}"

cd flask_backend

PYTHON_CMD="python3"
if ! command -v python3 >/dev/null 2>&1; then
    if command -v python >/dev/null 2>&1; then
        PYTHON_CMD="python"
    else
        echo -e "${RED}[✗] Python 3 is required but was not found. Please install Python 3.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}[✓] Using $PYTHON_CMD${NC}"

# Create persistent data directory
mkdir -p data

# Setup virtual environment
if [ ! -d "venv" ]; then
    echo -e "${BLUE}[*] Creating Python virtual environment (venv)...${NC}"
    $PYTHON_CMD -m venv venv
fi

source venv/bin/activate

echo -e "${BLUE}[*] Installing/updating production dependencies...${NC}"
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo -e "${BLUE}[*] Initializing SQLite database schema...${NC}"
$PYTHON_CMD init_db.py

echo -e "${BLUE}[*] Starting MedSafe Gunicorn production WSGI server...${NC}"
export PORT="${PORT:-5000}"
export FLASK_ENV=production
export MEDSAFE_DB_PATH="${MEDSAFE_DB_PATH:-$(pwd)/data/medsafe.db}"

gunicorn --config gunicorn.conf.py app:app --daemon

echo -e "${GREEN}====================================================================${NC}"
echo -e "${GREEN}[✓] MedSafe Flask + SQLite deployed successfully as a background daemon!${NC}"
echo -e "${GREEN}====================================================================${NC}"
echo -e "  API URL:       http://localhost:$PORT"
echo -e "  Health Check:  http://localhost:$PORT/health"
echo -e "  SQLite DB:     $MEDSAFE_DB_PATH"
