# POS System (Sellox) - Product Requirements Document

## Original Problem Statement
Build a comprehensive POS application as a multi-tenant SaaS system. Branded as **Sellox**.

## Tech Stack
- Frontend: React, React Router, TailwindCSS, Shadcn/UI, Recharts, Sonner
- Backend: FastAPI (modular: core/ + server.py)
- Database: MongoDB (database-per-tenant)

## Architecture
### Multi-Tenant SaaS (database-per-tenant)
- Master DB for admin/tenants, `tenant_{id}` DB per tenant
- JWT with tenant_id, `get_user_db()` for DB routing

### Backend Structure
```
backend/
├── server.py        (~2850 lines - routes, needs splitting)
├── core/
│   ├── __init__.py  (DB connections, tenant helpers)
│   ├── auth.py      (JWT, password, auth dependencies)
│   └── models.py    (Pydantic models)
├── routers/         (Empty - next refactoring target)
├── uploads/videos/  (Video tutorial storage)
├── tests/
```

## Completed Features
- Core POS, Multi-currency, Online Store, i18n, Printing (80mm + A4)
- Reports, Profit Analysis, Loyalty Points, Audit Log, Promotions
- VIP Auto-Upgrade, Product Images, Wholesale, Employee HR
- Commission System, Multi-Tenant SaaS, PWA Offline
- Sellox Branding, Tenant-aware Shop URLs
- Backend modular refactoring (core/ extracted)
- Docker deployment files
- User Manuals (SuperAdmin + Tenant, role-protected)
- Tax/Fiscal Module: IVA multi-rate, SENIAT fiscal print, dot matrix wholesale print
- Tax Report Page with CSV export
- **Video Tutorial Management (2025-03-14)**:
  - Screen recording via browser MediaRecorder API
  - Video upload/list/edit/delete CRUD
  - Help pages embed video player
  - Video categorization (POS, products, inventory, etc.)
- **Manual PDF Export (2025-03-14)**:
  - Both help pages have Export PDF button
  - Print-optimized CSS for clean PDF output
- **Trial Accounts (2025-03-14)**:
  - Super admin can create trial tenants with expiry (7/14/30/60/90 days)
  - Tenant list shows trial badge with remaining days
  - Trial expired status tracking
  - Summary card showing trial count

## Credentials
- Super Admin: username=admin, password=admin123
- Test Trial Tenant: trialadmin/trial123 (TEST_TrialBusiness)

## P1 - Next Tasks
- Backend router splitting (server.py → routers/)

## P2 - Future Tasks
- Wholesale Module improvements
- Enhanced Reporting
- UI/UX Polish
