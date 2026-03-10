#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  INTERIOSYNC — start all services
#  Usage: ./start.sh
# ─────────────────────────────────────────────

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# ── Colours ───────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${CYAN}[interiosync]${RESET} $*"; }
ok()   { echo -e "${GREEN}[✓]${RESET} $*"; }
warn() { echo -e "${YELLOW}[!]${RESET} $*"; }
err()  { echo -e "${RED}[✗]${RESET} $*"; exit 1; }

# ── Ports ─────────────────────────────────────
BACKEND_PORT=8000
FRONTEND_PORT=3000

free_port() {
  local pid
  pid=$(lsof -ti :"$1" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    warn "Port $1 in use (PID $pid) — killing it"
    kill -9 "$pid" 2>/dev/null || true
    sleep 0.5
  fi
}

# ── PostgreSQL check ──────────────────────────
check_postgres() {
  if ! pg_isready -q 2>/dev/null && ! /opt/homebrew/opt/postgresql@15/bin/pg_isready -q 2>/dev/null; then
    warn "PostgreSQL not responding. Trying to start…"
    # Try common Homebrew locations
    /opt/homebrew/opt/postgresql@15/bin/pg_ctl \
      -D /opt/homebrew/var/postgresql@15 start -l /tmp/postgres.log 2>/dev/null || \
    /opt/homebrew/opt/postgresql@14/bin/pg_ctl \
      -D /opt/homebrew/var/postgresql@14 start -l /tmp/postgres.log 2>/dev/null || \
    brew services start postgresql@15 2>/dev/null || \
    brew services start postgresql 2>/dev/null || true
    sleep 3
    pg_isready -q || err "PostgreSQL is not running. Start it manually with:
    /opt/homebrew/opt/postgresql@15/bin/pg_ctl -D /opt/homebrew/var/postgresql@15 start"
  fi
  ok "PostgreSQL is running"
}

# ── Database ──────────────────────────────────
ensure_db() {
  if ! psql -U postgres -lqt 2>/dev/null | cut -d\| -f1 | grep -qw "interior"; then
    log "Creating database 'interior'…"
    psql -U postgres -c "CREATE DATABASE interior;" 2>/dev/null || \
    createdb interior 2>/dev/null || \
    warn "Could not auto-create DB — it may already exist"
  fi
  ok "Database 'interior' ready"
}

# ── Backend venv ──────────────────────────────
setup_backend() {
  cd "$BACKEND"
  if [ ! -d venv ]; then
    log "Creating Python venv…"
    python3 -m venv venv
  fi
  source venv/bin/activate
  log "Installing/verifying Python dependencies…"
  pip install -q -r requirements.txt
  ok "Backend dependencies ready"
}

# ── Seed data ─────────────────────────────────
run_seed() {
  cd "$BACKEND"
  source venv/bin/activate
  export PYTHONPATH=.
  export DATABASE_URL=postgresql://postgres:password@localhost:5432/interior
  local result
  result=$(python seed_data.py 2>&1)
  if echo "$result" | grep -q "already exists"; then
    ok "Seed data already present — skipping"
  else
    echo "$result"
    ok "Seed data loaded"
  fi
}

# ── Frontend deps ─────────────────────────────
setup_frontend() {
  cd "$FRONTEND"
  if [ ! -d node_modules ]; then
    log "Installing frontend dependencies (npm install)…"
    npm install --silent
  fi
  ok "Frontend dependencies ready"
}

# ── Cleanup on exit ───────────────────────────
PIDS=()
cleanup() {
  echo ""
  log "Shutting down…"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  ok "All services stopped. Goodbye!"
}
trap cleanup EXIT INT TERM

# ══════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  InterioSync — startup${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

check_postgres
ensure_db
setup_backend
run_seed
setup_frontend

# Kill anything already on our ports
free_port $BACKEND_PORT
free_port $FRONTEND_PORT

# ── Start backend ─────────────────────────────
log "Starting backend on http://localhost:$BACKEND_PORT …"
cd "$BACKEND"
source venv/bin/activate
export DATABASE_URL=postgresql://postgres:password@localhost:5432/interior
export PYTHONPATH=.
uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload \
  > "$ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!
PIDS+=($BACKEND_PID)
ok "Backend started (PID $BACKEND_PID)"

# ── Start frontend ────────────────────────────
log "Starting frontend on http://localhost:$FRONTEND_PORT …"
cd "$FRONTEND"
VITE_API_URL=http://localhost:$BACKEND_PORT npm run dev \
  > "$ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
PIDS+=($FRONTEND_PID)
ok "Frontend started (PID $FRONTEND_PID)"

# ── Wait for backend to be ready ──────────────
log "Waiting for backend to be ready…"
for i in $(seq 1 20); do
  if curl -sf http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    ok "Backend is up"
    break
  fi
  sleep 1
done

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}${BOLD}  All services running!${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  ${BOLD}App:${RESET}      http://localhost:$FRONTEND_PORT"
echo -e "  ${BOLD}API docs:${RESET} http://localhost:$BACKEND_PORT/docs"
echo ""
echo -e "  ${BOLD}Designer:${RESET} designer@example.com / designer123"
echo -e "  ${BOLD}Client:${RESET}   client@example.com   / client123"
echo -e "  ${BOLD}Employee:${RESET} employee@example.com  / employee123"
echo ""
echo -e "  Logs → ${CYAN}logs/backend.log${RESET}  |  ${CYAN}logs/frontend.log${RESET}"
echo ""
echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop all services."
echo ""

# Keep running until Ctrl+C
wait
