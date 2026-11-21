import csv, io, os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from .db import Base, engine, get_db, SessionLocal
from .models import *
from .auth import check_pw, make_token, me, need


def boot():
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if not db.scalar(select(func.count(User.id))):
            from .seed import run
            run(db)


@asynccontextmanager
async def lifespan(app: FastAPI):
    boot()
    yield


app = FastAPI(title="GBU Inventory Management System", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- helpers ----------
def log(db, u, text):
    db.add(Audit(user_id=u.id, action=text))


def number(prefix, id_):
    return f"{prefix}-{datetime.now(timezone.utc).year}-{id_:04d}"


def move(db, item, kind, qty, u, ref="", note=""):
    if qty <= 0:
        raise HTTPException(400, "Quantity must be positive")
    if kind == "IN":
        item.qty += qty
    else:
        if item.qty < qty:
            raise HTTPException(400, f"Only {item.qty:g} {item.unit} of {item.name} in stock")
        item.qty -= qty
    db.add(Txn(item_id=item.id, kind=kind, qty=qty, ref=ref, note=note, user_id=u.id))


def get_or_404(db, model, id_, name):
    o = db.get(model, id_)
    if not o:
        raise HTTPException(404, f"{name} not found")
    return o


def d_item(i):
    return dict(id=i.id, code=i.code, name=i.name, category=i.category.name, category_id=i.category_id,
                unit=i.unit, min_stock=i.min_stock, qty=i.qty, price=i.price, location=i.location,
                low=i.qty <= i.min_stock, value=round(i.qty * i.price, 2))


def d_indent(x):
    return dict(id=x.id, no=x.no, dept=x.dept, note=x.note, status=x.status, remark=x.remark,
                by=x.by.name if x.by else "", by_id=x.by_id,
                decided_by=x.decider.name if getattr(x, "decider", None) and x.decider else "",
                at=x.at.isoformat(),
                lines=[dict(id=l.id, item_id=l.item_id, item=l.item.name, unit=l.item.unit, qty=l.qty) for l in x.lines])


def d_po(p):
    return dict(id=p.id, no=p.no, vendor=p.vendor.name, vendor_id=p.vendor_id,
                indent_id=p.indent_id, indent_no=p.indent.no if p.indent else "",
                status=p.status, at=p.at.isoformat(),
                by=p.by.name if getattr(p, "by", None) and p.by else "",
                total=round(sum(l.qty * l.rate for l in p.lines), 2),
                lines=[dict(id=l.id, item_id=l.item_id, item=l.item.name, unit=l.item.unit,
                            qty=l.qty, rate=l.rate, got=l.got) for l in p.lines])


def d_wo(w):
    return dict(id=w.id, no=w.no, item=w.item.name, item_id=w.item_id, unit=w.item.unit, qty=w.qty,
                reason=w.reason, status=w.status, remark=w.remark,
                by=w.by.name if w.by else "",
                decided_by=w.decider.name if getattr(w, "decider", None) and w.decider else "",
                at=w.at.isoformat())


# ---------- auth ----------
@app.post("/api/auth/login")
def login(f: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    u = db.scalar(select(User).where(User.email == f.username.lower().strip()))
    if not u or not check_pw(f.password, u.pw):
        raise HTTPException(401, "Wrong email or password")
    return dict(access_token=make_token(u.id), token_type="bearer",
                user=dict(id=u.id, name=u.name, role=u.role, dept=u.dept))


@app.get("/api/auth/me")
def whoami(u: User = Depends(me)):
    return dict(id=u.id, name=u.name, role=u.role, dept=u.dept)


# ---------- master data ----------
@app.get("/api/categories")
def cats(db: Session = Depends(get_db), u: User = Depends(me)):
    return [dict(id=c.id, name=c.name) for c in db.scalars(select(Category).order_by(Category.name))]


class CatIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)


@app.post("/api/categories")
def add_cat(b: CatIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    if db.scalar(select(Category).where(Category.name == b.name)):
        raise HTTPException(400, "Category already exists")
    c = Category(name=b.name)
    db.add(c)
    log(db, u, f"Added category {b.name}")
    db.commit()
    return dict(id=c.id, name=c.name)


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
def items(q: str = "", low: bool = False, category_id: int | None = None,
          db: Session = Depends(get_db), u: User = Depends(me)):
    st = select(Item).order_by(Item.name)
    if q:
        st = st.where(Item.name.ilike(f"%{q}%") | Item.code.ilike(f"%{q}%"))
    if category_id:
        st = st.where(Item.category_id == category_id)
    rows = [d_item(i) for i in db.scalars(st)]
    return [r for r in rows if r["low"]] if low else rows


@app.post("/api/items")
def add_item(b: ItemIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    if db.scalar(select(Item).where(Item.code == b.code)):
        raise HTTPException(400, "Item code already exists")
    get_or_404(db, Category, b.category_id, "Category")
    i = Item(code=b.code, name=b.name, category_id=b.category_id, unit=b.unit, min_stock=b.min_stock,
             price=b.price, location=b.location, qty=0)
    db.add(i)
    db.flush()
    if b.opening_qty > 0:
        move(db, i, "IN", b.opening_qty, u, ref="OPENING", note="Opening stock")
    log(db, u, f"Added item {b.code} {b.name}")
    db.commit()
    return d_item(i)


@app.get("/api/items/{id}")
def get_item(id: int, db: Session = Depends(get_db), u: User = Depends(me)):
    return d_item(get_or_404(db, Item, id, "Item"))


@app.put("/api/items/{id}")
def edit_item(id: int, b: ItemIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    i = get_or_404(db, Item, id, "Item")
    for k in ("name", "category_id", "unit", "min_stock", "price", "location"):
        setattr(i, k, getattr(b, k))
    log(db, u, f"Edited item {i.code}")
    db.commit()
    return d_item(i)


class VendorIn(BaseModel):
    name: str = Field(min_length=2)
    phone: str = ""
    email: str = ""


@app.get("/api/vendors")
def vendors(db: Session = Depends(get_db), u: User = Depends(me)):
    return [dict(id=v.id, name=v.name, phone=v.phone, email=v.email) for v in db.scalars(select(Vendor).order_by(Vendor.name))]


@app.post("/api/vendors")
def add_vendor(b: VendorIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    v = Vendor(**b.model_dump())
    db.add(v)
    log(db, u, f"Added vendor {b.name}")
    db.commit()
    return dict(id=v.id, name=v.name)


# ---------- stores: issue + ledger ----------
class IssueIn(BaseModel):
    item_id: int
    qty: float = Field(gt=0)
    dept: str = Field(min_length=2)
    note: str = ""


@app.post("/api/stock/issue")
def issue(b: IssueIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    i = get_or_404(db, Item, b.item_id, "Item")
    move(db, i, "OUT", b.qty, u, ref="ISSUE", note=f"To {b.dept}. {b.note}".strip())
    log(db, u, f"Issued {b.qty:g} {i.unit} {i.name} to {b.dept}")
    db.commit()
    return d_item(i)


@app.get("/api/transactions")
def txns(item_id: int | None = None, kind: str = "", limit: int = 100,
         db: Session = Depends(get_db), u: User = Depends(me)):
    st = select(Txn).order_by(Txn.id.desc()).limit(min(limit, 500))
    if item_id:
        st = st.where(Txn.item_id == item_id)
    if kind:
        st = st.where(Txn.kind == kind.upper())
    return [dict(id=t.id, item=t.item.name, code=t.item.code, kind=t.kind, qty=t.qty, unit=t.item.unit,
                 ref=t.ref, note=t.note, by=t.user.name, at=t.at.isoformat()) for t in db.scalars(st)]


# ---------- procurement: indent -> approval -> PO -> GRN ----------
class LineIn(BaseModel):
    item_id: int
    qty: float = Field(gt=0)


class IndentIn(BaseModel):
    dept: str = Field(min_length=2)
    note: str = ""
    lines: list[LineIn] = Field(min_length=1)


class Decision(BaseModel):
    approve: bool
    remark: str = ""


@app.get("/api/indents")
def indents(status: str = "", db: Session = Depends(get_db), u: User = Depends(me)):
    st = select(Indent).order_by(Indent.id.desc())
    if status:
        st = st.where(Indent.status == status.upper())
    if u.role == "dept":
        st = st.where(Indent.by_id == u.id)
    return [d_indent(x) for x in db.scalars(st)]


@app.get("/api/indents/{id}")
def get_indent(id: int, db: Session = Depends(get_db), u: User = Depends(me)):
    x = get_or_404(db, Indent, id, "Indent")
    if u.role == "dept" and x.by_id != u.id:
        raise HTTPException(403, "Not allowed to view this indent")
    return d_indent(x)


@app.post("/api/indents")
def new_indent(b: IndentIn, db: Session = Depends(get_db), u: User = Depends(need("store", "dept"))):
    x = Indent(dept=b.dept, note=b.note, by_id=u.id)
    for l in b.lines:
        get_or_404(db, Item, l.item_id, "Item")
        x.lines.append(IndentLine(item_id=l.item_id, qty=l.qty))
    db.add(x)
    db.flush()
    x.no = number("IND", x.id)
    log(db, u, f"Raised indent {x.no}")
    db.commit()
    return d_indent(x)


@app.post("/api/indents/{id}/decision")
def decide_indent(id: int, b: Decision, db: Session = Depends(get_db), u: User = Depends(need("approver"))):
    x = get_or_404(db, Indent, id, "Indent")
    if x.status != "PENDING":
        raise HTTPException(400, f"Indent is already {x.status}")
    x.status = "APPROVED" if b.approve else "REJECTED"
    x.remark, x.decided_by = b.remark, u.id
    log(db, u, f"{x.status} indent {x.no}")
    db.commit()
    return d_indent(x)


class POLineIn(BaseModel):
    item_id: int
    qty: float = Field(gt=0)
    rate: float = Field(ge=0)


class POIn(BaseModel):
    vendor_id: int
    indent_id: int = Field(gt=0)
    lines: list[POLineIn] = Field(min_length=1)


@app.get("/api/purchase-orders")
def pos(db: Session = Depends(get_db), u: User = Depends(need("store", "approver"))):
    return [d_po(p) for p in db.scalars(select(PO).order_by(PO.id.desc()))]


@app.get("/api/purchase-orders/{id}")
def get_po(id: int, db: Session = Depends(get_db), u: User = Depends(need("store", "approver"))):
    return d_po(get_or_404(db, PO, id, "PO"))


@app.post("/api/purchase-orders")
def new_po(b: POIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    get_or_404(db, Vendor, b.vendor_id, "Vendor")
    if not b.indent_id:
        raise HTTPException(400, "PO must be linked to an approved indent")
    ind = get_or_404(db, Indent, b.indent_id, "Indent")
    if ind.status != "APPROVED":
        raise HTTPException(400, "PO can only be raised against an approved indent")
    ind.status = "ORDERED"
    p = PO(vendor_id=b.vendor_id, indent_id=b.indent_id, by_id=u.id)
    for l in b.lines:
        get_or_404(db, Item, l.item_id, "Item")
        p.lines.append(POLine(item_id=l.item_id, qty=l.qty, rate=l.rate))
    db.add(p)
    db.flush()
    p.no = number("PO", p.id)
    log(db, u, f"Created {p.no} against {ind.no}")
    db.commit()
    return d_po(p)


class GRNLine(BaseModel):
    line_id: int
    qty: float = Field(gt=0)


class GRNIn(BaseModel):
    lines: list[GRNLine] = Field(min_length=1)


@app.post("/api/purchase-orders/{id}/receive")
def receive(id: int, b: GRNIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    p = get_or_404(db, PO, id, "PO")
    if p.status == "RECEIVED":
        raise HTTPException(400, "PO already fully received")
    by_id = {l.id: l for l in p.lines}
    for g in b.lines:
        l = by_id.get(g.line_id)
        if not l:
            raise HTTPException(400, f"Line {g.line_id} is not part of {p.no}")
        if g.qty > l.qty - l.got:
            raise HTTPException(400, f"Cannot receive {g.qty:g}, only {l.qty - l.got:g} pending for {l.item.name}")
        l.got += g.qty
        if l.rate:
            l.item.price = l.rate  # latest purchase rate becomes the item price
        move(db, l.item, "IN", g.qty, u, ref=p.no, note=f"GRN from {p.vendor.name}")
    p.status = "RECEIVED" if all(l.got >= l.qty for l in p.lines) else "PARTIAL"
    log(db, u, f"Received goods against {p.no} ({p.status})")
    db.commit()
    return d_po(p)


# ---------- write-off ----------
class WOIn(BaseModel):
    item_id: int
    qty: float = Field(gt=0)
    reason: str = Field(min_length=3)


@app.get("/api/writeoffs")
def writeoffs(db: Session = Depends(get_db), u: User = Depends(need("store", "approver"))):
    return [d_wo(w) for w in db.scalars(select(WriteOff).order_by(WriteOff.id.desc()))]


@app.post("/api/writeoffs")
def new_wo(b: WOIn, db: Session = Depends(get_db), u: User = Depends(need("store"))):
    i = get_or_404(db, Item, b.item_id, "Item")
    if b.qty > i.qty:
        raise HTTPException(400, f"Only {i.qty:g} {i.unit} available to write off")
    w = WriteOff(item_id=i.id, qty=b.qty, reason=b.reason, by_id=u.id)
    db.add(w)
    db.flush()
    w.no = number("WO", w.id)
    log(db, u, f"Requested write-off {w.no}")
    db.commit()
    return d_wo(w)


@app.post("/api/writeoffs/{id}/decision")
def decide_wo(id: int, b: Decision, db: Session = Depends(get_db), u: User = Depends(need("approver"))):
    w = get_or_404(db, WriteOff, id, "Write-off")
    if w.status != "PENDING":
        raise HTTPException(400, f"Write-off is already {w.status}")
    if b.approve:
        move(db, w.item, "WRITEOFF", w.qty, u, ref=w.no, note=w.reason)
    w.status = "APPROVED" if b.approve else "REJECTED"
    w.remark, w.decided_by = b.remark, u.id
    log(db, u, f"{w.status} write-off {w.no}")
    db.commit()
    return d_wo(w)


# ---------- dashboard, reports, audit ----------
@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db), u: User = Depends(me)):
    its = list(db.scalars(select(Item)))
    by_cat = {}
    for i in its:
        by_cat[i.category.name] = by_cat.get(i.category.name, 0) + i.qty * i.price
    since = datetime.now(timezone.utc) - timedelta(days=30)
    flow = {k: 0 for k in ("IN", "OUT", "WRITEOFF")}
    for k, n in db.execute(select(Txn.kind, func.count(Txn.id)).where(Txn.at >= since).group_by(Txn.kind)):
        flow[k] = n

    # Daily movement series for 30-day movement chart (last 30 days)
    daily_map = {}
    for days_ago in range(29, -1, -1):
        d_key = (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%d %b")
        daily_map[d_key] = {"date": d_key, "IN": 0, "OUT": 0, "WRITEOFF": 0}

    recent_txns_30d = db.scalars(select(Txn).where(Txn.at >= since)).all()
    for t in recent_txns_30d:
        d_key = t.at.strftime("%d %b")
        if d_key in daily_map and t.kind in daily_map[d_key]:
            daily_map[d_key][t.kind] += int(t.qty)

    # Weekly In vs Out flow (8 weeks, strictly excluding OPENING stock)
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
                    wk["in"] += t.qty
                elif t.kind in ("OUT", "WRITEOFF"):
                    wk["out"] += t.qty
                break

    weekly_flow = [{"week": wk["label"], "in": round(wk["in"], 1), "out": round(wk["out"], 1)} for wk in weeks]

    cnt = lambda m, s: db.scalar(select(func.count(m.id)).where(m.status.in_(s))) or 0
    low_stock_items = [d_item(i) for i in its if i.qty <= i.min_stock]

    # Role-aware attention items
    attention = {"type": u.role}
    if u.role in ("store", "admin"):
        attention["low_stock"] = [
            dict(id=i["id"], code=i["code"], name=i["name"], unit=i["unit"], qty=i["qty"], min_stock=i["min_stock"],
                 deficit=round(max(0, i["min_stock"] - i["qty"]), 1))
            for i in sorted(low_stock_items, key=lambda x: x["qty"] / max(1, x["min_stock"]))
        ]
        open_pos_list = db.scalars(select(PO).where(PO.status.in_(["OPEN", "PARTIAL"])).order_by(PO.id.desc())).all()
        attention["open_pos"] = [
            dict(id=p.id, no=p.no, vendor=p.vendor.name, status=p.status, at=p.at.isoformat(),
                 total=round(sum(l.qty * l.rate for l in p.lines), 2),
                 pending_lines=sum(1 for l in p.lines if l.got < l.qty))
            for p in open_pos_list
        ]
    elif u.role == "approver":
        pending_inds = db.scalars(select(Indent).where(Indent.status == "PENDING").order_by(Indent.id.desc())).all()
        attention["pending_indents"] = [
            dict(id=x.id, no=x.no, dept=x.dept, note=x.note, by=x.by.name if x.by else "",
                 at=x.at.isoformat(), lines_count=len(x.lines),
                 lines=[dict(item=l.item.name, unit=l.item.unit, qty=l.qty) for l in x.lines])
            for x in pending_inds
        ]
        pending_wos = db.scalars(select(WriteOff).where(WriteOff.status == "PENDING").order_by(WriteOff.id.desc())).all()
        attention["pending_writeoffs"] = [
            dict(id=w.id, no=w.no, item=w.item.name, unit=w.item.unit, qty=w.qty, reason=w.reason,
                 by=w.by.name if w.by else "", at=w.at.isoformat())
            for w in pending_wos
        ]
    elif u.role == "dept":
        my_inds = db.scalars(select(Indent).where(Indent.by_id == u.id).order_by(Indent.id.desc()).limit(5)).all()
        attention["my_indents"] = [
            dict(id=x.id, no=x.no, dept=x.dept, status=x.status, at=x.at.isoformat(), lines_count=len(x.lines))
            for x in my_inds
        ]

    # Sorted descending by value
    value_by_cat = [
        dict(name=k, value=round(v, 2))
        for k, v in sorted(by_cat.items(), key=lambda x: x[1], reverse=True)
    ]

    return dict(
        total_items=len(its),
        stock_value=round(sum(i.qty * i.price for i in its), 2),
        low_stock=low_stock_items,
        low_stock_count=len(low_stock_items),
        pending_indents=cnt(Indent, ["PENDING"]),
        pending_writeoffs=cnt(WriteOff, ["PENDING"]),
        open_pos=cnt(PO, ["OPEN", "PARTIAL"]),
        value_by_category=value_by_cat,
        flow_30d=flow,
        movement_30d=list(daily_map.values()),
        weekly_flow=weekly_flow,
        attention=attention,
        recent=txns(limit=8, db=db, u=u),
    )


def as_csv(name, head, rows):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(head)
    w.writerows(rows)
    buf.seek(0)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": f"attachment; filename={name}"})


@app.get("/api/reports/stock.csv")
def rep_stock(db: Session = Depends(get_db), u: User = Depends(me)):
    rows = [d_item(i) for i in db.scalars(select(Item).order_by(Item.code))]
    return as_csv("stock_report.csv", ["Code", "Item", "Category", "Unit", "Qty", "Min", "Price", "Value", "Location"],
                  [[r["code"], r["name"], r["category"], r["unit"], r["qty"], r["min_stock"], r["price"], r["value"], r["location"]] for r in rows])


@app.get("/api/reports/transactions.csv")
def rep_txn(db: Session = Depends(get_db), u: User = Depends(me)):
    rows = txns(limit=500, db=db, u=u)
    return as_csv("transactions.csv", ["Date", "Item", "Type", "Qty", "Ref", "Note", "By"],
                  [[r["at"], r["item"], r["kind"], r["qty"], r["ref"], r["note"], r["by"]] for r in rows])


@app.get("/api/audit")
def audit(db: Session = Depends(get_db), u: User = Depends(need("approver"))):
    return [dict(id=a.id, user=a.user.name, action=a.action, at=a.at.isoformat())
            for a in db.scalars(select(Audit).order_by(Audit.id.desc()).limit(200))]


@app.get("/api/health")
def health():
    return {"ok": True}
