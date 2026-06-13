from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from mysql.connector import MySQLConnection
from app.database import get_db
from app.routers import (
    auth_router,
    books,
    authors,
    copies,
    readers,
    borrowings,
    reservations,
)
from app.routers.auth_router import require_librarian

app = FastAPI(title="System Biblioteczny", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(books.router)
app.include_router(authors.router)
app.include_router(copies.router)
app.include_router(readers.router)
app.include_router(borrowings.router)
app.include_router(reservations.router)


@app.get("/api/dashboard")
def dashboard(db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    data = {}
    cursor.execute("SELECT COUNT(*) AS val FROM KSIAZKI")
    data["books"] = cursor.fetchone()["val"]
    cursor.execute("SELECT COUNT(*) AS val FROM CZYTELNICY")
    data["readers"] = cursor.fetchone()["val"]
    cursor.execute("SELECT COUNT(*) AS val FROM EGZEMPLARZE WHERE Status='Dostepny'")
    data["available_copies"] = cursor.fetchone()["val"]
    cursor.execute(
        "SELECT COUNT(*) AS val FROM WYPOZYCZENIA WHERE RzeczywistaDataZwrotu IS NULL"
    )
    data["active_borrowings"] = cursor.fetchone()["val"]
    cursor.execute(
        "SELECT COUNT(*) AS val FROM REZERWACJE WHERE StatusRezerwacji='Aktywna'"
    )
    data["active_reservations"] = cursor.fetchone()["val"]
    cursor.execute(
        """SELECT COUNT(*) AS val FROM WYPOZYCZENIA
           WHERE RzeczywistaDataZwrotu IS NULL AND TerminZwrotu < CURDATE()"""
    )
    data["overdue"] = cursor.fetchone()["val"]
    cursor.close()
    return data
