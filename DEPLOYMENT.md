# MedSafe Flask + SQLite Production Deployment Guide

This guide provides step-by-step instructions for deploying the **MedSafe Python Flask + SQLite** application to production across various hosting environments, from **one-click containerized deployments** to **cloud platform blueprints** and **bare-metal Linux servers**.

---

## 1. Architecture & SQLite Storage Model

```
                               ┌────────────────────────────────┐
                               │  Client Traffic / Webhook Post │
                               └───────────────┬────────────────┘
                                               │ Port 80 / 443 (HTTPS)
                                               ▼
                               ┌────────────────────────────────┐
                               │       Nginx Reverse Proxy      │
                               │   (SSL, Gzip, Rate Limiting)   │
                               └───────────────┬────────────────┘
                                               │ Port 5000 (Internal)
                                               ▼
                               ┌────────────────────────────────┐
                               │    Gunicorn WSGI HTTP Server   │
                               │  (4 Workers, 2 Threads/Worker) │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │      MedSafe Flask Backend     │
                               │ (Razorpay Live Mode, Webhooks) │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │ Persistent SQLite Volume Mount │
                               │     (/app/data/medsafe.db)     │
                               │   WAL Mode + Busy Timeout 5s   │
                               └────────────────────────────────┘
```

### Why SQLite WAL Mode in Production?
In standard SQLite, concurrent writes lock the entire database file. In MedSafe's production setup:
- **Write-Ahead Logging (`PRAGMA journal_mode=WAL;`)** is enabled on every connection.
- **Busy Timeout (`PRAGMA busy_timeout=5000;`)** is set to 5,000ms.
- **Synchronous Normal (`PRAGMA synchronous=NORMAL;`)** is enabled for fast, safe disk writes.

This enables multiple concurrent Gunicorn workers to read and write without encountering "database is locked" errors.

---

## 2. Option A: One-Click Docker Compose Deploy (Recommended)

Docker Compose is the fastest way to achieve zero-downtime, persistent containerized deployment on any Linux, macOS, or Windows host.

### Prerequisites
- Docker Engine $\ge 20.10$
- Docker Compose v2

### Quickstart
1. Clone your repository:
   ```bash
   git clone <repo-url> medsafe
   cd medsafe
   ```

2. Configure production environment variables:
   ```bash
   cp flask_backend/.env.production.example flask_backend/.env
   nano flask_backend/.env
   ```
   Set your `RAZORPAY_MODE=LIVE`, `RAZORPAY_LIVE_KEY_ID`, `RAZORPAY_LIVE_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.

3. Launch MedSafe in one click:
   ```bash
   docker compose up -d --build
   ```

4. Verify health:
   ```bash
   curl http://localhost:5000/health
   ```
   Output:
   ```json
   {
     "status": "healthy",
     "service": "medsafe-flask-backend",
     "database": {
       "status": "connected",
       "type": "SQLite",
       "path": "/app/data/medsafe.db",
       "journal_mode": "WAL"
     },
     "environment": "production",
     "razorpay": {
       "mode": "LIVE",
       "autoCapture": true
     }
   }
   ```

### Managing the Container
- View live logs: `docker compose logs -f medsafe-api`
- Restart container: `docker compose restart medsafe-api`
- Stop container: `docker compose down`
- Note: The database file is persisted safely inside the named volume `medsafe_sqlite_data` and is **never lost** when containers are stopped or rebuilt.

---

## 3. Option B: One-Click Cloud Platform Deployments

### 1. Render.com (Using `render.yaml`)
Render provides zero-config GitHub deployments. MedSafe includes a ready-to-use [`render.yaml`](./render.yaml) Blueprint that configures the Web Service and **attaches a persistent 1GB SSD disk** for the SQLite database.

1. Push your repository to GitHub or GitLab.
2. In the Render Dashboard, click **New** $\rightarrow$ **Blueprint**.
3. Select your MedSafe repository.
4. Render detects [`render.yaml`](./render.yaml) automatically:
   - Configures Gunicorn web service.
   - Attaches `medsafe-sqlite-disk` at `/app/data`.
   - Mounts health check at `/health`.
5. Enter your live Razorpay secrets in the prompted environment fields and click **Apply**.

### 2. Railway.app (Using `railway.json`)
1. Create a new project on Railway from your GitHub repo.
2. Railway detects [`railway.json`](./railway.json) and builds using [`flask_backend/Dockerfile`](./flask_backend/Dockerfile).
3. In Railway **Service Settings** $\rightarrow$ **Volumes**, add a Volume mounted at `/app/data`.
4. Set environment variables under the **Variables** tab.
5. Click **Deploy**.

### 3. Fly.io (Using `fly.toml`)
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Create Fly volume for SQLite persistence:
   ```bash
   fly volumes create medsafe_data --region iad --size 1
   ```
3. Deploy:
   ```bash
   fly launch --config fly.toml --copy-config
   fly deploy
   ```

---

## 4. Option C: Bare-Metal Linux VPS Deployment (Ubuntu / Debian)

For dedicated virtual private servers (AWS EC2, DigitalOcean, Linode, Hetzner, GCP Compute Engine):

### Step 1: System Packages
```bash
sudo apt update && sudo apt install -y python3 python3-pip python3-venv sqlite3 nginx curl
```

### Step 2: Create MedSafe System User & Directory
```bash
sudo useradd -r -s /bin/false -d /opt/medsafe medsafe
sudo mkdir -p /opt/medsafe/flask_backend /opt/medsafe/data
sudo cp -r flask_backend/* /opt/medsafe/flask_backend/
sudo chown -R medsafe:medsafe /opt/medsafe
```

### Step 3: Python Environment & Dependencies
```bash
cd /opt/medsafe/flask_backend
sudo -u medsafe python3 -m venv venv
sudo -u medsafe ./venv/bin/pip install --upgrade pip
sudo -u medsafe ./venv/bin/pip install -r requirements.txt
```

### Step 4: Environment Configuration
```bash
sudo cp .env.production.example .env
sudo chown medsafe:medsafe .env
sudo chmod 600 .env
sudo nano .env
```
Ensure `MEDSAFE_DB_PATH=/opt/medsafe/data/medsafe.db`.

### Step 5: Systemd Service Installation
```bash
sudo cp /path/to/repo/medsafe.service /etc/systemd/system/medsafe.service
sudo systemctl daemon-reload
sudo systemctl enable medsafe
sudo systemctl start medsafe
sudo systemctl status medsafe
```

### Step 6: Nginx Reverse Proxy Configuration
```bash
sudo cp /path/to/repo/nginx.conf /etc/nginx/sites-available/medsafe
sudo ln -s /etc/nginx/sites-available/medsafe /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 5. Option D: Windows Server Production Deploy (Waitress WSGI)

For Windows Server environments without Docker:
1. Open PowerShell as Administrator in the project directory.
2. Run the automated script:
   ```powershell
   .\deploy.ps1
   ```
3. The script automatically initializes the database, configures production environment variables, and launches the production multi-threaded **Waitress WSGI server** listening on `http://0.0.0.0:5000`.

---

## 6. Environment Variables Reference

| Variable | Default | Required in Live? | Description |
|---|---|---|---|
| `FLASK_ENV` | `production` | Yes | Flask environment mode |
| `PORT` | `5000` | No | Listening port |
| `MEDSAFE_DB_PATH` | `/app/data/medsafe.db` | Yes | File path to SQLite database |
| `RAZORPAY_MODE` | `TEST` | Yes | Switch between `TEST` and `LIVE` mode |
| `RAZORPAY_TEST_KEY_ID` | `rzp_test_...` | For Test | Razorpay sandbox Key ID |
| `RAZORPAY_TEST_KEY_SECRET` | `MedSafeSecret...` | For Test | Razorpay sandbox Key Secret |
| `RAZORPAY_LIVE_KEY_ID` | Empty | **YES** | Production Razorpay Live Key ID |
| `RAZORPAY_LIVE_KEY_SECRET` | Empty | **YES** | Production Razorpay Live Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | `MedSafe...` | **YES** | Webhook verification secret |
| `RAZORPAY_AUTO_CAPTURE` | `true` | Yes | Auto-capture authorized payments |
| `WEB_CONCURRENCY` | `4` | No | Gunicorn worker process count |
| `GUNICORN_THREADS` | `2` | No | Threads per Gunicorn worker |

---

## 7. SQLite Production Backup & Maintenance

Because SQLite in WAL mode writes to `.db`, `.db-wal`, and `.db-shm` files, never copy the raw `.db` file while the application is actively writing. Instead, use SQLite's native online vacuum/backup command:

### Automated Daily Backup Cronjob
Create `/etc/cron.daily/medsafe-backup`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/medsafe"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

# Safe online backup without locking or stopping the application
sqlite3 /app/data/medsafe.db ".backup '$BACKUP_DIR/medsafe_$TIMESTAMP.db'"

# Keep last 14 days of backups
find "$BACKUP_DIR" -name "medsafe_*.db" -mtime +14 -exec rm {} \;
```
Make executable:
```bash
chmod +x /etc/cron.daily/medsafe-backup
```
