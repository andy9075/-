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

# ==================== Exchange Rate Settings ====================

@router.get("/exchange-rates")
async def get_exchange_rates(current_user: dict = Depends(get_current_user)):
    """Get system exchange rates"""
    udb = get_user_db(current_user)
    settings = await udb.settings.find_one({"type": "exchange_rates"}, {"_id": 0})
    if not settings:
        settings = {
            "type": "exchange_rates",
            "usd_to_ves": 36.5,  # USD to Bolivares
            "usd_to_cop": 4000,  # USD to Colombian Pesos
            "default_currency": "USD",
            "local_currency": "VES",
            "local_currency_symbol": "Bs."
        }
    return settings

@router.put("/exchange-rates")
async def update_exchange_rates(
    usd_to_ves: float,
    usd_to_cop: float = 4000,
    default_currency: str = "USD",
    local_currency: str = "VES",
    local_currency_symbol: str = "Bs.",
    current_user: dict = Depends(get_current_user)
):
    udb = get_user_db(current_user)
    """Update system exchange rates"""
    settings_doc = {
        "type": "exchange_rates",
        "usd_to_ves": usd_to_ves,
        "usd_to_cop": usd_to_cop,
        "default_currency": default_currency,
        "local_currency": local_currency,
        "local_currency_symbol": local_currency_symbol,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.settings.update_one(
        {"type": "exchange_rates"},
        {"$set": settings_doc},
        upsert=True
    )
    return {"message": "汇率已更新"}

# ==================== Payment Settings Routes ====================

@router.get("/payment-settings")
async def get_payment_settings(current_user: dict = Depends(get_current_user)):
    """Get payment settings"""
    udb = get_user_db(current_user)
    settings = await udb.settings.find_one({"type": "payment"}, {"_id": 0})
    if not settings:
        # Default settings for Venezuela
        settings = {
            "type": "payment",
            "transfer_enabled": True,
            "transfer_bank_name": "Banco de Venezuela",
            "transfer_account_number": "",
            "transfer_account_holder": "",
            "transfer_rif": "",
            "pago_movil_enabled": True,
            "pago_movil_phone": "",
            "pago_movil_bank_code": "0102",
            "pago_movil_cedula": "",
            "whatsapp_number": ""
        }
    return settings

@router.put("/payment-settings")
async def update_payment_settings(settings: PaymentSettingsUpdate, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    """Update payment settings - admin only"""
    settings_doc = {
        "type": "payment",
        **settings.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.settings.update_one(
        {"type": "payment"},
        {"$set": settings_doc},
        upsert=True
    )
    return {"message": "支付设置已更新"}

@router.put("/shop/orders/{order_id}/confirm-payment")
async def confirm_order_payment(order_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    """Admin confirms payment received"""
    order = await udb.online_orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    await udb.online_orders.update_one(
        {"id": order_id},
        {"$set": {
            "payment_status": "paid",
            "order_status": "processing",
            "payment_confirmed_at": datetime.now(timezone.utc).isoformat(),
            "payment_confirmed_by": current_user["user_id"]
        }}
    )
    
    return {"message": "支付已确认"}

# ==================== System Settings ====================

@router.get("/settings/system")
async def get_system_settings(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    settings = await udb.system_settings.find_one({"key": "system"}, {"_id": 0})
    if not settings:
        return SystemSettings().model_dump()
    return {k: v for k, v in settings.items() if k != "key"}

@router.put("/settings/system")
async def update_system_settings(settings: SystemSettings, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    data = settings.model_dump()
    data["key"] = "system"
    await udb.system_settings.update_one({"key": "system"}, {"$set": data}, upsert=True)
    return {"message": "Settings updated"}

