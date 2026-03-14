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

# ==================== Purchase Order Routes ====================

@router.post("/purchase-orders", response_model=PurchaseOrderResponse)
async def create_purchase_order(order: PurchaseOrderCreate, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    order_id = generate_id()
    order_no = generate_order_no("PO")
    
    total_amount = sum(item.amount for item in order.items)
    
    order_doc = {
        "id": order_id,
        "order_no": order_no,
        "supplier_id": order.supplier_id,
        "warehouse_id": order.warehouse_id,
        "items": [item.model_dump() for item in order.items],
        "total_amount": total_amount,
        "status": "pending",
        "notes": order.notes,
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await udb.purchase_orders.insert_one(order_doc)
    return PurchaseOrderResponse(**order_doc)

@router.get("/purchase-orders", response_model=List[PurchaseOrderResponse])
async def get_purchase_orders(
    status: Optional[str] = None,
    supplier_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    udb = get_user_db(current_user)
    query = {}
    if status:
        query["status"] = status
    if supplier_id:
        query["supplier_id"] = supplier_id
    
    orders = await udb.purchase_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [PurchaseOrderResponse(**o) for o in orders]

@router.put("/purchase-orders/{order_id}/receive")
async def receive_purchase_order(order_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    order = await udb.purchase_orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="采购单不存在")
    
    if order["status"] != "pending":
        raise HTTPException(status_code=400, detail="订单状态不允许入库")
    
    # Update inventory
    for item in order["items"]:
        existing = await udb.inventory.find_one({
            "product_id": item["product_id"],
            "warehouse_id": order["warehouse_id"]
        })
        
        if existing:
            await udb.inventory.update_one(
                {"product_id": item["product_id"], "warehouse_id": order["warehouse_id"]},
                {"$inc": {"quantity": item["quantity"]}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        else:
            await udb.inventory.insert_one({
                "id": generate_id(),
                "product_id": item["product_id"],
                "warehouse_id": order["warehouse_id"],
                "quantity": item["quantity"],
                "reserved": 0,
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
    
    # Update order status
    await udb.purchase_orders.update_one(
        {"id": order_id},
        {"$set": {"status": "received", "received_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "入库成功"}

# ==================== 7. Purchase Returns ====================
@router.post("/purchase-returns")
async def create_purchase_return(data: Dict, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    return_id = generate_id()
    return_no = generate_order_no("PR")
    total = sum(item.get("amount", 0) for item in data.get("items", []))
    doc = {
        "id": return_id, "return_no": return_no,
        "supplier_id": data.get("supplier_id"), "purchase_order_id": data.get("purchase_order_id"),
        "items": data.get("items", []), "total_amount": total,
        "reason": data.get("reason", ""), "status": "pending",
        "created_by": current_user["user_id"], "created_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.purchase_returns.insert_one(doc)
    del doc["_id"]
    # Deduct inventory
    warehouse = await udb.warehouses.find_one({"is_main": True}, {"_id": 0})
    if warehouse:
        for item in data.get("items", []):
            await udb.inventory.update_one(
                {"product_id": item["product_id"], "warehouse_id": warehouse["id"]},
                {"$inc": {"quantity": -item.get("quantity", 0)}}
            )
    await log_audit(current_user["user_id"], current_user["username"], "create", "purchase_return", return_id, f"${total}", audit_db=udb)
    return doc

@router.get("/purchase-returns")
async def get_purchase_returns(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    return await udb.purchase_returns.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@router.put("/purchase-returns/{return_id}/approve")
async def approve_purchase_return(return_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    result = await udb.purchase_returns.update_one({"id": return_id}, {"$set": {"status": "approved"}})
    if result.matched_count == 0: raise HTTPException(404, "Return not found")
    return {"status": "approved"}

