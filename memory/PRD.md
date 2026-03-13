# POS System - PRD

## Tech Stack
Backend: FastAPI + MongoDB | Frontend: React + TailwindCSS + Shadcn/UI | Auth: JWT

## Implemented Features

### POS Cashier - Full Screen Layout
- Full-screen cart table: #, 商品名称, 数量(±), 价格类型(↑↓), 单价, 金额
- Product search popup: TABLE format (编码/商品名称/成本/价格1/价格2/价格3/操作+), category tabs
- Per-item price arrows: ↑↓ cycle through 价格1→价格2→整箱
- Currency toggle: Header ↑↓ arrows switch $/Bs.
- Box calculation: Shows `12×$12.00=$144.00` format, works in both $ and Bs. modes

### Multi-Price System
- Cost + Margin: cost × (1+margin%) = auto-calculated price
- 3 tiers: margin1→price1, margin2→price2, margin3→price3(整箱价)
- Admin form: input cost + 3 margins with real-time calculation

### Warehouse Transfer
- /admin/transfers: searchable product dropdown for transfers
- Inventory overview: product × warehouse stock matrix
- Transfer history logs

### Online Store
- Product catalog, cart, checkout (Bank Transfer, Pago Móvil)
- Order tracking with full item details

### Admin Panel
- Dashboard, store/warehouse/product/category/customer/supplier CRUD
- Exchange rates, payment settings, online order management
- Fixed: toast spam from auth errors (removed StrictMode + auth error filtering)

## Credentials: admin / admin123

## Backlog
- P2: Refactor server.py/App.js into modules
- P3: Product images, barcode scanner, loyalty system
