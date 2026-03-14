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

# ==================== Auth Routes ====================

@router.post("/auth/register", response_model=dict)
async def register(user: UserCreate):
    existing = await db.users.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    
    user_id = generate_id()
    user_doc = {
        "id": user_id,
        "username": user.username,
        "password": hash_password(user.password),
        "role": user.role,
        "store_id": user.store_id,
        "name": user.name,
        "phone": user.phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id, user.username, user.role)
    return {"token": token, "user": {k: v for k, v in user_doc.items() if k != "password"}}

@router.post("/auth/login", response_model=dict)
async def login(user: UserLogin):
    db_user = await db.users.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    token = create_token(db_user["id"], db_user["username"], db_user["role"])
    return {"token": token, "user": {k: v for k, v in db_user.items() if k not in ["password", "_id"]}}

@router.get("/auth/me", response_model=dict)
async def get_me(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    user = await udb.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if current_user.get("tenant_id"):
        user["tenant_id"] = current_user["tenant_id"]
    return user

@router.get("/auth/cashiers")
async def get_cashiers(current_user: dict = Depends(get_current_user)):
    """List users for POS login selection"""
    udb = get_user_db(current_user)
    users = await udb.users.find({}, {"_id": 0, "password": 0}).to_list(100)
    return [{"id": u["id"], "username": u["username"], "name": u.get("name", ""), "role": u.get("role", "staff")} for u in users]
# ==================== Init Data ====================

@router.post("/init-data")
async def init_data():
    """Initialize default data"""
    # Check if admin exists
    admin = await db.users.find_one({"username": "admin"})
    if not admin:
        await db.users.insert_one({
            "id": generate_id(),
            "username": "admin",
            "password": hash_password("admin123"),
            "role": "admin",
            "store_id": None,
            "name": "系统管理员",
            "phone": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Check if main warehouse exists
    main_wh = await db.warehouses.find_one({"is_main": True})
    if not main_wh:
        await db.warehouses.insert_one({
            "id": generate_id(),
            "code": "WH001",
            "name": "总部仓库",
            "address": "总部",
            "is_main": True,
            "store_id": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"message": "初始化完成"}

