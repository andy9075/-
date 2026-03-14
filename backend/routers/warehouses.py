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

# ==================== Warehouse Routes ====================

@router.post("/warehouses", response_model=WarehouseResponse)
async def create_warehouse(warehouse: WarehouseCreate, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    warehouse_id = generate_id()
    warehouse_doc = {
        "id": warehouse_id,
        **warehouse.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.warehouses.insert_one(warehouse_doc)
    return WarehouseResponse(**warehouse_doc)

@router.get("/warehouses", response_model=List[WarehouseResponse])
async def get_warehouses(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    warehouses = await udb.warehouses.find({}, {"_id": 0}).to_list(1000)
    return [WarehouseResponse(**w) for w in warehouses]

@router.get("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
async def get_warehouse(warehouse_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    warehouse = await udb.warehouses.find_one({"id": warehouse_id}, {"_id": 0})
    if not warehouse:
        raise HTTPException(status_code=404, detail="仓库不存在")
    return WarehouseResponse(**warehouse)

@router.get("/warehouses/main/info", response_model=WarehouseResponse)
async def get_main_warehouse(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    warehouse = await udb.warehouses.find_one({"is_main": True}, {"_id": 0})
    if not warehouse:
        raise HTTPException(status_code=404, detail="总部仓库不存在")
    return WarehouseResponse(**warehouse)

