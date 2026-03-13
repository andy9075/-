from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'pos-system-secret-key-2024')
JWT_ALGORITHM = "HS256"

app = FastAPI(title="POS管理系统 API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== Models ====================

# Auth Models
class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "staff"  # admin, manager, cashier, staff
    store_id: Optional[str] = None
    name: str = ""
    phone: str = ""

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    store_id: Optional[str]
    name: str
    phone: str
    created_at: str

# Store/Shop Models
class StoreCreate(BaseModel):
    code: str
    name: str
    type: str = "retail"  # retail, online, warehouse
    address: str = ""
    phone: str = ""
    warehouse_id: Optional[str] = None
    is_headquarters: bool = False
    status: str = "active"

class StoreResponse(BaseModel):
    id: str
    code: str
    name: str
    type: str
    address: str
    phone: str
    warehouse_id: Optional[str]
    is_headquarters: bool
    status: str
    created_at: str

# Warehouse Models
class WarehouseCreate(BaseModel):
    code: str
    name: str
    address: str = ""
    is_main: bool = False
    store_id: Optional[str] = None

class WarehouseResponse(BaseModel):
    id: str
    code: str
    name: str
    address: str
    is_main: bool
    store_id: Optional[str]
    created_at: str

# Supplier Models
class SupplierCreate(BaseModel):
    code: str
    name: str
    contact: str = ""
    phone: str = ""
    address: str = ""
    bank_account: str = ""
    tax_id: str = ""

class SupplierResponse(BaseModel):
    id: str
    code: str
    name: str
    contact: str
    phone: str
    address: str
    bank_account: str
    tax_id: str
    created_at: str

# Customer Models
class CustomerCreate(BaseModel):
    code: str
    name: str
    phone: str = ""
    email: str = ""
    address: str = ""
    member_level: str = "normal"
    points: int = 0
    balance: float = 0.0

class CustomerResponse(BaseModel):
    id: str
    code: str
    name: str
    phone: str
    email: str
    address: str
    member_level: str
    points: int
    balance: float
    created_at: str

# Category Models
class CategoryCreate(BaseModel):
    code: str
    name: str
    parent_id: Optional[str] = None
    sort_order: int = 0

class CategoryResponse(BaseModel):
    id: str
    code: str
    name: str
    parent_id: Optional[str]
    sort_order: int
    created_at: str

# Product Models
class ProductCreate(BaseModel):
    code: str
    barcode: str = ""
    name: str
    category_id: Optional[str] = None
    unit: str = "件"
    cost_price: float = 0.0
    retail_price: float = 0.0
    wholesale_price: float = 0.0
    min_stock: int = 0
    max_stock: int = 9999
    image_url: str = ""
    description: str = ""
    status: str = "active"

class ProductResponse(BaseModel):
    id: str
    code: str
    barcode: str
    name: str
    category_id: Optional[str]
    unit: str
    cost_price: float
    retail_price: float
    wholesale_price: float
    min_stock: int
    max_stock: int
    image_url: str
    description: str
    status: str
    created_at: str

# Inventory Models
class InventoryCreate(BaseModel):
    product_id: str
    warehouse_id: str
    quantity: int = 0
    reserved: int = 0

class InventoryResponse(BaseModel):
    id: str
    product_id: str
    warehouse_id: str
    quantity: int
    reserved: int
    available: int
    updated_at: str

class InventoryAdjust(BaseModel):
    product_id: str
    warehouse_id: str
    quantity: int
    reason: str = ""

# Purchase Order Models
class PurchaseItemCreate(BaseModel):
    product_id: str
    quantity: int
    unit_price: float
    amount: float

class PurchaseOrderCreate(BaseModel):
    supplier_id: str
    warehouse_id: str
    items: List[PurchaseItemCreate]
    notes: str = ""

class PurchaseOrderResponse(BaseModel):
    id: str
    order_no: str
    supplier_id: str
    warehouse_id: str
    items: List[Dict]
    total_amount: float
    status: str
    notes: str
    created_by: str
    created_at: str

# Sales Order Models
class SalesItemCreate(BaseModel):
    product_id: str
    quantity: int
    unit_price: float
    discount: float = 0.0
    amount: float

class SalesOrderCreate(BaseModel):
    store_id: str
    customer_id: Optional[str] = None
    items: List[SalesItemCreate]
    payment_method: str = "cash"
    paid_amount: float = 0.0
    notes: str = ""

class SalesOrderResponse(BaseModel):
    id: str
    order_no: str
    store_id: str
    customer_id: Optional[str]
    items: List[Dict]
    total_amount: float
    discount_amount: float
    paid_amount: float
    payment_method: str
    status: str
    notes: str
    created_by: str
    created_at: str

# Payment Settings Models
class PaymentSettingsUpdate(BaseModel):
    transfer_enabled: bool = True
    transfer_bank_name: str = ""
    transfer_account_number: str = ""
    transfer_account_holder: str = ""
    transfer_rif: str = ""
    pago_movil_enabled: bool = True
    pago_movil_phone: str = ""
    pago_movil_bank_code: str = ""
    pago_movil_cedula: str = ""
    whatsapp_number: str = ""  # WhatsApp contact number

# Online Shop Order Models
class OnlineOrderCreate(BaseModel):
    customer_id: str
    items: List[SalesItemCreate]
    shipping_address: str
    shipping_phone: str
    shipping_name: str
    payment_method: str = "transfer"  # transfer, pago_movil
    payment_reference: str = ""
    notes: str = ""

class OnlineOrderResponse(BaseModel):
    id: str
    order_no: str
    customer_id: str
    items: List[Dict]
    total_amount: float
    shipping_fee: float
    shipping_address: str
    shipping_phone: str
    shipping_name: str
    payment_method: str
    payment_reference: Optional[str] = ""
    payment_status: str
    order_status: str
    warehouse_id: Optional[str]
    notes: str
    created_at: str

# ==================== Helper Functions ====================

def generate_id():
    return str(uuid.uuid4())

def generate_order_no(prefix: str):
    now = datetime.now(timezone.utc)
    return f"{prefix}{now.strftime('%Y%m%d%H%M%S')}{str(uuid.uuid4())[:4].upper()}"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, username: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token已过期")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="无效的Token")

# ==================== Auth Routes ====================

@api_router.post("/auth/register", response_model=dict)
async def register(user: UserCreate):
    existing = await db.users.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    
    user_id = generate_id()
    user_doc = {
        "id": user_id,
        "username": user.username,
        "password": hash_password(user.password),
        "role": user.role,
        "store_id": user.store_id,
        "name": user.name,
        "phone": user.phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id, user.username, user.role)
    return {"token": token, "user": {k: v for k, v in user_doc.items() if k != "password"}}

@api_router.post("/auth/login", response_model=dict)
async def login(user: UserLogin):
    db_user = await db.users.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    token = create_token(db_user["id"], db_user["username"], db_user["role"])
    return {"token": token, "user": {k: v for k, v in db_user.items() if k not in ["password", "_id"]}}

@api_router.get("/auth/me", response_model=dict)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user

# ==================== Store Routes ====================

@api_router.post("/stores", response_model=StoreResponse)
async def create_store(store: StoreCreate, current_user: dict = Depends(get_current_user)):
    store_id = generate_id()
    store_doc = {
        "id": store_id,
        **store.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.stores.insert_one(store_doc)
    return StoreResponse(**store_doc)

@api_router.get("/stores", response_model=List[StoreResponse])
async def get_stores(type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if type:
        query["type"] = type
    stores = await db.stores.find(query, {"_id": 0}).to_list(1000)
    return [StoreResponse(**s) for s in stores]

@api_router.get("/stores/{store_id}", response_model=StoreResponse)
async def get_store(store_id: str, current_user: dict = Depends(get_current_user)):
    store = await db.stores.find_one({"id": store_id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="门店不存在")
    return StoreResponse(**store)

@api_router.put("/stores/{store_id}", response_model=StoreResponse)
async def update_store(store_id: str, store: StoreCreate, current_user: dict = Depends(get_current_user)):
    result = await db.stores.update_one({"id": store_id}, {"$set": store.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="门店不存在")
    updated = await db.stores.find_one({"id": store_id}, {"_id": 0})
    return StoreResponse(**updated)

@api_router.delete("/stores/{store_id}")
async def delete_store(store_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.stores.delete_one({"id": store_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="门店不存在")
    return {"message": "删除成功"}

# ==================== Warehouse Routes ====================

@api_router.post("/warehouses", response_model=WarehouseResponse)
async def create_warehouse(warehouse: WarehouseCreate, current_user: dict = Depends(get_current_user)):
    warehouse_id = generate_id()
    warehouse_doc = {
        "id": warehouse_id,
        **warehouse.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.warehouses.insert_one(warehouse_doc)
    return WarehouseResponse(**warehouse_doc)

@api_router.get("/warehouses", response_model=List[WarehouseResponse])
async def get_warehouses(current_user: dict = Depends(get_current_user)):
    warehouses = await db.warehouses.find({}, {"_id": 0}).to_list(1000)
    return [WarehouseResponse(**w) for w in warehouses]

@api_router.get("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
async def get_warehouse(warehouse_id: str, current_user: dict = Depends(get_current_user)):
    warehouse = await db.warehouses.find_one({"id": warehouse_id}, {"_id": 0})
    if not warehouse:
        raise HTTPException(status_code=404, detail="仓库不存在")
    return WarehouseResponse(**warehouse)

@api_router.get("/warehouses/main/info", response_model=WarehouseResponse)
async def get_main_warehouse(current_user: dict = Depends(get_current_user)):
    warehouse = await db.warehouses.find_one({"is_main": True}, {"_id": 0})
    if not warehouse:
        raise HTTPException(status_code=404, detail="总部仓库不存在")
    return WarehouseResponse(**warehouse)

# ==================== Supplier Routes ====================

@api_router.post("/suppliers", response_model=SupplierResponse)
async def create_supplier(supplier: SupplierCreate, current_user: dict = Depends(get_current_user)):
    supplier_id = generate_id()
    supplier_doc = {
        "id": supplier_id,
        **supplier.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.suppliers.insert_one(supplier_doc)
    return SupplierResponse(**supplier_doc)

@api_router.get("/suppliers", response_model=List[SupplierResponse])
async def get_suppliers(current_user: dict = Depends(get_current_user)):
    suppliers = await db.suppliers.find({}, {"_id": 0}).to_list(1000)
    return [SupplierResponse(**s) for s in suppliers]

@api_router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(supplier_id: str, supplier: SupplierCreate, current_user: dict = Depends(get_current_user)):
    result = await db.suppliers.update_one({"id": supplier_id}, {"$set": supplier.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="供应商不存在")
    updated = await db.suppliers.find_one({"id": supplier_id}, {"_id": 0})
    return SupplierResponse(**updated)

@api_router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.suppliers.delete_one({"id": supplier_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="供应商不存在")
    return {"message": "删除成功"}

# ==================== Customer Routes ====================

@api_router.post("/customers", response_model=CustomerResponse)
async def create_customer(customer: CustomerCreate, current_user: dict = Depends(get_current_user)):
    customer_id = generate_id()
    customer_doc = {
        "id": customer_id,
        **customer.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.customers.insert_one(customer_doc)
    return CustomerResponse(**customer_doc)

@api_router.get("/customers", response_model=List[CustomerResponse])
async def get_customers(search: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"code": {"$regex": search, "$options": "i"}}
        ]
    customers = await db.customers.find(query, {"_id": 0}).to_list(1000)
    return [CustomerResponse(**c) for c in customers]

@api_router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    return CustomerResponse(**customer)

@api_router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, customer: CustomerCreate, current_user: dict = Depends(get_current_user)):
    result = await db.customers.update_one({"id": customer_id}, {"$set": customer.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="客户不存在")
    updated = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    return CustomerResponse(**updated)

# ==================== Category Routes ====================

@api_router.post("/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    category_id = generate_id()
    category_doc = {
        "id": category_id,
        **category.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(category_doc)
    return CategoryResponse(**category_doc)

@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(current_user: dict = Depends(get_current_user)):
    categories = await db.categories.find({}, {"_id": 0}).sort("sort_order", 1).to_list(1000)
    return [CategoryResponse(**c) for c in categories]

@api_router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    result = await db.categories.update_one({"id": category_id}, {"$set": category.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="分类不存在")
    updated = await db.categories.find_one({"id": category_id}, {"_id": 0})
    return CategoryResponse(**updated)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="分类不存在")
    return {"message": "删除成功"}

# ==================== Product Routes ====================

@api_router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    product_id = generate_id()
    product_doc = {
        "id": product_id,
        **product.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product_doc)
    return ProductResponse(**product_doc)

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"code": {"$regex": search, "$options": "i"}},
            {"barcode": {"$regex": search, "$options": "i"}}
        ]
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    return [ProductResponse(**p) for p in products]

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    return ProductResponse(**product)

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product: ProductCreate, current_user: dict = Depends(get_current_user)):
    result = await db.products.update_one({"id": product_id}, {"$set": product.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="商品不存在")
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return ProductResponse(**updated)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="商品不存在")
    return {"message": "删除成功"}

# ==================== Inventory Routes ====================

@api_router.get("/inventory", response_model=List[dict])
async def get_inventory(
    warehouse_id: Optional[str] = None,
    product_id: Optional[str] = None,
    low_stock: bool = False,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if warehouse_id:
        query["warehouse_id"] = warehouse_id
    if product_id:
        query["product_id"] = product_id
    
    inventory = await db.inventory.find(query, {"_id": 0}).to_list(10000)
    
    result = []
    for inv in inventory:
        product = await db.products.find_one({"id": inv["product_id"]}, {"_id": 0})
        warehouse = await db.warehouses.find_one({"id": inv["warehouse_id"]}, {"_id": 0})
        inv["product"] = product
        inv["warehouse"] = warehouse
        inv["available"] = inv["quantity"] - inv.get("reserved", 0)
        
        if low_stock and product:
            if inv["quantity"] > product.get("min_stock", 0):
                continue
        result.append(inv)
    
    return result

@api_router.post("/inventory/adjust")
async def adjust_inventory(adjust: InventoryAdjust, current_user: dict = Depends(get_current_user)):
    existing = await db.inventory.find_one({
        "product_id": adjust.product_id,
        "warehouse_id": adjust.warehouse_id
    })
    
    if existing:
        new_qty = existing["quantity"] + adjust.quantity
        if new_qty < 0:
            raise HTTPException(status_code=400, detail="库存不足")
        await db.inventory.update_one(
            {"product_id": adjust.product_id, "warehouse_id": adjust.warehouse_id},
            {"$set": {"quantity": new_qty, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        if adjust.quantity < 0:
            raise HTTPException(status_code=400, detail="库存不足")
        await db.inventory.insert_one({
            "id": generate_id(),
            "product_id": adjust.product_id,
            "warehouse_id": adjust.warehouse_id,
            "quantity": adjust.quantity,
            "reserved": 0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Record adjustment log
    await db.inventory_logs.insert_one({
        "id": generate_id(),
        "product_id": adjust.product_id,
        "warehouse_id": adjust.warehouse_id,
        "quantity": adjust.quantity,
        "reason": adjust.reason,
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "库存调整成功"}

@api_router.post("/inventory/transfer")
async def transfer_inventory(
    product_id: str,
    from_warehouse_id: str,
    to_warehouse_id: str,
    quantity: int,
    current_user: dict = Depends(get_current_user)
):
    # Check source inventory
    source = await db.inventory.find_one({
        "product_id": product_id,
        "warehouse_id": from_warehouse_id
    })
    
    if not source or source["quantity"] < quantity:
        raise HTTPException(status_code=400, detail="源仓库库存不足")
    
    # Decrease source
    await db.inventory.update_one(
        {"product_id": product_id, "warehouse_id": from_warehouse_id},
        {"$inc": {"quantity": -quantity}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Increase destination
    dest = await db.inventory.find_one({
        "product_id": product_id,
        "warehouse_id": to_warehouse_id
    })
    
    if dest:
        await db.inventory.update_one(
            {"product_id": product_id, "warehouse_id": to_warehouse_id},
            {"$inc": {"quantity": quantity}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        await db.inventory.insert_one({
            "id": generate_id(),
            "product_id": product_id,
            "warehouse_id": to_warehouse_id,
            "quantity": quantity,
            "reserved": 0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Record transfer log
    await db.transfer_logs.insert_one({
        "id": generate_id(),
        "product_id": product_id,
        "from_warehouse_id": from_warehouse_id,
        "to_warehouse_id": to_warehouse_id,
        "quantity": quantity,
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "库存调拨成功"}

# ==================== Purchase Order Routes ====================

@api_router.post("/purchase-orders", response_model=PurchaseOrderResponse)
async def create_purchase_order(order: PurchaseOrderCreate, current_user: dict = Depends(get_current_user)):
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
    
    await db.purchase_orders.insert_one(order_doc)
    return PurchaseOrderResponse(**order_doc)

@api_router.get("/purchase-orders", response_model=List[PurchaseOrderResponse])
async def get_purchase_orders(
    status: Optional[str] = None,
    supplier_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if supplier_id:
        query["supplier_id"] = supplier_id
    
    orders = await db.purchase_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [PurchaseOrderResponse(**o) for o in orders]

@api_router.put("/purchase-orders/{order_id}/receive")
async def receive_purchase_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.purchase_orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="采购单不存在")
    
    if order["status"] != "pending":
        raise HTTPException(status_code=400, detail="订单状态不允许入库")
    
    # Update inventory
    for item in order["items"]:
        existing = await db.inventory.find_one({
            "product_id": item["product_id"],
            "warehouse_id": order["warehouse_id"]
        })
        
        if existing:
            await db.inventory.update_one(
                {"product_id": item["product_id"], "warehouse_id": order["warehouse_id"]},
                {"$inc": {"quantity": item["quantity"]}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        else:
            await db.inventory.insert_one({
                "id": generate_id(),
                "product_id": item["product_id"],
                "warehouse_id": order["warehouse_id"],
                "quantity": item["quantity"],
                "reserved": 0,
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
    
    # Update order status
    await db.purchase_orders.update_one(
        {"id": order_id},
        {"$set": {"status": "received", "received_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "入库成功"}

# ==================== Sales Order Routes ====================

@api_router.post("/sales-orders", response_model=SalesOrderResponse)
async def create_sales_order(order: SalesOrderCreate, current_user: dict = Depends(get_current_user)):
    order_id = generate_id()
    order_no = generate_order_no("SO")
    
    total_amount = sum(item.amount for item in order.items)
    discount_amount = sum(item.discount for item in order.items)
    
    # Get store's warehouse
    store = await db.stores.find_one({"id": order.store_id})
    warehouse_id = store.get("warehouse_id") if store else None
    
    # Check and deduct inventory
    if warehouse_id:
        for item in order.items:
            inv = await db.inventory.find_one({
                "product_id": item.product_id,
                "warehouse_id": warehouse_id
            })
            if not inv or inv["quantity"] < item.quantity:
                product = await db.products.find_one({"id": item.product_id})
                raise HTTPException(status_code=400, detail=f"商品 {product['name'] if product else item.product_id} 库存不足")
            
            await db.inventory.update_one(
                {"product_id": item.product_id, "warehouse_id": warehouse_id},
                {"$inc": {"quantity": -item.quantity}}
            )
    
    order_doc = {
        "id": order_id,
        "order_no": order_no,
        "store_id": order.store_id,
        "customer_id": order.customer_id,
        "items": [item.model_dump() for item in order.items],
        "total_amount": total_amount,
        "discount_amount": discount_amount,
        "paid_amount": order.paid_amount,
        "payment_method": order.payment_method,
        "status": "completed" if order.paid_amount >= total_amount else "pending",
        "notes": order.notes,
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.sales_orders.insert_one(order_doc)
    
    # Update customer points if applicable
    if order.customer_id:
        points_earned = int(total_amount / 10)  # 1 point per 10 currency
        await db.customers.update_one(
            {"id": order.customer_id},
            {"$inc": {"points": points_earned}}
        )
    
    return SalesOrderResponse(**order_doc)

@api_router.get("/sales-orders", response_model=List[SalesOrderResponse])
async def get_sales_orders(
    status: Optional[str] = None,
    store_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
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
    
    orders = await db.sales_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [SalesOrderResponse(**o) for o in orders]

# ==================== Online Shop Routes ====================

@api_router.get("/shop/products", response_model=List[dict])
async def get_shop_products(
    category_id: Optional[str] = None,
    search: Optional[str] = None
):
    """Public endpoint for online shop - no auth required"""
    query = {"status": "active"}
    if category_id:
        query["category_id"] = category_id
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"code": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    
    # Get main warehouse inventory
    main_warehouse = await db.warehouses.find_one({"is_main": True})
    
    result = []
    for product in products:
        inv = None
        if main_warehouse:
            inv = await db.inventory.find_one({
                "product_id": product["id"],
                "warehouse_id": main_warehouse["id"]
            }, {"_id": 0})
        
        product["stock"] = inv["quantity"] if inv else 0
        result.append(product)
    
    return result

@api_router.get("/shop/categories", response_model=List[CategoryResponse])
async def get_shop_categories():
    """Public endpoint for online shop categories"""
    categories = await db.categories.find({}, {"_id": 0}).sort("sort_order", 1).to_list(1000)
    return [CategoryResponse(**c) for c in categories]

@api_router.post("/shop/orders", response_model=OnlineOrderResponse)
async def create_online_order(order: OnlineOrderCreate):
    """Create online shop order - connects to main warehouse"""
    order_id = generate_id()
    order_no = generate_order_no("ON")
    
    # Get main warehouse
    main_warehouse = await db.warehouses.find_one({"is_main": True})
    if not main_warehouse:
        raise HTTPException(status_code=400, detail="总部仓库未配置")
    
    total_amount = sum(item.amount for item in order.items)
    shipping_fee = 0.0 if total_amount >= 100 else 10.0  # Free shipping over 100
    
    # Check and reserve inventory from main warehouse
    for item in order.items:
        inv = await db.inventory.find_one({
            "product_id": item.product_id,
            "warehouse_id": main_warehouse["id"]
        })
        if not inv or inv["quantity"] < item.quantity:
            product = await db.products.find_one({"id": item.product_id})
            raise HTTPException(status_code=400, detail=f"商品 {product['name'] if product else ''} 库存不足")
        
        # Reserve inventory
        await db.inventory.update_one(
            {"product_id": item.product_id, "warehouse_id": main_warehouse["id"]},
            {"$inc": {"reserved": item.quantity}}
        )
    
    order_doc = {
        "id": order_id,
        "order_no": order_no,
        "customer_id": order.customer_id,
        "items": [item.model_dump() for item in order.items],
        "total_amount": total_amount,
        "shipping_fee": shipping_fee,
        "shipping_address": order.shipping_address,
        "shipping_phone": order.shipping_phone,
        "shipping_name": order.shipping_name,
        "payment_method": order.payment_method,
        "payment_reference": order.payment_reference,
        "payment_status": "pending",
        "order_status": "pending",
        "warehouse_id": main_warehouse["id"],
        "notes": order.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.online_orders.insert_one(order_doc)
    return OnlineOrderResponse(**order_doc)

@api_router.get("/shop/orders", response_model=List[OnlineOrderResponse])
async def get_online_orders(
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    if status:
        query["order_status"] = status
    
    orders = await db.online_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [OnlineOrderResponse(**o) for o in orders]

@api_router.put("/shop/orders/{order_id}/pay")
async def pay_online_order(order_id: str):
    order = await db.online_orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    await db.online_orders.update_one(
        {"id": order_id},
        {"$set": {"payment_status": "paid", "order_status": "processing"}}
    )
    
    return {"message": "支付成功"}

@api_router.put("/shop/orders/{order_id}/ship")
async def ship_online_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.online_orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if order["payment_status"] != "paid":
        raise HTTPException(status_code=400, detail="订单未支付")
    
    # Deduct inventory from warehouse
    for item in order["items"]:
        await db.inventory.update_one(
            {"product_id": item["product_id"], "warehouse_id": order["warehouse_id"]},
            {"$inc": {"quantity": -item["quantity"], "reserved": -item["quantity"]}}
        )
    
    await db.online_orders.update_one(
        {"id": order_id},
        {"$set": {"order_status": "shipped", "shipped_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "发货成功"}

@api_router.put("/shop/orders/{order_id}/complete")
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

# ==================== Reports Routes ====================

@api_router.get("/reports/sales-summary")
async def get_sales_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    store_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if store_id:
        query["store_id"] = store_id
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    
    sales_orders = await db.sales_orders.find(query, {"_id": 0}).to_list(10000)
    online_orders = await db.online_orders.find(
        {"order_status": "completed"} if not query else {**query, "order_status": "completed"},
        {"_id": 0}
    ).to_list(10000)
    
    total_sales = sum(o["total_amount"] for o in sales_orders)
    total_online = sum(o["total_amount"] for o in online_orders)
    
    return {
        "total_sales": total_sales,
        "total_online_sales": total_online,
        "total_combined": total_sales + total_online,
        "sales_count": len(sales_orders),
        "online_count": len(online_orders)
    }

@api_router.get("/reports/inventory-summary")
async def get_inventory_summary(
    warehouse_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if warehouse_id:
        query["warehouse_id"] = warehouse_id
    
    inventory = await db.inventory.find(query, {"_id": 0}).to_list(10000)
    
    total_items = len(inventory)
    total_quantity = sum(i["quantity"] for i in inventory)
    total_value = 0.0
    low_stock_items = []
    
    for inv in inventory:
        product = await db.products.find_one({"id": inv["product_id"]}, {"_id": 0})
        if product:
            total_value += inv["quantity"] * product.get("cost_price", 0)
            if inv["quantity"] <= product.get("min_stock", 0):
                low_stock_items.append({
                    "product": product,
                    "quantity": inv["quantity"],
                    "min_stock": product.get("min_stock", 0)
                })
    
    return {
        "total_items": total_items,
        "total_quantity": total_quantity,
        "total_value": total_value,
        "low_stock_count": len(low_stock_items),
        "low_stock_items": low_stock_items[:10]
    }

@api_router.get("/reports/top-products")
async def get_top_products(
    limit: int = 10,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    
    sales_orders = await db.sales_orders.find(query, {"_id": 0}).to_list(10000)
    
    product_sales = {}
    for order in sales_orders:
        for item in order.get("items", []):
            pid = item["product_id"]
            if pid not in product_sales:
                product_sales[pid] = {"quantity": 0, "amount": 0}
            product_sales[pid]["quantity"] += item["quantity"]
            product_sales[pid]["amount"] += item["amount"]
    
    # Sort by amount
    sorted_products = sorted(product_sales.items(), key=lambda x: x[1]["amount"], reverse=True)[:limit]
    
    result = []
    for pid, stats in sorted_products:
        product = await db.products.find_one({"id": pid}, {"_id": 0})
        if product:
            result.append({
                "product": product,
                "quantity": stats["quantity"],
                "amount": stats["amount"]
            })
    
    return result

# ==================== Payment Settings Routes ====================

@api_router.get("/payment-settings")
async def get_payment_settings():
    """Get payment settings - public endpoint for shop"""
    settings = await db.settings.find_one({"type": "payment"}, {"_id": 0})
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

@api_router.put("/payment-settings")
async def update_payment_settings(settings: PaymentSettingsUpdate, current_user: dict = Depends(get_current_user)):
    """Update payment settings - admin only"""
    settings_doc = {
        "type": "payment",
        **settings.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.settings.update_one(
        {"type": "payment"},
        {"$set": settings_doc},
        upsert=True
    )
    return {"message": "支付设置已更新"}

@api_router.put("/shop/orders/{order_id}/confirm-payment")
async def confirm_order_payment(order_id: str, current_user: dict = Depends(get_current_user)):
    """Admin confirms payment received"""
    order = await db.online_orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    await db.online_orders.update_one(
        {"id": order_id},
        {"$set": {
            "payment_status": "paid",
            "order_status": "processing",
            "payment_confirmed_at": datetime.now(timezone.utc).isoformat(),
            "payment_confirmed_by": current_user["user_id"]
        }}
    )
    
    return {"message": "支付已确认"}

# ==================== Dashboard Routes ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    # Today's sales
    today_sales = await db.sales_orders.find({"created_at": {"$gte": today}}, {"_id": 0}).to_list(1000)
    today_online = await db.online_orders.find({"created_at": {"$gte": today}}, {"_id": 0}).to_list(1000)
    
    # Counts
    products_count = await db.products.count_documents({})
    customers_count = await db.customers.count_documents({})
    stores_count = await db.stores.count_documents({})
    pending_orders = await db.online_orders.count_documents({"order_status": "pending"})
    
    return {
        "today_sales_amount": sum(o["total_amount"] for o in today_sales),
        "today_sales_count": len(today_sales),
        "today_online_amount": sum(o["total_amount"] for o in today_online),
        "today_online_count": len(today_online),
        "products_count": products_count,
        "customers_count": customers_count,
        "stores_count": stores_count,
        "pending_online_orders": pending_orders
    }

# ==================== Init Data ====================

@api_router.post("/init-data")
async def init_data():
    """Initialize default data"""
    # Check if admin exists
    admin = await db.users.find_one({"username": "admin"})
    if not admin:
        await db.users.insert_one({
            "id": generate_id(),
            "username": "admin",
            "password": hash_password("admin123"),
            "role": "admin",
            "store_id": None,
            "name": "系统管理员",
            "phone": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Check if main warehouse exists
    main_wh = await db.warehouses.find_one({"is_main": True})
    if not main_wh:
        await db.warehouses.insert_one({
            "id": generate_id(),
            "code": "WH001",
            "name": "总部仓库",
            "address": "总部",
            "is_main": True,
            "store_id": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"message": "初始化完成"}

# ==================== Main App Setup ====================

@api_router.get("/")
async def root():
    return {"message": "POS System API", "status": "running"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
