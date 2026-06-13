from fastapi import APIRouter, Depends, HTTPException, status
from mysql.connector import MySQLConnection
from app.database import get_db
from app.models import ReaderCreate
from app.routers.auth_router import require_librarian, require_librarian_or_reader_owner

router = APIRouter(prefix="/api/readers", tags=["readers"])


@router.get("")
def list_readers(
    search: str = "",
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor(dictionary=True)
    cursor.callproc("sp_szukaj_czytelnika", (search,))
    for result in cursor.stored_results():
        rows = result.fetchall()
    cursor.close()
    return rows


@router.get("/{idC}")
def get_reader(
    idC: int,
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT IdC, Nazwisko, Imie, Email, Telefon, Login FROM CZYTELNICY WHERE IdC=%s",
        (idC,),
    )
    reader = cursor.fetchone()
    cursor.close()
    if not reader:
        raise HTTPException(status_code=404, detail="Reader not found")
    return reader


@router.get("/{idC}/history")
def get_reader_history(
    idC: int,
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian_or_reader_owner),
):
    cursor = db.cursor(dictionary=True)
    cursor.callproc("sp_historia_wypozyczen", (idC,))
    for result in cursor.stored_results():
        rows = result.fetchall()
    cursor.close()
    if not rows:
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT IdC FROM CZYTELNICY WHERE IdC=%s", (idC,))
        reader = cursor.fetchone()
        cursor.close()
        if not reader:
            raise HTTPException(status_code=404, detail="Reader not found")
        return []
    return rows


@router.post("", status_code=status.HTTP_201_CREATED)
def add_reader(
    reader: ReaderCreate,
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor()
    cursor.callproc(
        "sp_dodaj_czytelnika",
        (
            reader.nazwisko,
            reader.imie,
            reader.email,
            reader.telefon,
            reader.login,
            reader.haslo,
        ),
    )
    for result in cursor.stored_results():
        idC = result.fetchone()[0]
    cursor.close()
    db.commit()
    return {"IdC": idC, "message": "Reader added"}


@router.put("/{idC}")
def update_reader(
    idC: int,
    reader: ReaderCreate,
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor()
    try:
        cursor.callproc(
            "sp_edytuj_czytelnika",
            (
                idC,
                reader.nazwisko,
                reader.imie,
                reader.email,
                reader.telefon,
                reader.login,
                reader.haslo,
            ),
        )
        cursor.close()
        db.commit()
        return {"message": "Reader updated"}
    except Exception as e:
        cursor.close()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{idC}")
def delete_reader(
    idC: int,
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor()
    try:
        cursor.callproc("sp_usun_czytelnika", (idC,))
        cursor.close()
        db.commit()
        return {"message": "Reader deleted"}
    except Exception as e:
        cursor.close()
        raise HTTPException(status_code=400, detail=str(e))
