# POS System - Product Requirements Document

## Original Problem Statement
Build a comprehensive web-based POS system inspired by "秘奥软件" desktop application. The system includes:
1. Admin backend for managing products, categories, inventory, stores, pricing, and exchange rates
2. Online store for customer-facing e-commerce with Venezuelan payment methods
3. POS cashier frontend with shift management and multi-currency support

## Target Market
- Venezuelan retail businesses needing multi-currency support (USD + Bolívares)
- Local payment methods: Bank Transfer, Pago Móvil

## Tech Stack
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Frontend**: React (single SPA) + TailwindCSS + Shadcn/UI
- **Auth**: JWT-based authentication
- **Architecture**: Monolithic (server.py backend, App.js frontend)

## Core Requirements

### Implemented Features (All Complete & Tested)
1. **Admin Panel** - Dashboard, store/warehouse/product/customer/supplier/category management
2. **Multi-Price System** - price1 (USD), price2 (Bs.), wholesale_price per product
3. **Exchange Rate Management** - System-wide and per-category exchange rates (manual)
4. **Venezuelan Payments** - Bank Transfer + Pago Móvil with admin configuration
5. **WhatsApp Integration** - Click-to-chat button on order success (wa.me link)
6. **Online Store** - Product catalog, cart, checkout with payment info display
7. **Order Tracking** - Customer can look up orders by order number or phone at /shop/orders
8. **POS Cashier** - Login, store selection, shift management, price mode switching (USD/Bs./Mayor)
9. **Purchase Orders** - Create purchase orders, receive inventory
10. **Inventory Management** - Multi-warehouse, stock tracking, transfers
11. **Reports** - Sales summary, inventory summary, top products

### Key Endpoints
- `GET/POST /api/products` - Product CRUD
- `GET/POST /api/categories` - Categories with exchange_rate field
- `GET/PUT /api/exchange-rates` - System exchange rates
- `GET/PUT /api/payment-settings` - Venezuelan payment config
- `GET /api/shop/products` - Public product listing
- `POST /api/shop/orders` - Create online order
- `GET /api/shop/order-lookup` - Public order lookup by order_no/phone
- `POST /api/sales-orders` - POS sales
- `GET /api/dashboard/stats` - Dashboard statistics

### DB Collections
- users, products, categories, stores, warehouses, inventory, customers, suppliers
- purchase_orders, sales_orders, online_orders, settings, inventory_logs, transfer_logs

## Testing Status
- Backend: 25/25 API tests passing (pytest)
- Frontend: All pages functional and verified
- Test files: /app/backend/tests/test_pos_api.py, /app/test_reports/iteration_2.json

## Credentials
- Admin: username=admin, password=admin123

## Backlog / Future Tasks
- P2: Refactor server.py into multiple router modules
- P2: Refactor App.js into separate component files
- P3: Add product image upload
- P3: Add barcode scanner support for POS
- P3: Implement customer loyalty/points system
