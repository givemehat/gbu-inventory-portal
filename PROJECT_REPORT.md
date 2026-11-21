# Gautam Buddha University (GBU)
## Stores & Purchase (S&P) Department — Central Inventory Management System
### Comprehensive Technical Project Report

**Author:** Senior Full-Stack Engineer Candidate  
**Target Organization:** Gautam Buddha University, Greater Noida, UP  
**Presentation Date:** 24 November 2026  
**System Version:** 1.0 (Working Demo Prototype)  

---

### 1. Executive Summary & Problem Statement

The Stores & Purchase (S&P) Department at Gautam Buddha University manages thousands of consumable and capital inventory items across 8 academic schools (ICT, Engineering, Biotechnology, Management, Humanities, Vocational Studies, Law) and multiple administrative divisions (Registrar Office, Examination Cell, Central Library, CCC). 

Historically, store requisition, procurement sanctions, and physical asset condemnations relied on manual paper registers, leading to:
- **Discrepancies in Stock Ledger:** Lack of real-time outward deduction allowing accidental negative inventory balances.
- **Uncoordinated Procurement:** Purchase orders raised without formal administrative requisition approval, complicating university audit compliance.
- **Delayed Condemnations:** Damaged, expired, or unserviceable goods lingering indefinitely in store books without formal sanction.
- **Audit Deficits:** Inability to immediately produce immutable chronologies of storekeeper dispatches and administrative decisions.

**The Solution:** A unified, role-governed web portal engineered specifically for GBU’s operational hierarchy. The system provides real-time stock ledger accounting, multi-line requisition (indent) workflows, formal purchase order lifecycle with partial Goods Receipt Notes (GRN), and a material write-off protocol where assets are reduced strictly upon Director sanction.

---

### 2. System Architecture & High-Level Design

The portal is architected using a decoupled client-server model optimized for cloud deployment and zero infrastructure cost on modern developer tiers.

```
+-----------------------------------------------------------------------------------+
|                           CLIENT TIER (Vercel Edge CDN)                           |
|  React 18 + Vite + Tailwind CSS + React Router + Recharts + Lucide UI             |
|                                                                                   |
|  [ Store Officer UI ]   [ Director (S&P) UI ]   [ Dept Staff UI ]  [ Admin UI ]   |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / JSON Web Token (JWT Bearer)
                                           v
+-----------------------------------------------------------------------------------+
|                     APPLICATION SERVER TIER (Render Cloud PaaS)                   |
|                     Python 3.14 + FastAPI + Pydantic v2                           |
|                                                                                   |
|  * Token Auth Service (12h Expiry, Bcrypt Hashing, Role Guards)                   |
|  * Stores & Stock Ledger Engine (Opening, IN, OUT, WRITEOFF ledger txns)          |
|  * Procurement Engine (Requisition -> Director Sanction -> PO -> Partial GRN)    |
|  * Material Condemnation Engine (Director Sanction Gated Deductions)              |
|  * Automated Audit Logger (Actor, Action, UTC Timestamp)                          |
+------------------------------------------+----------------------------------------+
                                           | SQLAlchemy 2.0 ORM (PyMySQL / SSL)
                                           v
+-----------------------------------------------------------------------------------+
|                        DATABASE STORAGE TIER (MySQL / TiDB)                       |
|  * Local Dev: SQLite (`inv.db`)                                                   |
|  * Production: TiDB Cloud Serverless / Aiven MySQL (TLS Encrypted, UTF8MB4)       |
+-----------------------------------------------------------------------------------+
```

---

### 3. Entity-Relationship (ER) Architecture

The database enforces relational integrity across 8 core relational entities, with cascading constraints and foreign key indexes.

```
+------------------+         1:N         +-----------------------+
|      users       +-------------------->+      indents          |
|------------------|                     |-----------------------|
| id (PK)          |                     | id (PK)               |
| name             |                     | no (e.g. IND-2026-001)|
| email (Unique)   |                     | dept                  |
| pw (Bcrypt hash) |                     | status (PENDING/...)  |
| role             |                     | by_id (FK -> users)   |
| dept             |                     | decided_by (FK->users)|
+--------+---------+                     +-----------+-----------+
         |                                           | 1:N
         | 1:N                                       v
         |                               +-----------------------+
         |                               |     indent_lines      |
         |                               |-----------------------|
         |                               | id (PK)               |
         |                               | indent_id (FK->indents|
         |                               | item_id (FK->items)   |
         |                               | qty                   |
         |                               +-----------+-----------+
         |                                           |
         v                                           |
+------------------+         1:N                     |
| purchase_orders  |<--------------------------------+
|------------------|
| id (PK)          |
| no (PO-2026-001) |
| vendor_id (FK)   |         1:N         +-----------------------+
| indent_id (FK)   +-------------------->+       po_lines        |
| status (OPEN/..) |                     |-----------------------|
| by_id (FK->users)|                     | id (PK)               |
+--------+---------+                     | po_id (FK->po)        |
         |                               | item_id (FK->items)   |
         |                               | qty, rate, got        |
         |                               +-----------+-----------+
         |                                           |
         v                                           v
+------------------+         1:N         +-----------------------+
|      txns        |<--------------------+        items          |
|------------------| (item_id)           |-----------------------|
| id (PK)          |                     | id (PK)               |
| item_id (FK)     |                     | code (Unique, Indexed)|
| kind (IN/OUT/WO) |                     | name                  |
| qty              |                     | category_id (FK)      |
| ref (PO/IND/WO)  |                     | unit, min_stock       |
| note, at         |                     | qty (Physical balance)|
| user_id (FK)     |                     | price (Latest rate)   |
+------------------+                     | location (Rack)       |
                                         +-----------+-----------+
                                                     | N:1
                                                     v
                                         +-----------------------+
                                         |      categories       |
                                         |-----------------------|
                                         | id (PK), name         |
                                         +-----------------------+
```

---

### 4. Role-Based Access Control (RBAC) Matrix

| Portal Feature / Route | Department User (`dept`) | Store Officer (`store`) | Director S&P (`approver`) | System Admin (`admin`) |
| :--- | :---: | :---: | :---: | :---: |
| **Store Dashboard & Charts** | View Only | Full Access | Full Access | Full Access |
| **Inventory Master (Items)** | View Catalog | Add, Edit, Opening Stock | View Catalog & Ledger | Full Access |
| **Material Issuance (`/issue-stock`)** | ❌ Forbidden | Full Issuance | ❌ Forbidden | Full Access |
| **Department Indents (`/indents`)** | Raise & View Own | Raise & View All | Review, Approve, Reject | Full Access |
| **Purchase Orders (`/purchase-orders`)**| ❌ Forbidden | Create PO, Receive GRN | Review Sanctioned POs | Full Access |
| **Write-offs (`/write-offs`)** | ❌ Forbidden | Propose Condemnation | Review, Approve, Reject | Full Access |
| **Inventory & CSV Reports** | View & Download | Full Access | Full Access & Sign-off | Full Access |
| **System Audit Trail (`/audit`)** | ❌ Forbidden | ❌ Forbidden | Inspect All Actions | Full Access |

---

### 5. Implementation Highlights & University Business Logic

1. **Strict Non-Negative Stock Guarantee:**
   Every stock deduction (Material Issue, Write-off) is executed within a transactional database operation with explicit pre-checks:
   ```python
   if item.qty < qty:
       raise HTTPException(400, f"Only {item.qty:g} {item.unit} of {item.name} in stock")
   item.qty -= qty
   ```
2. **Mandatory Sanction Gate for Procurement:**
   A Purchase Order can **never** be raised without an approved indent. The API asserts `indent.status == "APPROVED"`, automatically transitioning the requisition to `ORDERED`.
3. **Goods Receipt Note (GRN) with Dynamic Price Averaging:**
   When goods arrive from a vendor, partial or complete deliveries are received line-by-line. The latest PO purchase rate automatically updates the catalog valuation price, and stock levels immediately increment.
4. **Condemnation Approval Gate:**
   When storekeepers propose a write-off for broken, expired, or water-damaged materials, stock is **not** altered. The physical inventory deduction and `WRITEOFF` ledger entry occur strictly when the Director approves the request.
5. **Cold-Start Resilience:**
   For zero-cost deployments on Render’s free tier, the frontend client automatically monitors backend latency, displaying a comforting "Server waking up from standby" message without throwing jarring network error popups.

---

### 6. Verification and Smoke Test Results

All 7 core university business flows were verified via automated end-to-end integration tests (`pytest backend/test_flows.py`):
- `test_health`: Passed (HTTP 200)
- `test_auth`: Verified bcrypt hashing, 12h JWT creation, and rejection of invalid credentials.
- `test_role_permissions`: Verified HTTP 403 Forbidden enforcement on unauthorized roles (dept blocked from POs and audit log; storekeeper blocked from self-approving write-offs).
- `test_stores_flow`: Catalog item creation, duplicate code rejection, stock issuance, over-issue rejection.
- `test_procurement_flow`: Department requisition -> Director approval -> PO generation -> Partial goods receipt -> Full GRN.
- `test_writeoff_flow`: Condemnation proposal -> Stock invariance verification -> Director sanction -> Stock reduction and ledger entry.
- `test_dashboard_and_reports`: KPI statistics aggregation, 30-day timeline series generation, and stock CSV download.

---

### 7. Future Scope & Roadmap

1. **Barcode / QR Code Generation:** Printing QR code labels for physical bins and racks inside Gautam Buddha University central storehouses.
2. **Automated Supplier Email Integration:** Direct PDF generation and automated emailing of approved Purchase Orders to contracted vendors.
3. **Annual Physical Stock Verification Module:** Blind stock auditing where internal university audit teams enter physical counts for automatic reconciliation variance reports.
4. **SMS / WhatsApp Alerts:** Automated notification to department heads when requisitioned items have arrived at the central store.
