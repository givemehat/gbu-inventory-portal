from datetime import datetime, timedelta, timezone
from .auth import hash_pw
from .models import *

USERS = [
    ("Admin", "admin@gbu.demo", "admin", "IT Cell"),
    ("Store Officer", "store@gbu.demo", "store", "Stores & Purchase"),
    ("Director S&P", "director@gbu.demo", "approver", "Stores & Purchase"),
    ("Dept Staff", "dept@gbu.demo", "dept", "School of ICT"),
]

# code, name, category, unit, min, qty, price, location
ITEMS = [
    ("STN-001", "A4 Paper Ream (500 sheets)", "Stationery", "ream", 40, 180, 285, "Rack A1"),
    ("STN-002", "Ball Pen Blue (box of 50)", "Stationery", "box", 10, 6, 240, "Rack A1"),
    ("STN-003", "Whiteboard Marker (box of 10)", "Stationery", "box", 8, 22, 190, "Rack A2"),
    ("STN-004", "File Folder", "Stationery", "pcs", 100, 340, 18, "Rack A2"),
    ("STN-005", "Stapler Pins (box)", "Stationery", "box", 20, 55, 25, "Rack A3"),
    ("CMP-001", "HDMI Cable 1.5m", "Computer Hardware", "pcs", 10, 14, 220, "Rack B1"),
    ("CMP-002", "USB Keyboard", "Computer Hardware", "pcs", 10, 8, 450, "Rack B1"),
    ("CMP-003", "Optical Mouse", "Computer Hardware", "pcs", 15, 31, 260, "Rack B1"),
    ("CMP-004", "DDR4 RAM 8GB", "Computer Hardware", "pcs", 5, 12, 2400, "Rack B2"),
    ("CMP-005", "Toner Cartridge 12A", "Computer Hardware", "pcs", 6, 4, 3100, "Rack B2"),
    ("LAB-001", "Digital Multimeter", "Lab Consumables", "pcs", 5, 18, 850, "Rack C1"),
    ("LAB-002", "Breadboard 830 pts", "Lab Consumables", "pcs", 20, 64, 120, "Rack C1"),
    ("LAB-003", "Jumper Wire Set", "Lab Consumables", "set", 30, 90, 95, "Rack C2"),
    ("LAB-004", "Solder Wire 100g", "Lab Consumables", "roll", 10, 7, 210, "Rack C2"),
    ("LAB-005", "Isopropyl Alcohol 1L", "Lab Consumables", "btl", 10, 25, 380, "Rack C3"),
    ("ELE-001", "LED Tube Light 18W", "Electrical", "pcs", 30, 120, 160, "Rack D1"),
    ("ELE-002", "Extension Board 5 Socket", "Electrical", "pcs", 15, 40, 350, "Rack D1"),
    ("ELE-003", "MCB 16A", "Electrical", "pcs", 10, 9, 280, "Rack D2"),
    ("ELE-004", "Copper Wire 1.5mm (90m)", "Electrical", "coil", 6, 15, 1850, "Rack D2"),
    ("FUR-001", "Office Chair", "Furniture", "pcs", 5, 11, 4200, "Hall 1"),
    ("FUR-002", "Steel Almirah", "Furniture", "pcs", 2, 3, 9800, "Hall 1"),
    ("FUR-003", "Whiteboard 4x3 ft", "Furniture", "pcs", 3, 2, 2300, "Hall 1"),
    ("CLN-001", "Phenyl 5L", "Cleaning", "can", 20, 48, 310, "Rack E1"),
    ("CLN-002", "Hand Wash 5L", "Cleaning", "can", 15, 11, 420, "Rack E1"),
    ("CLN-003", "Dustbin 20L", "Cleaning", "pcs", 10, 26, 190, "Rack E2"),
]

VENDORS = [
    ("Sharma Stationers, Noida", "9810000001", "sharma@example.com"),
    ("Rajdhani Computers", "9810000002", "rajdhani@example.com"),
    ("Delta Electricals", "9810000003", "delta@example.com"),
    ("Clean Care Supplies", "9810000004", "cleancare@example.com"),
]


def run(db):
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
        i = Item(code=c, name=n, category_id=cats[cat].id, unit=un, min_stock=mn, qty=q, price=pr, location=loc)
        db.add(i)
        objs[c] = i
    db.flush()
    t_start = datetime.now(timezone.utc) - timedelta(days=60)
    # 1. Spread opening stock verification across 60-55 days ago
    for k, (c, i) in enumerate(objs.items()):
        db.add(Txn(item_id=i.id, kind="IN", qty=i.qty, ref="OPENING", note="Physical opening balance verification",
                   user_id=us["store"].id, at=t_start + timedelta(days=k % 5)))

    # 2. Add realistic IN and OUT movements across 8 weeks (net change 0 per item to preserve exact demo quantities)
    movements = [
        # (item_code, kind, qty, days_ago, ref, note)
        ("STN-001", "IN", 40, 52, "PO-2026-0081", "GRN from Sharma Stationers"),
        ("STN-001", "OUT", 20, 47, "ISSUE", "To Examination Cell (Term Exam Papers)"),
        ("STN-001", "OUT", 20, 31, "ISSUE", "To Registrar Office (Annual Reports)"),
        ("STN-003", "IN", 20, 49, "PO-2026-0082", "GRN from Sharma Stationers"),
        ("STN-003", "OUT", 12, 35, "ISSUE", "To School of ICT Classrooms"),
        ("STN-003", "OUT", 8, 14, "ISSUE", "To School of Management Classrooms"),
        ("CMP-001", "IN", 15, 45, "PO-2026-0083", "GRN from Rajdhani Computers"),
        ("CMP-001", "OUT", 15, 28, "ISSUE", "To Smart Classrooms Phase 2"),
        ("CMP-003", "IN", 20, 42, "PO-2026-0084", "GRN from Rajdhani Computers"),
        ("CMP-003", "OUT", 10, 26, "ISSUE", "To Central Computer Centre Lab 3"),
        ("CMP-003", "OUT", 10, 12, "ISSUE", "To Faculty Cubicles Block A"),
        ("LAB-001", "IN", 10, 50, "PO-2026-0085", "GRN from Delta Electricals"),
        ("LAB-001", "OUT", 10, 38, "ISSUE", "To Robotics & IoT Research Lab"),
        ("LAB-002", "IN", 30, 44, "PO-2026-0086", "GRN from Delta Electricals"),
        ("LAB-002", "OUT", 18, 30, "ISSUE", "To Basic Electronics Lab 1"),
        ("LAB-002", "OUT", 12, 16, "ISSUE", "To Student Project Workshop"),
        ("LAB-003", "IN", 40, 40, "PO-2026-0087", "GRN from Delta Electricals"),
        ("LAB-003", "OUT", 25, 24, "ISSUE", "To Digital Signal Processing Lab"),
        ("LAB-003", "OUT", 15, 9, "ISSUE", "To Sensor Networks Lab"),
        ("LAB-005", "IN", 15, 36, "PO-2026-0088", "GRN from Clean Care Supplies"),
        ("LAB-005", "OUT", 15, 20, "ISSUE", "To PCB Cleaning & Chemistry Station"),
        ("ELE-001", "IN", 50, 48, "PO-2026-0089", "GRN from Delta Electricals"),
        ("ELE-001", "OUT", 30, 34, "ISSUE", "To Estate & Maintenance (Library 2F)"),
        ("ELE-001", "OUT", 20, 18, "ISSUE", "To Administrative Block Corridor Lighting"),
        ("ELE-002", "IN", 20, 43, "PO-2026-0090", "GRN from Delta Electricals"),
        ("ELE-002", "OUT", 12, 29, "ISSUE", "To Conference Hall & Syndicate Rooms"),
        ("ELE-002", "OUT", 8, 11, "ISSUE", "To Server Room UPS Backup Lines"),
        ("CLN-001", "IN", 30, 46, "PO-2026-0091", "GRN from Clean Care Supplies"),
        ("CLN-001", "OUT", 18, 32, "ISSUE", "To Girls Hostel 1 & 2 Housekeeping"),
        ("CLN-001", "OUT", 12, 15, "ISSUE", "To Boys Hostel 3 & 4 Housekeeping"),
        ("CLN-002", "IN", 25, 41, "PO-2026-0092", "GRN from Clean Care Supplies"),
        ("CLN-002", "OUT", 15, 27, "ISSUE", "To Main Academic Building Dispensers"),
        ("CLN-002", "OUT", 10, 8, "ISSUE", "To Guest House & Faculty Lounge"),
        ("CLN-003", "IN", 20, 39, "PO-2026-0093", "GRN from Clean Care Supplies"),
        ("CLN-003", "OUT", 12, 22, "ISSUE", "To School of Biotechnology Labs"),
        ("CLN-003", "OUT", 8, 6, "ISSUE", "To Central Library Reading Rooms"),
        ("STN-004", "IN", 100, 37, "PO-2026-0094", "GRN from Sharma Stationers"),
        ("STN-004", "OUT", 60, 19, "ISSUE", "To Dean Office Student File Refill"),
        ("STN-004", "OUT", 40, 5, "ISSUE", "To Admissions Cell 2026"),
        ("STN-005", "IN", 30, 33, "PO-2026-0095", "GRN from Sharma Stationers"),
        ("STN-005", "OUT", 18, 17, "ISSUE", "To Accounts & Dispatch Section"),
        ("STN-005", "OUT", 12, 4, "ISSUE", "To Examination Cell Dispatch"),
    ]

    now_utc = datetime.now(timezone.utc)
    for c, kind, qty, d_ago, ref, note in movements:
        item_obj = objs.get(c)
        if item_obj:
            t_date = now_utc - timedelta(days=d_ago)
            db.add(Txn(item_id=item_obj.id, kind=kind, qty=qty, ref=ref, note=note,
                       user_id=us["store"].id, at=t_date))
    # one pending indent, one approved indent with an open PO, one pending write-off
    a = Indent(dept="School of ICT", note="Lab refill for next semester", by_id=us["dept"].id)
    a.lines = [IndentLine(item_id=objs["LAB-004"].id, qty=20), IndentLine(item_id=objs["CMP-002"].id, qty=15)]
    b = Indent(dept="Admin Block", note="Printer toners", by_id=us["store"].id, status="ORDERED", decided_by=us["approver"].id, remark="Approved")
    b.lines = [IndentLine(item_id=objs["CMP-005"].id, qty=10)]
    db.add_all([a, b])
    db.flush()
    a.no, b.no = f"IND-{a.at.year}-{a.id:04d}", f"IND-{b.at.year}-{b.id:04d}"
    p = PO(vendor_id=vs[1].id, indent_id=b.id, by_id=us["store"].id)
    p.lines = [POLine(item_id=objs["CMP-005"].id, qty=10, rate=3050)]
    db.add(p)
    w = WriteOff(item_id=objs["STN-002"].id, qty=2, reason="Ink dried, boxes damaged by moisture", by_id=us["store"].id)
    db.add(w)
    db.flush()
    p.no, w.no = f"PO-{p.at.year}-{p.id:04d}", f"WO-{w.at.year}-{w.id:04d}"
    db.add(Audit(user_id=us["admin"].id, action="System initialized with standard master data", at=t_start))
    db.add(Audit(user_id=us["store"].id, action="Verified opening stock for 25 store items", at=t_start))
    db.add(Audit(user_id=us["dept"].id, action=f"Raised indent {a.no} (School of ICT)", at=a.at))
    db.add(Audit(user_id=us["store"].id, action=f"Raised indent {b.no} (Admin Block)", at=b.at))
    db.add(Audit(user_id=us["approver"].id, action=f"APPROVED indent {b.no}", at=b.at))
    db.add(Audit(user_id=us["store"].id, action=f"Created purchase order {p.no} for Rajdhani Computers", at=p.at))
    db.add(Audit(user_id=us["store"].id, action=f"Requested write-off {w.no} for damaged goods", at=w.at))
    db.commit()
