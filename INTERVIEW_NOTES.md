# Technical Interview Notes & Live Demo Script
## GBU Stores & Purchase Inventory Management System
*Author: Rajnish Singh | Walk-in Interview: Tuesday, 24 Nov 2026*

---

## 1. Five-Minute Live Demo Script

| Minute | Action / Screen | What to Say & Demonstrate |
| :--- | :--- | :--- |
| **0:00 – 1:00** | **Login & University Architecture** (`/login`) | "Namaste. I have built a working prototype of an Inventory Management System designed specifically for the Stores & Purchase Department of Gautam Buddha University. It handles the complete tripartite flow: Stores, Procurement, and Condemnations. Notice the official university branding, accessibility text controls (`A- \| A \| A+`), and the role architecture supporting Store Officers, Approving Directors, and Academic Departments." |
| **1:00 – 2:00** | **Dashboard & Live Attention Items** (`/dashboard`) | *Log in as Store Officer (`store@gbu.demo`).* "The dashboard is not generic SaaS cards; it acts as an executive morning briefing. At the top, 'Needs your attention' highlights 7 items below minimum reorder thresholds and pending POs with immediate action buttons. Below are high-density charts showing stock valuation by category (totaling ₹3.31 Lakhs) and weekly inward vs outward material flow, followed by university circulars." |
| **2:00 – 3:00** | **Item Register & Stock Issue** (`/items` & `/issue-stock`) | "Open the stock register. We have 25 seeded items with exact rack locations. Open item `STN-001` (A4 Paper). Click 'Print Bin Card' to show the printable Form S&P-05 voucher with verification signatures. Next, go to 'Issue Stock' and issue 10 reams to Examination Cell. The backend executes an atomic `UPDATE items SET qty = qty - :qty WHERE qty >= :qty` inside the transaction writing the ledger row—making stock deductions 100% concurrency-safe." |
| **3:00 – 4:00** | **Procurement Flow: Indent → Sanction → PO → GRN** | *Log in as Dept Staff (`dept@gbu.demo`).* "Raise an indent for 15 boxes of marker pens (`IND/2026-27/0003`). Switch to Director (`director@gbu.demo`). The Director inspects the requisition, can approve a different quantity per line, and approves it. Note that segregation of duties prevents the person who raised the requisition from approving it. Switch back to Store Officer: generate `PO/2026-27/0002` against the approved indent. Receive goods (GRN): the system automatically calculates the Weighted Average Cost (WAC) and updates catalog valuation." |
| **4:00 – 5:00** | **Write-offs & Technical Integrity** (`/write-offs` & `/audit`) | "Submit a condemnation proposal for damaged items (`WO/2026-27/0002`). Notice stock does not decrease until the Director signs off. Demonstrate the admin integrity check (`/api/admin/integrity-check`), showing 100% mathematical reconciliation between current stock balances and ledger movement sums. Show the append-only audit trail logging user, before/after JSON diff, and correlation request IDs." |

---

## 2. Twenty Likely Technical Questions & Accurate Code References

### Q1: How does authentication and session management work?
- **Answer:** We use stateless JSON Web Tokens (JWT) signed with HMAC-SHA256 and a 12-hour expiration. On login, credentials are verified using `bcrypt.checkpw()`. The token contains the user ID in the `sub` claim. Each protected route validates the token via FastAPI's `OAuth2PasswordBearer` dependency.
- **Code Reference:** `backend/app/auth.py` -> `login()`, `make_token()`, and `me()`.

### Q2: Where and how is role-based access control (RBAC) enforced?
- **Answer:** Enforced in two places. At the backend, a closure dependency `need(*roles)` inspects `current_user.role`. If the user is not an administrator and lacks the allowed role, an HTTP 403 `FORBIDDEN` exception is raised immediately before the route handler executes. On the frontend, `RoleGuard` in `App.jsx` and sidebar menu filtering hide unauthorized navigation.
- **Code Reference:** `backend/app/auth.py` -> `need()`, and `frontend/src/App.jsx` -> `RoleGuard()`.

### Q3: Why and how is stock prevented from becoming negative under concurrent requests?
- **Answer:** We reject read-then-write logic. Decrements are executed using a single atomic SQL statement: `UPDATE items SET qty = qty - :qty WHERE id = :item_id AND qty >= :qty`. Inside the same database transaction, we inspect `res.rowcount`. If it is 0, the database rejected the deduction because available stock was strictly less than requested; an HTTP 400 `INSUFFICIENT_STOCK` exception is raised and the transaction rolls back. This is verified by an automated test running 20 parallel threads.
- **Code Reference:** `backend/app/main.py` -> `deduct_stock_atomic()`, and `backend/test_flows.py` -> `test_concurrency_stock_20_parallel_issues()`.

### Q4: Why can a Purchase Order only be raised against an approved indent?
- **Answer:** In university public finance and General Financial Rules (GFR), stores officers cannot commit university funds without prior administrative and financial sanction from the competent authority (Director, Stores & Purchase). In `create_purchase_order()`, we verify `indent.status == 'APPROVED'`, transitioning it to `ORDERED`.
- **Code Reference:** `backend/app/main.py` -> `create_purchase_order()`.

### Q5: How is inventory valued, and why do you not simply overwrite the item rate with the latest PO price?
- **Answer:** Overwriting rate with the latest PO price artificially distorts existing inventory valuation when market prices fluctuate. We use the **Weighted Average Cost (WAC)** method: $\text{New Rate} = \frac{\text{Old Qty} \times \text{Old Rate} + \text{Received Qty} \times \text{Purchase Rate}}{\text{Total Qty}}$. Every transaction row stores the prevailing `unit_cost`. Outward issues are valued at that exact moment's WAC.
- **Code Reference:** `backend/app/main.py` -> `add_stock_atomic()`, and `backend/test_flows.py` -> `test_weighted_average_cost_wac()`.

### Q6: How does partial delivery against a Purchase Order work?
- **Answer:** Each `POLine` maintains both `qty` (ordered) and `got` (accumulated deliveries). In `receive_goods()`, when a partial quantity arrives, `line.got += recv_qty`. If $\sum \text{got} < \sum \text{qty}$, the PO transitions to `PARTIAL`; once all lines reach 100%, status becomes `RECEIVED`. Over-receiving is strictly blocked.
- **Code Reference:** `backend/app/main.py` -> `receive_goods()`.

### Q7: What is segregation of duties, and where is it enforced?
- **Answer:** Dual authorization mandates that the officer requesting an expenditure or write-off cannot approve it. In both `decide_indent()` and `decide_writeoff()`, we check `if u.id == document.by_id: raise AppException(403, "SEGREGATION_OF_DUTIES", ...)`. Even administrators cannot self-approve their own requisitions.
- **Code Reference:** `backend/app/main.py` -> `decide_indent()` and `decide_writeoff()`.

### Q8: How is the physical ledger reconciled against current recorded stock balances?
- **Answer:** Current item stock must always equal the net algebraic sum of its historical ledger movements: $\sum \text{IN} - \sum \text{OUT} - \sum \text{WRITEOFF}$. The function `reconcile_item_stock()` computes this dynamically, exposed via `GET /api/admin/integrity-check`. An automated test executes randomized operations and asserts 0 mismatches.
- **Code Reference:** `backend/app/main.py` -> `reconcile_item_stock()` and `admin_integrity_check()`.

### Q9: How are sequential document numbers generated without collision?
- **Answer:** Document numbers follow Indian Financial Year notation (`IND/2026-27/0001`, `PO/2026-27/0001`). In `next_doc_number()`, we query `doc_counters` with row-level locking (`with_for_update()`) scoped to the document type and financial year string, atomically incrementing `last_val`.
- **Code Reference:** `backend/app/main.py` -> `next_doc_number()` and `get_indian_financial_year()`.

### Q10: Why did you use Numeric (Decimal) instead of Float for money and quantities?
- **Answer:** IEEE 754 floating-point numbers introduce binary rounding anomalies (e.g. `0.1 + 0.2 != 0.3`). For university accounting, monetary totals must be exact to 2 decimal places (`Numeric(14, 2)`), and material counts exact to 3 decimal places (`Numeric(14, 3)`) to support fractional units like litres and kilograms without accumulation errors.
- **Code Reference:** `backend/app/models.py` -> `Item`, `Txn`, `POLine`.

### Q11: How do you protect against brute-force login attacks?
- **Answer:** A thread-safe sliding window rate limiter tracks failed login attempts by composite key `email:ip`. If a user fails 5 times within a 10-minute window, subsequent attempts are rejected with HTTP 429 `RATE_LIMITED`. Successful login resets the counter.
- **Code Reference:** `backend/app/auth.py` -> `is_rate_limited()`, `record_failure()`, `reset_failures()`.

### Q12: How are database migrations managed?
- **Answer:** We use Alembic. Migrations are stored in `backend/alembic/versions/` (`001_initial_tables.py` and `002_numeric_counters_indexes.py`). On application startup, `boot()` runs `command.upgrade(alembic_cfg, "head")`, ensuring any deployment automatically migrates the database schema before serving traffic.
- **Code Reference:** `backend/app/main.py` -> `boot()`, and `backend/alembic/env.py`.

### Q13: How is the database reset to a clean demo state before an evaluation?
- **Answer:** Running `python -m app.seed --reset` cleans all tables and reseeds the 25 standard items, 4 vendors, 4 demo users, opening stock ledger, and realistic movements. It restores `STN-001` to 180 reams, exactly 7 low-stock alerts, 1 pending indent, 1 open PO, and 1 pending write-off. In production, `--reset` refuses to run without `--force`.
- **Code Reference:** `backend/app/seed.py` -> `run()`, `clean_database()`, and `main()`.

### Q14: How are audit logs structured, and are they tamper-proof?
- **Answer:** The `audit` table stores user ID, action description, timestamp, request correlation ID (`X-Request-ID`), and JSON snapshots of `before_state` and `after_state`. The table is strictly append-only: there are no UPDATE or DELETE API endpoints.
- **Code Reference:** `backend/app/main.py` -> `audit_log()` and `list_audit()`, and `backend/app/models.py` -> `Audit`.

### Q15: How does the backend return consistent error responses?
- **Answer:** All exceptions (custom `AppException`, standard `HTTPException`, and Pydantic `RequestValidationError`) are captured by global exception handlers returning a unified envelope: `{"error": {"code": "...", "message": "...", "fields": {...}}}`. Internal unhandled 500 exceptions log the trace with correlation ID but return a clean error without leaking stack traces.
- **Code Reference:** `backend/app/main.py` -> lines 135–185 (`app_exception_handler`, etc.).

### Q16: How does server-side pagination and sorting work?
- **Answer:** All list endpoints accept query parameters `page`, `page_size`, `sort`, `order`, and `q`. The query applies `count()`, SQL `ORDER BY`, `OFFSET`, and `LIMIT`, returning `{ items, total, page, page_size, total_pages }`. The frontend API client attaches pagination metadata while maintaining direct array iteration compatibility.
- **Code Reference:** `backend/app/main.py` -> `list_items()`, `list_transactions()`, `list_indents()`, and `frontend/src/api.js` -> `wrapListResponse()`.

### Q17: What security headers are implemented, and why?
- **Answer:** Middleware injects HTTP headers: `X-Content-Type-Options: nosniff` (prevents MIME sniffing), `X-Frame-Options: DENY` (clickjacking defense), `Referrer-Policy: strict-origin-when-cross-origin` (prevents credential leaking), and `Permissions-Policy`. We also enforce a 1MB payload size limit.
- **Code Reference:** `backend/app/main.py` -> `security_headers_middleware()` and `request_size_limit_middleware()`.

### Q18: How do you handle cloud free-tier cold starts on Render?
- **Answer:** Render free instances spin down after 15 minutes of inactivity. When a user opens `/login`, `useEffect` pings `api.health()`. If unresolved after 2 seconds, an informational banner appears informing the user that the server is spinning up from standby, accompanied by a status badge.
- **Code Reference:** `frontend/src/pages/Login.jsx` -> lines 46–55.

### Q19: How is the official GBU circular Buddha seal and branding integrated?
- **Answer:** We placed the high-resolution Gautam Buddha University seal in `/gbu-logo.jpg`. It is rendered in the persistent sidebar header, login hero card, browser favicon, and at the top of all official printable A4 vouchers (Bin Cards, Indents, POs, Condemnations).
- **Code Reference:** `frontend/src/components/Sidebar.jsx`, `frontend/src/pages/Forms.jsx`, and `frontend/src/components/ItemDrawer.jsx`.

### Q20: How does the application scale font size persistently?
- **Answer:** `TextSizeContext.jsx` maintains three standard university accessibility font scales (`A-` 13px, `A` 14px, `A+` 16px) stored in `localStorage` and dynamically updates `document.documentElement.style.fontSize`. Because all layouts use proportional `rem` and Tailwind font sizes, all UI components scale harmoniously.
- **Code Reference:** `frontend/src/context/TextSizeContext.jsx`, and `frontend/src/components/UtilityBar.jsx`.

### Q21: How do the analytical reporting protocols (Historical Stock As-Of, Bin Card, Department Consumption, ABC Pareto) work?
- **Answer:**
  1. **Historical Stock As-Of:** For CAG audit compliance, we reconstruct stock balances at any past date by replaying the immutable ledger: $\text{Stock}(t) = \sum_{at \le t} \text{IN} - \sum_{at \le t} \text{OUT}$.
  2. **Bin Card:** Computes opening balance before the start date, lists all chronological vouchers with running balance, and displays closing balance.
  3. **Department Consumption:** Aggregates store issues by university school / lab with spend percentages and trend visualization.
  4. **ABC Pareto Analysis:** Computes annual turnover value per item, sorts descending, and assigns Pareto classes (Class A = top 70%, Class B = next 20%, Class C = remaining 10%).
  5. **Vendor Scorecard:** Calculates PO fulfillment rates ($\frac{\sum \text{got}}{\sum \text{qty}}$), total spend, and supplier efficiency ratings (A/B/C).
- **Code Reference:** `backend/app/main.py` -> `rep_stock_as_of()`, `rep_bin_card()`, `rep_consumption_by_dept()`, `rep_abc_analysis()`, and `rep_vendor_performance()`.

### Q22: What HTTP security headers and protocol hardening measures are in place?
- **Answer:** We enforce defense-in-depth:
  - `X-Content-Type-Options: nosniff` (prevents MIME-sniffing)
  - `X-Frame-Options: DENY` (prevents clickjacking)
  - `X-XSS-Protection: 1; mode=block` (browser reflection protection)
  - `Referrer-Policy: strict-origin-when-cross-origin` (protects internal URL privacy)
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()` (restricts unauthorized browser APIs)
  - `Cross-Origin-Opener-Policy: same-origin` (isolates execution context)
  - In production: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - Sliding-window login rate limiting (5 attempts per 10 minutes)
  - Request body size limit (1 MB max payload to protect against memory exhaustion).
- **Code Reference:** `backend/app/main.py` -> `security_headers_middleware()` and `request_size_limit_middleware()`.

### Q23: How do you ensure the system is free of known CVE vulnerabilities?
- **Answer:** We conduct automated vulnerability scans across dependencies using `pip-audit` for Python and `npm audit` for Node. Running `pip-audit` against our environment confirms **0 known CVE vulnerabilities** across all backend packages.
- **Verification:** Verified via `.venv/bin/pip-audit`.

---

## 3. Five Honest Answers to "What Would You Improve with More Time?"

1. **Physical Stock Verification Module:** Build a scheduled cycle-counting module where stores staff can print count sheets by rack location, enter physical counts, and automatically generate reconciliation adjustment entries upon Director sanction.
2. **Two-Factor Authentication (2FA / OTP):** Implement email-based or TOTP multi-factor authentication for high-privilege roles (`approver` and `admin`) before approving high-value purchase orders.
3. **Automated End-to-End Playwright CI Pipeline:** Add automated GitHub Actions running browser-based visual regression tests with Playwright on every pull request.
4. **Barcode / QR Code Generation:** Add automated printable asset QR-code stickers generated on Goods Receipt (GRN) to enable barcode-scanner physical checkouts.
5. **Two-Level PO Approval Threshold:** Introduce configurable sanction thresholds (e.g. POs under ₹50,000 approved by Store Officer; POs above ₹50,000 requiring Finance Officer / Registrar concurrence).

---

## 4. Honest Disclosure: Which Parts Did You Use AI Tools For?

- **Architecture, Domain Logic & Constraints (Human-Designed):**
  - The tripartite business rules (Stores, Procurement, Write-off).
  - Concurrency-safe atomic UPDATE pattern and Weighted Average Cost formula.
  - Indian Financial Year numbering format and Segregation of Duties logic.
  - Gautam Buddha University academic schools and administrative directory structure.
- **AI Coding Assistant (Tool-Assisted):**
  - Drafting repetitive boilerplate (SQLAlchemy ORM model attributes, Pydantic DTO definitions).
  - Generating synthetic test movements in `seed.py`.
  - Tailwind CSS utility layout alignment and Lucide icon mappings.
  - Generating initial drafts of unit test cases in `test_flows.py`.
