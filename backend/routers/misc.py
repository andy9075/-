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

# ==================== Video Tutorial Management ====================
@router.post("/videos/upload")
async def upload_video(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ("admin",):
        raise HTTPException(403, "Admin only")
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "webm"
    if ext not in ("webm", "mp4", "mov", "avi"):
        raise HTTPException(400, "Invalid video format. Use webm, mp4, mov, or avi")
    video_id = generate_id()[:12]
    filename = f"{video_id}.{ext}"
    filepath = UPLOAD_DIR / "videos" / filename
    content = await file.read()
    max_size = 200 * 1024 * 1024  # 200MB limit
    if len(content) > max_size:
        raise HTTPException(400, "File too large. Max 200MB")
    with open(filepath, "wb") as f:
        f.write(content)
    video_url = f"/api/uploads/videos/{filename}"
    udb = get_user_db(current_user)
    video_doc = {
        "id": video_id,
        "title": file.filename.rsplit(".", 1)[0],
        "url": video_url,
        "filename": filename,
        "size": len(content),
        "duration": 0,
        "category": "general",
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.videos.insert_one(video_doc)
    del video_doc["_id"]
    return video_doc

@router.get("/videos")
async def get_videos(current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    videos = await udb.videos.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return videos

@router.put("/videos/{video_id}")
async def update_video(video_id: str, data: Dict, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ("admin",):
        raise HTTPException(403, "Admin only")
    udb = get_user_db(current_user)
    update = {}
    for key in ("title", "category", "description"):
        if key in data:
            update[key] = data[key]
    if update:
        await udb.videos.update_one({"id": video_id}, {"$set": update})
    return {"message": "Updated"}

@router.delete("/videos/{video_id}")
async def delete_video(video_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ("admin",):
        raise HTTPException(403, "Admin only")
    udb = get_user_db(current_user)
    video = await udb.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(404, "Video not found")
    filepath = UPLOAD_DIR / "videos" / video.get("filename", "")
    if filepath.exists():
        filepath.unlink()
    await udb.videos.delete_one({"id": video_id})
    return {"message": "Deleted"}

@router.post("/videos/generate-tutorials")
async def generate_tutorial_videos(current_user: dict = Depends(get_current_user)):
    """Trigger background generation of narrated tutorial videos (screen recording + voice-over)"""
    if current_user.get("role") not in ("admin",):
        raise HTTPException(403, "Admin only")
    import subprocess, threading
    app_url = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:3000")
    app_url = app_url.rstrip("/")

    def run_generation():
        try:
            # Use the narrated tutorial generator (TTS + Playwright + ffmpeg)
            result = subprocess.run(
                ["python3", str(Path(ROOT_DIR) / "generate_narrated_tutorials.py"), app_url],
                cwd=str(ROOT_DIR),
                timeout=600,
                capture_output=True,
                text=True,
                env={**os.environ, "APP_URL": app_url}
            )
            print(f"Narrated generation stdout: {result.stdout[-500:]}")
            if result.stderr:
                print(f"Narrated generation stderr: {result.stderr[-500:]}")

            # Register videos in DB
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            from motor.motor_asyncio import AsyncIOMotorClient
            mongo_client = AsyncIOMotorClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
            udb_name = f"pos_{current_user['tenant_id']}" if current_user.get("tenant_id") else os.environ["DB_NAME"]
            video_db = mongo_client[udb_name]
            video_dir = UPLOAD_DIR / "videos"
            tutorials = [
                ("pos_tutorial", "POS 收银操作教程", "pos"),
                ("products_tutorial", "商品管理教程", "products"),
                ("inventory_tutorial", "库存管理教程", "inventory"),
                ("sales_tutorial", "销售与退款教程", "sales"),
                ("customers_tutorial", "客户管理教程", "customers"),
                ("reports_tutorial", "报表与分析教程", "reports"),
                ("settings_tutorial", "系统设置教程", "settings"),
            ]
            async def register():
                for filename, title, category in tutorials:
                    fpath = video_dir / f"{filename}.webm"
                    if fpath.exists():
                        vid = generate_id()[:12]
                        await video_db.videos.delete_many({"title": title})
                        await video_db.videos.insert_one({
                            "id": vid, "title": title, "url": f"/api/uploads/videos/{filename}.webm",
                            "filename": f"{filename}.webm", "size": fpath.stat().st_size,
                            "category": category, "created_by": current_user["user_id"],
                            "created_at": datetime.now(timezone.utc).isoformat()
                        })
            loop.run_until_complete(register())
            mongo_client.close()
            loop.close()
        except Exception as e:
            print(f"Narrated tutorial generation error: {e}")
            import traceback
            traceback.print_exc()

    thread = threading.Thread(target=run_generation, daemon=True)
    thread.start()
    return {"message": "正在生成带语音解说的视频教程，包括录制屏幕操作和生成中文旁白。预计需要3-5分钟，完成后自动显示。"}

# ==================== Audit Log ====================

@router.get("/audit-logs")
async def get_audit_logs(
    action: Optional[str] = None, target_type: Optional[str] = None,
    start_date: Optional[str] = None, end_date: Optional[str] = None,
    page: int = 1, limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    udb = get_user_db(current_user)
    query = {}
    if action: query["action"] = action
    if target_type: query["target_type"] = target_type
    if start_date: query["created_at"] = {"$gte": start_date}
    if end_date: query.setdefault("created_at", {})["$lte"] = end_date
    total = await udb.audit_logs.count_documents(query)
    logs = await udb.audit_logs.find(query, {"_id": 0}).sort("created_at", -1).skip((page - 1) * limit).limit(limit).to_list(limit)
    return {"total": total, "page": page, "limit": limit, "items": logs}

# ==================== Accounts Receivable / Payable ====================
@router.post("/accounts/receivable")
async def create_receivable(data: Dict, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    record = {
        "id": generate_id(), **data, "type": "receivable",
        "status": data.get("status", "pending"),
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.accounts.insert_one(record)
    del record["_id"]
    await log_audit(current_user["user_id"], current_user["username"], "create", "receivable", record["id"], f"${data.get('amount', 0)}", audit_db=udb)
    return record

@router.get("/accounts/receivable")
async def get_receivables(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    query = {"type": "receivable"}
    if status: query["status"] = status
    return await udb.accounts.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)

@router.put("/accounts/{account_id}/pay")
async def pay_account(account_id: str, amount: float = Query(..., gt=0), current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    account = await udb.accounts.find_one({"id": account_id}, {"_id": 0})
    if not account: raise HTTPException(404, "Account not found")
    paid = account.get("paid_amount", 0) + amount
    status = "paid" if paid >= account.get("amount", 0) else "partial"
    await udb.accounts.update_one({"id": account_id}, {"$set": {"paid_amount": paid, "status": status}})
    await log_audit(current_user["user_id"], current_user["username"], "payment", "account", account_id, f"${amount}", audit_db=udb)
    return {"paid_amount": paid, "status": status}

@router.post("/accounts/payable")
async def create_payable(data: Dict, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    record = {
        "id": generate_id(), **data, "type": "payable",
        "status": data.get("status", "pending"),
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.accounts.insert_one(record)
    del record["_id"]
    await log_audit(current_user["user_id"], current_user["username"], "create", "payable", record["id"], f"${data.get('amount', 0)}", audit_db=udb)
    return record

@router.get("/accounts/payable")
async def get_payables(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    query = {"type": "payable"}
    if status: query["status"] = status
    return await udb.accounts.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)

# ==================== Data Backup ====================
@router.get("/backup/export")
async def export_backup(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    collections = ["products", "categories", "customers", "suppliers", "stores", "warehouses", "inventory", "sales_orders", "purchase_orders", "online_orders", "employees", "promotions", "accounts", "exchange_rates", "payment_settings", "system_settings"]
    backup = {}
    for col_name in collections:
        col = db[col_name]
        docs = await col.find({}, {"_id": 0}).to_list(50000)
        backup[col_name] = docs
    backup["exported_at"] = datetime.now(timezone.utc).isoformat()
    backup["version"] = "1.0"
    output = io.BytesIO(json.dumps(backup, ensure_ascii=False, indent=2, default=str).encode("utf-8"))
    await log_audit(current_user["user_id"], current_user["username"], "backup", "system", "", "Full database backup", audit_db=udb)
    return StreamingResponse(output, media_type="application/json", headers={"Content-Disposition": f"attachment; filename=pos_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"})

# ==================== 4. Data Restore ====================
@router.post("/backup/restore")
async def restore_backup(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin": raise HTTPException(403, "Admin only")
    content = await file.read()
    try: backup = json.loads(content)
    except: raise HTTPException(400, "Invalid JSON file")
    collections = ["products", "categories", "customers", "suppliers", "stores", "warehouses", "inventory", "sales_orders", "purchase_orders", "online_orders", "employees", "promotions", "accounts", "exchange_rates", "payment_settings", "system_settings"]
    restored = {}
    for col_name in collections:
        if col_name in backup and isinstance(backup[col_name], list):
            col = db[col_name]
            if len(backup[col_name]) > 0:
                await col.delete_many({})
                for doc in backup[col_name]:
                    doc.pop("_id", None)
                await col.insert_many(backup[col_name])
            restored[col_name] = len(backup[col_name])
    await log_audit(current_user["user_id"], current_user["username"], "restore", "system", "", f"Restored {len(restored)} collections", audit_db=udb)
    return {"message": "Backup restored", "collections": restored}

# ==================== 6. Sales Targets ====================
@router.post("/sales-targets")
async def create_sales_target(data: Dict, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    target = {
        "id": generate_id(), **data,
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await udb.sales_targets.insert_one(target)
    del target["_id"]
    return target

@router.get("/sales-targets")
async def get_sales_targets(period: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    query = {}
    if period: query["period"] = period
    targets = await udb.sales_targets.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    # Calculate progress
    for t in targets:
        start = t.get("start_date", "")
        end = t.get("end_date", "")
        q = {}
        if start: q["created_at"] = {"$gte": start}
        if end: q.setdefault("created_at", {})["$lte"] = end + "T23:59:59"
        if t.get("employee_id"):
            q["created_by"] = t["employee_id"]
        if t.get("store_id"):
            q["store_id"] = t["store_id"]
        orders = await udb.sales_orders.find(q, {"_id": 0, "total_amount": 1}).to_list(10000)
        actual = sum(o.get("total_amount", 0) for o in orders)
        t["actual"] = round(actual, 2)
        t["progress"] = round(actual / t.get("target_amount", 1) * 100, 1) if t.get("target_amount") else 0
    return targets

@router.delete("/sales-targets/{target_id}")
async def delete_sales_target(target_id: str, current_user: dict = Depends(get_current_user)):
    udb = get_user_db(current_user)
    await udb.sales_targets.delete_one({"id": target_id})
    return {"status": "deleted"}

