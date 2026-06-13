#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"
CONTAINER_NAME="biblioteka-mariadb"

echo "Zatrzymywanie Systemu Bibliotecznego..."

# Stop backend
if [ -f "$PID_DIR/backend.pid" ]; then
    PID=$(cat "$PID_DIR/backend.pid")
    if kill -0 "$PID" 2>/dev/null; then
        echo "  Zatrzymywanie backendu (PID $PID)..."
        kill "$PID" 2>/dev/null || true
    fi
    rm -f "$PID_DIR/backend.pid"
fi

# Stop frontend
if [ -f "$PID_DIR/frontend.pid" ]; then
    PID=$(cat "$PID_DIR/frontend.pid")
    if kill -0 "$PID" 2>/dev/null; then
        echo "  Zatrzymywanie frontendu (PID $PID)..."
        kill "$PID" 2>/dev/null || true
    fi
    rm -f "$PID_DIR/frontend.pid"
fi

# Kill any orphaned uvicorn/node processes from our project
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Stop database container (comment out if you want DB to keep running)
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "  Zatrzymywanie kontenera MariaDB..."
    docker stop "$CONTAINER_NAME" >/dev/null
fi

echo "Gotowe."
