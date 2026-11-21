# Gautam Buddha University (GBU)
## Central Stores & Purchase (S&P) Department — Inventory Management System

A complete, production-ready university inventory management portal built for Gautam Buddha University (Greater Noida, UP). It handles the full tripartite lifecycle of **Stores**, **Procurement (Requisition → Director Approval → PO → GRN)**, and **Material Condemnations (Write-offs)** with an immutable audit trail and role-based access control.

---

### Tech Stack
- **Frontend:** React 18, Vite 6, Tailwind CSS, React Router v6, Recharts, Lucide Icons
- **Backend:** Python 3.14+, FastAPI, SQLAlchemy 2.0, Pydantic v2
- **Database:** SQLite (local development) / MySQL (TiDB Cloud Serverless or Aiven MySQL via PyMySQL in production)
- **Authentication:** JWT (12-hour session expiry), Bcrypt password hashing
- **Deployment:** Frontend on **Vercel**, Backend on **Render**, Database on **TiDB Cloud**

---

### Demo Logins (Password: `demo123`)

| Role | Email | Department | Key Permissions |
| :--- | :--- | :--- | :--- |
| **Store Officer** | `store@gbu.demo` | Stores & Purchase | Manage items/vendors, issue stock, create POs, receive goods (GRN), propose write-offs |
| **Director (S&P)** | `director@gbu.demo` | Stores & Purchase | Approve/reject indents, sanction write-offs, review POs, inspect audit trail |
| **Dept Staff** | `dept@gbu.demo` | School of ICT | Raise department indents, view only own requisitions |
| **System Admin** | `admin@gbu.demo` | IT Cell | Unrestricted access across all modules and audit records |

*Tip: The login screen includes 1-click demo account selector cards for quick evaluation during live interviews.*

---

### Project Structure

```
gbu-inventory-backend/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth.py         # JWT generation, bcrypt verification, role dependency guards
│   │   ├── db.py           # Engine & SessionLocal (SQLite dev / MySQL + SSL in prod)
│   │   ├── models.py       # SQLAlchemy 2.0 ORM models with foreign keys & relationships
│   │   ├── main.py         # FastAPI application, lifespan handler, all /api endpoints
│   │   └── seed.py         # 25 realistic items, 4 vendors, 4 demo users, sample flows
│   ├── .env.example        # Backend environment variables template
│   ├── requirements.txt    # Production Python dependencies
│   └── test_flows.py       # Automated pytest suite covering all 7 university workflows
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx    # Action confirmation dialog with remark support
│   │   │   ├── Header.jsx          # Header with user role badge, department & logout
│   │   │   ├── ItemLedgerModal.jsx # Comprehensive stock ledger drawer for any item
│   │   │   ├── Layout.jsx          # Protected route wrapper with dynamic page titles
│   │   │   ├── Sidebar.jsx         # Role-gated responsive navigation with GBU crest
│   │   │   ├── StatusBadge.jsx     # Visual status chips (PENDING, APPROVED, OPEN, etc.)
│   │   │   └── Toast.jsx           # Global animated notifications (success, error, info)
│   │   ├── pages/
│   │   │   ├── Audit.jsx           # Immutable audit log (Director & Admin only)
│   │   │   ├── Dashboard.jsx       # 6 KPI cards, category valuation chart, 30-day movement
│   │   │   ├── Indents.jsx         # Multi-line requisitions & Director approval panel
│   │   │   ├── IssueStock.jsx      # Departmental material issuance with live stock check
│   │   │   ├── Items.jsx           # Item catalog, add/edit modal, low-stock filters
│   │   │   ├── Login.jsx           # University branded login with demo cards & wake-up detector
│   │   │   ├── PurchaseOrders.jsx  # PO creation from approved indents & Goods Receipt (GRN)
│   │   │   ├── Reports.jsx         # Live CSV exports & printable university stock statement
│   │   │   └── WriteOffs.jsx       # Condemnation proposals & Director sanction gate
│   │   ├── api.js          # Centralized API client with JWT interception & error parser
│   │   ├── App.jsx         # React Router configuration & RoleGuard protection
│   │   └── main.jsx        # App entrypoint
│   ├── .env.example        # Frontend environment variables template
│   ├── package.json        # Frontend npm dependencies
│   ├── tailwind.config.js  # University blue & amber design system
│   └── vite.config.js      # Vite build configuration with chunk splitting
├── DEMO_SCRIPT.md          # 5-minute interview presentation walkthrough script
├── PROJECT_REPORT.md       # Comprehensive 2-page project documentation report
└── README.md
```

---

### Local Development Setup

#### 1. Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```
- API Documentation (Swagger UI): `http://localhost:8000/docs`
- On first start, SQLite database `inv.db` is created and automatically populated with realistic demo seed data.

#### 2. Run Automated Verification Tests
```bash
PYTHONPATH=. backend/.venv/bin/pytest -v backend/test_flows.py
```
*Executes all 7 end-to-end integration tests: health, auth, role enforcement, stock issues, procurement, write-offs, and dashboard reports.*

#### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. The Vite development proxy forwards all `/api` calls directly to `http://localhost:8000`.

---

### Production Deployment Guide

#### 1. Free MySQL Database (TiDB Cloud Serverless or Aiven)
1. Sign up for free at [TiDB Cloud](https://tidbcloud.com) or [Aiven](https://aiven.io).
2. Create a free MySQL-compatible cluster (e.g. `gbu-inventory`).
3. Note your connection details:
   - Host: e.g. `gateway01.us-east-1.prod.aws.tidbcloud.com`
   - Port: `4000` (or `3306` on Aiven)
   - User: `xxxxxx.root`
   - Password: `your-password`
   - Database: `test` (or create `gbu_inv`)
4. Construct your connection string:
   ```
   mysql+pymysql://<user>:<password>@<host>:<port>/<database>?charset=utf8mb4
   ```

#### 2. Backend Deployment on Render (FastAPI)
1. Push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Name:** `gbu-inventory-backend`
   - **Region:** Singapore / Frankfurt / Oregon
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: `mysql+pymysql://<user>:<password>@<host>:<port>/<database>?charset=utf8mb4`
   - `DB_SSL`: `1`
   - `SECRET_KEY`: `gbu-inventory-jwt-secret-key-production-super-secure-min32`
   - `ORIGINS`: `https://your-frontend-app.vercel.app,http://localhost:5173`
6. Click **Deploy Web Service**. The database tables and seed data will be initialized on first boot.

> **Handling the Free-Tier Cold-Start Problem:**  
> Free instances on Render spin down after 15 minutes of inactivity, taking ~30–45 seconds to spin up on cold requests.  
> **Built-in Mitigations:**
> 1. **Portal Login Waking-Up Indicator:** `Login.jsx` automatically monitors the `/api/health` ping and displays a user-friendly *"Server waking up from standby"* notice.
> 2. **Uptime Monitoring Ping:** Use a free monitor like [Cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com) to ping `https://your-backend.onrender.com/api/health` every 10 minutes to keep the container continuously warm.

#### 3. Frontend Deployment on Vercel
1. In [Vercel Dashboard](https://vercel.com), click **Add New...** → **Project**.
2. Select your repository.
3. Configure settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://your-backend-app.onrender.com`
5. Click **Deploy**. Vercel will build and serve your frontend across its global Edge Network.

---

### Core Business Rules Enforced

1. **Non-Negative Stock Rule:** No material can be issued or written off beyond available store balance (`400 Bad Request` with exact item stock message).
2. **Requisition Sanction Gate:** A Purchase Order cannot be generated without an approved indent. Raising a PO automatically updates indent status to `ORDERED`.
3. **Goods Receipt Note (GRN):** Partial deliveries are tracked line-by-line (`OPEN` → `PARTIAL` → `RECEIVED`). Receipt immediately increments stock and updates catalog price to the purchase rate.
4. **Condemnation Approval Gate:** Write-off proposals do **not** decrease inventory until the Director approves. Upon sanction, physical stock decreases and a `WRITEOFF` ledger entry is written.
5. **Role-Gated Security:** Department users see only their own requisitions and cannot view POs or audit logs. All critical operations generate permanent records in the `audit` table.
