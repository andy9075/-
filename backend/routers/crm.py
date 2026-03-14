from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from pathlib import Path
import os, logging, json, csv, io

from core import db, master_db, client, get_tenant_db, get_user_db, JWT_SECRET, JWT_ALGORITHM, ROOT_DIR
from core.auth import (
    security, hash_password, verify_password, generate_id, generate_order_no,
    create_token, get_current_user, log_audit
)
from core.models import *

router = APIRouter()
UPLOAD_DIR = Path(ROOT_DIR) / "uploads"

# ==================== Promotions ====================
@router.post("/promotions")
async def create_promotion(data: Dict, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    promo = {
        "id": generate_id(), **data,
        "status": data.get("status", "active"),
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.promotions.insert_one(promo)
    del promo["_id"]
    await log_audit(current_user["user_id"], current_user["username"], "create", "promotion", promo["id"], promo.get("name", ""), audit_db=udb)
    return promo

@router.get("/promotions")
async def get_promotions(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    query = {}
    if status: query["status"] = status
    return await udb.promotions.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)

@router.put("/promotions/{promo_id}")
async def update_promotion(promo_id: str, data: Dict, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    result = await udb.promotions.update_one({"id": promo_id}, {"$set": data})
    if result.matched_count == 0: raise HTTPException(404, "Promotion not found")
    await log_audit(current_user["user_id"], current_user["username"], "update", "promotion", promo_id, "", audit_db=udb)
    return await udb.promotions.find_one({"id": promo_id}, {"_id": 0})

@router.delete("/promotions/{promo_id}")
async def delete_promotion(promo_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    result = await udb.promotions.delete_one({"id": promo_id})
    if result.deleted_count == 0: raise HTTPException(404, "Promotion not found")
    await log_audit(current_user["user_id"], current_user["username"], "delete", "promotion", promo_id, "", audit_db=udb)
    return {"status": "deleted"}

# ==================== 1. VIP Auto-Upgrade ====================
@router.get("/settings/vip-rules")
async def get_vip_rules(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    rules = await udb.system_settings.find_one({"key": "vip_rules"}, {"_id": 0})
    if not rules:
        return {"levels": [
            {"name": "normal", "label": "普通会员", "min_spent": 0, "points_multiplier": 1, "discount_percent": 0},
            {"name": "silver", "label": "银卡会员", "min_spent": 200, "points_multiplier": 1.5, "discount_percent": 3},
            {"name": "gold", "label": "金卡会员", "min_spent": 500, "points_multiplier": 2, "discount_percent": 5},
            {"name": "vip", "label": "VIP会员", "min_spent": 1000, "points_multiplier": 3, "discount_percent": 8}
        ]}
    return {k: v for k, v in rules.items() if k != "key"}

@router.put("/settings/vip-rules")
async def update_vip_rules(data: Dict, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    data["key"] = "vip_rules"
    await udb.system_settings.update_one({"key": "vip_rules"}, {"$set": data}, upsert=True)
    return {"message": "VIP rules updated"}

@router.post("/customers/check-upgrades")
async def check_customer_upgrades(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    rules_doc = await udb.system_settings.find_one({"key": "vip_rules"}, {"_id": 0})
    levels = (rules_doc or {}).get("levels", [
        {"name": "normal", "min_spent": 0}, {"name": "silver", "min_spent": 200},
        {"name": "gold", "min_spent": 500}, {"name": "vip", "min_spent": 1000}
    ])
    levels.sort(key=lambda x: x["min_spent"], reverse=True)
    customers = await udb.customers.find({}, {"_id": 0}).to_list(10000)
    upgraded = 0
    for cust in customers:
        orders = await udb.sales_orders.find({"customer_id": cust["id"]}, {"_id": 0, "total_amount": 1}).to_list(10000)
        total_spent = sum(o.get("total_amount", 0) for o in orders)
        new_level = "normal"
        for lv in levels:
            if total_spent >= lv["min_spent"]:
                new_level = lv["name"]
                break
        if new_level != cust.get("member_level", "normal"):
            await udb.customers.update_one({"id": cust["id"]}, {"$set": {"member_level": new_level}})
            upgraded += 1
    return {"upgraded": upgraded, "total": len(customers)}

# ==================== 10. Notification Center ====================
@router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    notifications = []
    # Low stock alerts
    inventory = await udb.inventory.find({}, {"_id": 0}).to_list(10000)
    products = {p["id"]: p for p in await udb.products.find({}, {"_id": 0}).to_list(10000)}
    for inv in inventory:
        product = products.get(inv.get("product_id"))
        if product and inv.get("quantity", 0) <= product.get("min_stock", 5):
            notifications.append({"type": "stock_low", "severity": "warning", "title": f"{product['name']} low stock", "detail": f"Current: {inv['quantity']}, Min: {product.get('min_stock', 5)}", "product_id": inv["product_id"]})
    # Overdue accounts
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    overdue = await udb.accounts.find({"status": {"$ne": "paid"}, "due_date": {"$lt": today}}, {"_id": 0}).to_list(100)
    for acc in overdue:
        notifications.append({"type": "overdue_account", "severity": "error", "title": f"Overdue: {acc.get('party_name')}", "detail": f"${acc.get('amount', 0)} due {acc.get('due_date')}", "account_id": acc["id"]})
    # Pending online orders
    pending_online = await udb.online_orders.count_documents({"order_status": {"$in": ["pending", "confirmed"]}})
    if pending_online > 0:
        notifications.append({"type": "pending_orders", "severity": "info", "title": f"{pending_online} pending online orders", "detail": "Orders waiting for processing"})
    return {"count": len(notifications), "items": notifications}

# ==================== Commission Rules & Calculation ====================
@router.get("/settings/commission-rules")
async def get_commission_rules(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    rules = await udb.system_settings.find_one({"key": "commission_rules"}, {"_id": 0})
    if not rules:
        return {"tiers": [
            {"name": "base", "min_progress": 0, "rate": 3},
            {"name": "standard", "min_progress": 60, "rate": 5},
            {"name": "excellent", "min_progress": 100, "rate": 8}
        ]}
    return {k: v for k, v in rules.items() if k != "key"}

@router.put("/settings/commission-rules")
async def update_commission_rules(data: Dict, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    data["key"] = "commission_rules"
    await udb.system_settings.update_one({"key": "commission_rules"}, {"$set": data}, upsert=True)
    await log_audit(current_user["user_id"], current_user["username"], "update", "commission_rules", "", "Commission rules updated", audit_db=udb)
    return {"message": "Commission rules updated"}

@router.get("/reports/commission")
async def get_commission_report(month: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    if not month:
        month = datetime.now(timezone.utc).strftime("%Y-%m")
    start = f"{month}-01T00:00:00"
    end_dt = datetime.strptime(f"{month}-01", "%Y-%m-%d")
    if end_dt.month == 12:
        next_month = end_dt.replace(year=end_dt.year + 1, month=1)
    else:
        next_month = end_dt.replace(month=end_dt.month + 1)
    end = next_month.strftime("%Y-%m-%dT00:00:00")
    
    rules_doc = await udb.system_settings.find_one({"key": "commission_rules"}, {"_id": 0})
    tiers = (rules_doc or {}).get("tiers", [
        {"name": "base", "min_progress": 0, "rate": 3},
        {"name": "standard", "min_progress": 60, "rate": 5},
        {"name": "excellent", "min_progress": 100, "rate": 8}
    ])
    tiers.sort(key=lambda x: x["min_progress"], reverse=True)
    
    employees = await udb.users.find({}, {"_id": 0}).to_list(200)
    targets = await udb.sales_targets.find({"start_date": {"$lte": end}, "end_date": {"$gte": start}}, {"_id": 0}).to_list(200)
    target_map = {}
    for t in targets:
        if t.get("employee_id"):
            target_map[t["employee_id"]] = t.get("target_amount", 0)
    
    orders = await udb.sales_orders.find({"created_at": {"$gte": start, "$lt": end}}, {"_id": 0}).to_list(10000)
    sales_by_emp = {}
    for o in orders:
        uid = o.get("created_by", "")
        sales_by_emp[uid] = sales_by_emp.get(uid, 0) + o.get("total_amount", 0)
    
    result = []
    total_commission = 0
    for emp in employees:
        eid = emp["id"]
        sales = round(sales_by_emp.get(eid, 0), 2)
        target = target_map.get(eid, 0)
        progress = round(sales / target * 100, 1) if target > 0 else (100 if sales > 0 else 0)
        rate = 0
        tier_name = ""
        for tier in tiers:
            if progress >= tier["min_progress"]:
                rate = tier["rate"]
                tier_name = tier["name"]
                break
        commission = round(sales * rate / 100, 2)
        total_commission += commission
        result.append({
            "employee_id": eid, "employee_name": emp.get("name") or emp.get("username"),
            "role": emp.get("role", "staff"), "sales": sales, "target": target,
            "progress": progress, "rate": rate, "tier": tier_name,
            "commission": commission
        })
    result.sort(key=lambda x: x["commission"], reverse=True)
    return {"month": month, "employees": result, "total_commission": round(total_commission, 2)}

@router.get("/reports/daily-commission")
async def get_daily_commission(date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    start = f"{date}T00:00:00"
    end = f"{date}T23:59:59"
    
    rules_doc = await udb.system_settings.find_one({"key": "commission_rules"}, {"_id": 0})
    tiers = (rules_doc or {}).get("tiers", [
        {"name": "base", "min_progress": 0, "rate": 3},
        {"name": "standard", "min_progress": 60, "rate": 5},
        {"name": "excellent", "min_progress": 100, "rate": 8}
    ])
    base_rate = min(t["rate"] for t in tiers) if tiers else 3
    
    employees = await udb.users.find({}, {"_id": 0}).to_list(200)
    emp_map = {e["id"]: e.get("name") or e.get("username") for e in employees}
    
    orders = await udb.sales_orders.find({"created_at": {"$gte": start, "$lte": end}}, {"_id": 0}).to_list(10000)
    daily = {}
    for o in orders:
        uid = o.get("created_by", "")
        if uid not in daily:
            daily[uid] = {"employee_name": emp_map.get(uid, "?"), "sales": 0, "count": 0}
        daily[uid]["sales"] += o.get("total_amount", 0)
        daily[uid]["count"] += 1
    
    result = []
    for uid, data in daily.items():
        est_commission = round(data["sales"] * base_rate / 100, 2)
        result.append({**data, "employee_id": uid, "sales": round(data["sales"], 2), "estimated_commission": est_commission})
    result.sort(key=lambda x: x["sales"], reverse=True)
    return {"date": date, "employees": result}

