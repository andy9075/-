# POS System (Sellox) - Product Requirements Document

## Original Problem Statement
Build a comprehensive POS application as a multi-tenant SaaS system. Branded as **Sellox**.

## Tech Stack
- Frontend: React, React Router, TailwindCSS, Shadcn/UI, Recharts, Sonner
- Backend: FastAPI (modular: core/ + server.py)
- Database: MongoDB (database-per-tenant)

## Brand
- **Name**: Sellox | **Tagline**: Smart POS
- **Logo**: /frontend/public/sellox-logo.png

## Architecture
### Multi-Tenant SaaS (database-per-tenant)
- Master DB for admin/tenants, `tenant_{id}` DB per tenant
- JWT with tenant_id, `get_user_db()` for DB routing

### Backend Structure
```
backend/
├── server.py        (~2760 lines - routes, needs splitting)
├── core/
│   ├── __init__.py  (DB connections, tenant helpers)
│   ├── auth.py      (JWT, password, auth dependencies)
│   └── models.py    (Pydantic models + tax/fiscal fields)
├── routers/         (Empty - next refactoring target)
├── tests/           (Backend test files)
```

## Completed Features
- Core POS, Multi-currency, Online Store, i18n, Printing (80mm + A4)
- Reports, Profit Analysis, Loyalty Points, Audit Log, Promotions
- VIP Auto-Upgrade, Product Images, Wholesale, Employee HR
- Commission System, Multi-Tenant SaaS, PWA Offline
- Sellox Branding, Tenant-aware Shop URLs
- Backend modular refactoring (core/ extracted)
- Docker deployment files
- User Manuals (SuperAdminHelpPage + TenantHelpPage)
- **Tax/Fiscal Module (2025-03-14)**:
  - IVA multi-rate: 16%/8%/0%, product-level tax config
  - Tax breakdown in sales orders
  - SENIAT fiscal document print template
  - Dot matrix continuous form wholesale invoice template
  - System settings: SENIAT + dot matrix printer config
  - POS receipt dialog: 4 print buttons
  - POS tenant login fix
- **Tax Report Page (2025-03-14)**:
  - Reporte Fiscal / IVA page with date filtering
  - Summary cards (Total Ventas, Base Imponible, Total IVA, Facturas)
  - Breakdown table by tax rate with color-coded rows
  - CSV export with BOM for Excel compatibility
  - Print-friendly layout for tax declarations

## Credentials
- Super Admin: username=admin, password=admin123
- Tenant Admin: tenant_id=4e151812, username=shop1admin, password=shop1pass

## P1 - Next Tasks
- Backend router splitting (server.py → routers/)

## P2 - Future Tasks
- Wholesale Module improvements
- Enhanced Reporting (complex filters, exports, visualizations)
- UI/UX Polish
