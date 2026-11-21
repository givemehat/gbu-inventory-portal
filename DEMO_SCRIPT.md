# Gautam Buddha University (GBU) Stores & Purchase Portal
## 5-Minute Live Interview Demonstration Script
**Date:** 24 November 2026  
**Audience:** University Faculty, Stores & Purchase Selection Committee, and Technical Interviewers  
**Goal:** Demonstrate the complete end-to-end operational lifecycle: Requisitions, Director Approvals, Purchase Orders, Partial GRN Goods Inward, Condemnations, and Audit Compliance.

---

### Step-by-Step Walkthrough (Total Duration: 5 Minutes)

#### 00:00 – 00:45 | Introduction & Role-Based Login
- **Action:** Open the portal login page at `http://localhost:5173` (or your hosted Vercel link).
- **Dialogue:**  
  *"Good morning respected committee members. I have built a full-stack Inventory Management System tailored specifically to Gautam Buddha University’s Stores & Purchase Department. The portal supports four distinct roles: Store Officer, Director (S&P), Department Users, and System Administrator. Notice our quick-switch demo cards designed for this interview."*
- **Action:** Click the **Store Officer** demo card (`store@gbu.demo`) to auto-fill credentials, then click **Sign In to Portal**.

---

#### 00:45 – 01:30 | Dashboard Overview & Stores Inventory
- **Screen:** Dashboard
- **Dialogue:**  
  *"As the Store Officer, we are greeted with real-time university inventory metrics: Total Catalog Items, Inventory Valuation in Rupees, Low-Stock Alerts, Pending Requisitions, Active POs, and Condemnations. Below, we see stock valuation distributed across GBU’s 6 categories—Stationery, Computer Hardware, Lab Consumables, Electrical, Furniture, and Cleaning—plus a 30-day material movement timeline."*
- **Action:** Point out the **Low-Stock Alert** card (showing items like Toner Cartridge 12A or Ball Pen Blue). Click the item or click **Store Items** in the sidebar.
- **Action:** Click **Ledger** on any item (e.g. `STN-001` or `CMP-002`) to show the complete stock movement history (Opening Stock, Dispatches, Goods Inward) with user and date stamps.

---

#### 01:30 – 02:15 | Physical Stock Issuance & Non-Negative Validation
- **Screen:** Issue Stock (`/issue-stock`)
- **Dialogue:**  
  *"Now, let us disburse supplies to an academic department. The storekeeper selects an item, such as A4 Paper Reams or Multimeters."*
- **Action:** Select an item (e.g., `STN-001` with 180 in stock). Point out the live green availability badge: `180 reams Available`.
- **Dialogue:**  
  *"Notice our business rule: The system strictly prohibits negative stock."*
- **Action:** Type `200` into the quantity field. Show how the input turns red with the warning: *"Cannot issue 200. Maximum available is 180."*
- **Action:** Change quantity to `10`, select **School of ICT** as the receiving department, add note *"Mid-term exam papers"*, and click **Confirm Stock Issue**.
- **Result:** Success toast appears, stock immediately reduces to 170, and the new dispatch appears in the Recent Dispatches list.

---

#### 02:15 – 03:00 | Department Requisition (Indent Flow)
- **Screen:** Switch user to Department Staff
- **Action:** Click **Logout** in the top-right header. Click the **Dept Staff** card (`dept@gbu.demo`) and sign in.
- **Dialogue:**  
  *"Now we are logged in as a faculty/staff member from the School of ICT. Notice our sidebar dynamically adjusts: Department users cannot view purchase orders, issue stock, or access audit logs. They can only see requisitions belonging to their own department."*
- **Action:** Go to **Indents (Requisitions)** (`/indents`). Click **Raise New Indent**.
- **Action:** Keep department as *"School of ICT"*, note as *"Urgent lab refill"*, select **Digital Multimeter** (Qty: 5), and click **Add Item** to add a second line: **USB Keyboard** (Qty: 10). Click **Submit Requisition**.
- **Result:** New requisition `IND-2026-0003` is created in `PENDING` status.

---

#### 03:00 – 03:45 | Director Approval & Purchase Order Generation
- **Screen:** Switch user to Director (S&P)
- **Action:** Log out and sign in as **Director (S&P)** (`director@gbu.demo`).
- **Dialogue:**  
  *"The Director of Stores & Purchase holds administrative sanction authority. On their Indents screen, pending requisitions feature direct approval controls."*
- **Action:** Go to **Indents**. Find `IND-2026-0003`. Click **Approve Indent**.
- **Action:** In the confirmation dialog, enter remarks: *"Sanctioned against School of ICT annual lab budget"* and click **Confirm Approval**.
- **Result:** Status changes to `APPROVED`.
- **Action:** Log out and log back in as **Store Officer** (`store@gbu.demo`).
- **Dialogue:**  
  *"Now back as the Storekeeper, the approved requisition now displays a 'Create Purchase Order' button. A PO can never be raised without prior Director sanction."*
- **Action:** Click **Create Purchase Order →**. The PO creation dialog opens with the requisitioned lines pre-filled.
- **Action:** Select vendor **Rajdhani Computers**, verify rates, and click **Issue Purchase Order**.
- **Result:** `PO-2026-0002` is officially generated in `OPEN` status.

---

#### 03:45 – 04:30 | Goods Receipt Note (GRN) & Automatic Price Update
- **Screen:** Purchase Orders (`/purchase-orders`)
- **Dialogue:**  
  *"When the vendor delivers the shipment to GBU Central Stores, the storekeeper records a Goods Receipt Note (GRN). We support partial shipments because vendors often deliver in installments."*
- **Action:** Click **Receive Goods (GRN)** on the new PO.
- **Action:** Enter a partial quantity (e.g., receive 3 out of 5 multimeters, and 10 out of 10 keyboards). Click **Confirm Goods Inward**.
- **Dialogue:**  
  *"Notice the PO status automatically shifts to 'PARTIAL'. Simultaneously, the catalog stock for Digital Multimeters and Keyboards has increased, and the item price was updated to the latest purchase rate."*

---

#### 04:30 – 05:00 | Material Condemnation, Audit Trail & Print Statement
- **Screen:** Write-offs (`/write-offs`)
- **Dialogue:**  
  *"Next is condemnation. When items expire or suffer water damage, the storekeeper proposes a write-off. Notice: stock is NOT deducted yet."*
- **Action:** Show the existing proposal `WO-2026-0001` for Ball Pen Blue (damaged by moisture).
- **Dialogue:**  
  *"Only when the Director signs off does the physical asset leave the books."*
- **Action:** (Optional) Switch to Director to approve, or demonstrate the pending status.
- **Action:** Navigate to **Reports & Export** (`/reports`).
- **Dialogue:**  
  *"Finally, university administration requires compliance documentation. With one click, we can export full CSV datasets of all physical stock or the entire transactions ledger. Below is our formal Gautam Buddha University Stock Position Statement, formatted with university letterhead, category subtotals, and signature verification blocks ready for printing."*
- **Action:** Navigate to **Audit Trail** (`/audit`).
- **Dialogue:**  
  *"Every single action—from user login, requisition raising, director sanction, to goods inward—is permanently stamped in the university audit log. The system is production-ready, fully responsive, and tested end-to-end."*
- **Closing:**  
  *"Thank you, I would be delighted to answer any technical or operational questions!"*
