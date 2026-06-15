from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from mysql.connector import MySQLConnection
from app.database import get_db
from app.models import CopyCreate, CopyStatusUpdate
from app.routers.auth_router import require_librarian

router = APIRouter(prefix="/api/copies", tags=["copies"])


@router.get("")
def list_copies(book_id: Optional[int] = None, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    if book_id:
        cursor.execute(
            """SELECT e.*, k.Tytul FROM EGZEMPLARZE e
               JOIN KSIAZKI k ON k.IdK = e.IdK
               WHERE e.IdK = %s ORDER BY e.IdE""",
            (book_id,),
        )
    else:
        cursor.execute(
            """SELECT e.*, k.Tytul FROM EGZEMPLARZE e
               JOIN KSIAZKI k ON k.IdK = e.IdK ORDER BY e.IdE"""
        )
    rows = cursor.fetchall()
    cursor.close()
    return rows


@router.get("/{idE}")
def get_copy(idE: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """SELECT e.*, k.Tytul FROM EGZEMPLARZE e
           JOIN KSIAZKI k ON k.IdK = e.IdK WHERE e.IdE = %s""",
        (idE,),
    )
    copy = cursor.fetchone()
    cursor.close()
    if not copy:
        raise HTTPException(status_code=404, detail="Copy not found")
    return copy


@router.post("", status_code=status.HTTP_201_CREATED)
def add_copy(
    copy: CopyCreate,
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor()
    cursor.callproc("sp_dodaj_egzemplarz", (copy.idK,))
    for result in cursor.stored_results():
        idE = result.fetchone()[0]
    cursor.close()
    db.commit()
    return {"IdE": idE, "message": "Copy added"}


@router.patch("/{idE}/status")
def update_copy_status(
    idE: int,
    update: CopyStatusUpdate,
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor()
    cursor.execute(
        "UPDATE EGZEMPLARZE SET Status=%s WHERE IdE=%s",
        (update.status, idE),
    )
    if cursor.rowcount == 0:
        cursor.close()
        raise HTTPException(status_code=404, detail="Copy not found")
    cursor.close()
    db.commit()
    return {"message": "Status updated"}


@router.delete("/{idE}")
def delete_copy(
    idE: int, db: MySQLConnection = Depends(get_db), _=Depends(require_librarian)
):
    cursor = db.cursor()
    cursor.execute("DELETE FROM EGZEMPLARZE WHERE IdE=%s", (idE,))
    if cursor.rowcount == 0:
        cursor.close()
        raise HTTPException(status_code=404, detail="Copy not found")
    cursor.close()
    db.commit()
    return {"message": "Copy deleted"}
