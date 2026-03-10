#!/bin/sh
set -e
until python -c "
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    s.settimeout(2)
    s.connect(('db', 5432))
    s.close()
    exit(0)
except Exception:
    exit(1)
" 2>/dev/null; do
  echo "Waiting for database..."
  sleep 2
done
echo "Database is up."
python seed_data.py || true
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
