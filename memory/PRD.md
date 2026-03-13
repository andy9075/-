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
│       └── admin/ (30+ pages)
```

## Completed Features
- [x] Admin Panel (all CRUD modules)
- [x] POS Cash Register (shifts, cart, payment, held orders, refunds, keyboard shortcuts)
- [x] Multi-currency display (USD / Bs.) with per-department exchange rates
- [x] Online Store with cart and checkout
- [x] Product Import (CSV/Excel/JSON)
- [x] i18n (Chinese/English/Spanish)
- [x] Offline mode with auto-sync
- [x] Frontend Refactoring: Monolithic -> 30+ modular files
- [x] Printing: 80mm receipt, A4 invoice, price labels
- [x] 12-Point Enhancement Plan: All completed
- [x] **Phase 2 Features (2026-03-13):** All 11 new features
  - Report Export (Excel), Profit Analysis, Customer Purchase History
  - Loyalty Points/Balance management, Audit Log
  - Promotions Engine, Accounts Receivable/Payable
  - Data Backup Export, Dashboard Sales Trends
  - Role Permissions, Report Export Buttons
- [x] **POS Auto-Points System (2026-03-13):**
  - Auto-earn points on purchase ($1 = 1pt, configurable)
  - Points redemption at checkout (100pts = $1, configurable)
  - Points badge in POS header when customer selected
  - Points section in payment modal with "use all" button
  - Points earned/used shown in receipt
  - Points rate configuration in System Settings
  - All transactions logged in points_log collection

## P1 - Next Tasks
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
- /app/test_reports/iteration_16.json (POS auto-points - 100%)
