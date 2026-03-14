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

# ==================== Multi-Tenant Management ====================
@router.post("/tenants")
async def create_tenant(data: Dict, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin" or current_user.get("tenant_id"):
        raise HTTPException(403, "Super admin only")
    tenant_id = generate_id()[:8]
    tenant = {
        "id": tenant_id, "name": data.get("name", ""),
        "contact_name": data.get("contact_name", ""),
        "contact_phone": data.get("contact_phone", ""),
        "plan": data.get("plan", "basic"),
        "status": "active", "max_users": data.get("max_users", 5),
        "max_stores": data.get("max_stores", 3),
        "is_trial": data.get("is_trial", False),
        "trial_days": data.get("trial_days", 0),
        "trial_expires_at": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    if tenant["is_trial"] and tenant["trial_days"] > 0:
        from datetime import timedelta
        tenant["trial_expires_at"] = (datetime.now(timezone.utc) + timedelta(days=tenant["trial_days"])).isoformat()
    await master_db.tenants.insert_one(tenant)
    # Create default admin user for tenant
    admin_password = data.get("admin_password", "admin123")
    admin_username = data.get("admin_username", f"admin_{tenant_id}")
    tenant_db = get_tenant_db(tenant_id)
    admin_id = generate_id()
    await tenant_db.users.insert_one({
        "id": admin_id, "username": admin_username,
        "password": hash_password(admin_password), "role": "admin",
        "name": data.get("contact_name", "Admin"), "phone": data.get("contact_phone", ""),
        "store_id": None, "permissions": {}, "created_at": datetime.now(timezone.utc).isoformat()
    })
    # Create default store
    store_id = generate_id()
    await tenant_db.stores.insert_one({
        "id": store_id, "code": "S001", "name": data.get("name", "Main Store"),
        "type": "retail", "address": "", "phone": "", "warehouse_id": None,
        "is_headquarters": True, "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    # Create default warehouse
    wh_id = generate_id()
    await tenant_db.warehouses.insert_one({
        "id": wh_id, "code": "WH001", "name": "Main Warehouse",
        "address": "", "is_main": True, "status": "active",
        "store_id": None, "created_at": datetime.now(timezone.utc).isoformat()
    })
    del tenant["_id"]
    return {**tenant, "admin_username": admin_username, "admin_password": admin_password}

@router.get("/tenants")
async def get_tenants(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin" or current_user.get("tenant_id"):
        raise HTTPException(403, "Super admin only")
    tenants = await master_db.tenants.find({}, {"_id": 0}).to_list(500)
    for t in tenants:
        tdb = get_tenant_db(t["id"])
        t["users_count"] = await tdb.users.count_documents({})
        t["orders_count"] = await tdb.sales_orders.count_documents({})
        # Check trial expiry
        if t.get("is_trial") and t.get("trial_expires_at"):
            try:
                expires = datetime.fromisoformat(t["trial_expires_at"].replace("Z", "+00:00"))
                t["trial_expired"] = datetime.now(timezone.utc) > expires
                t["trial_days_left"] = max(0, (expires - datetime.now(timezone.utc)).days)
            except Exception:
                t["trial_expired"] = False
                t["trial_days_left"] = 0
    return tenants

@router.put("/tenants/{tenant_id}")
async def update_tenant(tenant_id: str, data: Dict, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin" or current_user.get("tenant_id"):
        raise HTTPException(403, "Super admin only")
    data.pop("id", None); data.pop("_id", None)
    result = await master_db.tenants.update_one({"id": tenant_id}, {"$set": data})
    if result.matched_count == 0: raise HTTPException(404, "Tenant not found")
    return await master_db.tenants.find_one({"id": tenant_id}, {"_id": 0})

@router.put("/tenants/{tenant_id}/toggle")
async def toggle_tenant(tenant_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin" or current_user.get("tenant_id"):
        raise HTTPException(403, "Super admin only")
    tenant = await master_db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant: raise HTTPException(404, "Tenant not found")
    new_status = "inactive" if tenant.get("status") == "active" else "active"
    await master_db.tenants.update_one({"id": tenant_id}, {"$set": {"status": new_status}})
    return {"status": new_status}

@router.post("/auth/tenant-login")
async def tenant_login(data: Dict):
    tenant_id = data.get("tenant_id", "")
    username = data.get("username", "")
    password = data.get("password", "")
    if not tenant_id or not username or not password:
        raise HTTPException(400, "Missing fields")
    tenant = await master_db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant: raise HTTPException(404, "Tenant not found")
    if tenant.get("status") != "active": raise HTTPException(403, "Tenant is inactive")
    tenant_db = get_tenant_db(tenant_id)
    user = await tenant_db.users.find_one({"username": username})
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(user["id"], user["username"], user.get("role", "staff"), tenant_id)
    return {
        "token": token,
        "user": {"id": user["id"], "username": user["username"], "role": user.get("role"), "name": user.get("name"), "tenant_id": tenant_id, "tenant_name": tenant.get("name")},
        "tenant": {k: v for k, v in tenant.items() if k != "password"}
    }

@router.get("/tenants/{tenant_id}/stats")
async def get_tenant_stats(tenant_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin" or current_user.get("tenant_id"):
        raise HTTPException(403, "Super admin only")
    tdb = get_tenant_db(tenant_id)
    return {
        "users": await tdb.users.count_documents({}),
        "products": await tdb.products.count_documents({}),
        "stores": await tdb.stores.count_documents({})
    }

