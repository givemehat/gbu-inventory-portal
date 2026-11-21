import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# local = sqlite, hosted = mysql+pymysql://user:pass@host:3306/dbname
url = os.getenv("DATABASE_URL", "sqlite:///./inv.db")
args = {"check_same_thread": False} if url.startswith("sqlite") else {}
if os.getenv("DB_SSL") == "1" and not url.startswith("sqlite"):
    ca_path = os.getenv("DB_SSL_CA")
    if not ca_path:
        try:
            import certifi
            ca_path = certifi.where()
        except ImportError:
            ca_path = "/etc/ssl/certs/ca-certificates.crt"
    if ca_path and os.path.exists(ca_path):
        args["ssl"] = {"ca": ca_path}
    else:
        args["ssl"] = True

engine = create_engine(url, pool_pre_ping=True, pool_recycle=280, connect_args=args)
SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
