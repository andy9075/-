# POS System (秘奥软件) - Product Requirements Document

## Original Problem Statement
Build a comprehensive, desktop-style POS application ("秘奥软件") as a web-based system with multi-currency support, online store, and admin management.

## Tech Stack
- **Frontend:** React, React Router, TailwindCSS, Shadcn/UI, Sonner (toasts)
- **Backend:** FastAPI, Pydantic
- **Database:** MongoDB
- **State:** React Context (Auth, Lang)

## Architecture (Post-Refactoring)
```
/app
├── backend/
│   └── server.py           # Monolithic FastAPI (to be refactored later)
├── frontend/src/
│   ├── App.js              # Clean routing file (~80 lines)
│   ├── lib/api.js          # Shared API constant + axios config
│   ├── context/
│   │   ├── AuthContext.js   # Auth provider (login/logout/token)
│   │   └── LangContext.js   # i18n (zh/en/es)
│   ├── components/
│   │   ├── AdminLayout.js   # Admin sidebar + layout
│   │   ├── ProtectedRoute.js
│   │   └── ui/              # Shadcn components
│   └── pages/
│       ├── LoginPage.js
│       ├── PosPage.js       # Full POS cash register
│       ├── ShopPage.js      # Online storefront
│       ├── ShopOrdersPage.js
│       └── admin/
│           ├── Dashboard.js
│           ├── ProductsPage.js (with import)
│           ├── StoresPage.js
│           ├── WarehousesPage.js
│           ├── CustomersPage.js
│           ├── SuppliersPage.js
│           ├── PurchasesPage.js
│           ├── SalesPage.js
│           ├── OnlineOrdersPage.js
│           ├── SalesReportPage.js
│           ├── ReportsPage.js
│           ├── TransferPage.js
│           ├── ExchangeRatesPage.js
│           ├── PaymentSettingsPage.js
│           ├── SystemSettingsPage.js
│           ├── EmployeesPage.js
│           ├── StockAlertsPage.js
│           └── StockTakingPage.js
```

## Completed Features
- [x] Admin Panel (all CRUD modules)
- [x] POS Cash Register (shifts, cart, payment, held orders, refunds, keyboard shortcuts)
- [x] Multi-currency display (USD / Bs.) with per-department exchange rates
- [x] Online Store with cart and checkout
- [x] Product Import (CSV/Excel/JSON)
- [x] i18n (Chinese/English/Spanish)
- [x] Offline mode with pending order queue
- [x] **Frontend Refactoring** (2026-03-13): 5322-line monolithic App.js → 25+ modular files
- [x] **Bug fixes**: getProductBsRate→getProductBsMultiplier, setShowSearch→setShowProductSearch
- [x] **Offline sync logic**: Auto-sync pending orders when coming back online

## Bugs Fixed (2026-03-13)
- `getProductBsRate` was called but never defined → fixed to use `getProductBsMultiplier`
- `setShowSearch` was called but didn't exist → fixed to `setShowProductSearch`
- Duplicate `onKeyDown` handler on search input → consolidated into single handler

## P0 - Verified / Stable
- Login/Auth flow
- Admin dashboard with stats
- All admin sidebar navigation (15+ pages)
- Products management (CRUD + import)
- POS login → store select → shift → cart → payment
- Online shop → cart → checkout
- Language switcher (zh/en/es)
- Currency toggle ($/Bs.)

## P1 - Next Tasks
- Verify POS pricing logic correctness (user was previously reporting incorrect calculations)
- Receipt/Invoice Printing (80mm thermal + A4)
- Wholesale Module
- Backend server.py refactoring into API routers

## P2 - Future Tasks
- Enhanced Reporting with charts
- UI/UX polish
- Product images upload

## Test Credentials
- Username: admin / Password: admin123

## Test Reports
- /app/test_reports/iteration_11.json (2026-03-13, 100% pass - 8 features verified)
