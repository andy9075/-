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

# ==================== Online Shop Routes ====================

@router.get("/shop/{tenant_id}/products", response_model=List[dict])
async def get_shop_products(
    tenant_id: str,
    category_id: Optional[str] = None,
    search: Optional[str] = None
):
    """Public endpoint for tenant's online shop"""
    tenant = await master_db.tenants.find_one({"id": tenant_id, "status": "active"})
    if not tenant:
        raise HTTPException(404, "Shop not found")
    shop_db = get_tenant_db(tenant_id)
    query = {"status": "active"}
    if category_id:
        query["category_id"] = category_id
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"code": {"$regex": search, "$options": "i"}}
        ]
    products = await shop_db.products.find(query, {"_id": 0}).to_list(1000)
    main_warehouse = await shop_db.warehouses.find_one({"is_main": True})
    result = []
    for product in products:
        inv = None
        if main_warehouse:
            inv = await shop_db.inventory.find_one({"product_id": product["id"], "warehouse_id": main_warehouse["id"]}, {"_id": 0})
        product["stock"] = inv["quantity"] if inv else 0
        result.append(product)
    return result

@router.get("/shop/{tenant_id}/categories", response_model=List[CategoryResponse])
async def get_shop_categories(tenant_id: str):
    """Public endpoint for tenant's shop categories"""
    tenant = await master_db.tenants.find_one({"id": tenant_id, "status": "active"})
    if not tenant:
        raise HTTPException(404, "Shop not found")
    shop_db = get_tenant_db(tenant_id)
    categories = await shop_db.categories.find({}, {"_id": 0}).sort("sort_order", 1).to_list(1000)
    return [CategoryResponse(**c) for c in categories]

@router.get("/shop/{tenant_id}/info")
async def get_shop_info(tenant_id: str):
    """Public endpoint to get shop name/info"""
    tenant = await master_db.tenants.find_one({"id": tenant_id, "status": "active"}, {"_id": 0})
    if not tenant:
        raise HTTPException(404, "Shop not found")
    return {"id": tenant["id"], "name": tenant.get("name", ""), "contact_phone": tenant.get("contact_phone", "")}

@router.post("/shop/{tenant_id}/orders", response_model=OnlineOrderResponse)
async def create_online_order(tenant_id: str, order: OnlineOrderCreate):
    """Create online shop order for a specific tenant"""
    tenant = await master_db.tenants.find_one({"id": tenant_id, "status": "active"})
    if not tenant:
        raise HTTPException(404, "Shop not found")
    shop_db = get_tenant_db(tenant_id)
    order_id = generate_id()
    order_no = generate_order_no("ON")
    main_warehouse = await shop_db.warehouses.find_one({"is_main": True})
    if not main_warehouse:
        raise HTTPException(status_code=400, detail="Warehouse not configured")
    total_amount = sum(item.amount for item in order.items)
    shipping_fee = 0.0 if total_amount >= 100 else 10.0
    for item in order.items:
        inv = await shop_db.inventory.find_one({"product_id": item.product_id, "warehouse_id": main_warehouse["id"]})
        if not inv or inv["quantity"] < item.quantity:
            product = await shop_db.products.find_one({"id": item.product_id})
            raise HTTPException(status_code=400, detail=f"{product['name'] if product else ''} out of stock")
        await shop_db.inventory.update_one({"product_id": item.product_id, "warehouse_id": main_warehouse["id"]}, {"$inc": {"reserved": item.quantity}})
    online_items = []
    for item in order.items:
        item_dict = item.model_dump()
        product = await shop_db.products.find_one({"id": item.product_id})
        if product:
            item_dict["product_name"] = product["name"]
        online_items.append(item_dict)
    order_doc = {
        "id": order_id, "order_no": order_no, "customer_id": order.customer_id,
        "items": online_items, "total_amount": total_amount, "shipping_fee": shipping_fee,
        "shipping_address": order.shipping_address, "shipping_phone": order.shipping_phone,
        "shipping_name": order.shipping_name, "payment_method": order.payment_method,
        "payment_reference": order.payment_reference, "payment_status": "pending",
        "order_status": "pending", "warehouse_id": main_warehouse["id"],
        "notes": order.notes, "created_at": datetime.now(timezone.utc).isoformat()
    }
    await shop_db.online_orders.insert_one(order_doc)
    return OnlineOrderResponse(**order_doc)

@router.get("/shop/{tenant_id}/orders/{order_no}")
async def lookup_shop_order(tenant_id: str, order_no: str):
    """Public: look up order status by order number"""
    tenant = await master_db.tenants.find_one({"id": tenant_id, "status": "active"})
    if not tenant:
        raise HTTPException(404, "Shop not found")
    shop_db = get_tenant_db(tenant_id)
    order = await shop_db.online_orders.find_one({"order_no": order_no}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    return order

@router.get("/shop/{tenant_id}/exchange-rates")
async def get_shop_exchange_rates(tenant_id: str):
    """Public: get tenant exchange rates for shop"""
    tenant = await master_db.tenants.find_one({"id": tenant_id, "status": "active"})
    if not tenant:
        raise HTTPException(404, "Shop not found")
    shop_db = get_tenant_db(tenant_id)
    settings = await shop_db.settings.find_one({"type": "exchange_rates"}, {"_id": 0})
    if not settings:
        settings = {"type": "exchange_rates", "usd_to_ves": 36.5, "default_currency": "USD", "local_currency": "VES", "local_currency_symbol": "Bs."}
    return settings

@router.get("/shop/{tenant_id}/payment-settings")
async def get_shop_payment_settings(tenant_id: str):
    """Public: get tenant payment settings for shop checkout"""
    tenant = await master_db.tenants.find_one({"id": tenant_id, "status": "active"})
    if not tenant:
        raise HTTPException(404, "Shop not found")
    shop_db = get_tenant_db(tenant_id)
    settings = await shop_db.settings.find_one({"type": "payment"}, {"_id": 0})
    if not settings:
        settings = {"type": "payment", "transfer_enabled": True, "transfer_bank_name": "", "transfer_account": "", "mobile_pay_enabled": False}
    return settings

@router.get("/shop/orders", response_model=List[OnlineOrderResponse])
async def get_online_orders(
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    udb = get_user_db(current_user)
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    if status:
        query["order_status"] = status
    
    orders = await udb.online_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [OnlineOrderResponse(**o) for o in orders]

@router.put("/shop/orders/{order_id}/pay")
async def pay_online_order(order_id: str):
    order = await db.online_orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    await db.online_orders.update_one(
        {"id": order_id},
        {"$set": {"payment_status": "paid", "order_status": "processing"}}
    )
    
    return {"message": "支付成功"}

@router.get("/shop/order-lookup")
async def lookup_order(order_no: Optional[str] = None, phone: Optional[str] = None):
    """Public endpoint - lookup order by order number or phone"""
    if not order_no and not phone:
        raise HTTPException(status_code=400, detail="请提供订单号或手机号")
    
    query = {}
    if order_no:
        query["order_no"] = order_no
    if phone:
        query["shipping_phone"] = phone
    
    orders = await db.online_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Get product details for each order
    result = []
    for order in orders:
        items_with_details = []
        for item in order.get("items", []):
            product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
            items_with_details.append({
                **item,
                "product_name": product["name"] if product else "Unknown",
                "product_code": product["code"] if product else ""
            })
        order["items"] = items_with_details
        result.append(order)
    
    return result

@router.put("/shop/orders/{order_id}/ship")
async def ship_online_order(order_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    order = await udb.online_orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if order["payment_status"] != "paid":
        raise HTTPException(status_code=400, detail="订单未支付")
    
    # Deduct inventory from warehouse
    for item in order["items"]:
        await udb.inventory.update_one(
            {"product_id": item["product_id"], "warehouse_id": order["warehouse_id"]},
            {"$inc": {"quantity": -item["quantity"], "reserved": -item["quantity"]}}
        )
    
    await udb.online_orders.update_one(
        {"id": order_id},
        {"$set": {"order_status": "shipped", "shipped_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "发货成功"}

@router.put("/shop/orders/{order_id}/complete")
async def complete_online_order(order_id: str):
    order = await db.online_orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    await db.online_orders.update_one(
        {"id": order_id},
        {"$set": {"order_status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Update customer points
    if order.get("customer_id"):
        points_earned = int(order["total_amount"] / 10)
        await db.customers.update_one(
            {"id": order["customer_id"]},
            {"$inc": {"points": points_earned}}
        )
    
    return {"message": "订单完成"}

