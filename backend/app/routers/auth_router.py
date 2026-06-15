from fastapi import APIRouter, Depends, HTTPException, status, Request
from mysql.connector import MySQLConnection
from app.database import get_db
from app.auth import create_token, verify_token
from app.models import LoginRequest, ReaderLoginRequest, TokenResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    return payload


def require_librarian(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    if payload.get("role") != "librarian":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )
    return payload


def require_reader(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    if payload.get("role") != "reader":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )
    return payload


def require_librarian_or_reader_owner(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    payload = verify_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    if payload.get("role") == "librarian":
        return payload
    idC = request.path_params.get("idC")
    if (
        payload.get("role") == "reader"
        and idC is not None
        and int(payload.get("sub", 0)) == int(idC)
    ):
        return payload
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT IdB, Nazwisko, Imie, Login FROM BIBLIOTEKARZE WHERE Login = %s AND Haslo = SHA2(%s, 256)",
        (req.login, req.haslo),
    )
    librarian = cursor.fetchone()
    cursor.close()
    if not librarian:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    token = create_token(
        {"sub": str(librarian["IdB"]), "login": librarian["Login"]},
        role="librarian",
    )
    return TokenResponse(access_token=token, role="librarian", bibliotekarz=librarian)


@router.post("/reader-login", response_model=TokenResponse)
def reader_login(req: ReaderLoginRequest, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT IdC, Nazwisko, Imie, Email, Telefon, Login FROM CZYTELNICY WHERE Login = %s AND Haslo = SHA2(%s, 256)",
        (req.login, req.haslo),
    )
    reader = cursor.fetchone()
    cursor.close()
    if not reader:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    token = create_token(
        {"sub": str(reader["IdC"]), "login": reader["Login"]},
        role="reader",
    )
    return TokenResponse(access_token=token, role="reader", czytelnik=reader)


@router.get("/me")
def get_me(payload: dict = Depends(get_current_user)):
    return payload
