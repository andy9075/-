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

# ==================== Inventory Routes ====================

@router.get("/inventory", response_model=List[dict])
async def get_inventory(
    warehouse_id: Optional[str] = None,
    product_id: Optional[str] = None,
    low_stock: bool = False,
    current_user: dict = Depends(get_current_user)
):
    udb = get_user_db(current_user)
    query = {}
    if warehouse_id:
        query["warehouse_id"] = warehouse_id
    if product_id:
        query["product_id"] = product_id
    
    inventory = await udb.inventory.find(query, {"_id": 0}).to_list(10000)
    
    result = []
    for inv in inventory:
        product = await udb.products.find_one({"id": inv["product_id"]}, {"_id": 0})
        warehouse = await udb.warehouses.find_one({"id": inv["warehouse_id"]}, {"_id": 0})
        inv["product"] = product
        inv["warehouse"] = warehouse
        inv["available"] = inv["quantity"] - inv.get("reserved", 0)
        
        if low_stock and product:
            if inv["quantity"] > product.get("min_stock", 0):
                continue
        result.append(inv)
    
    return result

@router.post("/inventory/adjust")
async def adjust_inventory(adjust: InventoryAdjust, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    existing = await udb.inventory.find_one({
        "product_id": adjust.product_id,
        "warehouse_id": adjust.warehouse_id
    })
    
    if existing:
        new_qty = existing["quantity"] + adjust.quantity
        if new_qty < 0:
            raise HTTPException(status_code=400, detail="库存不足")
        await udb.inventory.update_one(
            {"product_id": adjust.product_id, "warehouse_id": adjust.warehouse_id},
            {"$set": {"quantity": new_qty, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        if adjust.quantity < 0:
            raise HTTPException(status_code=400, detail="库存不足")
        await udb.inventory.insert_one({
            "id": generate_id(),
            "product_id": adjust.product_id,
            "warehouse_id": adjust.warehouse_id,
            "quantity": adjust.quantity,
            "reserved": 0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Record adjustment log
    await udb.inventory_logs.insert_one({
        "id": generate_id(),
        "product_id": adjust.product_id,
        "warehouse_id": adjust.warehouse_id,
        "quantity": adjust.quantity,
        "reason": adjust.reason,
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "库存调整成功"}

@router.post("/inventory/transfer")
async def transfer_inventory(
    product_id: str,
    from_warehouse_id: str,
    to_warehouse_id: str,
    quantity: int,
    current_user: dict = Depends(get_current_user)
):
    # Check source inventory
    udb = get_user_db(current_user)
    source = await udb.inventory.find_one({
        "product_id": product_id,
        "warehouse_id": from_warehouse_id
    })
    
    if not source or source["quantity"] < quantity:
        raise HTTPException(status_code=400, detail="源仓库库存不足")
    
    # Decrease source
    await udb.inventory.update_one(
        {"product_id": product_id, "warehouse_id": from_warehouse_id},
        {"$inc": {"quantity": -quantity}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Increase destination
    dest = await udb.inventory.find_one({
        "product_id": product_id,
        "warehouse_id": to_warehouse_id
    })
    
    if dest:
        await udb.inventory.update_one(
            {"product_id": product_id, "warehouse_id": to_warehouse_id},
            {"$inc": {"quantity": quantity}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        await udb.inventory.insert_one({
            "id": generate_id(),
            "product_id": product_id,
            "warehouse_id": to_warehouse_id,
            "quantity": quantity,
            "reserved": 0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Record transfer log
    await udb.transfer_logs.insert_one({
        "id": generate_id(),
        "product_id": product_id,
        "from_warehouse_id": from_warehouse_id,
        "to_warehouse_id": to_warehouse_id,
        "quantity": quantity,
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "库存调拨成功"}


@router.get("/transfer-logs")
async def get_transfer_logs(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    logs = await udb.transfer_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return logs


# ==================== Stock Alerts ====================

@router.get("/stock-alerts")
async def get_stock_alerts(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    products = await udb.products.find({"status": "active"}, {"_id": 0}).to_list(5000)
    alerts = []
    for p in products:
        inv_docs = await udb.inventory.find({"product_id": p["id"]}, {"_id": 0}).to_list(100)
        total_stock = sum(i.get("quantity", 0) for i in inv_docs)
        min_stock = p.get("min_stock", 0)
        if min_stock > 0 and total_stock <= min_stock:
            alerts.append({
                "product_id": p["id"], "product_code": p["code"], "product_name": p["name"],
                "current_stock": total_stock, "min_stock": min_stock,
                "level": "critical" if total_stock == 0 else "warning"
            })
    return alerts

# ==================== Stock Taking / Inventory Count ====================

@router.post("/stock-taking")
async def create_stock_taking(data: Dict, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    taking_id = generate_id()
    taking_doc = {
        "id": taking_id,
        "taking_no": generate_order_no("ST"),
        "warehouse_id": data.get("warehouse_id"),
        "items": data.get("items", []),  # [{product_id, system_qty, actual_qty, difference}]
        "status": data.get("status", "draft"),
        "notes": data.get("notes", ""),
        "created_by": current_user.get("user_id", current_user.get("id")),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.stock_takings.insert_one(taking_doc)
    
    # If confirmed, adjust inventory
    if data.get("status") == "confirmed":
        for item in data.get("items", []):
            diff = item.get("actual_qty", 0) - item.get("system_qty", 0)
            if diff != 0:
                await udb.inventory.update_one(
                    {"product_id": item["product_id"], "warehouse_id": data["warehouse_id"]},
                    {"$inc": {"quantity": diff}}
                )
    
    return {k: v for k, v in taking_doc.items() if k != "_id"}

@router.get("/stock-takings")
async def get_stock_takings(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    takings = await udb.stock_takings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return takings

