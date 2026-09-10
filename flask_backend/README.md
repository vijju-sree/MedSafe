# MedSafe Python Flask Backend (Razorpay + SQLite)

This is the standalone Python Flask backend implementation for MedSafe's payment processing and SQLite database.

## Features
- **Razorpay Order Creation**: Server-side price validation for Subscription and Healthcare Bills.
- **HMAC-SHA256 Signature Verification**: Cryptographic payment verification using `RAZORPAY_KEY_SECRET`.
- **SQLite Database**: Persistent schema for `subscription_payments`, `bill_payments`, `subscriptions`, `family_members`, and `bills`.
- **Family Plus Plan**: Allows primary patients to enroll up to 5 family members with full free access.
- **Idempotency Protection**: Unique transaction constraints prevent duplicate charges.

## Setup & Run (Development)
```bash
cd flask_backend
pip install -r requirements.txt
python init_db.py
python app.py
```
Development server runs on `http://localhost:5001`.

## Production Deployment (One-Click)

### 1. Using Docker Compose
```bash
# From workspace root or flask_backend directory:
docker compose up -d --build
```
Production server runs on `http://localhost:5000` with persistent SQLite volume (`medsafe_sqlite_data:/app/data`).

### 2. Using Gunicorn WSGI (Linux/macOS)
```bash
cd flask_backend
gunicorn --config gunicorn.conf.py app:app
```

### 3. Health & Probes
- Health check: `GET http://localhost:5000/health` or `/api/health`
- Complete deployment manual: [**DEPLOYMENT.md**](../DEPLOYMENT.md) (covers Render, Railway, Fly.io, Nginx, Systemd).

