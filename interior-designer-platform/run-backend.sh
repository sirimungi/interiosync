#!/bin/bash
# Run backend locally (no Docker). Uses SQLite by default.
set -e
cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
  echo "Creating venv..."
  python3 -m venv venv
fi
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

echo "Installing dependencies..."
pip install -q -r requirements.txt

echo "Seeding database..."
PYTHONPATH=. python seed_data.py || true

echo "Starting backend at http://localhost:8000"
PYTHONPATH=. uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
