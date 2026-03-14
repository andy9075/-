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
│   ├── server.py
│   └── uploads/products/   (product images)
├── frontend/src/
│   ├── App.js
│   ├── lib/api.js
│   ├── context/ (AuthContext, LangContext)
│   ├── components/ (AdminLayout with grouped nav, Print, ui/)
│   └── pages/
│       ├── LoginPage.js, PosPage.js, ShopPage.js, ShopOrdersPage.js
│       └── admin/ (35+ pages)
```

## Completed Features

### Core POS
- [x] POS Cash Register with shifts, cart, payment, held orders, refunds, keyboard shortcuts
- [x] Multi-currency (USD/Bs.) with per-department exchange rates
- [x] Online Store with cart and checkout
- [x] Product Import (CSV/Excel/JSON)
- [x] i18n (Chinese/English/Spanish)
- [x] Printing: 80mm receipt, A4 invoice, price labels

### Phase 1 - Foundation
- [x] Admin Panel with all CRUD modules
- [x] Frontend refactored from monolithic to 35+ modular files

### Phase 2 - Enhancements (2026-03-13)
- [x] Report Export (Excel), Profit Analysis, Customer Purchase History
- [x] Loyalty Points/Balance, Audit Log, Promotions Engine
- [x] Accounts Receivable/Payable, Data Backup, Dashboard Trends
- [x] Role Permissions, POS Auto-Points ($1=1pt earn, 100pt=$1 redeem)

### Phase 3 - Advanced Features (2026-03-13)
- [x] VIP Auto-Upgrade (normal->silver->gold->VIP based on spending)
- [x] Product Image Upload with display in shop
- [x] Wholesale Module (dedicated wholesale ordering)
- [x] Data Restore from JSON backup
- [x] Employee Attendance (clock in/out, hours tracking)
- [x] Sales Target Management (monthly/quarterly with progress)
- [x] Purchase Returns (create, approve workflow)
- [x] Product Bundles/Combos (create bundles with discount pricing)
- [x] Cost Price Change Tracking
- [x] Notification Center (low stock, overdue accounts, pending orders)
- [x] Sidebar Grouped Navigation (9 collapsible groups)

## P1 - Next Tasks
- Backend server.py refactoring into API routers (code organization)
- Offline Mode sync enhancement

## P2 - Future Tasks
- UI/UX polish across the app
- Enhanced reporting (PDF export, complex filters)
- Barcode scanner optimization

## Test Credentials
- Username: admin / Password: admin123

## Test Reports
- iteration_14: pie chart fix (100%)
- iteration_15: 11 features (100%)
- iteration_16: POS auto-points (100%)
- iteration_17: Phase 3 - 12 features (100%)
