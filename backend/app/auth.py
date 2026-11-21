import os
import time
import threading
import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .db import get_db
from .models import User

DEV_FALLBACK_SECRET = "dev-only-ephemeral-jwt-secret-key-32bytes"
SECRET = os.getenv("SECRET_KEY", DEV_FALLBACK_SECRET)
oauth = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Thread-safe in-memory sliding window rate limiter
_login_failures: dict[str, list[float]] = {}
_failures_lock = threading.Lock()
WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "600"))  # 10 minutes
MAX_FAILURES = int(os.getenv("MAX_LOGIN_FAILURES", "5"))  # 5 attempts


def clear_all_failures() -> None:
    with _failures_lock:
        _login_failures.clear()


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


def is_rate_limited(email: str, client_ip: str) -> bool:
    key = f"{email.lower().strip()}:{client_ip}"
    now = time.time()
    with _failures_lock:
        attempts = [t for t in _login_failures.get(key, []) if now - t < WINDOW_SECONDS]
        _login_failures[key] = attempts
        return len(attempts) >= MAX_FAILURES


def record_failure(email: str, client_ip: str) -> None:
    key = f"{email.lower().strip()}:{client_ip}"
    now = time.time()
    with _failures_lock:
        attempts = [t for t in _login_failures.get(key, []) if now - t < WINDOW_SECONDS]
        attempts.append(now)
        _login_failures[key] = attempts


def reset_failures(email: str, client_ip: str) -> None:
    key = f"{email.lower().strip()}:{client_ip}"
    with _failures_lock:
        _login_failures.pop(key, None)


def validate_production_secret() -> None:
    is_prod = os.getenv("ENV", "").lower() in ("production", "prod")
    secret_val = os.getenv("SECRET_KEY")
    if is_prod and (not secret_val or secret_val == DEV_FALLBACK_SECRET):
        raise RuntimeError(
            "CRITICAL SECURITY CONFIGURATION ERROR: Production environment requires a securely generated, "
            "non-default SECRET_KEY environment variable. Generate one with: "
            "python -c 'import secrets; print(secrets.token_hex(32))'"
        )


def hash_pw(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def check_pw(p: str, h: str) -> bool:
    return bcrypt.checkpw(p.encode(), h.encode())


def make_token(uid: int) -> str:
    return jwt.encode({"sub": str(uid), "exp": int(time.time()) + 60 * 60 * 12}, SECRET, algorithm="HS256")


def me(tok: str = Depends(oauth), db: Session = Depends(get_db)) -> User:
    try:
        uid = int(jwt.decode(tok, SECRET, algorithms=["HS256"])["sub"])
    except Exception:
        raise HTTPException(401, "Invalid or expired token")
    u = db.get(User, uid)
    if not u:
        raise HTTPException(401, "User not found")
    return u


def need(*roles):
    def dep(u: User = Depends(me)) -> User:
        if u.role != "admin" and u.role not in roles:
            raise HTTPException(403, "Not allowed for your role")
        return u
    return dep
