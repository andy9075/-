# POS System (秘奥软件) - Product Requirements Document

## Original Problem Statement
Build a comprehensive, desktop-style POS application ("秘奥软件") as a web-based system with multi-currency support, online store, and admin management.

## Tech Stack
- **Frontend:** React, React Router, TailwindCSS, Shadcn/UI, Sonner (toasts)
- **Backend:** FastAPI, Pydantic
- **Database:** MongoDB
- **State:** React Context (Auth, Lang)

## Architecture
```
/app
├── backend/
│   └── server.py
├── frontend/src/
│   ├── App.js              # Clean routing (~80 lines)
│   ├── lib/api.js
│   ├── context/
│   │   ├── AuthContext.js
│   │   └── LangContext.js   # i18n (zh/en/es)
│   ├── components/
│   │   ├── AdminLayout.js
│   │   ├── ProtectedRoute.js
│   │   ├── ReceiptPrint.js  # 80mm thermal receipt
│   │   ├── InvoicePrint.js  # A4 invoice
│   │   ├── PriceLabelPrint.js # Price labels (3-col grid)
│   │   └── ui/
│   └── pages/
│       ├── LoginPage.js
│       ├── PosPage.js
│       ├── ShopPage.js
│       ├── ShopOrdersPage.js
│       └── admin/ (18 pages)
```

## Completed Features
- [x] Admin Panel (all CRUD modules)
- [x] POS Cash Register (shifts, cart, payment, held orders, refunds, keyboard shortcuts)
- [x] Multi-currency display (USD / Bs.) with per-department exchange rates
- [x] Online Store with cart and checkout
- [x] Product Import (CSV/Excel/JSON)
- [x] i18n (Chinese/English/Spanish)
- [x] Offline mode with auto-sync
- [x] **Frontend Refactoring** (2026-03-13): Monolithic → 25+ modular files
- [x] **80mm Thermal Receipt** (2026-03-13): Print after POS payment, dual currency
- [x] **A4 Invoice** (2026-03-13): Print from POS or Sales management
- [x] **Price Labels** (2026-03-13): Select products → print labels (3-col grid, triple price)

- [x] **12-Point Enhancement Plan** (2026-03-13): All 12 items completed
  - New pages: Customers, Suppliers, Categories, Daily Settlement, Marketing
  - Reports page with bar charts and pie chart (payment method distribution)
  - Sales page search/filter, POS customer selection, ShopPage Bs. currency
  - Reports pie chart fix: added by_payment_method to backend sales-summary API
  - Added topProducts translation key (zh/en/es)

## P1 - Next Tasks
- Offline Mode sync logic (queue sales offline, auto-sync on reconnection)
- Wholesale Module
- Backend server.py refactoring into API routers

## P2 - Future Tasks
- UI/UX polish across the app
- Product images upload
- Enhanced reporting (complex filters, exports)

## Test Credentials
- Username: admin / Password: admin123

## Test Reports
- /app/test_reports/iteration_8.json, iteration_9.json, iteration_10.json (previous session)
- /app/test_reports/iteration_14.json (reports pie chart fix - 100% pass)
