import os
import sys
import argparse
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy import select, delete

from .auth import hash_pw
from .db import engine, SessionLocal, Base
from .models import (
    User, Category, Item, Vendor, Txn, Indent, IndentLine, PO, POLine,
    WriteOff, Audit, Notice, DocCounter, utcnow
)

USERS = [
    ("Admin", "admin@gbu.demo", "admin", "IT Cell"),
    ("Store Officer", "store@gbu.demo", "store", "Stores & Purchase"),
    ("Director S&P", "director@gbu.demo", "approver", "Stores & Purchase"),
    ("Dept Staff", "dept@gbu.demo", "dept", "School of ICT"),
]

# code, name, category, unit, min, qty, price, location
ITEMS = [
    ("STN-001", "A4 Paper Ream (500 sheets)", "Stationery", "ream", 40, 180, 285.00, "Rack A1"),
    ("STN-002", "Ball Pen Blue (box of 50)", "Stationery", "box", 10, 6, 240.00, "Rack A1"),
    ("STN-003", "Whiteboard Marker (box of 10)", "Stationery", "box", 8, 22, 190.00, "Rack A2"),
    ("STN-004", "File Folder", "Stationery", "pcs", 100, 340, 18.00, "Rack A2"),
    ("STN-005", "Stapler Pins (box)", "Stationery", "box", 20, 55, 25.00, "Rack A3"),
    ("CMP-001", "HDMI Cable 1.5m", "Computer Hardware", "pcs", 10, 14, 220.00, "Rack B1"),
    ("CMP-002", "USB Keyboard", "Computer Hardware", "pcs", 10, 8, 450.00, "Rack B1"),
    ("CMP-003", "Optical Mouse", "Computer Hardware", "pcs", 15, 31, 260.00, "Rack B1"),
    ("CMP-004", "DDR4 RAM 8GB", "Computer Hardware", "pcs", 5, 12, 2400.00, "Rack B2"),
    ("CMP-005", "Toner Cartridge 12A", "Computer Hardware", "pcs", 6, 4, 3100.00, "Rack B2"),
    ("LAB-001", "Digital Multimeter", "Lab Consumables", "pcs", 5, 18, 850.00, "Rack C1"),
    ("LAB-002", "Breadboard 830 pts", "Lab Consumables", "pcs", 20, 64, 120.00, "Rack C1"),
    ("LAB-003", "Jumper Wire Set", "Lab Consumables", "set", 30, 90, 95.00, "Rack C2"),
    ("LAB-004", "Solder Wire 100g", "Lab Consumables", "roll", 10, 7, 210.00, "Rack C2"),
    ("LAB-005", "Isopropyl Alcohol 1L", "Lab Consumables", "btl", 10, 25, 380.00, "Rack C3"),
    ("ELE-001", "LED Tube Light 18W", "Electrical", "pcs", 30, 120, 160.00, "Rack D1"),
    ("ELE-002", "Extension Board 5 Socket", "Electrical", "pcs", 15, 40, 350.00, "Rack D1"),
    ("ELE-003", "MCB 16A", "Electrical", "pcs", 10, 9, 280.00, "Rack D2"),
    ("ELE-004", "Copper Wire 1.5mm (90m)", "Electrical", "coil", 6, 15, 1850.00, "Rack D2"),
    ("FUR-001", "Office Chair", "Furniture", "pcs", 5, 11, 4200.00, "Hall 1"),
    ("FUR-002", "Steel Almirah", "Furniture", "pcs", 2, 3, 9800.00, "Hall 1"),
    ("FUR-003", "Whiteboard 4x3 ft", "Furniture", "pcs", 3, 2, 2300.00, "Hall 1"),
    ("CLN-001", "Phenyl 5L", "Cleaning", "can", 20, 48, 310.00, "Rack E1"),
    ("CLN-002", "Hand Wash 5L", "Cleaning", "can", 15, 11, 420.00, "Rack E1"),
    ("CLN-003", "Dustbin 20L", "Cleaning", "pcs", 10, 26, 190.00, "Rack E2"),
]

VENDORS = [
    ("Sharma Stationers, Noida", "9810000001", "sharma@example.com"),
    ("Rajdhani Computers", "9810000002", "rajdhani@example.com"),
    ("Delta Electricals", "9810000003", "delta@example.com"),
    ("Clean Care Supplies", "9810000004", "cleancare@example.com"),
]


def clean_database(db):
    """Clean all tables in reverse dependency order."""
    for model in [
        Audit, Notice, Txn, POLine, PO, IndentLine, Indent, WriteOff,
        DocCounter, Item, Vendor, Category, User
    ]:
        db.execute(delete(model))
    db.commit()


def run(db, reset: bool = False, force: bool = False):
    is_prod = os.getenv("ENV", "").lower() in ("production", "prod")
    if reset:
        if is_prod and not force:
            raise RuntimeError(
                "Refusing to reset database in production environment without --force."
            )
        print("Resetting database...")
        clean_database(db)

    # Check if already seeded
    existing_user_count = db.scalar(select(User.id).limit(1))
    if existing_user_count and not reset:
        print("Database already has records; skipping seed.")
        return

    us = {}
    for n, e, r, d in USERS:
        u = User(name=n, email=e, pw=hash_pw("demo123"), role=r, dept=d)
        db.add(u)
        us[r] = u

    cats = {n: Category(name=n) for n in sorted({i[2] for i in ITEMS})}
    db.add_all(cats.values())

    vs = [Vendor(name=n, phone=p, email=e) for n, p, e in VENDORS]
    db.add_all(vs)
    db.flush()

    objs = {}
    for c, n, cat, un, mn, q, pr, loc in ITEMS:
        i = Item(
            code=c,
            name=n,
            category_id=cats[cat].id,
            unit=un,
            min_stock=Decimal(str(mn)),
            qty=Decimal(str(q)),
            price=Decimal(str(pr)),
            location=loc
        )
        db.add(i)
        objs[c] = i
    db.flush()

    t_start = utcnow() - timedelta(days=60)

    # 1. Spread opening stock verification across 60-55 days ago
    for k, (c, i) in enumerate(objs.items()):
        db.add(Txn(
            item_id=i.id,
            kind="IN",
            qty=i.qty,
            unit_cost=i.price,
            ref="OPENING",
            note="Physical opening balance verification",
            user_id=us["store"].id,
            at=t_start + timedelta(days=k % 5)
        ))

    # 2. Add realistic IN and OUT movements across 8 weeks (net change 0 per item to preserve exact demo quantities)
    movements = [
        # (item_code, kind, qty, days_ago, ref, note)
        ("STN-001", "IN", 40, 52, "PO/2026-27/0081", "GRN from Sharma Stationers"),
        ("STN-001", "OUT", 20, 47, "ISSUE", "To Examination Cell (Term Exam Papers)"),
        ("STN-001", "OUT", 20, 31, "ISSUE", "To Registrar Office (Annual Reports)"),
        ("STN-003", "IN", 20, 49, "PO/2026-27/0082", "GRN from Sharma Stationers"),
        ("STN-003", "OUT", 12, 35, "ISSUE", "To School of ICT Classrooms"),
        ("STN-003", "OUT", 8, 14, "ISSUE", "To School of Management Classrooms"),
        ("CMP-001", "IN", 15, 45, "PO/2026-27/0083", "GRN from Rajdhani Computers"),
        ("CMP-001", "OUT", 15, 28, "ISSUE", "To Smart Classrooms Phase 2"),
        ("CMP-003", "IN", 20, 42, "PO/2026-27/0084", "GRN from Rajdhani Computers"),
        ("CMP-003", "OUT", 10, 26, "ISSUE", "To Central Computer Centre Lab 3"),
        ("CMP-003", "OUT", 10, 12, "ISSUE", "To Faculty Cubicles Block A"),
        ("LAB-001", "IN", 10, 50, "PO/2026-27/0085", "GRN from Delta Electricals"),
        ("LAB-001", "OUT", 10, 38, "ISSUE", "To Robotics & IoT Research Lab"),
        ("LAB-002", "IN", 30, 44, "PO/2026-27/0086", "GRN from Delta Electricals"),
        ("LAB-002", "OUT", 18, 30, "ISSUE", "To Basic Electronics Lab 1"),
        ("LAB-002", "OUT", 12, 16, "ISSUE", "To Student Project Workshop"),
        ("LAB-003", "IN", 40, 40, "PO/2026-27/0087", "GRN from Delta Electricals"),
        ("LAB-003", "OUT", 25, 24, "ISSUE", "To Digital Signal Processing Lab"),
        ("LAB-003", "OUT", 15, 9, "ISSUE", "To Sensor Networks Lab"),
        ("LAB-005", "IN", 15, 36, "PO/2026-27/0088", "GRN from Clean Care Supplies"),
        ("LAB-005", "OUT", 15, 20, "ISSUE", "To PCB Cleaning & Chemistry Station"),
        ("ELE-001", "IN", 50, 48, "PO/2026-27/0089", "GRN from Delta Electricals"),
        ("ELE-001", "OUT", 30, 34, "ISSUE", "To Estate & Maintenance (Library 2F)"),
        ("ELE-001", "OUT", 20, 18, "ISSUE", "To Administrative Block Corridor Lighting"),
        ("ELE-002", "IN", 20, 43, "PO/2026-27/0090", "GRN from Delta Electricals"),
        ("ELE-002", "OUT", 12, 29, "ISSUE", "To Conference Hall & Syndicate Rooms"),
        ("ELE-002", "OUT", 8, 11, "ISSUE", "To Server Room UPS Backup Lines"),
        ("CLN-001", "IN", 30, 46, "PO/2026-27/0091", "GRN from Clean Care Supplies"),
        ("CLN-001", "OUT", 18, 32, "ISSUE", "To Girls Hostel 1 & 2 Housekeeping"),
        ("CLN-001", "OUT", 12, 15, "ISSUE", "To Boys Hostel 3 & 4 Housekeeping"),
        ("CLN-002", "IN", 25, 41, "PO/2026-27/0092", "GRN from Clean Care Supplies"),
        ("CLN-002", "OUT", 15, 27, "ISSUE", "To Main Academic Building Dispensers"),
        ("CLN-002", "OUT", 10, 8, "ISSUE", "To Guest House & Faculty Lounge"),
        ("CLN-003", "IN", 20, 39, "PO/2026-27/0093", "GRN from Clean Care Supplies"),
        ("CLN-003", "OUT", 12, 22, "ISSUE", "To School of Biotechnology Labs"),
        ("CLN-003", "OUT", 8, 6, "ISSUE", "To Central Library Reading Rooms"),
        ("STN-004", "IN", 100, 37, "PO/2026-27/0094", "GRN from Sharma Stationers"),
        ("STN-004", "OUT", 60, 19, "ISSUE", "To Dean Office Student File Refill"),
        ("STN-004", "OUT", 40, 5, "ISSUE", "To Admissions Cell 2026"),
        ("STN-005", "IN", 30, 33, "PO/2026-27/0095", "GRN from Sharma Stationers"),
        ("STN-005", "OUT", 18, 17, "ISSUE", "To Accounts & Dispatch Section"),
        ("STN-005", "OUT", 12, 4, "ISSUE", "To Examination Cell Dispatch"),
    ]

    now_utc = utcnow()
    for c, kind, q, d_ago, ref, note in movements:
        item_obj = objs.get(c)
        if item_obj:
            t_date = now_utc - timedelta(days=d_ago)
            db.add(Txn(
                item_id=item_obj.id,
                kind=kind,
                qty=Decimal(str(q)),
                unit_cost=item_obj.price,
                ref=ref,
                note=note,
                user_id=us["store"].id,
                at=t_date
            ))

    # 1 Pending Indent: IND/2026-27/0001
    a = Indent(
        no="IND/2026-27/0001",
        dept="School of ICT",
        note="Lab refill for next semester",
        by_id=us["dept"].id,
        status="PENDING",
        at=now_utc - timedelta(days=3)
    )
    a.lines = [
        IndentLine(item_id=objs["LAB-004"].id, qty=Decimal("20.000")),
        IndentLine(item_id=objs["CMP-002"].id, qty=Decimal("15.000"))
    ]

    # 1 Approved Indent (ordered)
    b = Indent(
        no="IND/2026-27/0002",
        dept="Admin Block",
        note="Printer toners",
        by_id=us["store"].id,
        status="ORDERED",
        decided_by=us["approver"].id,
        remark="Approved under store grant",
        at=now_utc - timedelta(days=8)
    )
    b.lines = [
        IndentLine(item_id=objs["CMP-005"].id, qty=Decimal("10.000"), approved_qty=Decimal("10.000"))
    ]
    db.add_all([a, b])
    db.flush()

    # 1 Open Purchase Order: PO/2026-27/0001
    p = PO(
        no="PO/2026-27/0001",
        vendor_id=vs[1].id,
        indent_id=b.id,
        by_id=us["store"].id,
        status="OPEN",
        at=now_utc - timedelta(days=7)
    )
    p.lines = [
        POLine(item_id=objs["CMP-005"].id, qty=Decimal("10.000"), rate=Decimal("3050.00"), got=Decimal("0.000"))
    ]
    db.add(p)

    # 1 Pending Write-Off: WO/2026-27/0001
    w = WriteOff(
        no="WO/2026-27/0001",
        item_id=objs["STN-002"].id,
        qty=Decimal("2.000"),
        reason="Ink dried, boxes damaged by moisture during monsoon",
        by_id=us["store"].id,
        status="PENDING",
        at=now_utc - timedelta(days=2)
    )
    db.add(w)
    db.flush()

    # Set up DocCounters
    db.add_all([
        DocCounter(doc_type="IND", fin_year="2026-27", last_val=2),
        DocCounter(doc_type="PO", fin_year="2026-27", last_val=1),
        DocCounter(doc_type="WO", fin_year="2026-27", last_val=1),
        DocCounter(doc_type="GRN", fin_year="2026-27", last_val=0),
    ])

    # Initial Audits
    db.add(Audit(user_id=us["admin"].id, action="System initialized with standard master data", at=t_start))
    db.add(Audit(user_id=us["store"].id, action="Verified opening stock for 25 store items", at=t_start))
    db.add(Audit(user_id=us["dept"].id, action=f"Raised indent {a.no} (School of ICT)", at=a.at))
    db.add(Audit(user_id=us["store"].id, action=f"Raised indent {b.no} (Admin Block)", at=b.at))
    db.add(Audit(user_id=us["approver"].id, action=f"APPROVED indent {b.no}", at=b.at))
    db.add(Audit(user_id=us["store"].id, action=f"Created purchase order {p.no} for Rajdhani Computers", at=p.at))
    db.add(Audit(user_id=us["store"].id, action=f"Requested write-off {w.no} for damaged goods", at=w.at))

    # Sample circulars / notices
    sample_notices = [
        Notice(
            title="Annual Physical Stock Verification Commences 1 Dec 2026",
            content="All Schools, Centres of Excellence, and administrative sections are requested to keep their stock registers updated. The University Audit Committee will inspect physical balances starting 1st December 2026.",
            ref_no="GBU/S&P/2026/NOT-084",
            by="Director, Stores & Purchase",
            at=now_utc - timedelta(days=2)
        ),
        Notice(
            title="Deadline for End-Semester Material Requisitions: 15 Dec 2026",
            content="To ensure timely procurement and delivery before semester-end examinations, all academic departments must submit their consumable and lab requisitions via the portal by 15th December 2026.",
            ref_no="GBU/S&P/2026/NOT-085",
            by="Store Officer",
            at=now_utc - timedelta(days=5)
        ),
        Notice(
            title="Empanelment of University Rate-Contract Vendors for FY 2026-27",
            content="Approved rate contracts for stationery, laboratory reagents, computer hardware, and electrical fittings are active. All purchase orders will adhere strictly to negotiated university rates.",
            ref_no="GBU/S&P/2026/NOT-081",
            by="Stores & Purchase Committee",
            at=now_utc - timedelta(days=12)
        ),
        Notice(
            title="Condemnation & Disposal Protocol for Obsolete IT Equipment",
            content="Schools possessing unserviceable computers, printers, or lab electronics must submit formal Write-off proposals through the portal for board inspection before 20th December 2026.",
            ref_no="GBU/S&P/2026/NOT-078",
            by="Director, Stores & Purchase",
            at=now_utc - timedelta(days=18)
        )
    ]
    db.add_all(sample_notices)
    db.commit()
    print("Database seeding completed successfully.")


def main():
    parser = argparse.ArgumentParser(description="GBU Inventory Database Seeder")
    parser.add_argument("--reset", action="store_true", help="Reset all data and reseed database")
    parser.add_argument("--force", action="store_true", help="Force reset in production environment")
    args = parser.parse_args()

    with SessionLocal() as db:
        try:
            run(db, reset=args.reset, force=args.force)
        except Exception as e:
            print(f"Error seeding database: {e}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
