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
- Tenant management for super admin only

### Backend Structure
```
backend/
├── server.py        (~2730 lines - routes, needs splitting)
├── core/
│   ├── __init__.py  (DB connections, tenant helpers)
│   ├── auth.py      (JWT, password, auth dependencies)
│   └── models.py    (All Pydantic models + tax/fiscal fields)
├── routers/         (Empty - next refactoring target)
├── tests/           (Backend test files)
```

### PWA: Service worker + offline POS + auto-sync

## Completed Features (All Sessions)
- Core POS, Multi-currency, Online Store, i18n, Printing
- Reports, Profit Analysis, Loyalty Points, Audit Log, Promotions
- VIP Auto-Upgrade, Product Images, Wholesale, Employee HR
- Commission System, Multi-Tenant SaaS, PWA Offline
- Sellox Branding, Tenant-aware Shop URLs
- Quick POS/Shop buttons in sidebar
- Backend modular refactoring (core/ extracted)
- Docker deployment files (Dockerfile, docker-compose.yml, DEPLOY.md)
- User Manuals (SuperAdminHelpPage + TenantHelpPage, role-based access)
- **Tax/Fiscal Printer Module (2025-03-14)**:
  - IVA/Tax system: multi-rate (16%/8%/0%), product-level tax config
  - Tax breakdown in sales orders (tax_breakdown, total_tax, total_base)
  - Tax report API endpoint (/api/reports/tax)
  - SENIAT fiscal document print template
  - Dot matrix continuous form wholesale invoice template
  - Updated receipt (80mm) and A4 invoice with tax breakdown
  - System settings: SENIAT printer config, dot matrix printer config
  - Product form/table with IVA rate selector and color-coded column
  - POS receipt dialog: 4 print buttons (80mm, A4, Fiscal SENIAT, Mayorista)
  - POS tenant login fix (uses tenant-login endpoint in tenant context)

## Credentials
- Super Admin: username=admin, password=admin123
- Tenant Admin: tenant_id=4e151812, username=shop1admin, password=shop1pass

## P1 - Next Tasks
- Backend router splitting (server.py → routers/)
- Tax summary report page (frontend)

## P2 - Future Tasks
- Wholesale Module improvements
- Enhanced Reporting (complex filters, exports, visualizations)
- UI/UX Polish
