from datetime import datetime
from sqlalchemy import String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    pw: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(20))  # admin / store / approver / dept
    dept: Mapped[str] = mapped_column(String(80), default="")


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)


class Item(Base):
    __tablename__ = "items"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(150))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    unit: Mapped[str] = mapped_column(String(20), default="pcs")
    min_stock: Mapped[float] = mapped_column(Float, default=0)
    qty: Mapped[float] = mapped_column(Float, default=0)
    price: Mapped[float] = mapped_column(Float, default=0)
    location: Mapped[str] = mapped_column(String(60), default="")
    category: Mapped[Category] = relationship()


class Vendor(Base):
    __tablename__ = "vendors"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(30), default="")
    email: Mapped[str] = mapped_column(String(120), default="")


class Txn(Base):
    __tablename__ = "txns"
    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"), index=True)
    kind: Mapped[str] = mapped_column(String(12))  # IN / OUT / WRITEOFF
    qty: Mapped[float] = mapped_column(Float)
    ref: Mapped[str] = mapped_column(String(40), default="")
    note: Mapped[str] = mapped_column(String(255), default="")
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    item: Mapped[Item] = relationship()
    user: Mapped[User] = relationship()


class Indent(Base):
    __tablename__ = "indents"
    id: Mapped[int] = mapped_column(primary_key=True)
    no: Mapped[str] = mapped_column(String(30), default="")
    dept: Mapped[str] = mapped_column(String(80))
    note: Mapped[str] = mapped_column(String(255), default="")
    status: Mapped[str] = mapped_column(String(12), default="PENDING")  # PENDING / APPROVED / REJECTED / ORDERED
    remark: Mapped[str] = mapped_column(String(255), default="")
    by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    decided_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    by: Mapped[User] = relationship(foreign_keys=[by_id])
    decider: Mapped[User | None] = relationship(foreign_keys=[decided_by])
    lines: Mapped[list["IndentLine"]] = relationship(cascade="all, delete-orphan")


class IndentLine(Base):
    __tablename__ = "indent_lines"
    id: Mapped[int] = mapped_column(primary_key=True)
    indent_id: Mapped[int] = mapped_column(ForeignKey("indents.id"))
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"))
    qty: Mapped[float] = mapped_column(Float)
    item: Mapped[Item] = relationship()


class PO(Base):
    __tablename__ = "purchase_orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    no: Mapped[str] = mapped_column(String(30), default="")
    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendors.id"))
    indent_id: Mapped[int | None] = mapped_column(ForeignKey("indents.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(12), default="OPEN")  # OPEN / PARTIAL / RECEIVED
    by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    vendor: Mapped[Vendor] = relationship()
    indent: Mapped["Indent | None"] = relationship(foreign_keys=[indent_id])
    by: Mapped[User] = relationship(foreign_keys=[by_id])
    lines: Mapped[list["POLine"]] = relationship(cascade="all, delete-orphan")


class POLine(Base):
    __tablename__ = "po_lines"
    id: Mapped[int] = mapped_column(primary_key=True)
    po_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id"))
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"))
    qty: Mapped[float] = mapped_column(Float)
    rate: Mapped[float] = mapped_column(Float, default=0)
    got: Mapped[float] = mapped_column(Float, default=0)
    item: Mapped[Item] = relationship()


class WriteOff(Base):
    __tablename__ = "writeoffs"
    id: Mapped[int] = mapped_column(primary_key=True)
    no: Mapped[str] = mapped_column(String(30), default="")
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"))
    qty: Mapped[float] = mapped_column(Float)
    reason: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(12), default="PENDING")  # PENDING / APPROVED / REJECTED
    remark: Mapped[str] = mapped_column(String(255), default="")
    by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    decided_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    item: Mapped[Item] = relationship()
    by: Mapped[User] = relationship(foreign_keys=[by_id])
    decider: Mapped[User | None] = relationship(foreign_keys=[decided_by])


class Audit(Base):
    __tablename__ = "audit"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(255))
    at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user: Mapped[User] = relationship()
