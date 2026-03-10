#!/bin/sh
set -e

echo "INTERIOSYNC — starting up..."

# Wait for the Railway-provided PostgreSQL to accept connections
echo "Waiting for database..."
python - <<'PYEOF'
import os, time, sys
url = os.environ.get("DATABASE_URL", "")
if not url:
    print("ERROR: DATABASE_URL is not set. Add the Railway PostgreSQL plugin.")
    sys.exit(1)

# Railway sometimes uses 'postgres://' prefix; SQLAlchemy needs 'postgresql://'
if url.startswith("postgres://"):
    url = "postgresql://" + url[len("postgres://"):]

try:
    import psycopg2
except ImportError:
    print("psycopg2 not found — assuming database is ready.")
    sys.exit(0)

for attempt in range(30):
    try:
        conn = psycopg2.connect(url)
        conn.close()
        print("Database is ready.")
        sys.exit(0)
    except Exception as e:
        print(f"  Retry {attempt + 1}/30: {e}")
        time.sleep(2)

print("ERROR: Could not connect to the database after 30 attempts.")
sys.exit(1)
PYEOF

# Fix 'postgres://' in DATABASE_URL for SQLAlchemy (Railway quirk)
if echo "$DATABASE_URL" | grep -q "^postgres://"; then
    export DATABASE_URL="postgresql://${DATABASE_URL#postgres://}"
fi

# Seed sample data only on first deploy (controlled by env var)
if [ "${SEED_DB:-0}" = "1" ]; then
    echo "Seeding database..."
    python seed_data.py || true
fi

# Start the server; Railway injects PORT automatically
echo "Starting server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
