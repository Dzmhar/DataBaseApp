from fastapi import APIRouter, Depends, HTTPException, status
from mysql.connector import MySQLConnection
from app.database import get_db
from app.models import AuthorCreate, AuthorAssign
from app.routers.auth_router import require_librarian

router = APIRouter(prefix="/api/authors", tags=["authors"])


@router.get("")
def list_authors(db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM AUTORZY ORDER BY Nazwisko, Imie")
    rows = cursor.fetchall()
    cursor.close()
    return rows


@router.get("/{idA}")
def get_author(idA: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM AUTORZY WHERE IdA=%s", (idA,))
    author = cursor.fetchone()
    cursor.close()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    return author


@router.post("", status_code=status.HTTP_201_CREATED)
def add_author(
    author: AuthorCreate,
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO AUTORZY (Nazwisko, Imie) VALUES (%s, %s)",
        (author.nazwisko, author.imie),
    )
    idA = cursor.lastrowid
    cursor.close()
    db.commit()
    return {"IdA": idA, "message": "Author added"}


@router.put("/{idA}")
def update_author(
    idA: int,
    author: AuthorCreate,
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor()
    cursor.execute(
        "UPDATE AUTORZY SET Nazwisko=%s, Imie=%s WHERE IdA=%s",
        (author.nazwisko, author.imie, idA),
    )
    if cursor.rowcount == 0:
        cursor.close()
        raise HTTPException(status_code=404, detail="Author not found")
    cursor.close()
    db.commit()
    return {"message": "Author updated"}


@router.delete("/{idA}")
def delete_author(
    idA: int, db: MySQLConnection = Depends(get_db), _=Depends(require_librarian)
):
    cursor = db.cursor()
    cursor.execute("DELETE FROM AUTORZY WHERE IdA=%s", (idA,))
    if cursor.rowcount == 0:
        cursor.close()
        raise HTTPException(status_code=404, detail="Author not found")
    cursor.close()
    db.commit()
    return {"message": "Author deleted"}


@router.post("/{idA}/assign/{idK}")
def assign_author_to_book(
    idA: int,
    idK: int,
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor()
    try:
        cursor.execute(
            "INSERT INTO AUTOR_KSIAZKA (IdA, IdK) VALUES (%s, %s)",
            (idA, idK),
        )
        idAK = cursor.lastrowid
        cursor.close()
        db.commit()
        return {"IdAK": idAK, "message": "Author assigned to book"}
    except Exception as e:
        cursor.close()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{idA}/assign/{idK}")
def unassign_author_from_book(
    idA: int,
    idK: int,
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor()
    cursor.execute(
        "DELETE FROM AUTOR_KSIAZKA WHERE IdA=%s AND IdK=%s",
        (idA, idK),
    )
    if cursor.rowcount == 0:
        cursor.close()
        raise HTTPException(status_code=404, detail="Assignment not found")
    cursor.close()
    db.commit()
    return {"message": "Author unassigned from book"}
