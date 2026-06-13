from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS


def create_token(data: dict, role: str = "librarian") -> str:
    payload = data.copy()
    payload["role"] = role
    payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None
