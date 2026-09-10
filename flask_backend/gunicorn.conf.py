"""
MedSafe Production Gunicorn Configuration
Optimized for Flask + SQLite with multi-threading and persistent connections
"""
import os
import multiprocessing

# Server Socket
bind = f"0.0.0.0:{os.environ.get('PORT', '5000')}"
backlog = 2048

# Worker Processes & Concurrency
# Default: 4 workers with 2 threads per worker using 'gthread'
# SQLite WAL mode handles this level of concurrency efficiently
workers = int(os.environ.get('WEB_CONCURRENCY', os.environ.get('GUNICORN_WORKERS', 4)))
worker_class = 'gthread'
threads = int(os.environ.get('GUNICORN_THREADS', 2))
worker_connections = 1000
timeout = int(os.environ.get('GUNICORN_TIMEOUT', 120))
keepalive = int(os.environ.get('GUNICORN_KEEPALIVE', 5))

# Process Naming
proc_name = 'medsafe_flask_production'

# Logging
accesslog = '-'  # Log access to stdout for Docker / cloud log routers
errorlog = '-'   # Log errors to stderr
loglevel = os.environ.get('LOG_LEVEL', 'info').lower()
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)sµs'

# Lifecycle Hooks
def on_starting(server):
    server.log.info("Starting MedSafe Flask Production WSGI Server...")

def post_fork(server, worker):
    server.log.info(f"Worker spawned (pid: {worker.pid})")
