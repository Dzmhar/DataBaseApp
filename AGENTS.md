# System Biblioteczny — agent guide

## Stack
- **Backend**: FastAPI (uvicorn), raw MySQL via `mysql-connector-python`, JWT auth
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, no external UI lib
- **DB**: MariaDB 10.11 via Docker, schema in `biblioteka_poprawiona.sql`
- **Python**: venv at `.venv/` (root), dependencies in `backend/requirements.txt`

## Project layout
```
backend/          FastAPI app (app.main:app, port 8000)
frontend/         Next.js 14 app (port 3000)
start.sh          Orchestrated startup (Docker → backend → frontend)
stop.sh           Graceful shutdown
biblioteka_poprawiona.sql   DB schema + seed data
```

## Commands
```bash
# Start everything (requires Docker + .venv + node_modules)
./start.sh

# Stop everything
./stop.sh

# Backend dev only (from repo root)
.venv/bin/uvicorn backend.app.main:app --reload --port 8000

# Frontend dev only
cd frontend && npm run dev

# Frontend lint only
cd frontend && npm run lint

# Frontend build
cd frontend && npm run build
```

## Key architecture facts
- **No ORM** — backend uses raw SQL via `mysql.connector` with `cursor(dictionary=True)`
- **Two auth roles**: `librarian` (full access) and `reader` (self-service only)
- **Passwords** hashed via MySQL `SHA2()` — done in SQL queries, not in Python
- **JWT** stored in `localStorage` on frontend, sent as `Authorization: Bearer <token>`
- **API base**: `http://localhost:8000/api` hardcoded in `frontend/src/lib/api.ts`
- **CORS**: only allows `http://localhost:3000`
- **Routes**: backend uses prefix `/api/auth`, `/api/books`, `/api/authors`, `/api/copies`, `/api/readers`, `/api/borrowings`, `/api/reservations`, `/api/dashboard`
- **Frontend**: Next.js App Router with `(auth)` redirect logic in `AppLayout.tsx` — login pages at `/login` (librarian) and `/reader-login` (reader)
- **Auth context** (`AuthProvider` + `AppLayout`) wraps all routes; unauthenticated users redirect to `/reader-login`

## Quirks & constraints
- No Python linter/formatter config committed (ruff cache exists but no `ruff.toml` or `pyproject.toml`)
- No tests anywhere
- **When editing the SQL schema**, the DB container must be recreated (`docker rm -f biblioteka-mariadb && ./start.sh`)
- Backend `.env` lives at `backend/.env` — not loaded automatically by uvicorn; `config.py` calls `load_dotenv()` explicitly
- Frontend `next.config.mjs` is empty (no custom config)
- Used Next.js version can differ from your training data — check `node_modules/next/dist/docs/` before writing frontend code (see `frontend/AGENTS.md`)
