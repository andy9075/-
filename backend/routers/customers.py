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

# ==================== Customer Routes ====================

@router.post("/customers", response_model=CustomerResponse)
async def create_customer(customer: CustomerCreate, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    customer_id = generate_id()
    customer_doc = {
        "id": customer_id,
        **customer.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.customers.insert_one(customer_doc)
    return CustomerResponse(**customer_doc)

@router.get("/customers", response_model=List[CustomerResponse])
async def get_customers(search: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"code": {"$regex": search, "$options": "i"}}
        ]
    customers = await udb.customers.find(query, {"_id": 0}).to_list(1000)
    return [CustomerResponse(**c) for c in customers]

@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    customer = await udb.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    return CustomerResponse(**customer)

@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, customer: CustomerCreate, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    result = await udb.customers.update_one({"id": customer_id}, {"$set": customer.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="客户不存在")
    updated = await udb.customers.find_one({"id": customer_id}, {"_id": 0})
    return CustomerResponse(**updated)

# ==================== Customer Purchase History & Points/Balance ====================
@router.get("/customers/{customer_id}/purchase-history")
async def get_customer_purchase_history(customer_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    orders = await udb.sales_orders.find({"customer_id": customer_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    total_spent = sum(o.get("total_amount", 0) for o in orders)
    return {"orders": orders, "total_spent": round(total_spent, 2), "order_count": len(orders)}

@router.post("/customers/{customer_id}/points/add")
async def add_customer_points(customer_id: str, amount: int = Query(..., gt=0), reason: str = "", current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    customer = await udb.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer: raise HTTPException(404, "Customer not found")
    new_points = customer.get("points", 0) + amount
    await udb.customers.update_one({"id": customer_id}, {"$set": {"points": new_points}})
    await udb.points_log.insert_one({"id": generate_id(), "customer_id": customer_id, "type": "earn", "amount": amount, "balance": new_points, "reason": reason, "created_by": current_user["user_id"], "created_at": datetime.now(timezone.utc).isoformat()})
    await log_audit(current_user["user_id"], current_user["username"], "points_add", "customer", customer_id, f"+{amount} points", audit_db=udb)
    return {"points": new_points}

@router.post("/customers/{customer_id}/points/redeem")
async def redeem_customer_points(customer_id: str, amount: int = Query(..., gt=0), reason: str = "", current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    customer = await udb.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer: raise HTTPException(404, "Customer not found")
    current_points = customer.get("points", 0)
    if current_points < amount: raise HTTPException(400, "Insufficient points")
    new_points = current_points - amount
    await udb.customers.update_one({"id": customer_id}, {"$set": {"points": new_points}})
    await udb.points_log.insert_one({"id": generate_id(), "customer_id": customer_id, "type": "redeem", "amount": -amount, "balance": new_points, "reason": reason, "created_by": current_user["user_id"], "created_at": datetime.now(timezone.utc).isoformat()})
    await log_audit(current_user["user_id"], current_user["username"], "points_redeem", "customer", customer_id, f"-{amount} points", audit_db=udb)
    return {"points": new_points}

@router.post("/customers/{customer_id}/balance/topup")
async def topup_customer_balance(customer_id: str, amount: float = Query(..., gt=0), reason: str = "", current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    customer = await udb.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer: raise HTTPException(404, "Customer not found")
    new_balance = round(customer.get("balance", 0) + amount, 2)
    await udb.customers.update_one({"id": customer_id}, {"$set": {"balance": new_balance}})
    await udb.balance_log.insert_one({"id": generate_id(), "customer_id": customer_id, "type": "topup", "amount": amount, "balance": new_balance, "reason": reason, "created_by": current_user["user_id"], "created_at": datetime.now(timezone.utc).isoformat()})
    await log_audit(current_user["user_id"], current_user["username"], "balance_topup", "customer", customer_id, f"+${amount}", audit_db=udb)
    return {"balance": new_balance}

@router.get("/customers/{customer_id}/points-log")
async def get_customer_points_log(customer_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    logs = await udb.points_log.find({"customer_id": customer_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return logs

@router.get("/customers/{customer_id}/balance-log")
async def get_customer_balance_log(customer_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    logs = await udb.balance_log.find({"customer_id": customer_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return logs

