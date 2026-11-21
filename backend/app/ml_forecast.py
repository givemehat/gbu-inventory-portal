import math
import statistics
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models import Item, Txn, Indent, IndentLine

def calculate_item_forecast(item: Item, txns_out: List[Txn], window_days: int = 60, lead_time_days: int = 14) -> Dict[str, Any]:
    """
    Computes statistical consumption run-rate, days-of-supply (DOS),
    recommended safety stock, and Economic Order Quantity (EOQ).
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=window_days)

    # Filter outward issues in the analysis window
    recent_out = [
        t for t in txns_out
        if t.item_id == item.id and t.kind in ("OUT", "WRITEOFF") and t.at.replace(tzinfo=timezone.utc) >= cutoff
    ]

    total_issued = sum(float(t.qty) for t in recent_out)
    daily_run_rate = total_issued / float(window_days)

    # Calculate daily consumption variance
    daily_buckets = { (now - timedelta(days=d)).date(): 0.0 for d in range(window_days) }
    for t in recent_out:
        d = t.at.date()
        if d in daily_buckets:
            daily_buckets[d] += float(t.qty)

    daily_values = list(daily_buckets.values())
    stdev_daily = statistics.stdev(daily_values) if len(daily_values) > 1 and sum(daily_values) > 0 else 0.0

    # Safety Stock formula: Z * sqrt(LeadTime) * stdev_daily (Z = 1.65 for 95% service level)
    z_factor = 1.65
    safety_stock = math.ceil(z_factor * math.sqrt(lead_time_days) * stdev_daily) if stdev_daily > 0 else max(1, math.ceil(float(item.min_stock) * 0.3))
    
    # Dynamic Reorder Point (ROP) = (Lead Time * Daily Run Rate) + Safety Stock
    reorder_point = math.ceil((daily_run_rate * lead_time_days) + safety_stock)
    
    current_qty = float(item.qty)
    price = float(item.price) if item.price else 100.0

    # Days of supply remaining
    if current_qty <= 0:
        days_of_supply = 0
        urgency = "STOCKOUT"
        stockout_date = now.strftime("%Y-%m-%d")
    elif daily_run_rate > 0:
        days_of_supply = round(current_qty / daily_run_rate, 1)
        projected_date = now + timedelta(days=math.floor(days_of_supply))
        stockout_date = projected_date.strftime("%Y-%m-%d")
        if days_of_supply <= 7:
            urgency = "CRITICAL"
        elif days_of_supply <= 21 or current_qty <= reorder_point:
            urgency = "WARNING"
        else:
            urgency = "HEALTHY"
    else:
        days_of_supply = 999
        urgency = "DORMANT"
        stockout_date = None

    # EOQ calculation: sqrt( (2 * AnnualDemand * OrderingCost) / HoldingCostPerUnit )
    # S = approx Rs 500 administrative tender/PO issuance cost
    # H = approx 12% annual cost of capital / storage per unit
    annual_demand = max(10.0, daily_run_rate * 365)
    ordering_cost_s = 500.0
    holding_cost_h = max(1.0, price * 0.12)
    eoq = math.ceil(math.sqrt((2.0 * annual_demand * ordering_cost_s) / holding_cost_h))

    # Confidence score based on observation density
    active_days_with_usage = sum(1 for v in daily_values if v > 0)
    confidence = min(96, max(45, int((active_days_with_usage / max(1, window_days / 3)) * 80) + 15))

    return {
        "item_id": item.id,
        "code": item.code,
        "name": item.name,
        "category": item.category.name if item.category else "General",
        "unit": item.unit,
        "current_stock": current_qty,
        "min_stock": float(item.min_stock),
        "price": price,
        "daily_run_rate": round(daily_run_rate, 2),
        "days_of_supply": days_of_supply if days_of_supply < 999 else "90+ days",
        "stockout_date": stockout_date,
        "recommended_safety_stock": safety_stock,
        "dynamic_reorder_point": reorder_point,
        "economic_order_qty": eoq,
        "urgency": urgency,
        "confidence_score": confidence,
    }


def analyze_inventory_procurement(db: Session) -> Dict[str, Any]:
    """
    Runs full store portfolio ML analytics and cross-department anomaly detection.
    """
    now = datetime.now(timezone.utc)
    items = list(db.scalars(select(Item).order_by(Item.id)))
    
    cutoff = now - timedelta(days=90)
    txns_out = list(db.scalars(
        select(Txn).where(Txn.kind.in_(["OUT", "WRITEOFF"]), Txn.at >= cutoff)
    ))

    forecasts = [calculate_item_forecast(item, txns_out, window_days=60) for item in items]

    # Sort so most critical items appear first
    priority_order = {"STOCKOUT": 0, "CRITICAL": 1, "WARNING": 2, "HEALTHY": 3, "DORMANT": 4}
    forecasts.sort(key=lambda x: (priority_order.get(x["urgency"], 9), x["current_stock"]))

    critical_count = sum(1 for f in forecasts if f["urgency"] in ("STOCKOUT", "CRITICAL"))
    warning_count = sum(1 for f in forecasts if f["urgency"] == "WARNING")
    dormant_count = sum(1 for f in forecasts if f["urgency"] == "DORMANT")
    healthy_count = sum(1 for f in forecasts if f["urgency"] == "HEALTHY")

    # Cross-department duplicate requisition anomaly detection (last 30 days)
    indent_cutoff = now - timedelta(days=30)
    recent_indent_lines = db.execute(
        select(IndentLine.item_id, Indent.dept, func.count(Indent.id), func.sum(IndentLine.qty))
        .join(Indent, IndentLine.indent_id == Indent.id)
        .where(Indent.at >= indent_cutoff)
        .group_by(IndentLine.item_id, Indent.dept)
    ).all()

    # Find items requested by multiple distinct departments
    dept_requests_by_item: Dict[int, List[Dict[str, Any]]] = {}
    for item_id, dept, count, total_qty in recent_indent_lines:
        if item_id not in dept_requests_by_item:
            dept_requests_by_item[item_id] = []
        dept_requests_by_item[item_id].append({
            "dept": dept,
            "requests_count": count,
            "qty": float(total_qty)
        })

    duplicate_alerts = []
    item_map = {i.id: i for i in items}
    for item_id, depts in dept_requests_by_item.items():
        if len(depts) >= 2:
            item_obj = item_map.get(item_id)
            if item_obj:
                total_combined_qty = sum(d["qty"] for d in depts)
                duplicate_alerts.append({
                    "item_id": item_id,
                    "code": item_obj.code,
                    "name": item_obj.name,
                    "departments": [d["dept"] for d in depts],
                    "total_combined_qty": total_combined_qty,
                    "unit": item_obj.unit,
                    "recommendation": f"Consolidate {len(depts)} departmental indents into a single bulk PO for rate discount."
                })

    return {
        "generated_at": now.isoformat(),
        "total_items_analyzed": len(items),
        "critical_count": critical_count,
        "warning_count": warning_count,
        "dormant_count": dormant_count,
        "healthy_count": healthy_count,
        "forecasts": forecasts,
        "cross_dept_anomalies": duplicate_alerts,
    }
