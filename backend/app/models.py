from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    login: str
    haslo: str


class ReaderLoginRequest(BaseModel):
    login: str
    haslo: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "librarian"
    bibliotekarz: Optional[dict] = None
    czytelnik: Optional[dict] = None


class BookCreate(BaseModel):
    tytul: str
    isbn: Optional[str] = None
    rokWydania: Optional[int] = None


class BookResponse(BaseModel):
    IdK: int
    Tytul: str
    ISBN: Optional[str]
    RokWydania: Optional[int]
    Autorzy: Optional[str] = None
    LiczbaEgzemplarzy: Optional[int] = None
    LiczbaDostepnych: Optional[int] = None


class AuthorCreate(BaseModel):
    nazwisko: str
    imie: str


class AuthorAssign(BaseModel):
    idA: int


class CopyCreate(BaseModel):
    idK: int


class CopyStatusUpdate(BaseModel):
    status: str


class ReaderCreate(BaseModel):
    nazwisko: str
    imie: str
    email: Optional[str] = None
    telefon: Optional[str] = None
    login: str
    haslo: str


class BorrowRequest(BaseModel):
    idC: int
    idE: int
    dniNaZwrot: Optional[int] = 14


class ReturnRequest(BaseModel):
    idW: int


class ReserveRequest(BaseModel):
    idK: int
    idC: Optional[int] = None


class CancelReservationRequest(BaseModel):
    idR: int


class BorrowFromReservationRequest(BaseModel):
    dniNaZwrot: Optional[int] = 14
