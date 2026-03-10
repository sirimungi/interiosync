#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  share.sh — Build INTERIOSYNC and expose it via ngrok so you can share
#             a single URL with your client.
#
#  What it does:
#    1. Checks / installs ngrok
#    2. Ensures PostgreSQL is running
#    3. Builds the React frontend (production mode, relative API URLs)
#    4. Starts the FastAPI backend on port 8000 (it serves the built frontend)
#    5. Opens an ngrok tunnel → prints the public URL
#
#  Usage:  ./share.sh
#          ./share.sh --port 8000        (default)
#          ./share.sh --skip-build       (skip npm build if already built)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=8000
SKIP_BUILD=0

for arg in "$@"; do
  case $arg in
    --port=*)  PORT="${arg#*=}" ;;
    --port)    shift; PORT="$1" ;;
    --skip-build) SKIP_BUILD=1 ;;
  esac
done

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${CYAN}[share]${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
die()  { echo -e "${RED}✗ $*${NC}" >&2; exit 1; }

echo ""
echo -e "${BOLD}  INTERIOSYNC — Share with client${NC}"
echo "  ─────────────────────────────────"
echo ""

# ── 1. ngrok ──────────────────────────────────────────────────────────────────

if ! command -v ngrok &>/dev/null; then
  log "ngrok not found — installing via Homebrew..."
  if command -v brew &>/dev/null; then
    brew install ngrok/ngrok/ngrok
  else
    die "Homebrew not found. Please install ngrok manually from https://ngrok.com/download and re-run."
  fi
fi

NGROK_VER=$(ngrok version 2>&1 | head -1)
ok "ngrok ready  ($NGROK_VER)"

# Check ngrok auth token
if ! ngrok config check &>/dev/null 2>&1; then
  echo ""
  warn "ngrok needs an auth token (free account at https://ngrok.com)."
  echo -e "  Run this once:  ${BOLD}ngrok config add-authtoken <your-token>${NC}"
  echo ""
  read -r -p "  Enter your ngrok auth token now (or press Enter to skip): " NGROK_TOKEN
  if [[ -n "$NGROK_TOKEN" ]]; then
    ngrok config add-authtoken "$NGROK_TOKEN"
    ok "Auth token saved."
  else
    warn "Skipping auth token — you may see an error when ngrok starts."
  fi
fi

# ── 2. PostgreSQL ─────────────────────────────────────────────────────────────

log "Checking PostgreSQL..."
if ! pg_isready -q 2>/dev/null; then
  log "Starting PostgreSQL via Homebrew..."
  brew services start postgresql@14 2>/dev/null || \
  brew services start postgresql 2>/dev/null || \
  pg_ctl -D /usr/local/var/postgresql@14 start 2>/dev/null || true
  sleep 3
fi

if pg_isready -q 2>/dev/null; then
  ok "PostgreSQL is running"
else
  warn "Could not confirm PostgreSQL is running. The backend may fail to start."
fi

# ── 3. Build frontend ─────────────────────────────────────────────────────────

if [[ $SKIP_BUILD -eq 1 ]]; then
  warn "Skipping frontend build (--skip-build)"
else
  log "Building frontend for production..."
  cd "$PROJECT_DIR/frontend"

  # Install deps if node_modules is missing
  if [[ ! -d node_modules ]]; then
    log "Installing npm packages..."
    npm install --silent
  fi

  # Build — .env.production sets VITE_API_URL='' so all API calls are relative
  npm run build
  ok "Frontend built → frontend/dist/"
fi

cd "$PROJECT_DIR"

# ── 4. Start backend ──────────────────────────────────────────────────────────

log "Killing any existing process on port $PORT..."
lsof -ti ":$PORT" | xargs kill -9 2>/dev/null || true
sleep 1

log "Starting FastAPI backend on port $PORT..."
cd "$PROJECT_DIR/backend"

if [[ ! -d venv ]]; then
  log "Creating Python virtual environment..."
  python3 -m venv venv
fi
source venv/bin/activate

# Install/upgrade deps quietly
pip install -r requirements.txt -q

# Launch uvicorn in the background with ALLOW_ALL_ORIGINS so ngrok URLs pass CORS
ALLOW_ALL_ORIGINS=1 uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "$PORT" \
  --log-level warning \
  >> "$PROJECT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$PROJECT_DIR/logs/backend.pid"

log "Waiting for backend to be ready..."
for i in {1..20}; do
  if curl -s "http://localhost:$PORT/health" | grep -q "ok"; then
    break
  fi
  sleep 1
done

if ! curl -s "http://localhost:$PORT/health" | grep -q "ok"; then
  die "Backend failed to start. Check logs/backend.log for details."
fi
ok "Backend is up on port $PORT"

cd "$PROJECT_DIR"

# ── 5. ngrok tunnel ───────────────────────────────────────────────────────────

log "Opening ngrok tunnel → port $PORT ..."
echo ""

# Write ngrok config for a clean named tunnel
NGROK_CFG="$PROJECT_DIR/logs/ngrok.yml"
cat > "$NGROK_CFG" <<YAML
version: "2"
tunnels:
  interiosync:
    proto: http
    addr: $PORT
    inspect: false
YAML

# Run ngrok in foreground so the URL is visible; Ctrl+C to stop everything.
cleanup() {
  echo ""
  log "Shutting down..."
  kill "$BACKEND_PID" 2>/dev/null || true
  ok "Done."
}
trap cleanup EXIT INT TERM

echo -e "${BOLD}  Your INTERIOSYNC is live!${NC}"
echo -e "  The public URL will appear below in a moment."
echo -e "  ${YELLOW}Press Ctrl+C to stop sharing.${NC}"
echo ""

ngrok start --config "$NGROK_CFG" --config "$HOME/.config/ngrok/ngrok.yml" interiosync 2>/dev/null \
  || ngrok http "$PORT"
