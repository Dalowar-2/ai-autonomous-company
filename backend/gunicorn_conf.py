"""
Production server config: Gunicorn manages multiple Uvicorn worker
processes (handles crashes/restarts, graceful reload, etc.) instead of
running a single `uvicorn` process directly.

Usage:  gunicorn -c gunicorn_conf.py app.main:app
"""
import multiprocessing
import os

bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
worker_class = "uvicorn.workers.UvicornWorker"

# A safe default for most small/medium deployments. Override with the
# WEB_CONCURRENCY env var if you know your CPU/memory budget.
workers = int(os.getenv("WEB_CONCURRENCY", min(4, multiprocessing.cpu_count() * 2 + 1)))

timeout = int(os.getenv("GUNICORN_TIMEOUT", "60"))
graceful_timeout = 30
keepalive = 5

accesslog = "-"  # stdout — let the platform's log collector handle it
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info")
