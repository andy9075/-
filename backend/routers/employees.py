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

# ==================== Employee Management ====================

@router.get("/employees", response_model=List[UserResponse])
async def get_employees(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    users = await udb.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@router.post("/employees")
async def create_employee(user: UserCreate, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    existing = await udb.users.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username exists")
    user_id = generate_id()
    user_doc = {
        "id": user_id,
        "username": user.username,
        "password": hash_password(user.password),
        "role": user.role,
        "store_id": user.store_id,
        "name": user.name,
        "phone": user.phone,
        "permissions": user.permissions,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.users.insert_one(user_doc)
    return {k: v for k, v in user_doc.items() if k not in ("password", "_id")}

@router.put("/employees/{user_id}")
async def update_employee(user_id: str, user: UserCreate, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    update_data = {
        "name": user.name, "phone": user.phone, "role": user.role,
        "store_id": user.store_id, "permissions": user.permissions
    }
    if user.password:
        update_data["password"] = hash_password(user.password)
    await udb.users.update_one({"id": user_id}, {"$set": update_data})
    return {"message": "Employee updated"}

@router.delete("/employees/{user_id}")
async def delete_employee(user_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    if current_user.get("user_id", current_user.get("id")) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    await udb.users.delete_one({"id": user_id})
    return {"message": "Employee deleted"}

# ==================== 5. Employee Attendance ====================
@router.post("/attendance/clock-in")
async def clock_in(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    existing = await udb.attendance.find_one({"user_id": current_user["user_id"], "date": today})
    if existing: raise HTTPException(400, "Already clocked in today")
    record = {
        "id": generate_id(), "user_id": current_user["user_id"],
        "username": current_user["username"], "date": today,
        "clock_in": datetime.now(timezone.utc).isoformat(), "clock_out": None,
        "hours": 0, "status": "present"
    }
    await udb.attendance.insert_one(record)
    del record["_id"]
    return record

@router.post("/attendance/clock-out")
async def clock_out(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    record = await udb.attendance.find_one({"user_id": current_user["user_id"], "date": today})
    if not record: raise HTTPException(400, "Not clocked in")
    if record.get("clock_out"): raise HTTPException(400, "Already clocked out")
    now = datetime.now(timezone.utc)
    clock_in_time = datetime.fromisoformat(record["clock_in"])
    hours = round((now - clock_in_time).total_seconds() / 3600, 2)
    await udb.attendance.update_one({"id": record["id"]}, {"$set": {"clock_out": now.isoformat(), "hours": hours}})
    return {"clock_out": now.isoformat(), "hours": hours}

@router.get("/attendance")
async def get_attendance(start_date: Optional[str] = None, end_date: Optional[str] = None, user_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    query = {}
    if user_id: query["user_id"] = user_id
    if start_date: query["date"] = {"$gte": start_date}
    if end_date: query.setdefault("date", {})["$lte"] = end_date
    records = await udb.attendance.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return records

# ==================== Role Permission Check ====================

# SaaS Plan Features
PLAN_FEATURES = {
    "basic": {"pos": True, "products": True, "inventory": True, "customers": True, "reports_basic": True,
              "online_shop": False, "reports_advanced": False, "promotions": False, "wholesale": False,
              "commission": False, "multi_store": False, "api_access": False, "max_users": 5, "max_stores": 1},
    "pro": {"pos": True, "products": True, "inventory": True, "customers": True, "reports_basic": True,
            "online_shop": True, "reports_advanced": True, "promotions": True, "wholesale": True,
            "commission": False, "multi_store": True, "api_access": False, "max_users": 15, "max_stores": 5},
    "enterprise": {"pos": True, "products": True, "inventory": True, "customers": True, "reports_basic": True,
                   "online_shop": True, "reports_advanced": True, "promotions": True, "wholesale": True,
                   "commission": True, "multi_store": True, "api_access": True, "max_users": 999, "max_stores": 999},
}

@router.get("/auth/permissions")
async def get_permissions(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    user = await udb.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not user: raise HTTPException(404, "User not found")
    role = user.get("role", "staff")
    perms = user.get("permissions", {})
    role_defaults = {
        "admin": {"can_access_pos": True, "can_discount": True, "can_refund": True, "can_void": True, "can_export": True, "can_manage_employees": True, "can_view_reports": True, "can_manage_settings": True, "can_manage_products": True, "can_manage_inventory": True, "can_manage_purchases": True, "can_manage_customers": True, "can_view_cost_price": True, "can_manage_promotions": True, "max_discount": 100},
        "manager": {"can_access_pos": True, "can_discount": True, "can_refund": True, "can_void": True, "can_export": True, "can_manage_employees": False, "can_view_reports": True, "can_manage_settings": False, "can_manage_products": True, "can_manage_inventory": True, "can_manage_purchases": True, "can_manage_customers": True, "can_view_cost_price": True, "can_manage_promotions": True, "max_discount": 50},
        "cashier": {"can_access_pos": True, "can_discount": False, "can_refund": False, "can_void": False, "can_export": False, "can_manage_employees": False, "can_view_reports": False, "can_manage_settings": False, "can_manage_products": False, "can_manage_inventory": False, "can_manage_purchases": False, "can_manage_customers": False, "can_view_cost_price": False, "can_manage_promotions": False, "max_discount": 0},
        "staff": {"can_access_pos": True, "can_discount": False, "can_refund": False, "can_void": False, "can_export": False, "can_manage_employees": False, "can_view_reports": False, "can_manage_settings": False, "can_manage_products": False, "can_manage_inventory": True, "can_manage_purchases": False, "can_manage_customers": False, "can_view_cost_price": False, "can_manage_promotions": False, "max_discount": 0},
    }
    defaults = role_defaults.get(role, role_defaults["staff"])
    defaults.update(perms)
    # Get plan features if tenant user
    plan_features = {}
    if current_user.get("tenant_id"):
        tenant = await master_db.tenants.find_one({"id": current_user["tenant_id"]}, {"_id": 0})
        plan = tenant.get("plan", "basic") if tenant else "basic"
        plan_features = PLAN_FEATURES.get(plan, PLAN_FEATURES["basic"])
    else:
        plan_features = PLAN_FEATURES["enterprise"]
    return {"role": role, "permissions": defaults, "plan_features": plan_features}
