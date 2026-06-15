from fastapi import APIRouter, Depends, HTTPException, status
from mysql.connector import MySQLConnection
from app.database import get_db
from app.models import (
    ReserveRequest,
    CancelReservationRequest,
    BorrowFromReservationRequest,
)
from app.routers.auth_router import require_librarian, require_reader, get_current_user

router = APIRouter(prefix="/api/reservations", tags=["reservations"])


@router.get("")
def list_reservations(
    db: MySQLConnection = Depends(get_db), _=Depends(require_librarian)
):
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """SELECT r.*, CONCAT(c.Imie, ' ', c.Nazwisko) AS Czytelnik, k.Tytul
           FROM REZERWACJE r
           JOIN CZYTELNICY c ON c.IdC = r.IdC
           JOIN KSIAZKI k ON k.IdK = r.IdK
           WHERE r.StatusRezerwacji != 'Zrealizowana'
           ORDER BY r.DataRezerwacji DESC"""
    )
    rows = cursor.fetchall()
    cursor.close()
    return rows


@router.get("/my")
def my_reservations(
    db: MySQLConnection = Depends(get_db),
    payload: dict = Depends(require_reader),
):
    idC = int(payload["sub"])
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """SELECT r.*, k.Tytul
           FROM REZERWACJE r
           JOIN KSIAZKI k ON k.IdK = r.IdK
           WHERE r.IdC = %s
           ORDER BY r.DataRezerwacji DESC""",
        (idC,),
    )
    rows = cursor.fetchall()
    cursor.close()
    return rows


@router.post("", status_code=status.HTTP_201_CREATED)
def reserve_book(
    req: ReserveRequest,
    db: MySQLConnection = Depends(get_db),
    payload: dict = Depends(get_current_user),
):
    if payload.get("role") == "reader":
        idC = int(payload["sub"])
    elif payload.get("role") == "librarian":
        if not req.idC:
            raise HTTPException(status_code=400, detail="idC is required for librarian")
        idC = req.idC
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    cursor = db.cursor()
    try:
        cursor.callproc("sp_zarezerwuj_ksiazke", (idC, req.idK))
        for result in cursor.stored_results():
            idR = result.fetchone()[0]
        cursor.close()
        db.commit()
        return {"IdR": idR, "message": "Book reserved"}
    except Exception as e:
        cursor.close()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cancel")
def cancel_reservation(
    req: CancelReservationRequest,
    db: MySQLConnection = Depends(get_db),
    payload: dict = Depends(get_current_user),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT IdC FROM REZERWACJE WHERE IdR = %s", (req.idR,))
    reservation = cursor.fetchone()
    if not reservation:
        cursor.close()
        raise HTTPException(status_code=404, detail="Reservation not found")
    if payload.get("role") == "reader" and reservation["IdC"] != int(payload["sub"]):
        cursor.close()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your reservation",
        )
    cursor.close()
    cursor = db.cursor()
    try:
        cursor.callproc("sp_anuluj_rezerwacje", (req.idR,))
        cursor.close()
        db.commit()
        return {"message": "Reservation cancelled"}
    except Exception as e:
        cursor.close()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{idR}/borrow", status_code=status.HTTP_201_CREATED)
def borrow_from_reservation(
    idR: int,
    req: BorrowFromReservationRequest,
    db: MySQLConnection = Depends(get_db),
    payload: dict = Depends(require_librarian),
):
    idB = int(payload["sub"])
    cursor = db.cursor()
    try:
        cursor.callproc("sp_wypozycz_z_rezerwacji", (idR, idB, req.dniNaZwrot))
        for result in cursor.stored_results():
            idW = result.fetchone()[0]
        cursor.close()
        db.commit()
        return {"IdW": idW, "message": "Book borrowed from reservation"}
    except Exception as e:
        cursor.close()
        raise HTTPException(status_code=400, detail=str(e))
