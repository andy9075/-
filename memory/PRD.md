# POS System - PRD

## Tech Stack
Backend: FastAPI + MongoDB | Frontend: React + TailwindCSS + Shadcn/UI | Auth: JWT

## Implemented Features

### POS Cashier - Full Screen Layout (Updated 2026-03-13)
- **Full-screen cart table**: columns #, 商品名称, 数量(±), 价格类型(↑↓), 单价, 金额
- **Product search popup**: Search by barcode/name, category tabs (全部/分类), click to add
- **Per-item price arrows**: ↑↓ cycle through 价格1→价格2→整箱
- **Currency toggle**: Header ↑↓ arrows switch $/Bs., converts all prices
- **Box calculation**: Shows detail e.g., "3×$12.00=$36.00"

### Multi-Price System
- Cost + Margin: cost × (1+margin%) = auto-calculated price
- 3 tiers: margin1→price1, margin2→price2, margin3→price3(整箱价)
- Admin form: input cost + 3 margins with real-time calculation

### Warehouse Transfer
- /admin/transfers: source→destination warehouse transfer
- Inventory overview: product × warehouse stock matrix
- Transfer history logs

### Online Store
- Product catalog, cart, checkout (Bank Transfer, Pago Móvil)
- Order tracking: /shop/orders with full item details (product name, qty, price)
- WhatsApp click-to-chat

### Admin Panel
- Dashboard, store/warehouse/product/category/customer/supplier CRUD
- Exchange rates, payment settings, online order management

## Testing: iteration_5.json - 57/57 backend + full frontend passed
## Credentials: admin / admin123

## Backlog
- P2: Refactor server.py/App.js into modules
- P3: Product images, barcode scanner, loyalty system
