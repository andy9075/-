# POS System (Sellox) - Product Requirements Document

## Original Problem Statement
Build a comprehensive POS application as a multi-tenant SaaS system. Branded as **Sellox**.

## Tech Stack
- Frontend: React, React Router, TailwindCSS, Shadcn/UI, Recharts, Sonner
- Backend: FastAPI (modular routers architecture)
- Database: MongoDB (database-per-tenant)

## Architecture
### Backend Structure (REFACTORED 2025-03-14)
```
backend/
├── server.py           (28 lines - app setup, includes routers)
├── core/
│   ├── __init__.py     (DB connections, tenant helpers)
│   ├── auth.py         (JWT, password, auth dependencies)
│   └── models.py       (Pydantic models)
├── routers/            (17 modules, ~3070 lines total)
│   ├── auth.py         (Auth, init-data)
│   ├── stores.py       (Store management)
│   ├── warehouses.py   (Warehouse management)
│   ├── suppliers.py    (Supplier management)
│   ├── customers.py    (Customer + purchase history)
│   ├── categories.py   (Product categories)
│   ├── products.py     (Products, import, images, bundles)
│   ├── inventory.py    (Inventory, alerts, stock-taking)
│   ├── purchases.py    (Purchase orders, returns)
│   ├── sales.py        (Sales orders, refunds, settlements)
│   ├── shop.py         (Online shop)
│   ├── reports.py      (Reports, dashboard, tax, export)
│   ├── settings.py     (Exchange rates, payment, system)
│   ├── employees.py    (Employee mgmt, attendance, perms)
│   ├── tenants.py      (Multi-tenant management)
│   ├── crm.py          (Promotions, VIP, commission, notifications)
│   └── misc.py         (Videos, audit, accounts, backup)
├── uploads/
│   ├── products/
│   └── videos/
```

## Completed Features
- Core POS, Multi-currency, Online Store, i18n
- Printing: 80mm thermal, A4 invoice, SENIAT fiscal, dot matrix wholesale
- Reports, Profit Analysis, Loyalty Points, Audit Log, Promotions
- Tax/IVA Module: multi-rate (16%/8%/0%), tax reports, CSV export
- User Manuals (SuperAdmin + Tenant, role-protected, PDF export)
- Video Tutorial Management: screen recording, upload, auto-generate from manual
- Trial Accounts: time-limited demo tenants
- Multi-Tenant SaaS, PWA Offline, Sellox Branding
- Backend fully modularized (17 routers)

## Credentials
- Super Admin: username=admin, password=admin123

## P2 - Future Tasks
- Wholesale Module improvements
- Enhanced Reporting (complex filters, exports, visualizations)
- UI/UX Polish
