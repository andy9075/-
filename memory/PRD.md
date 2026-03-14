# POS System (Sellox) - Product Requirements Document

## Original Problem Statement
Build a comprehensive, desktop-style POS application as a web-based SaaS system. Branded as **Sellox** - Smart POS.

## Tech Stack
- Frontend: React, React Router, TailwindCSS, Shadcn/UI, Recharts, Sonner
- Backend: FastAPI, Pydantic, openpyxl
- Database: MongoDB (database-per-tenant model)

## Brand
- **Name**: Sellox
- **Tagline**: Smart POS
- **Logo**: /frontend/public/sellox-logo.png
- **Icons**: icon-192.png, icon-512.png, favicon.png

## Architecture
### Multi-Tenant SaaS
- Database-per-tenant: Master DB for admin/tenants, `tenant_{id}` DB for each tenant
- Token structure: `{user_id, username, role, tenant_id, exp}`
- DB routing: `get_user_db(current_user)` returns correct DB
- Access control: Tenant management = super admin only

### PWA
- Service worker caches assets, offline POS with auto-sync
- Installable via manifest.json

## Completed Features
- Core POS, Multi-currency, Online Store, i18n, Printing
- Reports, Profit Analysis, Loyalty Points, Audit Log, Promotions
- VIP Auto-Upgrade, Product Images, Wholesale, Employee HR
- Commission System, Multi-Tenant SaaS, PWA Offline
- **Sellox Branding** (2026-03-14): Logo, icons, updated all UI

## Test Reports
- iteration_19: Multi-tenant 100% passed (18/18 backend + all frontend)

## Credentials
- Super Admin: username=admin, password=admin123

## P1 - Next Tasks
- Backend server.py refactoring (~3000 lines → modular)
- Wholesale Module improvements
- Enhanced Reporting
- UI/UX Polish
