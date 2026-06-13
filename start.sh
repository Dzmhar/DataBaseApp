#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
SQL_FILE="$SCRIPT_DIR/biblioteka_poprawiona.sql"
PID_DIR="$SCRIPT_DIR/.pids"
CONTAINER_NAME="biblioteka-mariadb"
DB_PORT=3306
BACKEND_PORT=8000
FRONTEND_PORT=3000

cleanup() {
    echo ""
    echo "Zatrzymywanie..."
    bash "$SCRIPT_DIR/stop.sh" 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

mkdir -p "$PID_DIR"

check_docker() {
    if ! command -v docker &>/dev/null; then
        echo "BLAD: Docker nie jest zainstalowany."
        echo "Zainstaluj Dockera: https://docs.docker.com/engine/install/ubuntu/"
        exit 1
    fi
    if ! docker info &>/dev/null; then
        echo "BLAD: Docker daemon nie dziala."
        echo "Uruchom: sudo systemctl start docker"
        exit 1
    fi
}

start_database() {
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "[DB] Kontener '$CONTAINER_NAME' juz dziala."
        return 0
    fi

    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "[DB] Uruchamianie zatrzymanego kontenera '$CONTAINER_NAME'..."
        docker start "$CONTAINER_NAME"
    else
        echo "[DB] Tworzenie nowego kontenera MariaDB z inicjalizacja SQL..."
        docker run -d \
            --name "$CONTAINER_NAME" \
            -e MYSQL_ROOT_PASSWORD=root \
            -e MYSQL_DATABASE=biblioteka \
            -v "$SQL_FILE:/docker-entrypoint-initdb.d/01-init.sql" \
            -p "$DB_PORT:3306" \
            mariadb:10.11
    fi

    echo "[DB] Czekanie na gotowosc MySQL..."
    for i in $(seq 1 30); do
        if docker exec "$CONTAINER_NAME" mysqladmin ping --silent 2>/dev/null; then
            echo "[DB] MySQL gotowy (baza zainicjalizowana przez docker-entrypoint)."
            return 0
        fi
        sleep 1
    done
    echo "BLAD: MySQL nie wstal po 30 sekundach."
    exit 1
}

start_backend() {
    if [ -f "$PID_DIR/backend.pid" ] && kill -0 "$(cat "$PID_DIR/backend.pid")" 2>/dev/null; then
        echo "[Backend] Juz dziala (PID $(cat "$PID_DIR/backend.pid"))."
        return 0
    fi

    echo "[Backend] Uruchamianie FastAPI na porcie $BACKEND_PORT..."
    cd "$BACKEND_DIR"
    nohup "$SCRIPT_DIR/.venv/bin/uvicorn" app.main:app --reload --port "$BACKEND_PORT" \
        > "$PID_DIR/backend.log" 2>&1 &
    echo $! > "$PID_DIR/backend.pid"
    cd "$SCRIPT_DIR"

    for i in $(seq 1 10); do
        if curl -s "http://localhost:$BACKEND_PORT/docs" >/dev/null 2>&1; then
            echo "[Backend] Gotowy na http://localhost:$BACKEND_PORT"
            return 0
        fi
        sleep 1
    done
    echo "OSTRZEZENIE: Backend moze sie jeszcze ladowac. Sprawdz logi: $PID_DIR/backend.log"
}

start_frontend() {
    if [ -f "$PID_DIR/frontend.pid" ] && kill -0 "$(cat "$PID_DIR/frontend.pid")" 2>/dev/null; then
        echo "[Frontend] Juz dziala (PID $(cat "$PID_DIR/frontend.pid"))."
        return 0
    fi

    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        echo "[Frontend] Instalowanie zależności npm..."
        cd "$FRONTEND_DIR"
        npm install
        cd "$SCRIPT_DIR"
    fi

    echo "[Frontend] Uruchamianie Next.js na porcie $FRONTEND_PORT..."
    cd "$FRONTEND_DIR"
    nohup npm run dev > "$PID_DIR/frontend.log" 2>&1 &
    echo $! > "$PID_DIR/frontend.pid"
    cd "$SCRIPT_DIR"

    for i in $(seq 1 30); do
        if curl -s "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
            echo "[Frontend] Gotowy na http://localhost:$FRONTEND_PORT"
            return 0
        fi
        sleep 1
    done
    echo "OSTRZEZENIE: Frontend moze sie jeszcze ladowac. Sprawdz logi: $PID_DIR/frontend.log"
}

echo ""
echo "============================================"
echo "  System Biblioteczny - uruchamianie"
echo "============================================"
echo ""

check_docker
start_database
start_backend
start_frontend

echo ""
echo "============================================"
echo "  Gotowe!"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo "  API docs: http://localhost:$BACKEND_PORT/docs"
echo "============================================"
echo "  Nacisnij Ctrl+C aby zatrzymac wszystko."
echo ""

xdg-open "http://localhost:$FRONTEND_PORT" 2>/dev/null || true

wait
