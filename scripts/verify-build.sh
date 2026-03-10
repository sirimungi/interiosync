#!/usr/bin/env bash
# Run before git push to catch build failures (same as Railway).
set -e
cd "$(dirname "$0")/.."
echo "Building frontend..."
cd frontend && npm run build && cd ..
echo "OK — frontend build passed."
