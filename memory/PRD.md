# POS System - Product Requirements Document

## Original Problem Statement
Build a comprehensive web-based POS system inspired by "秘奥软件" desktop application. The system includes:
1. Admin backend for managing products, categories, inventory, stores, pricing, and exchange rates
2. Online store for customer-facing e-commerce with Venezuelan payment methods
3. POS cashier frontend with shift management and multi-currency support

## Target Market
- Venezuelan retail businesses needing multi-currency support (USD + Bolivares)
- Local payment methods: Bank Transfer, Pago Movil

## Tech Stack
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Frontend**: React (single SPA) + TailwindCSS + Shadcn/UI
- **Auth**: JWT-based authentication
- **Architecture**: Monolithic (server.py backend, App.js frontend)

## Core Requirements - All Implemented & Tested

### Admin Panel
- Dashboard with sales stats, product counts, pending orders
- Store/warehouse/product/customer/supplier/category CRUD
- Multi-price system: price1 (USD), price2 (Bs.), wholesale_price per product
- Exchange rate management (system-wide and per-category, manual)
- Venezuelan payment settings (Bank Transfer + Pago Movil)
- Online order management with payment confirmation workflow

### Online Store (/shop)
- Product catalog with categories
- Shopping cart and checkout
- Venezuelan payment methods display
- WhatsApp click-to-chat on order success
- Order tracking at /shop/orders (lookup by order number or phone)

### POS Cashier (/pos)
- Login, store selection, shift management
- Product grid with category filtering and barcode search
- Price mode switching: USD / Bs. / Mayor (wholesale)
- Cart with dynamic currency symbol updates
- Payment modal with cash change calculation

## Bug Fixes Applied (2026-03-13)
- Fixed: Cart item amounts showed hardcoded `$` instead of dynamic currency symbol (Bs./$/Mayor)
- Fixed: Payment change display used hardcoded `$` symbol
- Fixed: Wholesale mode displayed awkward "$ Mayor" prefix, simplified to "$"
- Fixed: Stale closure in handlePriceModeChange using functional state update
- Fixed: Shop page used ¥ (Yuan) symbol instead of $ for USD prices

## Testing Status
- Backend: 25/25 API tests passing
- Frontend: All pages verified, price switching tested across all 3 modes
- Test files: /app/backend/tests/test_pos_api.py, /app/test_reports/iteration_2.json

## Credentials
- Admin: username=admin, password=admin123

## Backlog / Future Tasks
- P2: Refactor server.py into multiple router modules
- P2: Refactor App.js into separate component files
- P3: Add product image upload
- P3: Add barcode scanner support for POS
- P3: Implement customer loyalty/points system
