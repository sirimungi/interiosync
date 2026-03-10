#!/bin/bash
# Run frontend locally.
set -e
cd "$(dirname "$0")/frontend"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting frontend at http://localhost:3000"
npm run dev
