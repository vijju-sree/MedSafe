# ==============================================================================
# MedSafe Flask + SQLite Production Dockerfile
# Multi-arch, hardened, non-root user, persistent volume for SQLite
# ==============================================================================
FROM python:3.11-slim AS base

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    PORT=5000 \
    MEDSAFE_DB_PATH=/app/data/medsafe.db

WORKDIR /app

# Install system dependencies (curl for container healthcheck, sqlite3 utilities)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root application user for container security
RUN groupadd -r medsafe && useradd -r -g medsafe -d /app -s /sbin/nologin medsafe

# Install Python production dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Create persistent storage directory for SQLite database
RUN mkdir -p /app/data && chown -R medsafe:medsafe /app

# Copy application files
COPY --chown=medsafe:medsafe app.py schema.sql init_db.py gunicorn.conf.py ./

# Switch to non-root user
USER medsafe

# Declare persistent volume mount point for SQLite database file
VOLUME ["/app/data"]

# Expose production port
EXPOSE 5000

# Docker Healthcheck targeting the production health probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5000}/health || exit 1

# Start MedSafe with production Gunicorn WSGI server
CMD ["gunicorn", "--config", "gunicorn.conf.py", "app:app"]
