# POS System (秘奥软件) - PRD

## Original Problem Statement
Build a comprehensive, desktop-style POS application as a web-based system with multi-store, multi-warehouse support, product management, sales, inventory transfers, and an online store.

## Architecture
- **Frontend:** React (single App.js) + TailwindCSS + Shadcn/UI
- **Backend:** FastAPI (server.py) + MongoDB
- **Auth:** JWT-based login
- **i18n:** LangContext with zh/en/es translations

## Core Modules
1. **POS** (/pos) - Full-screen cashier interface with barcode scanning, hold/recall orders, multi-price levels, payment modal, shortcut toolbar
2. **Admin Panel** (/admin/*) - Dashboard, Stores, Warehouses, Products, Transfers, Customers, Suppliers, Purchases, Sales, Reports, Exchange Rates, Payment Settings
3. **Online Store** (/) - Customer-facing e-commerce with cart, checkout, WhatsApp contact

## Implemented Features (as of 2026-03-13)
- Multi-user login (admin + cashier roles)
- Decimal quantity input in POS
- Barcode scanner integration
- Hold/Recall orders (F4/F10)
- Advanced payment modal (F9) with cash/card/multi-currency
- Dual currency display ($/Bs.)
- POS shortcut toolbar (F1 Search, F3 Clear, F4 Hold, F9 Checkout, F10 Recall, F11 Refund)
- Product import from external systems (Excel .xlsx/.xls, CSV, JSON)
- Multi-language support (Chinese/English/Spanish) on ALL pages
- Store/Warehouse/Customer/Supplier/Purchase/Sales/Transfer management
- Exchange rate settings with per-category rates
- Payment settings (bank transfer, mobile pay, WhatsApp)
- Online store with language switcher and category filtering

## Bug Fixes Applied
- POS price switching (box↔piece) - fixed stale state closures in addToCart/removeFromCart using functional updates (setCart(prev => ...))

## P0 - Completed
- [x] POS price switching bug fix
- [x] POS shortcut toolbar
- [x] Product import (multi-format)
- [x] i18n fix for all admin pages

## P1 - Upcoming
- [ ] Wholesale module
- [ ] Receipt/Invoice printing (80mm + A4)
- [ ] Offline mode sync logic

## P2 - Future
- [ ] Enhanced reporting with charts
- [ ] UI/background improvements
- [ ] Code refactoring (split App.js and server.py)

## Key API Endpoints
- POST /api/auth/login
- GET/POST /api/products, /api/products/import
- GET /api/products/import/template
- GET/POST /api/stores, /api/warehouses
- GET/POST /api/customers, /api/suppliers
- GET/POST /api/purchase-orders
- GET/POST /api/sales, /api/sales-orders
- POST /api/inventory/transfer
- GET/PUT /api/exchange-rates, /api/payment-settings
- GET /api/dashboard/stats

## DB Schema
- products: {id, code, name, category, cost_price, margin1-3, price1-3, items_per_box, barcode, stock, status}
- users: {id, username, password, role, permissions}
- stores, warehouses, customers, suppliers, purchase_orders, sales, inventory, transfers

## Test Credentials
- Username: admin / Password: admin123
