from fastapi import APIRouter, Depends, HTTPException, status
from mysql.connector import MySQLConnection
from app.database import get_db
from app.models import BookCreate
from app.routers.auth_router import require_librarian

router = APIRouter(prefix="/api/books", tags=["books"])


@router.get("")
def list_books(search: str = "", db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    if search:
        cursor.execute(
            """SELECT * FROM v_wyszukiwanie_ksiazek
               WHERE Tytul LIKE %s OR Autorzy LIKE %s OR ISBN LIKE %s
               ORDER BY Tytul""",
            (f"%{search}%", f"%{search}%", f"%{search}%"),
        )
    else:
        cursor.execute("SELECT * FROM v_wyszukiwanie_ksiazek ORDER BY Tytul")
    rows = cursor.fetchall()
    cursor.close()
    return rows


@router.get("/{idK}")
def get_book(idK: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM v_wyszukiwanie_ksiazek WHERE IdK = %s", (idK,))
    book = cursor.fetchone()
    cursor.close()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.get("/{idK}/authors")
def get_book_authors(idK: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """SELECT a.IdA, a.Imie, a.Nazwisko
           FROM AUTORZY a
           JOIN AUTOR_KSIAZKA ak ON ak.IdA = a.IdA
           WHERE ak.IdK = %s
           ORDER BY a.Nazwisko, a.Imie""",
        (idK,),
    )
    rows = cursor.fetchall()
    cursor.close()
    return rows


@router.post("", status_code=status.HTTP_201_CREATED)
def add_book(
    book: BookCreate,
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor()
    cursor.callproc("sp_dodaj_ksiazke", (book.tytul, book.isbn, book.rokWydania))
    for result in cursor.stored_results():
        idK = result.fetchone()[0]
    cursor.close()
    db.commit()
    return {"IdK": idK, "message": "Book added"}


@router.put("/{idK}")
def update_book(
    idK: int,
    book: BookCreate,
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor()
    try:
        cursor.callproc(
            "sp_edytuj_ksiazke",
            (idK, book.tytul, book.isbn, book.rokWydania),
        )
        cursor.close()
        db.commit()
        return {"message": "Book updated"}
    except Exception as e:
        cursor.close()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{idK}")
def delete_book(
    idK: int, db: MySQLConnection = Depends(get_db), _=Depends(require_librarian)
):
    cursor = db.cursor()
    cursor.execute("DELETE FROM KSIAZKI WHERE IdK=%s", (idK,))
    if cursor.rowcount == 0:
        cursor.close()
        raise HTTPException(status_code=404, detail="Book not found")
    cursor.close()
    db.commit()
    return {"message": "Book deleted"}
