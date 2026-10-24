"""
Gunicorn configuration for NutriTrack AI backend.
Uses async gevent workers to prevent long AI/vision inference calls
from blocking other concurrent users.
"""
import os
import multiprocessing

# Bind to localhost on port 5000 (reverse-proxied by Nginx)
bind = os.environ.get("GUNICORN_BIND", "127.0.0.1:5000")

# 2-4 workers suited for containerized environments (Render / Docker)
workers = int(os.environ.get("GUNICORN_WORKERS", "2"))

# Async gevent worker class handles concurrent I/O & streaming AI requests efficiently
worker_class = os.environ.get("GUNICORN_WORKER_CLASS", "gevent")

# Number of concurrent greenlets/connections per worker process
worker_connections = int(os.environ.get("GUNICORN_WORKER_CONNECTIONS", "1000"))

# 120-second timeout accommodates long multimodal vision analysis
timeout = int(os.environ.get("GUNICORN_TIMEOUT", "120"))

# Keep-alive connections
keepalive = int(os.environ.get("GUNICORN_KEEPALIVE", "5"))

# Log output to stdout/stderr for Docker/Render log collection
accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("LOG_LEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(L)ss'
