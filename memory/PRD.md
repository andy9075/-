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

### Backend Structure (Refactored)
```
backend/
├── server.py        (2648 lines - routes)
├── core/
│   ├── __init__.py  (DB connections, tenant helpers)
│   ├── auth.py      (JWT, password, auth dependencies)
│   └── models.py    (All Pydantic models)
```

### PWA: Service worker + offline POS + auto-sync

## Completed Features
- Core POS, Multi-currency, Online Store, i18n, Printing
- Reports, Profit Analysis, Loyalty Points, Audit Log, Promotions
- VIP Auto-Upgrade, Product Images, Wholesale, Employee HR
- Commission System, Multi-Tenant SaaS, PWA Offline
- Sellox Branding, Tenant-aware Shop URLs
- Quick POS/Shop buttons in sidebar
- Backend modular refactoring (core/ extracted)
- Docker deployment files (Dockerfile, docker-compose.yml, DEPLOY.md)

## Credentials
- Super Admin: username=admin, password=admin123

## P1 - Next Tasks
- Further backend router splitting (server.py → routers/)
- Wholesale Module improvements
- Enhanced Reporting
- UI/UX Polish
