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

# ==================== Category Routes ====================

@router.post("/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    category_id = generate_id()
    category_doc = {
        "id": category_id,
        **category.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.categories.insert_one(category_doc)
    return CategoryResponse(**category_doc)

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    categories = await udb.categories.find({}, {"_id": 0}).sort("sort_order", 1).to_list(1000)
    return [CategoryResponse(**c) for c in categories]

@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    result = await udb.categories.update_one({"id": category_id}, {"$set": category.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="分类不存在")
    updated = await udb.categories.find_one({"id": category_id}, {"_id": 0})
    return CategoryResponse(**updated)

@router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    result = await udb.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="分类不存在")
    return {"message": "删除成功"}

