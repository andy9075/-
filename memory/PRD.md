# POS System - Product Requirements Document

## Original Problem Statement
Web-based POS system with admin backend, online store, and cashier frontend for Venezuelan retail businesses.

## Tech Stack
- Backend: FastAPI + MongoDB | Frontend: React + TailwindCSS + Shadcn/UI | Auth: JWT

## Implemented Features

### Multi-Price System (Updated 2026-03-13)
- Cost + Margin model: cost_price × (1 + margin%) = auto-calculated price
- 3 price tiers: margin1→price1, margin2→price2, margin3→price3(整箱价)
- Admin form: input cost + 3 margins, real-time price calculation

### POS Cashier - Per-Item Price Selection (Updated 2026-03-13)
- Each cart item has independent price mode: 价格1 / 价格2 / 整箱
- Box calculation: full boxes × price3 + remainder × price2
- Global Bs./USD toggle for currency display
- Different items in same cart can use different price tiers

### Warehouse Transfer (New 2026-03-13)
- Admin page /admin/transfers for stock transfer between warehouses
- Inventory overview: all products × all warehouses stock matrix
- Transfer history with logs
- API: POST /api/inventory/transfer, GET /api/transfer-logs

### Online Store Order Tracking
- /shop/orders: customer lookup by order number or phone
- Shows purchased items with product name, quantity, unit_price

### Other Features
- Admin Panel: dashboard, store/warehouse/product/category/customer/supplier CRUD
- Exchange rate settings (manual), payment settings (Bank Transfer, Pago Móvil)
- Online order management with payment confirmation
- WhatsApp click-to-chat on order success

## Testing
- iteration_4.json: 11/11 backend + full frontend verified
- All test files: /app/backend/tests/

## Credentials
- Admin: username=admin, password=admin123

## Backlog
- P2: Refactor server.py and App.js into modules
- P3: Product images, barcode scanner, customer loyalty
