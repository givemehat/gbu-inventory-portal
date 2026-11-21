from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import String, Numeric, ForeignKey, DateTime, Text, JSON, Integer, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    pw: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(20), index=True)  # admin / store / approver / dept
    dept: Mapped[str] = mapped_column(String(80), default="")


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, index=True)


class Item(Base):
    __tablename__ = "items"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(150), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), index=True)
    unit: Mapped[str] = mapped_column(String(20), default="pcs")
    min_stock: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=Decimal("0.000"))
    qty: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=Decimal("0.000"), index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.00"))  # Weighted average cost
    location: Mapped[str] = mapped_column(String(60), default="")
    category: Mapped[Category] = relationship()


class Vendor(Base):
    __tablename__ = "vendors"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    phone: Mapped[str] = mapped_column(String(30), default="")
    email: Mapped[str] = mapped_column(String(120), default="")


class Txn(Base):
    __tablename__ = "txns"
    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), index=True)
    kind: Mapped[str] = mapped_column(String(12), index=True)  # IN / OUT / WRITEOFF
    qty: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.00"), server_default="0.00")  # valuation at movement time
    ref: Mapped[str] = mapped_column(String(40), default="", index=True)
    note: Mapped[str] = mapped_column(String(255), default="")
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    item: Mapped[Item] = relationship()
    user: Mapped[User] = relationship()


class DocCounter(Base):
    __tablename__ = "doc_counters"
    id: Mapped[int] = mapped_column(primary_key=True)
    doc_type: Mapped[str] = mapped_column(String(10), index=True)  # IND, PO, GRN, WO
    fin_year: Mapped[str] = mapped_column(String(10), index=True)  # e.g. "2026-27"
    last_val: Mapped[int] = mapped_column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint("doc_type", "fin_year", name="uq_doc_counter_type_fy"),
    )


class Indent(Base):
    __tablename__ = "indents"
    id: Mapped[int] = mapped_column(primary_key=True)
    no: Mapped[str] = mapped_column(String(30), default="", unique=True, index=True)
    dept: Mapped[str] = mapped_column(String(80), index=True)
    note: Mapped[str] = mapped_column(String(255), default="")
    status: Mapped[str] = mapped_column(String(12), default="PENDING", index=True)  # PENDING / APPROVED / REJECTED / ORDERED / CANCELLED
    remark: Mapped[str] = mapped_column(String(255), default="")
    by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    decided_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    by: Mapped[User] = relationship(foreign_keys=[by_id])
    decider: Mapped[User | None] = relationship(foreign_keys=[decided_by])
    lines: Mapped[list["IndentLine"]] = relationship(cascade="all, delete-orphan")


class IndentLine(Base):
    __tablename__ = "indent_lines"
    id: Mapped[int] = mapped_column(primary_key=True)
    indent_id: Mapped[int] = mapped_column(ForeignKey("indents.id"), index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), index=True)
    qty: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    approved_qty: Mapped[Decimal | None] = mapped_column(Numeric(14, 3), nullable=True)
    item: Mapped[Item] = relationship()


class PO(Base):
    __tablename__ = "purchase_orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    no: Mapped[str] = mapped_column(String(30), default="", unique=True, index=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendors.id"), index=True)
    indent_id: Mapped[int | None] = mapped_column(ForeignKey("indents.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(12), default="OPEN", index=True)  # OPEN / PARTIAL / RECEIVED
    by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    vendor: Mapped[Vendor] = relationship()
    indent: Mapped["Indent | None"] = relationship(foreign_keys=[indent_id])
    by: Mapped[User] = relationship(foreign_keys=[by_id])
    lines: Mapped[list["POLine"]] = relationship(cascade="all, delete-orphan")


class POLine(Base):
    __tablename__ = "po_lines"
    id: Mapped[int] = mapped_column(primary_key=True)
    po_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id"), index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), index=True)
    qty: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    rate: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.00"))
    got: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=Decimal("0.000"))
    item: Mapped[Item] = relationship()


class WriteOff(Base):
    __tablename__ = "writeoffs"
    id: Mapped[int] = mapped_column(primary_key=True)
    no: Mapped[str] = mapped_column(String(30), default="", unique=True, index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), index=True)
    qty: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    reason: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(12), default="PENDING", index=True)  # PENDING / APPROVED / REJECTED
    remark: Mapped[str] = mapped_column(String(255), default="")
    by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    decided_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    item: Mapped[Item] = relationship()
    by: Mapped[User] = relationship(foreign_keys=[by_id])
    decider: Mapped[User | None] = relationship(foreign_keys=[decided_by])


class Audit(Base):
    __tablename__ = "audit"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(255))
    request_id: Mapped[str] = mapped_column(String(64), default="", server_default="", index=True)
    before_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    after_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    user: Mapped[User | None] = relationship()


class Notice(Base):
    __tablename__ = "notices"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    ref_no: Mapped[str] = mapped_column(String(50), default="", index=True)
    by: Mapped[str] = mapped_column(String(100), default="Stores & Purchase Office")
    at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
