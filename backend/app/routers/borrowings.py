from fastapi import APIRouter, Depends, HTTPException, status
from mysql.connector import MySQLConnection
from app.database import get_db
from app.models import BorrowRequest, ReturnRequest
from app.routers.auth_router import require_librarian

router = APIRouter(prefix="/api/borrowings", tags=["borrowings"])


@router.get("")
def list_borrowings(
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """SELECT * FROM v_zestawienie_wypozyczen
           WHERE RzeczywistaDataZwrotu IS NULL
           ORDER BY TerminZwrotu ASC"""
    )
    rows = cursor.fetchall()
    cursor.close()
    return rows


@router.get("/history")
def list_history(
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """SELECT * FROM v_zestawienie_wypozyczen
           WHERE RzeczywistaDataZwrotu IS NOT NULL
           ORDER BY RzeczywistaDataZwrotu DESC"""
    )
    rows = cursor.fetchall()
    cursor.close()
    return rows


@router.post("/borrow", status_code=status.HTTP_201_CREATED)
def borrow_copy(
    req: BorrowRequest,
    db: MySQLConnection = Depends(get_db),
    payload: dict = Depends(require_librarian),
):
    idB = int(payload["sub"])
    cursor = db.cursor()
    try:
        cursor.callproc(
            "sp_wypozycz_egzemplarz", (req.idC, req.idE, idB, req.dniNaZwrot)
        )
        for result in cursor.stored_results():
            idW = result.fetchone()[0]
        cursor.close()
        db.commit()
        return {"IdW": idW, "message": "Book borrowed"}
    except Exception as e:
        cursor.close()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/return")
def return_copy(
    req: ReturnRequest,
    db: MySQLConnection = Depends(get_db),
    _=Depends(require_librarian),
):
    cursor = db.cursor()
    try:
        cursor.callproc("sp_zwrot_egzemplarza", (req.idW,))
        cursor.close()
        db.commit()
        return {"message": "Book returned"}
    except Exception as e:
        cursor.close()
        raise HTTPException(status_code=400, detail=str(e))
