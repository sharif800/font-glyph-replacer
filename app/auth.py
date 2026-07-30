import datetime
import jwt
from fastapi import Request, HTTPException, Security, status
from fastapi.responses import RedirectResponse
from app.config import SECRET_KEY, ADMIN_USERNAME, ADMIN_PASSWORD

ALGORITHM = "HS256"
COOKIE_NAME = "access_token"

def create_access_token(data: dict, expires_delta: datetime.timedelta = datetime.timedelta(hours=12)) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def authenticate_user(username: str, password: str) -> bool:
    return username == ADMIN_USERNAME and password == ADMIN_PASSWORD

def get_current_user(request: Request) -> str:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    payload = verify_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    return payload["sub"]

def is_authenticated(request: Request) -> bool:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return False
    payload = verify_token(token)
    return payload is not None and "sub" in payload
