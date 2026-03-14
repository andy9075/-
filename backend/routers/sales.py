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

# ==================== Sales Order Routes ====================

@router.post("/sales-orders", response_model=SalesOrderResponse)
async def create_sales_order(order: SalesOrderCreate, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    order_id = generate_id()
    order_no = generate_order_no("SO")
    
    total_amount = sum(item.amount for item in order.items)
    discount_amount = sum(item.discount for item in order.items)
    
    # Points redemption: 100 points = $1 (configurable via system settings)
    sys_settings = await udb.system_settings.find_one({"key": "system"}, {"_id": 0}) or {}
    points_per_dollar = sys_settings.get("points_per_dollar", 1)  # earn rate
    points_value_rate = sys_settings.get("points_value_rate", 100)  # 100 points = $1
    points_discount = 0.0
    if order.points_used > 0 and order.customer_id:
        customer = await udb.customers.find_one({"id": order.customer_id}, {"_id": 0})
        if not customer or customer.get("points", 0) < order.points_used:
            raise HTTPException(400, "Insufficient points")
        points_discount = order.points_used / points_value_rate
        if points_discount > total_amount:
            points_discount = total_amount
    
    final_total = total_amount - points_discount
    
    # Get store's warehouse
    store = await udb.stores.find_one({"id": order.store_id})
    warehouse_id = store.get("warehouse_id") if store else None
    
    # Check and deduct inventory
    if warehouse_id:
        for item in order.items:
            inv = await udb.inventory.find_one({
                "product_id": item.product_id,
                "warehouse_id": warehouse_id
            })
            if not inv or inv["quantity"] < item.quantity:
                product = await udb.products.find_one({"id": item.product_id})
                raise HTTPException(status_code=400, detail=f"商品 {product['name'] if product else item.product_id} 库存不足")
            
            await udb.inventory.update_one(
                {"product_id": item.product_id, "warehouse_id": warehouse_id},
                {"$inc": {"quantity": -item.quantity}}
            )
    
    # Build items with product names and tax info
    order_items = []
    tax_breakdown = {}  # {rate: {"base": ..., "tax": ...}}
    for item in order.items:
        item_dict = item.model_dump()
        product = await udb.products.find_one({"id": item.product_id})
        if product:
            item_dict["product_name"] = product["name"]
            item_dict["tax_rate"] = product.get("tax_rate", sys_settings.get("default_tax_rate", 16.0))
        else:
            item_dict["tax_rate"] = sys_settings.get("default_tax_rate", 16.0)
        # Calculate tax for this item
        rate = item_dict["tax_rate"]
        item_amount = item_dict.get("amount", 0)
        if sys_settings.get("tax_included_in_price", True):
            base = round(item_amount / (1 + rate / 100), 2)
            tax = round(item_amount - base, 2)
        else:
            base = item_amount
            tax = round(item_amount * rate / 100, 2)
        item_dict["tax_amount"] = tax
        item_dict["base_amount"] = base
        if rate not in tax_breakdown:
            tax_breakdown[rate] = {"base": 0, "tax": 0}
        tax_breakdown[rate]["base"] += base
        tax_breakdown[rate]["tax"] += tax
        order_items.append(item_dict)
    
    # Round tax breakdown
    for rate in tax_breakdown:
        tax_breakdown[rate]["base"] = round(tax_breakdown[rate]["base"], 2)
        tax_breakdown[rate]["tax"] = round(tax_breakdown[rate]["tax"], 2)
    total_tax = round(sum(v["tax"] for v in tax_breakdown.values()), 2)
    total_base = round(sum(v["base"] for v in tax_breakdown.values()), 2)
    
    order_doc = {
        "id": order_id,
        "order_no": order_no,
        "store_id": order.store_id,
        "customer_id": order.customer_id,
        "items": order_items,
        "total_amount": final_total,
        "original_amount": total_amount,
        "discount_amount": discount_amount,
        "points_used": order.points_used,
        "points_discount": round(points_discount, 2),
        "paid_amount": order.paid_amount,
        "payment_method": order.payment_method,
        "tax_breakdown": {str(k): v for k, v in tax_breakdown.items()},
        "total_tax": total_tax,
        "total_base": total_base,
        "status": "completed" if order.paid_amount >= final_total else "pending",
        "notes": order.notes,
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await udb.sales_orders.insert_one(order_doc)
    
    # Update customer points if applicable
    points_earned = 0
    if order.customer_id:
        points_earned = int(final_total * points_per_dollar)
        net_points = points_earned - order.points_used
        if net_points != 0:
            await udb.customers.update_one(
                {"id": order.customer_id},
                {"$inc": {"points": net_points}}
            )
        # Log points earned
        if points_earned > 0:
            await udb.points_log.insert_one({
                "id": generate_id(), "customer_id": order.customer_id,
                "type": "earn", "amount": points_earned,
                "reason": f"Purchase {order_no}",
                "created_by": current_user["user_id"],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        # Log points redeemed
        if order.points_used > 0:
            await udb.points_log.insert_one({
                "id": generate_id(), "customer_id": order.customer_id,
                "type": "redeem", "amount": -order.points_used,
                "reason": f"Redeem at {order_no} (-${points_discount:.2f})",
                "created_by": current_user["user_id"],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    order_doc.pop("_id", None)
    order_doc["points_earned"] = points_earned
    
    # Auto-upgrade customer VIP level
    if order.customer_id:
        rules_doc = await udb.system_settings.find_one({"key": "vip_rules"}, {"_id": 0})
        vip_levels = (rules_doc or {}).get("levels", [
            {"name": "normal", "min_spent": 0}, {"name": "silver", "min_spent": 200},
            {"name": "gold", "min_spent": 500}, {"name": "vip", "min_spent": 1000}
        ])
        vip_levels.sort(key=lambda x: x["min_spent"], reverse=True)
        all_orders = await udb.sales_orders.find({"customer_id": order.customer_id}, {"_id": 0, "total_amount": 1}).to_list(10000)
        total_spent = sum(o.get("total_amount", 0) for o in all_orders)
        for lv in vip_levels:
            if total_spent >= lv["min_spent"]:
                await udb.customers.update_one({"id": order.customer_id}, {"$set": {"member_level": lv["name"]}})
                break
    
    return SalesOrderResponse(**{k: v for k, v in order_doc.items() if k in SalesOrderResponse.model_fields})

@router.get("/sales-orders", response_model=List[SalesOrderResponse])
async def get_sales_orders(
    status: Optional[str] = None,
    store_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    udb = get_user_db(current_user)
    query = {}
    if status:
        query["status"] = status
    if store_id:
        query["store_id"] = store_id
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    
    orders = await udb.sales_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [SalesOrderResponse(**o) for o in orders]


@router.get("/sales-report")
async def get_sales_report(
    store_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    udb = get_user_db(current_user)
    query = {}
    if store_id:
        query["store_id"] = store_id
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date + "T23:59:59"
        else:
            query["created_at"] = {"$lte": end_date + "T23:59:59"}
    
    orders = await udb.sales_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(5000)
    
    # Enrich with product names and store names
    products_map = {}
    async for p in udb.products.find({}, {"_id": 0, "id": 1, "name": 1, "code": 1}):
        products_map[p["id"]] = p
    
    stores_map = {}
    async for s in udb.stores.find({}, {"_id": 0, "id": 1, "name": 1}):
        stores_map[s["id"]] = s
    
    # Build report
    store_summary = {}
    product_summary = {}
    total_sales = 0
    total_orders = len(orders)
    total_items = 0
    
    for order in orders:
        store_name = stores_map.get(order.get("store_id"), {}).get("name", "Unknown")
        order_total = order.get("total_amount", 0)
        total_sales += order_total
        
        if store_name not in store_summary:
            store_summary[store_name] = {"store_id": order.get("store_id", ""), "name": store_name, "total": 0, "orders": 0, "products": {}}
        store_summary[store_name]["total"] += order_total
        store_summary[store_name]["orders"] += 1
        
        for item in order.get("items", []):
            pid = item.get("product_id", "")
            pname = products_map.get(pid, {}).get("name", item.get("product_name", "Unknown"))
            pcode = products_map.get(pid, {}).get("code", "")
            qty = item.get("quantity", 0)
            amt = item.get("amount", 0)
            total_items += qty
            
            # Per-store product breakdown
            if pid not in store_summary[store_name]["products"]:
                store_summary[store_name]["products"][pid] = {"name": pname, "code": pcode, "quantity": 0, "amount": 0}
            store_summary[store_name]["products"][pid]["quantity"] += qty
            store_summary[store_name]["products"][pid]["amount"] += amt
            
            # Global product summary
            if pid not in product_summary:
                product_summary[pid] = {"name": pname, "code": pcode, "quantity": 0, "amount": 0}
            product_summary[pid]["quantity"] += qty
            product_summary[pid]["amount"] += amt
    
    # Convert to lists
    store_list = []
    for s in store_summary.values():
        s["products"] = list(s["products"].values())
        store_list.append(s)
    
    return {
        "total_sales": total_sales,
        "total_orders": total_orders,
        "total_items": total_items,
        "stores": store_list,
        "products": list(product_summary.values()),
        "orders": [{
            "id": o.get("id"), "order_no": o.get("order_no"), "store_id": o.get("store_id"),
            "store_name": stores_map.get(o.get("store_id"), {}).get("name", ""),
            "total_amount": o.get("total_amount", 0), "payment_method": o.get("payment_method", ""),
            "created_at": o.get("created_at", ""),
            "items": [{
                "product_name": products_map.get(it.get("product_id"), {}).get("name", it.get("product_name", "")),
                "product_code": products_map.get(it.get("product_id"), {}).get("code", ""),
                "quantity": it.get("quantity", 0), "unit_price": it.get("unit_price", 0), "amount": it.get("amount", 0)
            } for it in o.get("items", [])]
        } for o in orders]
    }


# ==================== Refund/Return ====================

@router.get("/sales-orders/{order_no}/detail")
async def get_order_detail(order_no: str, current_user: dict = Depends(get_current_user)):
    """Get order detail with product info for refund lookup"""
    udb = get_user_db(current_user)
    order = await udb.sales_orders.find_one({"order_no": order_no}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    for item in order.get("items", []):
        product = await udb.products.find_one({"id": item.get("product_id")}, {"_id": 0})
        if product:
            item["product_name"] = product.get("name", "")
            item["product_code"] = product.get("code", "")
            item["image_url"] = product.get("image_url", "")
    return order

@router.post("/refunds")
async def create_refund(data: Dict, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    # Role check: only users with can_refund permission
    role = current_user.get("role", "staff")
    if role not in ("admin", "manager"):
        # Check custom permissions
        udb2 = get_user_db(current_user)
        user_doc = await udb2.users.find_one({"id": current_user.get("user_id")}, {"_id": 0, "permissions": 1})
        if not user_doc or not user_doc.get("permissions", {}).get("can_refund"):
            raise HTTPException(status_code=403, detail="No refund permission")
    order_no = data.get("order_no", "")
    items = data.get("items", [])
    reason = data.get("reason", "")
    order = await udb.sales_orders.find_one({"order_no": order_no}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    refund_id = generate_id()
    refund_items = items if items else order.get("items", [])
    refund_amount = sum(item.get("amount", 0) for item in refund_items)
    refund_doc = {
        "id": refund_id,
        "refund_no": generate_order_no("RF"),
        "original_order_no": order_no,
        "original_order_id": order["id"],
        "store_id": order.get("store_id"),
        "items": refund_items,
        "refund_amount": refund_amount,
        "reason": reason,
        "status": "completed",
        "created_by": current_user.get("user_id", current_user.get("id")),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.refunds.insert_one(refund_doc)
    for item in refund_items:
        warehouse = await udb.warehouses.find_one({"store_id": order.get("store_id")})
        if not warehouse:
            warehouse = await udb.warehouses.find_one({"is_main": True})
        if warehouse:
            await udb.inventory.update_one(
                {"product_id": item.get("product_id"), "warehouse_id": warehouse["id"]},
                {"$inc": {"quantity": item.get("quantity", 0)}}
            )
    await log_audit(current_user.get("user_id",""), current_user.get("username",""), "refund", "refund", refund_id, f"Order {order_no}, Amount ${refund_amount}", audit_db=udb)
    return {k: v for k, v in refund_doc.items() if k != "_id"}

@router.get("/refunds")
async def get_refunds(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    refunds = await udb.refunds.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return refunds

# ==================== Daily Settlement ====================

@router.get("/reports/daily-settlement")
async def daily_settlement(date: Optional[str] = None, store_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    target_date = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    start = f"{target_date}T00:00:00"
    end = f"{target_date}T23:59:59"
    
    query = {"created_at": {"$gte": start, "$lte": end}}
    if store_id:
        query["store_id"] = store_id
    
    sales = await udb.sales_orders.find(query, {"_id": 0}).to_list(10000)
    refunds = await udb.refunds.find({"created_at": {"$gte": start, "$lte": end}}, {"_id": 0}).to_list(1000)
    
    by_method = {}
    for s in sales:
        m = s.get("payment_method", "cash")
        if m not in by_method:
            by_method[m] = {"count": 0, "amount": 0}
        by_method[m]["count"] += 1
        by_method[m]["amount"] += s.get("total_amount", 0)
    
    total_sales = sum(s.get("total_amount", 0) for s in sales)
    total_cost = 0
    for s in sales:
        for item in s.get("items", []):
            product = await udb.products.find_one({"id": item.get("product_id")})
            if product:
                total_cost += product.get("cost_price", 0) * item.get("quantity", 0)
    
    total_refunds = sum(r.get("refund_amount", 0) for r in refunds)
    
    return {
        "date": target_date,
        "total_sales": total_sales,
        "total_orders": len(sales),
        "total_refunds": total_refunds,
        "refund_count": len(refunds),
        "total_cost": total_cost,
        "gross_profit": total_sales - total_cost - total_refunds,
        "by_payment_method": by_method
    }


# ==================== 3. Wholesale Module ====================
@router.post("/wholesale-orders")
async def create_wholesale_order(data: Dict, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    order_id = generate_id()
    order_no = generate_order_no("WS")
    total = sum(item.get("amount", 0) for item in data.get("items", []))
    order_doc = {
        "id": order_id, "order_no": order_no, "customer_id": data.get("customer_id"),
        "items": data.get("items", []), "total_amount": total,
        "payment_method": data.get("payment_method", "cash"),
        "paid_amount": data.get("paid_amount", 0), "status": "completed" if data.get("paid_amount", 0) >= total else "pending",
        "notes": data.get("notes", ""), "type": "wholesale",
        "created_by": current_user["user_id"], "created_at": datetime.now(timezone.utc).isoformat()
    }
    # Deduct inventory from main warehouse
    warehouse = await udb.warehouses.find_one({"is_main": True}, {"_id": 0})
    wh_id = warehouse["id"] if warehouse else None
    if wh_id:
        for item in data.get("items", []):
            await udb.inventory.update_one(
                {"product_id": item["product_id"], "warehouse_id": wh_id},
                {"$inc": {"quantity": -item.get("quantity", 0)}}
            )
    await udb.wholesale_orders.insert_one(order_doc)
    del order_doc["_id"]
    await log_audit(current_user["user_id"], current_user["username"], "create", "wholesale", order_id, f"${total}", audit_db=udb)
    return order_doc

@router.get("/wholesale-orders")
async def get_wholesale_orders(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    return await udb.wholesale_orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

