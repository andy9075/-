# POS System (秘奥软件) - Product Requirements Document

## Original Problem Statement
Build a comprehensive, desktop-style POS application ("秘奥软件") as a web-based system with multi-currency support, online store, and admin management.

## Tech Stack
- **Frontend:** React, React Router, TailwindCSS, Shadcn/UI, Recharts, Sonner
- **Backend:** FastAPI, Pydantic, openpyxl
- **Database:** MongoDB
- **State:** React Context (Auth, Lang)

## Architecture
```
/app
├── backend/
│   └── server.py
├── frontend/src/
│   ├── App.js
│   ├── lib/api.js
│   ├── context/ (AuthContext, LangContext)
│   ├── components/ (AdminLayout, ProtectedRoute, Print components, ui/)
│   └── pages/
│       ├── LoginPage.js, PosPage.js, ShopPage.js, ShopOrdersPage.js
│       └── admin/ (25+ pages)
```

## Completed Features
- [x] Admin Panel (all CRUD modules)
- [x] POS Cash Register (shifts, cart, payment, held orders, refunds, keyboard shortcuts)
- [x] Multi-currency display (USD / Bs.) with per-department exchange rates
- [x] Online Store with cart and checkout
- [x] Product Import (CSV/Excel/JSON)
- [x] i18n (Chinese/English/Spanish)
- [x] Offline mode with auto-sync
- [x] Frontend Refactoring: Monolithic → 25+ modular files
- [x] Printing: 80mm receipt, A4 invoice, price labels
- [x] 12-Point Enhancement Plan: All completed
- [x] **Phase 2 Features (2026-03-13):** All 11 new features
  - [x] Report Export: Sales & Inventory Excel download
  - [x] Profit Analysis: Revenue/cost/profit per product with charts
  - [x] Customer Purchase History: Order history in customer detail
  - [x] Loyalty Points/Balance: Add/redeem points, top-up balance
  - [x] Audit Log: Track all operations with filters
  - [x] Promotions Engine: CRUD for discount/fullReduction/buyGet/flashSale
  - [x] Accounts Receivable/Payable: Track credit sales & supplier debts
  - [x] Data Backup Export: Full JSON database backup
  - [x] Dashboard Sales Trends: 7-day/30-day area chart
  - [x] Role Permissions: Admin/manager/cashier/staff permission system
  - [x] Report Export Buttons: Added to Reports page UI

## P1 - Next Tasks
- Offline Mode sync logic enhancement
- Wholesale Module (dedicated wholesale ordering flow)
- Backend server.py refactoring into API routers

## P2 - Future Tasks
- UI/UX polish across the app
- Product images upload
- Enhanced reporting (complex filters, PDF export)

## Test Credentials
- Username: admin / Password: admin123

## Test Reports
- /app/test_reports/iteration_14.json (pie chart fix - 100%)
- /app/test_reports/iteration_15.json (11 new features - 100%)
