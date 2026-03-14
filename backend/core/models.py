from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# Auth
class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "staff"
    store_id: Optional[str] = None
    name: str = ""
    phone: str = ""
    permissions: Dict = {}

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
    permissions: Dict = {}
    created_at: Optional[str] = None

# Store
class StoreCreate(BaseModel):
    code: str
    name: str
    type: str = "retail"
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
    created_at: Optional[str] = None

# Warehouse
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
    created_at: Optional[str] = None

# Supplier
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

# Customer
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

# Category
class CategoryCreate(BaseModel):
    code: str
    name: str
    parent_id: Optional[str] = None
    sort_order: int = 0
    exchange_rate: float = 1.0

class CategoryResponse(BaseModel):
    id: str
    code: str
    name: str
    parent_id: Optional[str] = None
    sort_order: int = 0
    exchange_rate: float = 1.0
    created_at: str

# Product
class ProductCreate(BaseModel):
    code: str
    barcode: str = ""
    name: str
    category_id: Optional[str] = None
    unit: str = "件"
    cost_price: float = 0.0
    margin1: float = 0.0
    margin2: float = 0.0
    margin3: float = 0.0
    price1: float = 0.0
    price2: float = 0.0
    price3: float = 0.0
    wholesale_price: float = 0.0
    box_quantity: int = 1
    retail_price: float = 0.0
    min_stock: int = 0
    max_stock: int = 9999
    image_url: str = ""
    description: str = ""
    status: str = "active"

class ProductResponse(BaseModel):
    id: str
    code: str
    barcode: str = ""
    name: str
    category_id: Optional[str] = None
    unit: str = "件"
    cost_price: float = 0.0
    margin1: float = 0.0
    margin2: float = 0.0
    margin3: float = 0.0
    price1: float = 0.0
    price2: float = 0.0
    price3: float = 0.0
    wholesale_price: float = 0.0
    box_quantity: int = 1
    retail_price: float = 0.0
    min_stock: int = 0
    max_stock: int = 9999
    image_url: str = ""
    description: str = ""
    status: str = "active"
    created_at: str

# Inventory
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

# Purchase
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

# Sales
class SalesItemCreate(BaseModel):
    product_id: str
    quantity: float
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
    points_used: int = 0

class SalesOrderResponse(BaseModel):
    id: str
    order_no: str
    store_id: str
    customer_id: Optional[str]
    items: List[Dict]
    total_amount: float
    discount_amount: float = 0
    paid_amount: float
    payment_method: str
    status: str
    notes: str = ""
    created_by: str
    created_at: str
    points_used: int = 0
    points_discount: float = 0
    points_earned: int = 0

# Payment Settings
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
    whatsapp_number: str = ""

# System Settings
class SystemSettings(BaseModel):
    company_name: str = ""
    company_tax_id: str = ""
    company_address: str = ""
    company_phone: str = ""
    invoice_header: str = ""
    invoice_footer: str = ""
    default_print_format: str = "80mm"
    auto_print_receipt: bool = True
    receipt_copies: int = 1
    default_report_currency: str = "USD"
    default_date_range: str = "today"
    sales_prefix: str = "SO"
    transfer_prefix: str = "TR"
    purchase_prefix: str = "PO"
    next_sales_number: int = 1
    barcode_scanner_enabled: bool = True
    scanner_input_delay: int = 50
    wholesale_enabled: bool = True
    wholesale_min_quantity: int = 10
    wholesale_discount_percent: float = 0.0
    pricing_mode: str = "local_based"
    points_per_dollar: int = 1
    points_value_rate: int = 100

# Online Shop
class OnlineOrderCreate(BaseModel):
    customer_id: str
    items: List[SalesItemCreate]
    shipping_address: str
    shipping_phone: str
    shipping_name: str
    payment_method: str = "transfer"
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
