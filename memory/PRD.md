# POS System - Product Requirements Document

## Original Problem Statement
Build a comprehensive web-based POS system inspired by "秘奥软件" desktop application with:
1. Admin backend for managing products, categories, inventory, stores, pricing, and exchange rates
2. Online store for customer-facing e-commerce with Venezuelan payment methods
3. POS cashier frontend with shift management and multi-currency support

## Tech Stack
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Frontend**: React (single SPA) + TailwindCSS + Shadcn/UI
- **Auth**: JWT-based authentication

## Core Features - All Implemented

### Multi-Price System (Updated 2026-03-13)
- **Cost + Margin model**: cost_price × (1 + margin%) = auto-calculated price
- **3 price tiers**: margin1→price1, margin2→price2, margin3→price3(整箱价)
- Admin product form: input cost + 3 margins, prices auto-calculate in real-time
- Product table shows: 编码, 商品名称, 成本价, 利率1%, 价格1, 利率2%, 价格2, 利率3%, 价格3(整箱)

### POS Cashier (/pos)
- 4 price mode buttons: **价格1** / **价格2** / **价格3(整箱)** / **Bs.**
- Bs. mode converts price1 to Bolivares using exchange rate
- Cart updates dynamically when switching price modes
- Currency badge: USD for price modes, Bs. for bs mode

### Admin Panel (/admin)
- Dashboard, store/warehouse management, product/category CRUD
- Exchange rate settings (manual), payment settings
- Online order management with payment confirmation

### Online Store (/shop)
- Product catalog, cart, checkout with Venezuelan payment methods
- Order tracking at /shop/orders (lookup by order number or phone)
- WhatsApp click-to-chat on order success

## Key DB Schema
- products: {code, name, cost_price, margin1, margin2, margin3, price1, price2, price3, wholesale_price, retail_price, ...}
- categories, stores, warehouses, inventory, online_orders, sales_orders, settings

## Testing
- iteration_2.json: 25/25 API tests passed
- iteration_3.json: 8/8 backend + full frontend verified (multi-price system)
- Test files: /app/backend/tests/test_multi_price_system.py

## Credentials
- Admin: username=admin, password=admin123

## Backlog
- P2: Refactor server.py into multiple router modules
- P2: Refactor App.js into separate component files
- P3: Product image upload, barcode scanner, customer loyalty
