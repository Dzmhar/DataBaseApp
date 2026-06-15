# System Biblioteczny — agent guide

## Stack
- **Backend**: FastAPI (uvicorn), raw MySQL via `mysql-connector-python`, JWT auth
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, no external UI lib
- **DB**: MariaDB 10.11 via Docker, schema in `biblioteka_poprawiona.sql`, contains stored procedures + views for all mutations/reads
- **Python**: venv at `.venv/` (root), deps in `backend/requirements.txt`

## Commands
```bash
./start.sh               # Docker → backend → frontend (creates .pids/)
./stop.sh                # Graceful shutdown (kills pids, stops container)
.venv/bin/uvicorn backend.app.main:app --reload --port 8000   # backend only
cd frontend && npm run dev     # frontend only
cd frontend && npm run lint    # frontend lint
cd frontend && npm run build   # frontend typecheck + build
```

## Architecture
- **No ORM** — raw SQL via `mysql.connector` with `cursor(dictionary=True)`
- **Mutations** via stored procedures (`callproc`): `sp_dodaj_ksiazke`, `sp_wypozycz_egzemplarz`, `sp_zwrot_egzemplarza`, `sp_zarezerwuj_ksiazke`, `sp_anuluj_rezerwacje`, `sp_wypozycz_z_rezerwacji`, `sp_edytuj_ksiazke`
- **Reads** via DB views: `v_wyszukiwanie_ksiazek`, `v_zestawienie_wypozyczen`
- **Auth**: three dependency functions in `backend/app/routers/auth_router.py` — `require_librarian`, `require_reader`, `require_librarian_or_reader_owner`
- **Passwords** hashed via MySQL `SHA2()` in SQL queries, not in Python
- **JWT** in `localStorage`, sent as `Authorization: Bearer <token>`, default 24h expiry (from `backend/.env`)
- **API base**: `http://localhost:8000/api` hardcoded in `frontend/src/lib/api.ts`
- **CORS**: only `http://localhost:3000`
- **Two nav structures** in `Sidebar.tsx`: librarian (`/dashboard`, `/books`, `/authors`, `/readers`, `/copies`, `/borrowings`, `/history`, `/reservations`) and reader (`/reader/dashboard`, `/reader/active-borrowings`, `/reader/books`, `/reader/reservations`, `/reader/history`)
- **Auth redirect**: unauthenticated → `/reader-login`; librarian → `/dashboard`; reader → `/reader/dashboard`
- **Backend `.env`** at `backend/.env` — loaded explicitly via `load_dotenv()` in `config.py`
- `migration.sql` contains a standalone procedure (`sp_zarezerwuj_ksiazke`) separate from the main schema

## Conventions & quirks
- `db.commit()` must be called manually after every mutation in router code
- `frontend/AGENTS.md` references `node_modules/next/dist/docs/` for Next.js version-specific APIs — check before writing frontend code
- When editing the SQL schema, recreate the DB container: `docker rm -f biblioteka-mariadb && ./start.sh`
- No tests, no CI (.github/ absent), no Python linter/formatter config
- Frontend uses `@/` path alias → `./src/*`
- Start script manages processes via `.pids/` directory (not docker-compose)
