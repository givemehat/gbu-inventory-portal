import os, time
import pytest

# Ensure tests use an isolated test sqlite db
TEST_DB = "test_inv.db"
if os.path.exists(TEST_DB):
    try:
        os.remove(TEST_DB)
    except Exception:
        pass
os.environ["DATABASE_URL"] = f"sqlite:///./{TEST_DB}"

from fastapi.testclient import TestClient

try:
    from app.main import app, boot
except ImportError:
    from backend.app.main import app, boot

# Boot the app so tables and seed data are initialized
boot()
client = TestClient(app)

def login(email, password="demo123"):
    res = client.post("/api/auth/login", data={"username": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    data = res.json()
    token = data["access_token"]
    return {"Authorization": f"Bearer {token}"}, data["user"]

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"ok": True}

def test_auth():
    # Test valid logins for all 4 roles
    for email, role in [
        ("admin@gbu.demo", "admin"),
        ("store@gbu.demo", "store"),
        ("director@gbu.demo", "approver"),
        ("dept@gbu.demo", "dept"),
    ]:
        headers, user = login(email)
        assert user["role"] == role
        me_res = client.get("/api/auth/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] if "email" in me_res.json() else me_res.json()["role"] == role

    # Test invalid password
    bad_res = client.post("/api/auth/login", data={"username": "store@gbu.demo", "password": "wrongpassword"})
    assert bad_res.status_code == 401

def test_role_permissions():
    dept_headers, _ = login("dept@gbu.demo")
    store_headers, _ = login("store@gbu.demo")
    dir_headers, _ = login("director@gbu.demo")
    admin_headers, _ = login("admin@gbu.demo")

    # Dept cannot add category (403)
    res = client.post("/api/categories", json={"name": "Forbidden Cat"}, headers=dept_headers)
    assert res.status_code == 403

    # Dept cannot view POs (403)
    res = client.get("/api/purchase-orders", headers=dept_headers)
    assert res.status_code == 403

    # Dept cannot view audit log (403)
    res = client.get("/api/audit", headers=dept_headers)
    assert res.status_code == 403

    # Store cannot view audit log (403)
    res = client.get("/api/audit", headers=store_headers)
    assert res.status_code == 403

    # Director can view audit log (200)
    res = client.get("/api/audit", headers=dir_headers)
    assert res.status_code == 200
    assert len(res.json()) > 0

    # Admin can view audit log (200)
    res = client.get("/api/audit", headers=admin_headers)
    assert res.status_code == 200

def test_stores_flow():
    store_headers, _ = login("store@gbu.demo")

    # 1. Get categories
    cats = client.get("/api/categories", headers=store_headers).json()
    assert len(cats) >= 6
    cat_id = cats[0]["id"]

    # 2. Add an item
    new_code = "TEST-ITEM-001"
    res = client.post("/api/items", json={
        "code": new_code,
        "name": "Testing Multimeter Probe",
        "category_id": cat_id,
        "unit": "pcs",
        "min_stock": 5,
        "price": 150.0,
        "location": "Test Bin 1",
        "opening_qty": 20
    }, headers=store_headers)
    assert res.status_code == 200, res.text
    item_data = res.json()
    item_id = item_data["id"]
    assert item_data["qty"] == 20

    # 3. Duplicate code rejection (400)
    dup_res = client.post("/api/items", json={
        "code": new_code,
        "name": "Duplicate Code Item",
        "category_id": cat_id,
        "unit": "pcs",
        "min_stock": 5,
        "price": 100,
        "location": "Test Bin 2",
        "opening_qty": 5
    }, headers=store_headers)
    assert dup_res.status_code == 400

    # 4. Get single item
    get_item_res = client.get(f"/api/items/{item_id}", headers=store_headers)
    assert get_item_res.status_code == 200
    assert get_item_res.json()["code"] == new_code

    # 5. Issue stock
    issue_res = client.post("/api/stock/issue", json={
        "item_id": item_id,
        "qty": 5,
        "dept": "School of Engineering",
        "note": "For electronics lab"
    }, headers=store_headers)
    assert issue_res.status_code == 200
    assert issue_res.json()["qty"] == 15

    # 6. Reject over-issuing (cannot issue 25 when only 15 available)
    over_res = client.post("/api/stock/issue", json={
        "item_id": item_id,
        "qty": 25,
        "dept": "School of Engineering",
        "note": "Too much"
    }, headers=store_headers)
    assert over_res.status_code == 400
    assert "Only 15" in over_res.text or "stock" in over_res.text

    # 7. Check ledger transactions for this item
    txns_res = client.get(f"/api/transactions?item_id={item_id}", headers=store_headers)
    assert txns_res.status_code == 200
    txns = txns_res.json()
    assert len(txns) == 2  # OPENING (IN) and ISSUE (OUT)
    assert txns[0]["kind"] == "OUT"
    assert txns[1]["kind"] == "IN"

def test_procurement_flow():
    dept_headers, _ = login("dept@gbu.demo")
    dir_headers, _ = login("director@gbu.demo")
    store_headers, _ = login("store@gbu.demo")

    # 1. Dept raises an indent
    items = client.get("/api/items", headers=dept_headers).json()
    item1 = items[0]
    item2 = items[1]
    indent_res = client.post("/api/indents", json={
        "dept": "School of ICT",
        "note": "Urgent semester exam requirement",
        "lines": [
            {"item_id": item1["id"], "qty": 10},
            {"item_id": item2["id"], "qty": 5}
        ]
    }, headers=dept_headers)
    assert indent_res.status_code == 200
    indent_data = indent_res.json()
    indent_id = indent_data["id"]
    assert indent_data["status"] == "PENDING"
    assert indent_data["no"].startswith("IND-")

    # 2. Dept sees only their own indents
    dept_indents = client.get("/api/indents", headers=dept_headers).json()
    for ind in dept_indents:
        assert ind["by"] == "Dept Staff"

    # 3. Store cannot create PO from pending indent (must be APPROVED)
    vendors = client.get("/api/vendors", headers=store_headers).json()
    vendor_id = vendors[0]["id"]
    bad_po_res = client.post("/api/purchase-orders", json={
        "vendor_id": vendor_id,
        "indent_id": indent_id,
        "lines": [{"item_id": item1["id"], "qty": 10, "rate": 250}]
    }, headers=store_headers)
    assert bad_po_res.status_code == 400

    # 4. Director approves the indent
    dec_res = client.post(f"/api/indents/{indent_id}/decision", json={
        "approve": True,
        "remark": "Approved as per budget sanction"
    }, headers=dir_headers)
    assert dec_res.status_code == 200
    assert dec_res.json()["status"] == "APPROVED"

    # 5. Store creates PO against the approved indent
    po_res = client.post("/api/purchase-orders", json={
        "vendor_id": vendor_id,
        "indent_id": indent_id,
        "lines": [
            {"item_id": item1["id"], "qty": 10, "rate": 260.0},
            {"item_id": item2["id"], "qty": 5, "rate": 210.0}
        ]
    }, headers=store_headers)
    assert po_res.status_code == 200
    po_data = po_res.json()
    po_id = po_data["id"]
    assert po_data["status"] == "OPEN"
    assert po_data["no"].startswith("PO-")
    po_line1 = po_data["lines"][0]
    po_line2 = po_data["lines"][1]

    # Verify indent is now ORDERED
    chk_indent = client.get(f"/api/indents/{indent_id}", headers=store_headers).json()
    assert chk_indent["status"] == "ORDERED"

    # 6. GRN: Partial receive goods (receive line 1 got 4/10)
    initial_qty = client.get(f"/api/items/{item1['id']}", headers=store_headers).json()["qty"]
    grn_res = client.post(f"/api/purchase-orders/{po_id}/receive", json={
        "lines": [{"line_id": po_line1["id"], "qty": 4}]
    }, headers=store_headers)
    assert grn_res.status_code == 200
    po_partial = grn_res.json()
    assert po_partial["status"] == "PARTIAL"

    # Check stock increased by 4 and rate updated
    updated_item1 = client.get(f"/api/items/{item1['id']}", headers=store_headers).json()
    assert updated_item1["qty"] == initial_qty + 4
    assert updated_item1["price"] == 260.0

    # 7. Reject receiving more than ordered
    over_grn = client.post(f"/api/purchase-orders/{po_id}/receive", json={
        "lines": [{"line_id": po_line1["id"], "qty": 10}] # only 6 pending!
    }, headers=store_headers)
    assert over_grn.status_code == 400

    # 8. Receive remaining quantities (line 1: 6, line 2: 5)
    full_grn = client.post(f"/api/purchase-orders/{po_id}/receive", json={
        "lines": [
            {"line_id": po_line1["id"], "qty": 6},
            {"line_id": po_line2["id"], "qty": 5}
        ]
    }, headers=store_headers)
    assert full_grn.status_code == 200
    assert full_grn.json()["status"] == "RECEIVED"

def test_writeoff_flow():
    store_headers, _ = login("store@gbu.demo")
    dir_headers, _ = login("director@gbu.demo")

    items = client.get("/api/items", headers=store_headers).json()
    test_item = next(i for i in items if i["qty"] >= 5)
    item_id = test_item["id"]
    orig_qty = test_item["qty"]

    # 1. Request write-off
    wo_res = client.post("/api/writeoffs", json={
        "item_id": item_id,
        "qty": 2,
        "reason": "Water leakage in stores room"
    }, headers=store_headers)
    assert wo_res.status_code == 200
    wo_data = wo_res.json()
    wo_id = wo_data["id"]
    assert wo_data["status"] == "PENDING"
    assert wo_data["no"].startswith("WO-")

    # Verify stock has NOT decreased yet!
    chk_item = client.get(f"/api/items/{item_id}", headers=store_headers).json()
    assert chk_item["qty"] == orig_qty

    # 2. Store cannot approve write-off (403)
    bad_dec = client.post(f"/api/writeoffs/{wo_id}/decision", json={
        "approve": True,
        "remark": "Trying to self-approve"
    }, headers=store_headers)
    assert bad_dec.status_code == 403

    # 3. Director approves write-off
    dir_dec = client.post(f"/api/writeoffs/{wo_id}/decision", json={
        "approve": True,
        "remark": "Inspected and written off"
    }, headers=dir_headers)
    assert dir_dec.status_code == 200
    assert dir_dec.json()["status"] == "APPROVED"

    # Verify stock reduced by 2 now
    final_item = client.get(f"/api/items/{item_id}", headers=store_headers).json()
    assert final_item["qty"] == orig_qty - 2

    # Verify ledger entry for WRITEOFF
    txns = client.get(f"/api/transactions?item_id={item_id}&kind=WRITEOFF", headers=store_headers).json()
    assert len(txns) >= 1
    assert txns[0]["ref"] == wo_data["no"]

def test_dashboard_and_reports():
    store_headers, _ = login("store@gbu.demo")

    # Dashboard check
    dash = client.get("/api/dashboard", headers=store_headers).json()
    assert "total_items" in dash
    assert "stock_value" in dash
    assert "low_stock" in dash
    assert "low_stock_count" in dash
    assert "pending_indents" in dash
    assert "pending_writeoffs" in dash
    assert "open_pos" in dash
    assert "value_by_category" in dash
    assert "flow_30d" in dash
    assert "movement_30d" in dash
    assert len(dash["movement_30d"]) == 30

    # Stock CSV report check
    stock_csv = client.get("/api/reports/stock.csv", headers=store_headers)
    assert stock_csv.status_code == 200
    assert "text/csv" in stock_csv.headers["content-type"]
    assert "Code,Item,Category,Unit,Qty,Min,Price,Value,Location" in stock_csv.text

    # Transactions CSV report check
    txn_csv = client.get("/api/reports/transactions.csv", headers=store_headers)
    assert txn_csv.status_code == 200
    assert "text/csv" in txn_csv.headers["content-type"]
    assert "Date,Item,Type,Qty,Ref,Note,By" in txn_csv.text

def test_notices_flow():
    store_headers, _ = login("store@gbu.demo")
    dept_headers, _ = login("dept@gbu.demo")
    dir_headers, _ = login("director@gbu.demo")

    # 1. Anyone can read notices
    res = client.get("/api/notices")
    assert res.status_code == 200
    notices = res.json()
    assert len(notices) >= 4

    # 2. Dept cannot publish notice (403)
    bad_post = client.post("/api/notices", json={
        "title": "Unauthorized notice",
        "content": "Trying to post notice"
    }, headers=dept_headers)
    assert bad_post.status_code == 403

    # 3. Store officer can publish notice
    post_res = client.post("/api/notices", json={
        "title": "Test Circular on Office Stationery",
        "content": "All requests must be submitted online through the portal.",
        "ref_no": "GBU/TEST/001"
    }, headers=store_headers)
    assert post_res.status_code == 200
    created = post_res.json()
    assert created["title"] == "Test Circular on Office Stationery"

    # 4. Director can delete notice
    del_res = client.delete(f"/api/notices/{created['id']}", headers=dir_headers)
    assert del_res.status_code == 200

if __name__ == "__main__":
    pytest.main(["-v", "backend/test_flows.py"])
