# System Biblioteczny

Aplikacja do zarządzania biblioteką. Składa się z trzech części:
- **Baza danych** — MariaDB (uruchamiana w Dockerze)
- **Backend** — FastAPI (Python)
- **Frontend** — Next.js (React)

## Wymagania

- **Docker** — zainstaluj z [docker.com](https://docs.docker.com/engine/install/ubuntu/)
- **Python 3.10+** ze środowiskiem wirtualnym (`.venv/`)
- **Node.js 18+**

## Uruchamianie

W katalogu głównym projektu uruchom:

```bash
./start.sh
```

Skrypt automatycznie:
1. Sprawdza czy Docker jest uruchomiony
2. Tworzy i uruchamia kontener MariaDB z bazą danych
3. Uruchamia backend FastAPI na porcie **8000**
4. Instaluje zależności frontendu (jeśli trzeba) i uruchamia Next.js na porcie **3000**

Po uruchomieniu aplikacja będzie dostępna pod adresem:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Dokumentacja API**: http://localhost:8000/docs

## Zatrzymywanie

**Wciśnij Ctrl+C** w terminalu, w którym uruchomiony jest `start.sh`.

Można też uruchomić osobno:

```bash
./stop.sh
```

Skrypt zatrzymuje backend, frontend oraz kontener MariaDB.
