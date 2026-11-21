import os
import time
import random
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
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
    from app.db import SessionLocal
    from app.models import Item, Txn, Indent, PO, WriteOff, DocCounter
except ImportError:
    from backend.app.main import app, boot
    from backend.app.db import SessionLocal
    from backend.app.models import Item, Txn, Indent, PO, WriteOff, DocCounter

# Boot the app so migrations and initial seed are executed
boot()
client = TestClient(app)


def login(email, password="demo123"):
    res = client.post("/api/auth/login", data={"username": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    data = res.json()
    token = data["access_token"]
    return {"Authorization": f"Bearer {token}"}, data["user"]


# 1. Health and Readiness Check
def test_health_and_readiness():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert "time" in res.json()

    ready_res = client.get("/api/ready")
    assert ready_res.status_code == 200
    assert ready_res.json() == {"status": "ready", "database": "connected"}


# 2. Auth, Roles, and Rate Limiting
def test_auth_and_rate_limiting():
    # Valid logins for all demo roles
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
        assert me_res.json()["role"] == role

    # Rate limiting: 5 consecutive failures for a specific test email
    test_email = "victim@gbu.demo"
    for i in range(5):
        bad_res = client.post("/api/auth/login", data={"username": test_email, "password": "wrongpassword"})
        assert bad_res.status_code == 401
        assert bad_res.json()["error"]["code"] == "INVALID_CREDENTIALS"

    # 6th attempt should be rate limited (429)
    blocked_res = client.post("/api/auth/login", data={"username": test_email, "password": "wrongpassword"})
    assert blocked_res.status_code == 429
    assert blocked_res.json()["error"]["code"] == "RATE_LIMITED"


# 3. Role Permissions
def test_role_permissions():
    dept_headers, _ = login("dept@gbu.demo")
    store_headers, _ = login("store@gbu.demo")
    dir_headers, _ = login("director@gbu.demo")
    admin_headers, _ = login("admin@gbu.demo")

    # Dept cannot add category (403)
    res = client.post("/api/categories", json={"name": "Forbidden Cat"}, headers=dept_headers)
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN"

    # Dept cannot view POs (403)
    res = client.get("/api/purchase-orders", headers=dept_headers)
    assert res.status_code == 403

    # Dept and Store cannot view audit log (403)
    assert client.get("/api/audit", headers=dept_headers).status_code == 403
    assert client.get("/api/audit", headers=store_headers).status_code == 403

    # Director and Admin can view audit log (200)
    assert client.get("/api/audit", headers=dir_headers).status_code == 200
    assert client.get("/api/audit", headers=admin_headers).status_code == 200


# 4. Concurrency-Safe Stock (20 Parallel Issue Requests)
def test_concurrency_stock_20_parallel_issues():
    store_headers, _ = login("store@gbu.demo")

    # 1. Create a brand new item with exact stock 10
    cat_res = client.get("/api/categories", headers=store_headers)
    cat_id = cat_res.json()[0]["id"]

    item_code = f"CONC-{int(time.time())}"
    create_res = client.post("/api/items", json={
        "code": item_code,
        "name": "Concurrency Test Relay Switch",
        "category_id": cat_id,
        "unit": "pcs",
        "min_stock": 2,
        "price": 250.0,
        "location": "Bench 9",
        "opening_qty": 10
    }, headers=store_headers)
    assert create_res.status_code == 200
    item_id = create_res.json()["id"]

    # 2. Fire 20 concurrent requests each asking for 1 unit
    def fire_issue(_):
        return client.post("/api/stock/issue", json={
            "item_id": item_id,
            "qty": 1,
            "dept": "Robotics Lab",
            "note": "Parallel stress test"
        }, headers=store_headers)

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(fire_issue, range(20)))

    successes = [r for r in results if r.status_code == 200]
    failures = [r for r in results if r.status_code == 400]

    # Exactly 10 must succeed, exactly 10 must fail with INSUFFICIENT_STOCK
    assert len(successes) == 10, f"Expected 10 successes, got {len(successes)}"
    assert len(failures) == 10, f"Expected 10 failures, got {len(failures)}"

    for f in failures:
        assert f.json()["error"]["code"] == "INSUFFICIENT_STOCK"

    # Stock must never be negative, must be exactly 0
    final_item = client.get(f"/api/items/{item_id}", headers=store_headers).json()
    assert final_item["qty"] == 0.0

    # Exactly 10 issue ledger entries + 1 opening entry
    txns = client.get(f"/api/transactions?item_id={item_id}", headers=store_headers).json()["items"]
    assert len(txns) == 11


# 5. Valuation: Weighted Average Cost (WAC) Worked Example
def test_weighted_average_cost_wac():
    store_headers, _ = login("store@gbu.demo")
    cat_id = client.get("/api/categories", headers=store_headers).json()[0]["id"]
    vendor_id = client.get("/api/vendors", headers=store_headers).json()[0]["id"]

    # Step 1: Create item with 10 units @ Rs 100 = Rs 1,000 valuation
    code = f"WAC-{int(time.time())}"
    res = client.post("/api/items", json={
        "code": code,
        "name": "WAC Test Cable Roll",
        "category_id": cat_id,
        "unit": "roll",
        "min_stock": 5,
        "price": 100.0,
        "location": "Rack W1",
        "opening_qty": 10
    }, headers=store_headers)
    assert res.status_code == 200
    item_id = res.json()["id"]
    assert res.json()["price"] == 100.0
    assert res.json()["value"] == 1000.0

    # Step 2: Create Indent -> Approve -> Create PO for 10 units @ Rs 120
    ind_res = client.post("/api/indents", json={
        "dept": "School of Engineering",
        "note": "WAC procurement",
        "lines": [{"item_id": item_id, "qty": 10}]
    }, headers=store_headers)
    ind_id = ind_res.json()["id"]

    dir_headers, _ = login("director@gbu.demo")
    client.post(f"/api/indents/{ind_id}/decision", json={"approve": True, "remark": "Sanctioned"}, headers=dir_headers)

    po_res = client.post("/api/purchase-orders", json={
        "vendor_id": vendor_id,
        "indent_id": ind_id,
        "lines": [{"item_id": item_id, "qty": 10, "rate": 120.0}]
    }, headers=store_headers)
    po_data = po_res.json()
    po_id = po_data["id"]
    po_line_id = po_data["lines"][0]["id"]

    # Step 3: Receive goods (GRN) for 10 units @ Rs 120
    # Expected New WAC: (10 * 100 + 10 * 120) / (10 + 10) = 2200 / 20 = Rs 110.00
    grn_res = client.post(f"/api/purchase-orders/{po_id}/receive", json={
        "lines": [{"line_id": po_line_id, "qty": 10}]
    }, headers=store_headers)
    assert grn_res.status_code == 200

    item_after_grn = client.get(f"/api/items/{item_id}", headers=store_headers).json()
    assert item_after_grn["qty"] == 20.0
    assert item_after_grn["price"] == 110.0
    assert item_after_grn["value"] == 2200.0

    # Check GRN ledger row recorded unit_cost = 120.00
    txns = client.get(f"/api/transactions?item_id={item_id}", headers=store_headers).json()["items"]
    grn_txn = next(t for t in txns if t["kind"] == "IN" and "GRN" in t["note"])
    assert grn_txn["unit_cost"] == 120.0

    # Step 4: Issue 5 units. Valued at current WAC (Rs 110.00)
    issue_res = client.post("/api/stock/issue", json={
        "item_id": item_id,
        "qty": 5,
        "dept": "Civil Lab",
        "note": "Testing issue"
    }, headers=store_headers)
    assert issue_res.status_code == 200
    assert issue_res.json()["qty"] == 15.0
    assert issue_res.json()["price"] == 110.0
    assert issue_res.json()["value"] == 1650.0

    issue_txn = client.get(f"/api/transactions?item_id={item_id}&kind=OUT", headers=store_headers).json()["items"][0]
    assert issue_txn["unit_cost"] == 110.0


# 6. Segregation of Duties
def test_segregation_of_duties():
    dir_headers, dir_user = login("director@gbu.demo")

    # 1. Director raises an indent
    items = client.get("/api/items", headers=dir_headers).json()["items"]
    test_item = items[0]

    ind_res = client.post("/api/indents", json={
        "dept": "Stores & Purchase Office",
        "note": "Director self-requisition",
        "lines": [{"item_id": test_item["id"], "qty": 2}]
    }, headers=dir_headers)
    assert ind_res.status_code == 200
    ind_id = ind_res.json()["id"]

    # 2. Director attempts to approve their own indent -> Must be rejected with 403 SEGREGATION_OF_DUTIES
    self_approve_res = client.post(f"/api/indents/{ind_id}/decision", json={
        "approve": True,
        "remark": "Attempting self-approval"
    }, headers=dir_headers)
    assert self_approve_res.status_code == 403
    assert self_approve_res.json()["error"]["code"] == "SEGREGATION_OF_DUTIES"

    # 3. Store officer raises a write-off
    store_headers, _ = login("store@gbu.demo")
    wo_res = client.post("/api/writeoffs", json={
        "item_id": test_item["id"],
        "qty": 1,
        "reason": "Damaged packing"
    }, headers=store_headers)
    assert wo_res.status_code == 200
    wo_id = wo_res.json()["id"]

    # Even admin cannot approve a proposal they submitted themselves
    admin_headers, _ = login("admin@gbu.demo")
    admin_wo = client.post("/api/writeoffs", json={
        "item_id": test_item["id"],
        "qty": 1,
        "reason": "Admin condemned item"
    }, headers=admin_headers).json()

    admin_self_approve = client.post(f"/api/writeoffs/{admin_wo['id']}/decision", json={
        "approve": True,
        "remark": "Admin self approval attempt"
    }, headers=admin_headers)
    assert admin_self_approve.status_code == 403
    assert admin_self_approve.json()["error"]["code"] == "SEGREGATION_OF_DUTIES"


# 7. Approval Quality & Indent Lifecycle
def test_approval_quality_and_lifecycle():
    dept_headers, dept_user = login("dept@gbu.demo")
    dir_headers, _ = login("director@gbu.demo")
    items = client.get("/api/items", headers=dept_headers).json()["items"]

    # 1. Raise indent with 2 lines (qty 10, qty 20)
    ind = client.post("/api/indents", json={
        "dept": "School of ICT",
        "note": "Partial approval test",
        "lines": [
            {"item_id": items[0]["id"], "qty": 10},
            {"item_id": items[1]["id"], "qty": 20}
        ]
    }, headers=dept_headers).json()
    ind_id = ind["id"]
    line1_id = ind["lines"][0]["id"]
    line2_id = ind["lines"][1]["id"]

    # 2. Requester can cancel their own indent while PENDING
    cancel_res = client.post(f"/api/indents/{ind_id}/cancel", headers=dept_headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"

    # Cannot cancel an already cancelled indent
    assert client.post(f"/api/indents/{ind_id}/cancel", headers=dept_headers).status_code == 400

    # 3. Copy cancelled/rejected indent into new draft
    copy_res = client.post(f"/api/indents/{ind_id}/copy", headers=dept_headers)
    assert copy_res.status_code == 200
    new_ind = copy_res.json()
    assert new_ind["status"] == "PENDING"
    assert new_ind["id"] != ind_id
    assert len(new_ind["lines"]) == 2
    new_l1 = new_ind["lines"][0]["id"]
    new_l2 = new_ind["lines"][1]["id"]

    # 4. Director approves with different approved_qty (line 1: 6/10, line 2: 15/20)
    appr_res = client.post(f"/api/indents/{new_ind['id']}/decision", json={
        "approve": True,
        "remark": "Approved with budgetary cut",
        "line_approvals": [
            {"line_id": new_l1, "approved_qty": 6.0},
            {"line_id": new_l2, "approved_qty": 15.0}
        ]
    }, headers=dir_headers)
    assert appr_res.status_code == 200
    approved_ind = appr_res.json()
    assert approved_ind["lines"][0]["approved_qty"] == 6.0
    assert approved_ind["lines"][1]["approved_qty"] == 15.0


# 8. Document Numbering by Financial Year
def test_indian_financial_year_numbering():
    store_headers, _ = login("store@gbu.demo")
    items = client.get("/api/items", headers=store_headers).json()["items"]

    # Raise indent and verify format: IND/YYYY-YY/XXXX
    ind_res = client.post("/api/indents", json={
        "dept": "School of Management",
        "note": "FY format test",
        "lines": [{"item_id": items[0]["id"], "qty": 5}]
    }, headers=store_headers)
    assert ind_res.status_code == 200
    ind_no = ind_res.json()["no"]
    parts = ind_no.split("/")
    assert len(parts) == 3
    assert parts[0] == "IND"
    assert "-" in parts[1]  # e.g. 2026-27
    assert len(parts[2]) == 4  # e.g. 0003

    # Propose write-off and verify format: WO/YYYY-YY/XXXX
    wo_res = client.post("/api/writeoffs", json={
        "item_id": items[0]["id"],
        "qty": 1,
        "reason": "Expired test reagent"
    }, headers=store_headers)
    assert wo_res.status_code == 200
    assert wo_res.json()["no"].startswith("WO/")


# 9. Ledger Integrity and Reconciliation
def test_ledger_integrity_reconciliation():
    admin_headers, _ = login("admin@gbu.demo")
    store_headers, _ = login("store@gbu.demo")

    # 1. Run integrity check on initial seeded state -> Should be 100% OK with 0 mismatches
    check_res = client.get("/api/admin/integrity-check", headers=admin_headers)
    assert check_res.status_code == 200
    data = check_res.json()
    assert data["status"] == "ok"
    assert len(data["mismatches"]) == 0

    # 2. Run a sequence of 5 random issue and receipt operations
    items = client.get("/api/items", headers=store_headers).json()["items"]
    test_items = [i for i in items if i["qty"] >= 20][:3]

    for item in test_items:
        # Issue 2
        client.post("/api/stock/issue", json={
            "item_id": item["id"],
            "qty": 2,
            "dept": "Random Reconcile Test",
            "note": "Ledger check"
        }, headers=store_headers)

    # 3. Assert zero mismatches again
    recheck = client.get("/api/admin/integrity-check", headers=admin_headers).json()
    assert recheck["status"] == "ok"
    assert len(recheck["mismatches"]) == 0


# 10. Server-Side Pagination, Sorting, and Filtering
def test_server_side_pagination_and_sorting():
    store_headers, _ = login("store@gbu.demo")

    # Items pagination
    p1 = client.get("/api/items?page=1&page_size=5&sort=name&order=asc", headers=store_headers).json()
    assert "items" in p1
    assert "total" in p1
    assert "page" in p1
    assert "page_size" in p1
    assert p1["page"] == 1
    assert p1["page_size"] == 5
    assert len(p1["items"]) == 5

    p2 = client.get("/api/items?page=2&page_size=5&sort=name&order=asc", headers=store_headers).json()
    assert p2["page"] == 2
    assert p2["items"][0]["id"] != p1["items"][0]["id"]

    # Filter items by low stock
    low_res = client.get("/api/items?low=true", headers=store_headers).json()
    for item in low_res["items"]:
        assert item["qty"] <= item["min_stock"]

    # Audit pagination
    dir_headers, _ = login("director@gbu.demo")
    audit_res = client.get("/api/audit?page=1&page_size=10", headers=dir_headers).json()
    assert "items" in audit_res
    assert audit_res["page"] == 1
    assert len(audit_res["items"]) <= 10


# 11. Consistent Error Envelope & Security Headers
def test_error_envelope_and_security_headers():
    store_headers, _ = login("store@gbu.demo")
    res = client.get("/api/items/999999", headers=store_headers)
    # Headers
    assert res.headers["x-content-type-options"] == "nosniff"
    assert res.headers["x-frame-options"] == "DENY"
    assert res.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert "x-request-id" in res.headers

    # Error envelope format: {"error": {"code": ..., "message": ..., "fields": ...}}
    assert res.status_code == 404
    err = res.json()["error"]
    assert err["code"] == "NOT_FOUND"
    assert "not found" in err["message"].lower()
    assert isinstance(err["fields"], dict)


# 12. Notices Flow
def test_notices_flow():
    store_headers, _ = login("store@gbu.demo")
    dept_headers, _ = login("dept@gbu.demo")
    dir_headers, _ = login("director@gbu.demo")

    # 1. Read notices
    res = client.get("/api/notices")
    assert res.status_code == 200
    assert len(res.json()) >= 4

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


# 13. Enterprise Reports & Analytics
def test_enterprise_reports_and_analytics():
    store_headers, _ = login("store@gbu.demo")

    # 1. Historical Stock As-Of
    res = client.get("/api/reports/stock-as-of?date=2026-11-21", headers=store_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_items"] >= 20
    assert data["total_valuation"] > 0
    assert len(data["items"]) >= 20

    # 2. Bin Card / Stock Ledger
    bin_res = client.get("/api/reports/bin-card?item_id=1", headers=store_headers)
    assert bin_res.status_code == 200
    bin_data = bin_res.json()
    assert "item" in bin_data
    assert "opening_balance" in bin_data
    assert "closing_balance" in bin_data
    assert isinstance(bin_data["entries"], list)

    # 3. Department Consumption
    dept_res = client.get("/api/reports/consumption-by-dept?days=90", headers=store_headers)
    assert dept_res.status_code == 200
    dept_data = dept_res.json()
    assert "total_consumption_value" in dept_data
    assert isinstance(dept_data["departments"], list)

    # 4. ABC Pareto Analysis
    abc_res = client.get("/api/reports/abc-analysis", headers=store_headers)
    assert abc_res.status_code == 200
    abc_data = abc_res.json()
    assert abc_data["summary"]["class_a_count"] > 0
    assert abc_data["summary"]["class_b_count"] > 0
    assert abc_data["summary"]["class_c_count"] > 0
    assert abc_data["items"][0]["class"] == "A"

    # 5. Vendor Performance Scorecard
    vendor_res = client.get("/api/reports/vendor-performance", headers=store_headers)
    assert vendor_res.status_code == 200
    vendor_data = vendor_res.json()
    assert vendor_data["total_vendors"] >= 1
    assert "fill_rate_percentage" in vendor_data["vendors"][0]


# 14. AI/ML Stock-Out Forecasting & Procurement Anomaly Detection
def test_ml_stockout_forecast_and_analytics():
    store_headers, _ = login("store@gbu.demo")
    res = client.get("/api/analytics/stock-forecast", headers=store_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_items_analyzed" in data
    assert "forecasts" in data
    assert len(data["forecasts"]) > 0
    first = data["forecasts"][0]
    assert "days_of_supply" in first
    assert "daily_run_rate" in first
    assert "recommended_safety_stock" in first
    assert "economic_order_qty" in first
    assert first["urgency"] in ("STOCKOUT", "CRITICAL", "WARNING", "HEALTHY", "DORMANT")
    assert "confidence_score" in first
    assert "cross_dept_anomalies" in data


if __name__ == "__main__":
    pytest.main(["-v", "backend/test_flows.py"])
