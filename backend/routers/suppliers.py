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

# ==================== Supplier Routes ====================

@router.post("/suppliers", response_model=SupplierResponse)
async def create_supplier(supplier: SupplierCreate, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    supplier_id = generate_id()
    supplier_doc = {
        "id": supplier_id,
        **supplier.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.suppliers.insert_one(supplier_doc)
    return SupplierResponse(**supplier_doc)

@router.get("/suppliers", response_model=List[SupplierResponse])
async def get_suppliers(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    suppliers = await udb.suppliers.find({}, {"_id": 0}).to_list(1000)
    return [SupplierResponse(**s) for s in suppliers]

@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(supplier_id: str, supplier: SupplierCreate, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    result = await udb.suppliers.update_one({"id": supplier_id}, {"$set": supplier.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="供应商不存在")
    updated = await udb.suppliers.find_one({"id": supplier_id}, {"_id": 0})
    return SupplierResponse(**updated)

@router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    result = await udb.suppliers.delete_one({"id": supplier_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="供应商不存在")
    return {"message": "删除成功"}

