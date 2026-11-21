import csv
import io
import json
import logging
import os
import sys
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy import select, update, func, text, desc, asc
from sqlalchemy.orm import Session

from .db import engine, get_db, SessionLocal
from .models import (
    User, Category, Item, Vendor, Txn, Indent, IndentLine, PO, POLine,
    WriteOff, Audit, Notice, DocCounter, utcnow
)
from .auth import (
    check_pw, make_token, me, need, is_rate_limited, record_failure,
    reset_failures, get_client_ip, validate_production_secret
)

# ----------------- Structured Logging -----------------
class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "name": record.name,
        }
        if hasattr(record, "request_id"):
            log_obj["request_id"] = record.request_id
        return json.dumps(log_obj)

logger = logging.getLogger("gbu_inventory")
logger.setLevel(logging.INFO)
log_handler = logging.StreamHandler(sys.stdout)
log_handler.setFormatter(JsonFormatter())
logger.handlers = [log_handler]


# ----------------- Custom Exceptions & Error Handling -----------------
class AppException(HTTPException):
    def __init__(self, status_code: int, code: str, message: str, fields: dict | None = None):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.message = message
        self.fields = fields or {}


# ----------------- Startup & Migrations -----------------
def boot():
    validate_production_secret()

    # Automatically execute Alembic migrations on startup
    from alembic.config import Config
    from alembic import command
    alembic_ini_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    alembic_cfg = Config(alembic_ini_path)
    try:
        command.upgrade(alembic_cfg, "head")
        logger.info("Database schema migrated to head.")
    except Exception as e:
        logger.error(f"Error running database migrations: {e}")

    with SessionLocal() as db:
        if not db.scalar(select(func.count(User.id))):
            from .seed import run
            run(db)


@asynccontextmanager
async def lifespan(app: FastAPI):
    boot()
    yield


app = FastAPI(title="GBU Stores & Purchase Inventory Management System", lifespan=lifespan)

# ----------------- Middlewares -----------------
# 1. CORS
raw_origins = os.getenv("ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 2. Correlation ID Middleware
@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    request.state.request_id = req_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    return response


# 3. Security Headers Middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


# 4. Request Body Size Limit Middleware (Max 1MB)
@app.middleware("http")
async def request_size_limit_middleware(request: Request, call_next):
    content_length = request.headers.get("Content-Length")
    if content_length and int(content_length) > 1048576:
        return JSONResponse(
            status_code=413,
            content={"error": {"code": "PAYLOAD_TOO_LARGE", "message": "Request payload exceeds 1MB limit.", "fields": {}}}
        )
    return await call_next(request)


# ----------------- Exception Handlers -----------------
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message, "fields": exc.fields}}
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMITED",
    }
    code = code_map.get(exc.status_code, "ERROR")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": code, "message": str(exc.detail), "fields": {}}}
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    fields = {}
    for err in exc.errors():
        field_name = ".".join(str(loc) for loc in err["loc"] if loc != "body")
        fields[field_name] = err["msg"]
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "VALIDATION_ERROR", "message": "Request validation failed.", "fields": fields}}
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Unhandled exception [req_id={req_id}]: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_SERVER_ERROR", "message": "An internal server error occurred.", "fields": {}}}
    )


# ----------------- Business Logic Helpers -----------------
def get_indian_financial_year(dt: datetime | None = None) -> str:
    if dt is None:
        dt = datetime.now(timezone.utc)
    year = dt.year
    if dt.month >= 4:
        return f"{year}-{(year + 1) % 100:02d}"
    else:
        return f"{year - 1}-{year % 100:02d}"


def next_doc_number(db: Session, doc_type: str, dt: datetime | None = None) -> str:
    fy = get_indian_financial_year(dt)
    stmt = select(DocCounter).where(DocCounter.doc_type == doc_type, DocCounter.fin_year == fy)
    if db.bind and not db.bind.dialect.name.startswith("sqlite"):
        stmt = stmt.with_for_update()

    counter = db.scalar(stmt)
    if not counter:
        counter = DocCounter(doc_type=doc_type, fin_year=fy, last_val=1)
        db.add(counter)
        db.flush()
        seq = 1
    else:
        counter.last_val += 1
        db.flush()
        seq = counter.last_val

    return f"{doc_type}/{fy}/{seq:04d}"


def audit_log(db: Session, u: User | None, action: str, request_id: str = "", before: dict | None = None, after: dict | None = None):
    entry = Audit(
        user_id=u.id if u else None,
        action=action,
        request_id=request_id,
        before_state=before,
        after_state=after,
        at=utcnow()
    )
    db.add(entry)


def deduct_stock_atomic(db: Session, item_id: int, qty: Decimal, user_id: int, kind: str, ref: str = "", note: str = "") -> Item:
    if qty <= 0:
        raise AppException(400, "INVALID_QUANTITY", "Quantity must be strictly positive.")

    # Atomic UPDATE with conditional constraint check
    stmt = (
        update(Item)
        .where(Item.id == item_id, Item.qty >= qty)
        .values(qty=Item.qty - qty)
    )
    res = db.execute(stmt)
    if res.rowcount == 0:
        item = db.get(Item, item_id)
        current = float(item.qty) if item else 0.0
        name = item.name if item else "Item"
        unit = item.unit if item else "units"
        raise AppException(
            400,
            "INSUFFICIENT_STOCK",
            f"Insufficient stock for {name}. Requested: {float(qty):g} {unit}, available: {current:g} {unit}."
        )

    item = db.get(Item, item_id)
    unit_cost = item.price if item else Decimal("0.00")

    # Record ledger row inside same database transaction
    txn = Txn(
        item_id=item_id,
        kind=kind,
        qty=qty,
        unit_cost=unit_cost,
        ref=ref,
        note=note,
        user_id=user_id,
        at=utcnow()
    )
    db.add(txn)
    return item


def add_stock_atomic(db: Session, item_id: int, qty: Decimal, rate: Decimal, user_id: int, ref: str = "", note: str = "") -> Item:
    if qty <= 0:
        raise AppException(400, "INVALID_QUANTITY", "Quantity must be strictly positive.")

    item = db.get(Item, item_id)
    if not item:
        raise AppException(404, "NOT_FOUND", "Item not found.")

    # Weighted Average Cost recalculation
    old_qty = Decimal(str(item.qty))
    old_avg = Decimal(str(item.price))
    new_qty = Decimal(str(qty))
    unit_rate = Decimal(str(rate))
    total_qty = old_qty + new_qty

    if total_qty > 0:
        new_avg = (old_qty * old_avg + new_qty * unit_rate) / total_qty
    else:
        new_avg = unit_rate

    item.price = round(new_avg, 2)

    # Atomic stock increment
    stmt = (
        update(Item)
        .where(Item.id == item_id)
        .values(qty=Item.qty + qty, price=round(new_avg, 2))
    )
    db.execute(stmt)

    txn = Txn(
        item_id=item_id,
        kind="IN",
        qty=qty,
        unit_cost=unit_rate,
        ref=ref,
        note=note,
        user_id=user_id,
        at=utcnow()
    )
    db.add(txn)
    return item


def reconcile_item_stock(db: Session, item_id: int) -> dict:
    item = db.get(Item, item_id)
    if not item:
        return {}
    in_sum = db.scalar(select(func.coalesce(func.sum(Txn.qty), Decimal("0"))).where(Txn.item_id == item_id, Txn.kind == "IN"))
    out_sum = db.scalar(select(func.coalesce(func.sum(Txn.qty), Decimal("0"))).where(Txn.item_id == item_id, Txn.kind == "OUT"))
    wo_sum = db.scalar(select(func.coalesce(func.sum(Txn.qty), Decimal("0"))).where(Txn.item_id == item_id, Txn.kind == "WRITEOFF"))
    calc_qty = Decimal(str(in_sum)) - Decimal(str(out_sum)) - Decimal(str(wo_sum))
    diff = Decimal(str(item.qty)) - calc_qty
    return {
        "item_id": item.id,
        "code": item.code,
        "name": item.name,
        "recorded_qty": float(item.qty),
        "calculated_qty": float(calc_qty),
        "difference": float(diff),
        "is_balanced": abs(diff) < Decimal("0.0001"),
    }


def get_or_404(db: Session, model, id_: int, name: str):
    obj = db.get(model, id_)
    if not obj:
        raise AppException(404, "NOT_FOUND", f"{name} not found.")
    return obj


# ----------------- Serializers -----------------
def d_item(i: Item) -> dict:
    qty_f = float(i.qty)
    price_f = float(i.price)
    min_f = float(i.min_stock)
    return {
        "id": i.id,
        "code": i.code,
        "name": i.name,
        "category": i.category.name if i.category else "",
        "category_id": i.category_id,
        "unit": i.unit,
        "min_stock": min_f,
        "qty": qty_f,
        "price": price_f,
        "location": i.location,
        "low": qty_f <= min_f,
        "value": round(qty_f * price_f, 2),
    }


def d_indent(x: Indent) -> dict:
    return {
        "id": x.id,
        "no": x.no,
        "dept": x.dept,
        "note": x.note,
        "status": x.status,
        "remark": x.remark,
        "by": x.by.name if x.by else "",
        "by_id": x.by_id,
        "decided_by": x.decider.name if getattr(x, "decider", None) and x.decider else "",
        "at": x.at.isoformat(),
        "lines": [
            {
                "id": l.id,
                "item_id": l.item_id,
                "item": l.item.name if l.item else "",
                "unit": l.item.unit if l.item else "",
                "qty": float(l.qty),
                "approved_qty": float(l.approved_qty) if l.approved_qty is not None else float(l.qty),
            }
            for l in x.lines
        ],
    }


def d_po(p: PO) -> dict:
    lines = [
        {
            "id": l.id,
            "item_id": l.item_id,
            "item": l.item.name if l.item else "",
            "unit": l.item.unit if l.item else "",
            "qty": float(l.qty),
            "rate": float(l.rate),
            "got": float(l.got),
        }
        for l in p.lines
    ]
    total = round(sum(l["qty"] * l["rate"] for l in lines), 2)
    return {
        "id": p.id,
        "no": p.no,
        "vendor": p.vendor.name if p.vendor else "",
        "vendor_id": p.vendor_id,
        "indent_id": p.indent_id,
        "indent_no": p.indent.no if p.indent else "",
        "status": p.status,
        "at": p.at.isoformat(),
        "by": p.by.name if getattr(p, "by", None) and p.by else "",
        "total": total,
        "lines": lines,
    }


def d_wo(w: WriteOff) -> dict:
    return {
        "id": w.id,
        "no": w.no,
        "item": w.item.name if w.item else "",
        "item_id": w.item_id,
        "item_code": w.item.code if w.item else "",
        "unit": w.item.unit if w.item else "",
        "qty": float(w.qty),
        "reason": w.reason,
        "status": w.status,
        "remark": w.remark,
        "by": w.by.name if w.by else "",
        "by_id": w.by_id,
        "decided_by": w.decider.name if getattr(w, "decider", None) and w.decider else "",
        "at": w.at.isoformat(),
    }


def d_txn(t: Txn) -> dict:
    return {
        "id": t.id,
        "item": t.item.name if t.item else "",
        "code": t.item.code if t.item else "",
        "kind": t.kind,
        "qty": float(t.qty),
        "unit_cost": float(t.unit_cost),
        "unit": t.item.unit if t.item else "",
        "ref": t.ref,
        "note": t.note,
        "by": t.user.name if t.user else "",
        "at": t.at.isoformat(),
    }


# ----------------- Auth Endpoints -----------------
@app.post("/api/auth/login")
def login(request: Request, f: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = f.username.lower().strip()
    client_ip = get_client_ip(request)

    if is_rate_limited(email, client_ip):
        raise AppException(
            429,
            "RATE_LIMITED",
            "Too many failed login attempts. Please try again after 10 minutes."
        )

    u = db.scalar(select(User).where(User.email == email))
    if not u or not check_pw(f.password, u.pw):
        record_failure(email, client_ip)
        raise AppException(401, "INVALID_CREDENTIALS", "Wrong email or password.")

    reset_failures(email, client_ip)
    req_id = getattr(request.state, "request_id", "")
    audit_log(db, u, f"User {u.email} logged in", request_id=req_id)
    db.commit()

    return {
        "access_token": make_token(u.id),
        "token_type": "bearer",
        "user": {"id": u.id, "name": u.name, "role": u.role, "dept": u.dept}
    }


@app.get("/api/auth/me")
def whoami(u: User = Depends(me)):
    return {"id": u.id, "name": u.name, "role": u.role, "dept": u.dept}


@app.get("/api/config")
def get_config():
    return {
        "show_demo_accounts": os.getenv("SHOW_DEMO_ACCOUNTS", "true").lower() in ("true", "1", "yes"),
        "env": os.getenv("ENV", "development"),
        "app": "GBU Stores & Purchase Portal",
    }


# ----------------- Categories & Vendors -----------------
@app.get("/api/categories")
def list_categories(db: Session = Depends(get_db), u: User = Depends(me)):
    cats = db.scalars(select(Category).order_by(Category.name)).all()
    return [{"id": c.id, "name": c.name} for c in cats]


class CatIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)


@app.post("/api/categories")
def add_category(request: Request, b: CatIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    name = b.name.strip()
    if db.scalar(select(Category).where(Category.name == name)):
        raise AppException(400, "DUPLICATE_CATEGORY", f"Category '{name}' already exists.")
    c = Category(name=name)
    db.add(c)
    db.flush()
    req_id = getattr(request.state, "request_id", "")
    audit_log(db, u, f"Added category '{name}'", request_id=req_id, after={"id": c.id, "name": c.name})
    db.commit()
    return {"id": c.id, "name": c.name}


@app.get("/api/vendors")
def list_vendors(db: Session = Depends(get_db), u: User = Depends(me)):
    vs = db.scalars(select(Vendor).order_by(Vendor.name)).all()
    return [{"id": v.id, "name": v.name, "phone": v.phone, "email": v.email} for v in vs]


class VendorIn(BaseModel):
    name: str = Field(min_length=2)
    phone: str = ""
    email: str = ""


@app.post("/api/vendors")
def add_vendor(request: Request, b: VendorIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    v = Vendor(**b.model_dump())
    db.add(v)
    db.flush()
    req_id = getattr(request.state, "request_id", "")
    audit_log(db, u, f"Registered vendor '{b.name}'", request_id=req_id, after=b.model_dump())
    db.commit()
    return {"id": v.id, "name": v.name}


# ----------------- Items -----------------
class ItemIn(BaseModel):
    code: str = Field(min_length=2, max_length=30)
    name: str = Field(min_length=2, max_length=150)
    category_id: int
    unit: str = "pcs"
    min_stock: float = Field(0, ge=0)
    price: float = Field(0, ge=0)
    location: str = ""
    opening_qty: float = Field(0, ge=0)


@app.get("/api/items")
def list_items(
    q: str = "",
    low: bool = False,
    category_id: int | None = None,
    page: int | None = None,
    page_size: int = 20,
    sort: str = "name",
    order: str = "asc",
    db: Session = Depends(get_db),
    u: User = Depends(me)
):
    st = select(Item)
    if q:
        st = st.where(Item.name.ilike(f"%{q}%") | Item.code.ilike(f"%{q}%"))
    if category_id:
        st = st.where(Item.category_id == category_id)
    if low:
        st = st.where(Item.qty <= Item.min_stock)

    sort_cols = {
        "name": Item.name,
        "code": Item.code,
        "qty": Item.qty,
        "price": Item.price,
        "category": Item.category_id,
    }
    col = sort_cols.get(sort, Item.name)
    st = st.order_by(desc(col) if order.lower() == "desc" else asc(col))

    if page is not None:
        count_st = select(func.count(Item.id))
        if q:
            count_st = count_st.where(Item.name.ilike(f"%{q}%") | Item.code.ilike(f"%{q}%"))
        if category_id:
            count_st = count_st.where(Item.category_id == category_id)
        if low:
            count_st = count_st.where(Item.qty <= Item.min_stock)
        total = db.scalar(count_st) or 0
        items_db = db.scalars(st.offset((page - 1) * page_size).limit(page_size)).all()
        return {
            "items": [d_item(i) for i in items_db],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 1,
        }

    items_db = db.scalars(st).all()
    rows = [d_item(i) for i in items_db]
    return {
        "items": rows,
        "total": len(rows),
        "page": 1,
        "page_size": len(rows),
        "total_pages": 1,
    }


@app.post("/api/items")
def create_item(request: Request, b: ItemIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    code = b.code.strip().upper()
    if db.scalar(select(Item).where(Item.code == code)):
        raise AppException(400, "DUPLICATE_CODE", f"Item code '{code}' already exists.")
    get_or_404(db, Category, b.category_id, "Category")

    price_dec = Decimal(str(round(b.price, 2)))
    min_dec = Decimal(str(round(b.min_stock, 3)))
    open_dec = Decimal(str(round(b.opening_qty, 3)))

    i = Item(
        code=code,
        name=b.name.strip(),
        category_id=b.category_id,
        unit=b.unit.strip(),
        min_stock=min_dec,
        qty=Decimal("0.000"),
        price=price_dec,
        location=b.location.strip(),
    )
    db.add(i)
    db.flush()

    if open_dec > 0:
        add_stock_atomic(db, i.id, open_dec, price_dec, u.id, ref="OPENING", note="Opening stock")

    req_id = getattr(request.state, "request_id", "")
    audit_log(db, u, f"Added item {i.code} {i.name}", request_id=req_id, after=d_item(i))
    db.commit()
    return d_item(i)


@app.get("/api/items/{id}")
def get_single_item(id: int, db: Session = Depends(get_db), u: User = Depends(me)):
    return d_item(get_or_404(db, Item, id, "Item"))


@app.put("/api/items/{id}")
def update_item(request: Request, id: int, b: ItemIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    i = get_or_404(db, Item, id, "Item")
    before = d_item(i)

    i.name = b.name.strip()
    i.category_id = b.category_id
    i.unit = b.unit.strip()
    i.min_stock = Decimal(str(round(b.min_stock, 3)))
    i.price = Decimal(str(round(b.price, 2)))
    i.location = b.location.strip()

    req_id = getattr(request.state, "request_id", "")
    audit_log(db, u, f"Updated item {i.code}", request_id=req_id, before=before, after=d_item(i))
    db.commit()
    return d_item(i)


# ----------------- Stock Transactions -----------------
class IssueIn(BaseModel):
    item_id: int
    qty: float = Field(gt=0)
    dept: str = Field(min_length=2)
    note: str = ""


@app.post("/api/stock/issue")
def issue_stock(request: Request, b: IssueIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    i = get_or_404(db, Item, b.item_id, "Item")
    qty_dec = Decimal(str(round(b.qty, 3)))
    before = d_item(i)

    deduct_stock_atomic(
        db,
        i.id,
        qty_dec,
        u.id,
        kind="OUT",
        ref="ISSUE",
        note=f"To {b.dept.strip()}. {b.note.strip()}".strip()
    )

    req_id = getattr(request.state, "request_id", "")
    audit_log(
        db,
        u,
        f"Issued {float(qty_dec):g} {i.unit} of {i.name} to {b.dept}",
        request_id=req_id,
        before=before,
        after=d_item(i)
    )
    db.commit()
    return d_item(i)


@app.get("/api/transactions")
def list_transactions(
    item_id: int | None = None,
    kind: str = "",
    page: int | None = None,
    page_size: int = 50,
    sort: str = "at",
    order: str = "desc",
    db: Session = Depends(get_db),
    u: User = Depends(me)
):
    st = select(Txn)
    if item_id:
        st = st.where(Txn.item_id == item_id)
    if kind:
        st = st.where(Txn.kind == kind.upper())

    sort_cols = {"at": Txn.at, "qty": Txn.qty, "id": Txn.id}
    col = sort_cols.get(sort, Txn.id)
    st = st.order_by(desc(col) if order.lower() == "desc" else asc(col))

    if page is not None:
        count_st = select(func.count(Txn.id))
        if item_id:
            count_st = count_st.where(Txn.item_id == item_id)
        if kind:
            count_st = count_st.where(Txn.kind == kind.upper())
        total = db.scalar(count_st) or 0
        txns_db = db.scalars(st.offset((page - 1) * page_size).limit(page_size)).all()
        return {
            "items": [d_txn(t) for t in txns_db],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 1,
        }

    txns_db = db.scalars(st.limit(min(page_size, 500))).all()
    rows = [d_txn(t) for t in txns_db]
    return {
        "items": rows,
        "total": len(rows),
        "page": 1,
        "page_size": len(rows),
        "total_pages": 1,
    }


# ----------------- Indents (Requisitions) -----------------
class LineIn(BaseModel):
    item_id: int
    qty: float = Field(gt=0)


class IndentIn(BaseModel):
    dept: str = Field(min_length=2)
    note: str = ""
    lines: list[LineIn] = Field(min_length=1)


class IndentLineApproval(BaseModel):
    line_id: int
    approved_qty: float = Field(ge=0)


class Decision(BaseModel):
    approve: bool
    remark: str = ""
    line_approvals: list[IndentLineApproval] | None = None


@app.get("/api/indents")
def list_indents(
    status: str = "",
    dept: str = "",
    page: int | None = None,
    page_size: int = 20,
    sort: str = "at",
    order: str = "desc",
    db: Session = Depends(get_db),
    u: User = Depends(me)
):
    st = select(Indent)
    if status:
        st = st.where(Indent.status == status.upper())
    if dept:
        st = st.where(Indent.dept.ilike(f"%{dept}%"))
    if u.role == "dept":
        st = st.where(Indent.by_id == u.id)

    sort_cols = {"at": Indent.at, "no": Indent.no, "id": Indent.id}
    col = sort_cols.get(sort, Indent.id)
    st = st.order_by(desc(col) if order.lower() == "desc" else asc(col))

    if page is not None:
        count_st = select(func.count(Indent.id))
        if status:
            count_st = count_st.where(Indent.status == status.upper())
        if dept:
            count_st = count_st.where(Indent.dept.ilike(f"%{dept}%"))
        if u.role == "dept":
            count_st = count_st.where(Indent.by_id == u.id)
        total = db.scalar(count_st) or 0
        items_db = db.scalars(st.offset((page - 1) * page_size).limit(page_size)).all()
        return {
            "items": [d_indent(x) for x in items_db],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 1,
        }

    items_db = db.scalars(st).all()
    rows = [d_indent(x) for x in items_db]
    return {
        "items": rows,
        "total": len(rows),
        "page": 1,
        "page_size": len(rows),
        "total_pages": 1,
    }


@app.get("/api/indents/{id}")
def get_indent(id: int, db: Session = Depends(get_db), u: User = Depends(me)):
    x = get_or_404(db, Indent, id, "Indent")
    if u.role == "dept" and x.by_id != u.id:
        raise AppException(403, "FORBIDDEN", "Not allowed to view requisitions raised by other departments.")
    return d_indent(x)


@app.post("/api/indents")
def raise_indent(request: Request, b: IndentIn, db: Session = Depends(get_db), u: User = Depends(need("store", "dept", "approver"))):
    doc_no = next_doc_number(db, "IND")
    x = Indent(no=doc_no, dept=b.dept.strip(), note=b.note.strip(), by_id=u.id, status="PENDING")
    for l in b.lines:
        get_or_404(db, Item, l.item_id, "Item")
        x.lines.append(IndentLine(item_id=l.item_id, qty=Decimal(str(round(l.qty, 3)))))
    db.add(x)
    db.flush()

    req_id = getattr(request.state, "request_id", "")
    audit_log(db, u, f"Raised material indent {x.no}", request_id=req_id, after=d_indent(x))
    db.commit()
    return d_indent(x)


@app.post("/api/indents/{id}/decision")
def decide_indent(request: Request, id: int, b: Decision, db: Session = Depends(get_db), u: User = Depends(need("approver"))):
    x = get_or_404(db, Indent, id, "Indent")

    # Segregation of Duties Check
    if u.id == x.by_id:
        raise AppException(
            403,
            "SEGREGATION_OF_DUTIES",
            "Segregation of duties violation: the person who raised an indent cannot approve or reject it."
        )

    if x.status != "PENDING":
        raise AppException(400, "INVALID_STATE", f"Indent is already in '{x.status}' state.")

    before = d_indent(x)
    x.status = "APPROVED" if b.approve else "REJECTED"
    x.remark = b.remark.strip()
    x.decided_by = u.id

    if b.approve:
        line_map = {l.id: l for l in x.lines}
        if b.line_approvals:
            for la in b.line_approvals:
                line_obj = line_map.get(la.line_id)
                if not line_obj:
                    raise AppException(400, "INVALID_LINE", f"Indent line {la.line_id} does not exist.")
                appr_dec = Decimal(str(round(la.approved_qty, 3)))
                if appr_dec < 0:
                    raise AppException(400, "INVALID_QUANTITY", "Approved quantity cannot be negative.")
                if appr_dec > line_obj.qty:
                    raise AppException(
                        400,
                        "EXCEEDS_REQUESTED",
                        f"Approved quantity ({float(appr_dec):g}) exceeds requested quantity ({float(line_obj.qty):g})."
                    )
                line_obj.approved_qty = appr_dec
        else:
            for l in x.lines:
                if l.approved_qty is None:
                    l.approved_qty = l.qty

    req_id = getattr(request.state, "request_id", "")
    audit_log(db, u, f"{x.status} indent {x.no}", request_id=req_id, before=before, after=d_indent(x))
    db.commit()
    return d_indent(x)


@app.post("/api/indents/{id}/cancel")
def cancel_indent(request: Request, id: int, db: Session = Depends(get_db), u: User = Depends(me)):
    x = get_or_404(db, Indent, id, "Indent")
    if u.role != "admin" and x.by_id != u.id:
        raise AppException(403, "FORBIDDEN", "Only the indent requisitioner or administrator can cancel this indent.")
    if x.status != "PENDING":
        raise AppException(400, "INVALID_STATE", f"Cannot cancel an indent that is already '{x.status}'.")

    before = d_indent(x)
    x.status = "CANCELLED"
    req_id = getattr(request.state, "request_id", "")
    audit_log(db, u, f"Cancelled indent {x.no}", request_id=req_id, before=before, after=d_indent(x))
    db.commit()
    return d_indent(x)


@app.post("/api/indents/{id}/copy")
def copy_indent(request: Request, id: int, db: Session = Depends(get_db), u: User = Depends(need("store", "dept"))):
    orig = get_or_404(db, Indent, id, "Indent")
    doc_no = next_doc_number(db, "IND")
    new_ind = Indent(
        no=doc_no,
        dept=u.dept or orig.dept,
        note=f"Re-submitted draft of {orig.no}: {orig.note}".strip(),
        by_id=u.id,
        status="PENDING",
    )
    for l in orig.lines:
        new_ind.lines.append(IndentLine(item_id=l.item_id, qty=l.qty))
    db.add(new_ind)
    db.flush()

    req_id = getattr(request.state, "request_id", "")
    audit_log(db, u, f"Copied indent {orig.no} into new draft {new_ind.no}", request_id=req_id, after=d_indent(new_ind))
    db.commit()
    return d_indent(new_ind)


# ----------------- Purchase Orders -----------------
class POLineIn(BaseModel):
    item_id: int
    qty: float = Field(gt=0)
    rate: float = Field(ge=0)


class POIn(BaseModel):
    vendor_id: int
    indent_id: int = Field(gt=0)
    lines: list[POLineIn] = Field(min_length=1)


@app.get("/api/purchase-orders")
def list_pos(
    status: str = "",
    vendor_id: int | None = None,
    page: int | None = None,
    page_size: int = 20,
    sort: str = "at",
    order: str = "desc",
    db: Session = Depends(get_db),
    u: User = Depends(need("store", "approver"))
):
    st = select(PO)
    if status:
        st = st.where(PO.status == status.upper())
    if vendor_id:
        st = st.where(PO.vendor_id == vendor_id)

    sort_cols = {"at": PO.at, "no": PO.no, "id": PO.id}
    col = sort_cols.get(sort, PO.id)
    st = st.order_by(desc(col) if order.lower() == "desc" else asc(col))

    if page is not None:
        count_st = select(func.count(PO.id))
        if status:
            count_st = count_st.where(PO.status == status.upper())
        if vendor_id:
            count_st = count_st.where(PO.vendor_id == vendor_id)
        total = db.scalar(count_st) or 0
        items_db = db.scalars(st.offset((page - 1) * page_size).limit(page_size)).all()
        return {
            "items": [d_po(p) for p in items_db],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 1,
        }

    items_db = db.scalars(st).all()
    rows = [d_po(p) for p in items_db]
    return {
        "items": rows,
        "total": len(rows),
        "page": 1,
        "page_size": len(rows),
        "total_pages": 1,
    }


@app.get("/api/purchase-orders/{id}")
def get_single_po(id: int, db: Session = Depends(get_db), u: User = Depends(need("store", "approver"))):
    return d_po(get_or_404(db, PO, id, "PO"))


@app.post("/api/purchase-orders")
def create_purchase_order(request: Request, b: POIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    get_or_404(db, Vendor, b.vendor_id, "Vendor")
    ind = get_or_404(db, Indent, b.indent_id, "Indent")
    if ind.status != "APPROVED":
        raise AppException(400, "UNSANCTIONED_INDENT", f"PO can only be generated against an APPROVED indent (current status: {ind.status}).")

    ind.status = "ORDERED"
    doc_no = next_doc_number(db, "PO")
    p = PO(no=doc_no, vendor_id=b.vendor_id, indent_id=b.indent_id, by_id=u.id, status="OPEN")

    for l in b.lines:
        get_or_404(db, Item, l.item_id, "Item")
        p.lines.append(
            POLine(
                item_id=l.item_id,
                qty=Decimal(str(round(l.qty, 3))),
                rate=Decimal(str(round(l.rate, 2))),
                got=Decimal("0.000")
            )
        )

    db.add(p)
    db.flush()
    req_id = getattr(request.state, "request_id", "")
    audit_log(db, u, f"Created {p.no} against {ind.no}", request_id=req_id, after=d_po(p))
    db.commit()
    return d_po(p)


class GRNLine(BaseModel):
    line_id: int
    qty: float = Field(gt=0)


class GRNIn(BaseModel):
    lines: list[GRNLine] = Field(min_length=1)


@app.post("/api/purchase-orders/{id}/receive")
def receive_goods(request: Request, id: int, b: GRNIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    p = get_or_404(db, PO, id, "PO")
    if p.status == "RECEIVED":
        raise AppException(400, "PO_ALREADY_FULFILLED", "Purchase order has already been fully received.")

    by_id = {l.id: l for l in p.lines}
    grn_no = next_doc_number(db, "GRN")

    for g in b.lines:
        line = by_id.get(g.line_id)
        if not line:
            raise AppException(400, "INVALID_LINE", f"PO line {g.line_id} is not part of {p.no}.")
        recv_dec = Decimal(str(round(g.qty, 3)))
        pending = line.qty - line.got
        if recv_dec > pending:
            raise AppException(
                400,
                "OVER_RECEIPT",
                f"Cannot receive {float(recv_dec):g} {line.item.unit}; only {float(pending):g} pending for {line.item.name}."
            )

        line.got += recv_dec
        # Weighted Average Cost calculation and stock increment
        add_stock_atomic(
            db,
            line.item_id,
            qty=recv_dec,
            rate=line.rate,
            user_id=u.id,
            ref=grn_no,
            note=f"GRN against {p.no} from {p.vendor.name}"
        )

    p.status = "RECEIVED" if all(l.got >= l.qty for l in p.lines) else "PARTIAL"
    req_id = getattr(request.state, "request_id", "")
    audit_log(db, u, f"Inward GRN {grn_no} against {p.no} (Status: {p.status})", request_id=req_id, after=d_po(p))
    db.commit()
    return d_po(p)


# ----------------- Write-Offs (Condemnation) -----------------
class WOIn(BaseModel):
    item_id: int
    qty: float = Field(gt=0)
    reason: str = Field(min_length=3)


@app.get("/api/writeoffs")
def list_writeoffs(
    status: str = "",
    page: int | None = None,
    page_size: int = 20,
    sort: str = "at",
    order: str = "desc",
    db: Session = Depends(get_db),
    u: User = Depends(need("store", "approver"))
):
    st = select(WriteOff)
    if status:
        st = st.where(WriteOff.status == status.upper())

    sort_cols = {"at": WriteOff.at, "no": WriteOff.no, "id": WriteOff.id}
    col = sort_cols.get(sort, WriteOff.id)
    st = st.order_by(desc(col) if order.lower() == "desc" else asc(col))

    if page is not None:
        count_st = select(func.count(WriteOff.id))
        if status:
            count_st = count_st.where(WriteOff.status == status.upper())
        total = db.scalar(count_st) or 0
        items_db = db.scalars(st.offset((page - 1) * page_size).limit(page_size)).all()
        return {
            "items": [d_wo(w) for w in items_db],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 1,
        }

    items_db = db.scalars(st).all()
    rows = [d_wo(w) for w in items_db]
    return {
        "items": rows,
        "total": len(rows),
        "page": 1,
        "page_size": len(rows),
        "total_pages": 1,
    }


@app.post("/api/writeoffs")
def propose_writeoff(request: Request, b: WOIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    i = get_or_404(db, Item, b.item_id, "Item")
    qty_dec = Decimal(str(round(b.qty, 3)))
    if qty_dec > i.qty:
        raise AppException(
            400,
            "INSUFFICIENT_STOCK",
            f"Cannot condemn {float(qty_dec):g} {i.unit}; only {float(i.qty):g} in store."
        )

    doc_no = next_doc_number(db, "WO")
    w = WriteOff(no=doc_no, item_id=i.id, qty=qty_dec, reason=b.reason.strip(), by_id=u.id, status="PENDING")
    db.add(w)
    db.flush()

    req_id = getattr(request.state, "request_id", "")
    audit_log(db, u, f"Proposed write-off {w.no} for {float(qty_dec):g} {i.unit} of {i.name}", request_id=req_id, after=d_wo(w))
    db.commit()
    return d_wo(w)


@app.post("/api/writeoffs/{id}/decision")
def decide_writeoff(request: Request, id: int, b: Decision, db: Session = Depends(get_db), u: User = Depends(need("approver"))):
    w = get_or_404(db, WriteOff, id, "Write-off")

    # Segregation of Duties Check
    if u.id == w.by_id:
        raise AppException(
            403,
            "SEGREGATION_OF_DUTIES",
            "Segregation of duties violation: the person who proposed a write-off cannot sanction or reject it."
        )

    if w.status != "PENDING":
        raise AppException(400, "INVALID_STATE", f"Write-off proposal is already '{w.status}'.")

    before = d_wo(w)
    if b.approve:
        deduct_stock_atomic(
            db,
            w.item_id,
            w.qty,
            u.id,
            kind="WRITEOFF",
            ref=w.no,
            note=f"Condemnation sanctioned by {u.name}: {b.remark or w.reason}".strip()
        )

    w.status = "APPROVED" if b.approve else "REJECTED"
    w.remark = b.remark.strip()
    w.decided_by = u.id

    req_id = getattr(request.state, "request_id", "")
    audit_log(db, u, f"{w.status} write-off {w.no}", request_id=req_id, before=before, after=d_wo(w))
    db.commit()
    return d_wo(w)


# ----------------- Dashboard & Reports -----------------
@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db), u: User = Depends(me)):
    its = list(db.scalars(select(Item)))
    by_cat = {}
    for i in its:
        c_name = i.category.name if i.category else "General"
        by_cat[c_name] = by_cat.get(c_name, Decimal("0.00")) + (i.qty * i.price)

    since = datetime.now(timezone.utc) - timedelta(days=30)
    flow = {k: 0 for k in ("IN", "OUT", "WRITEOFF")}
    for k, n in db.execute(select(Txn.kind, func.count(Txn.id)).where(Txn.at >= since).group_by(Txn.kind)):
        flow[k] = n

    daily_map = {}
    for days_ago in range(29, -1, -1):
        d_key = (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%d %b")
        daily_map[d_key] = {"date": d_key, "IN": 0, "OUT": 0, "WRITEOFF": 0}

    recent_txns_30d = db.scalars(select(Txn).where(Txn.at >= since)).all()
    for t in recent_txns_30d:
        d_key = t.at.strftime("%d %b")
        if d_key in daily_map and t.kind in daily_map[d_key]:
            daily_map[d_key][t.kind] += int(t.qty)

    now_utc = datetime.now(timezone.utc)
    weeks = []
    for w in range(7, -1, -1):
        w_start = now_utc - timedelta(days=(w + 1) * 7)
        w_end = now_utc - timedelta(days=w * 7)
        label = w_start.strftime("%d %b")
        weeks.append({"label": label, "start": w_start, "end": w_end, "in": 0.0, "out": 0.0})

    txns_8w = db.scalars(
        select(Txn).where(Txn.at >= (now_utc - timedelta(days=56)), Txn.ref != "OPENING")
    ).all()
    for t in txns_8w:
        t_at = t.at.replace(tzinfo=timezone.utc) if t.at.tzinfo is None else t.at
        for wk in weeks:
            if wk["start"] <= t_at < wk["end"]:
                if t.kind == "IN":
                    wk["in"] += float(t.qty)
                elif t.kind in ("OUT", "WRITEOFF"):
                    wk["out"] += float(t.qty)
                break

    weekly_flow = [{"week": wk["label"], "in": round(wk["in"], 1), "out": round(wk["out"], 1)} for wk in weeks]

    cnt = lambda m, s: db.scalar(select(func.count(m.id)).where(m.status.in_(s))) or 0
    low_stock_items = [d_item(i) for i in its if i.qty <= i.min_stock]

    attention = {"type": u.role}
    if u.role in ("store", "admin"):
        attention["low_stock"] = [
            {
                "id": i["id"],
                "code": i["code"],
                "name": i["name"],
                "unit": i["unit"],
                "qty": i["qty"],
                "min_stock": i["min_stock"],
                "deficit": round(max(0.0, i["min_stock"] - i["qty"]), 1)
            }
            for i in sorted(low_stock_items, key=lambda x: x["qty"] / max(1.0, x["min_stock"]))
        ]
        open_pos_list = db.scalars(select(PO).where(PO.status.in_(["OPEN", "PARTIAL"])).order_by(PO.id.desc())).all()
        attention["open_pos"] = [
            {
                "id": p.id,
                "no": p.no,
                "vendor": p.vendor.name if p.vendor else "",
                "status": p.status,
                "at": p.at.isoformat(),
                "total": round(sum(float(l.qty * l.rate) for l in p.lines), 2),
                "pending_lines": sum(1 for l in p.lines if l.got < l.qty),
            }
            for p in open_pos_list
        ]
    elif u.role == "approver":
        pending_inds = db.scalars(select(Indent).where(Indent.status == "PENDING").order_by(Indent.id.desc())).all()
        attention["pending_indents"] = [
            {
                "id": x.id,
                "no": x.no,
                "dept": x.dept,
                "note": x.note,
                "by": x.by.name if x.by else "",
                "at": x.at.isoformat(),
                "lines_count": len(x.lines),
                "lines": [{"item": l.item.name, "unit": l.item.unit, "qty": float(l.qty)} for l in x.lines],
            }
            for x in pending_inds
        ]
        pending_wos = db.scalars(select(WriteOff).where(WriteOff.status == "PENDING").order_by(WriteOff.id.desc())).all()
        attention["pending_writeoffs"] = [
            {
                "id": w.id,
                "no": w.no,
                "item": w.item.name,
                "unit": w.item.unit,
                "qty": float(w.qty),
                "reason": w.reason,
                "by": w.by.name if w.by else "",
                "at": w.at.isoformat(),
            }
            for w in pending_wos
        ]
    elif u.role == "dept":
        my_inds = db.scalars(select(Indent).where(Indent.by_id == u.id).order_by(Indent.id.desc()).limit(5)).all()
        attention["my_indents"] = [
            {
                "id": x.id,
                "no": x.no,
                "dept": x.dept,
                "status": x.status,
                "at": x.at.isoformat(),
                "lines_count": len(x.lines),
            }
            for x in my_inds
        ]

    value_by_cat = [
        {"name": k, "value": round(float(v), 2)}
        for k, v in sorted(by_cat.items(), key=lambda x: x[1], reverse=True)
    ]

    total_stock_value = round(float(sum((i.qty * i.price for i in its), Decimal("0.00"))), 2)

    return {
        "total_items": len(its),
        "stock_value": total_stock_value,
        "low_stock": low_stock_items,
        "low_stock_count": len(low_stock_items),
        "pending_indents": cnt(Indent, ["PENDING"]),
        "pending_writeoffs": cnt(WriteOff, ["PENDING"]),
        "open_pos": cnt(PO, ["OPEN", "PARTIAL"]),
        "value_by_category": value_by_cat,
        "flow_30d": flow,
        "movement_30d": list(daily_map.values()),
        "weekly_flow": weekly_flow,
        "attention": attention,
        "recent": [d_txn(t) for t in db.scalars(select(Txn).order_by(Txn.id.desc()).limit(8)).all()],
    }


def as_csv(name, head, rows):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(head)
    w.writerows(rows)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={name}"}
    )


@app.get("/api/reports/stock.csv")
def rep_stock(db: Session = Depends(get_db), u: User = Depends(me)):
    rows = [d_item(i) for i in db.scalars(select(Item).order_by(Item.code))]
    return as_csv(
        "stock_report.csv",
        ["Code", "Item", "Category", "Unit", "Qty", "Min", "Price", "Value", "Location"],
        [[r["code"], r["name"], r["category"], r["unit"], r["qty"], r["min_stock"], r["price"], r["value"], r["location"]] for r in rows]
    )


@app.get("/api/reports/transactions.csv")
def rep_txn(db: Session = Depends(get_db), u: User = Depends(me)):
    txns_db = db.scalars(select(Txn).order_by(Txn.id.desc()).limit(500)).all()
    rows = [d_txn(t) for t in txns_db]
    return as_csv(
        "transactions.csv",
        ["Date", "Item", "Type", "Qty", "Unit Cost", "Ref", "Note", "By"],
        [[r["at"], r["item"], r["kind"], r["qty"], r["unit_cost"], r["ref"], r["note"], r["by"]] for r in rows]
    )


# ----------------- Admin Integrity Check & Audit -----------------
@app.get("/api/admin/integrity-check")
def admin_integrity_check(db: Session = Depends(get_db), u: User = Depends(need("admin"))):
    items = db.scalars(select(Item).order_by(Item.code)).all()
    results = [reconcile_item_stock(db, i.id) for i in items]
    mismatches = [r for r in results if not r.get("is_balanced", True)]
    return {
        "status": "mismatch" if mismatches else "ok",
        "total_items": len(items),
        "mismatches": mismatches
    }


@app.get("/api/audit")
def list_audit(
    q: str = "",
    page: int | None = None,
    page_size: int = 50,
    db: Session = Depends(get_db),
    u: User = Depends(need("approver"))
):
    st = select(Audit)
    if q:
        st = st.where(Audit.action.ilike(f"%{q}%"))
    st = st.order_by(Audit.id.desc())

    if page is not None:
        count_st = select(func.count(Audit.id))
        if q:
            count_st = count_st.where(Audit.action.ilike(f"%{q}%"))
        total = db.scalar(count_st) or 0
        items_db = db.scalars(st.offset((page - 1) * page_size).limit(page_size)).all()
        return {
            "items": [
                {
                    "id": a.id,
                    "user": a.user.name if a.user else "System",
                    "action": a.action,
                    "request_id": a.request_id,
                    "before": a.before_state,
                    "after": a.after_state,
                    "at": a.at.isoformat()
                }
                for a in items_db
            ],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 1,
        }

    items_db = db.scalars(st.limit(min(page_size, 200))).all()
    rows = [
        {
            "id": a.id,
            "user": a.user.name if a.user else "System",
            "action": a.action,
            "request_id": a.request_id,
            "before": a.before_state,
            "after": a.after_state,
            "at": a.at.isoformat()
        }
        for a in items_db
    ]
    return {
        "items": rows,
        "total": len(rows),
        "page": 1,
        "page_size": len(rows),
        "total_pages": 1,
    }


# ----------------- Store Notices -----------------
class NoticeIn(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=5)
    ref_no: str = Field(default="", max_length=50)


@app.get("/api/notices")
def get_notices(db: Session = Depends(get_db)):
    notices = db.scalars(select(Notice).order_by(Notice.id.desc())).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "ref_no": n.ref_no,
            "by": n.by,
            "at": n.at.isoformat()
        }
        for n in notices
    ]


@app.post("/api/notices")
def create_notice(request: Request, payload: NoticeIn, db: Session = Depends(get_db), u: User = Depends(need("store", "approver"))):
    n = Notice(
        title=payload.title.strip(),
        content=payload.content.strip(),
        ref_no=payload.ref_no.strip() or f"GBU/S&P/2026/NOT-{(db.scalar(select(func.count(Notice.id))) or 0) + 1:03d}",
        by=f"{u.name} ({u.role.title()})",
    )
    db.add(n)
    db.flush()
    req_id = getattr(request.state, "request_id", "")
    audit_log(db, u, f"Published store circular: {n.title}", request_id=req_id, after={"id": n.id, "title": n.title})
    db.commit()
    db.refresh(n)
    return {"id": n.id, "title": n.title, "content": n.content, "ref_no": n.ref_no, "by": n.by, "at": n.at.isoformat()}


@app.delete("/api/notices/{id}")
def delete_notice(request: Request, id: int, db: Session = Depends(get_db), u: User = Depends(need("store", "approver"))):
    n = get_or_404(db, Notice, id, "Notice")
    req_id = getattr(request.state, "request_id", "")
    audit_log(db, u, f"Archived store notice: {n.title}", request_id=req_id, before={"id": n.id, "title": n.title})
    db.delete(n)
    db.commit()
    return {"ok": True}


# ----------------- Health & Readiness -----------------
@app.get("/api/health")
def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}


@app.get("/api/ready")
def readiness(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "not_ready", "database": "disconnected", "error": str(e)})
