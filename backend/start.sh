#!/bin/bash
# =============================================================
#  TableBoost Start Script
#  Set this as your Render.com Start Command:
#    cd backend && bash start.sh
# =============================================================
set -e

echo ">>> Running pre-start (migrations + seeding)..."
python prestart.py

echo ">>> Launching application server..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
