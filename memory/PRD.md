# POS System (Sellox) - Product Requirements Document

## Original Problem Statement
Build a comprehensive POS application as a multi-tenant SaaS system. Branded as **Sellox**.

## Tech Stack
- Frontend: React, React Router, TailwindCSS, Shadcn/UI, Recharts, Sonner
- Backend: FastAPI (17 modular routers)
- Database: MongoDB (database-per-tenant)
- Video Recording: Playwright (automated browser recording)

## Architecture (Refactored)
```
backend/
├── server.py              (28 lines - app setup)
├── generate_tutorials.py  (Playwright-based video recording)
├── core/                  (DB, auth, models)
├── routers/               (17 modules, ~3070 lines)
│   ├── auth, stores, warehouses, suppliers
│   ├── customers, categories, products, inventory
│   ├── purchases, sales, shop, reports
│   ├── settings, employees, tenants, crm, misc
├── uploads/videos/        (Recorded tutorial videos)
```

## Completed Features
- Core POS, Multi-currency, Online Store, i18n
- Printing: 80mm thermal, A4, SENIAT fiscal, dot matrix wholesale
- Tax/IVA Module: multi-rate, tax reports
- User Manuals with PDF export
- **Real Operation Video Tutorials**: Playwright auto-records 7 tutorials
- Trial Accounts, Multi-Tenant SaaS, PWA Offline
- Backend fully modularized (17 routers)

## Credentials
- Super Admin: username=admin, password=admin123

## P2 - Future Tasks
- Wholesale Module improvements
- Enhanced Reporting
- UI/UX Polish
