# Architecture & Engineering Design Decisions
## Gautam Buddha University (GBU) Stores & Purchase Inventory Portal

This document records the foundational technical and architectural decisions made in the system, explaining the context, rationale, and alternative approaches evaluated and rejected.

---

### Decision 1: Concurrency-Safe Stock Deduction via Atomic UPDATE
- **Decision:** Execute inventory decrease operations using a single atomic SQL statement:
  ```sql
  UPDATE items SET qty = qty - :qty WHERE id = :item_id AND qty >= :qty;
  ```
  Check the affected row count (`res.rowcount == 0` triggers an immediate `INSUFFICIENT_STOCK` rollback and error) inside the same database transaction that records the ledger row.
- **Alternative Rejected:** Read-then-write application-level check (`if item.qty >= qty: item.qty -= qty; db.commit()`) or pessimistic table-level locking (`SELECT ... FOR UPDATE`).
- **Why Rejected:** Read-then-write is vulnerable to race conditions under concurrent requests (proven by the 20-thread parallel issue test), leading to phantom stock and negative balances. Table-level locking severely bottlenecks throughput and causes deadlocks under high request volumes.

---

### Decision 2: Inventory Valuation using Weighted Average Cost (WAC)
- **Decision:** Calculate inventory valuation using the Weighted Average Cost method upon every Goods Receipt Note (GRN):
  $$\text{New Average} = \frac{(\text{Old Qty} \times \text{Old Avg}) + (\text{Received Qty} \times \text{Purchase Rate})}{\text{Old Qty} + \text{Received Qty}}$$
  Store the prevailing unit cost on every ledger transaction (`Txn.unit_cost`). Outward issues and write-offs debit inventory at the exact average cost at that moment. Total valuation is dynamically computed as $\text{Qty} \times \text{Avg Cost}$.
- **Alternative Rejected:** Overwriting catalog price with the latest PO rate ("Latest Price Method"), or strict FIFO / LIFO lot-tracking.
- **Why Rejected:** Overwriting catalog rate artificially inflates or deflates existing stock value whenever price fluctuates, violating General Financial Rules (GFR). Strict FIFO lot-tracking requires complex bin-batch tracking unsuitable for homogeneous commodity store goods (e.g. A4 reams, pens, phenyl).

---

### Decision 3: Immutable Stock Ledger as the Single Source of Truth
- **Decision:** The `txns` table is append-only. No UPDATE or DELETE statements exist for ledger records. Item stock is verified and reconciled against the algebraic sum of its ledger rows ($\sum \text{IN} - \sum \text{OUT} - \sum \text{WRITEOFF}$).
- **Alternative Rejected:** Modifying historical transactions or storing only current item balances without an audit trail.
- **Why Rejected:** University statutory audit rules mandate that every physical disbursal, supplier delivery, and condemnation must be traceable to a signed voucher, official order, or board proceeding. An append-only ledger prevents tampering.

---

### Decision 4: Document Numbering Aligned with Indian Financial Year (April–March)
- **Decision:** Format all requisition slips, purchase orders, goods receipt notes, and write-offs by Indian Financial Year (`IND/2026-27/0001`, `PO/2026-27/0001`, `GRN/2026-27/0001`, `WO/2026-27/0001`). Generate sequential counters from a dedicated `doc_counters` table using row-level locking.
- **Alternative Rejected:** Simple database auto-increment IDs (`PO-1`, `IND-2`) or calendar-year formatting (`PO-2026-0001`).
- **Why Rejected:** Indian public universities operate strictly on an April 1 to March 31 fiscal cycle for budget allocations and government grants. Calendar-year numbering clashes with university accounting books. Database auto-increment integers reveal record counts and reset unpredictably.

---

### Decision 5: Segregation of Duties (Dual Control)
- **Decision:** Enforce segregation of duties at the backend API layer: the user who created an indent cannot approve or reject it (`u.id == indent.by_id` forbidden), and the officer who requested a write-off cannot sanction it (`u.id == writeoff.by_id` forbidden), even if that user possesses administrative or approver privileges.
- **Alternative Rejected:** Granting unrestricted self-approval to the `admin` role or relying solely on frontend button hiding.
- **Why Rejected:** University financial controls forbid self-sanctioning of institutional purchases or asset write-offs. Enforcing this only on the frontend leaves APIs vulnerable to bypass via direct cURL or script calls.

---

### Decision 6: Dual Database Strategy (SQLite for Dev, MySQL for Production)
- **Decision:** Use SQLite zero-config file database (`inv.db`) for local development, automated pytest flows, and offline walk-in demos. Use MySQL-compatible serverless database (TiDB Cloud or Aiven MySQL) with TLS SSL (`DB_SSL=1`) in production.
- **Alternative Rejected:** Requiring local MySQL/Docker installation for development, or using SQLite in production.
- **Why Rejected:** SQLite allows any evaluator or examiner to clone the repo and run `pytest` or `uvicorn` in seconds without installing database daemons. However, production multi-user cloud deployment requires MySQL's connection pooling, concurrent writes, and cloud failover. SQLAlchemy 2.0 ORM abstracts both seamlessly.

---

### Decision 7: Stateless JWT Authentication with 12-Hour Expiry
- **Decision:** Issue signed HMAC-SHA256 JWT tokens with a 12-hour session lifetime storing user ID, verified via FastAPI OAuth2 password bearer dependency on every protected route.
- **Alternative Rejected:** Stateful server-side session cookies stored in Redis or database.
- **Why Rejected:** Stateless tokens eliminate the need for an external Redis cache server, reducing deployment complexity and cost on free cloud tiers (Render / Vercel), while 12-hour expiration aligns with typical university office working shifts.

---

### Decision 8: Server-Side Pagination, Sorting, and Filtering
- **Decision:** All list endpoints (`/api/items`, `/api/transactions`, `/api/indents`, `/api/purchase-orders`, `/api/writeoffs`, `/api/audit`) paginate at the database query level (`LIMIT` and `OFFSET`) returning standard envelope:
  ```json
  { "items": [...], "total": 120, "page": 1, "page_size": 20, "total_pages": 6 }
  ```
- **Alternative Rejected:** Client-side pagination (fetching all 5,000 records to the browser and slicing in React).
- **Why Rejected:** As university registers accumulate thousands of transaction lines over semesters, transferring entire tables creates excessive memory bloat, high network latency on mobile networks, and degraded browser responsiveness.
