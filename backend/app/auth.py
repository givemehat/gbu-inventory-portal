import os, time
import bcrypt, jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .db import get_db
from .models import User

SECRET = os.getenv("SECRET_KEY", "gbu-inventory-jwt-secret-key-production-super-secure-min32")
oauth = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


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
