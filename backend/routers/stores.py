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

# ==================== Store Routes ====================

@router.post("/stores", response_model=StoreResponse)
async def create_store(store: StoreCreate, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    store_id = generate_id()
    store_doc = {
        "id": store_id,
        **store.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.stores.insert_one(store_doc)
    return StoreResponse(**store_doc)

@router.get("/stores", response_model=List[StoreResponse])
async def get_stores(type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    query = {}
    if type:
        query["type"] = type
    stores = await udb.stores.find(query, {"_id": 0}).to_list(1000)
    return [StoreResponse(**s) for s in stores]

@router.get("/stores/{store_id}", response_model=StoreResponse)
async def get_store(store_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    store = await udb.stores.find_one({"id": store_id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="门店不存在")
    return StoreResponse(**store)

@router.put("/stores/{store_id}", response_model=StoreResponse)
async def update_store(store_id: str, store: StoreCreate, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    result = await udb.stores.update_one({"id": store_id}, {"$set": store.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="门店不存在")
    updated = await udb.stores.find_one({"id": store_id}, {"_id": 0})
    return StoreResponse(**updated)

@router.delete("/stores/{store_id}")
async def delete_store(store_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    result = await udb.stores.delete_one({"id": store_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="门店不存在")
    return {"message": "删除成功"}

