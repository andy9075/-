# POS System (秘奥软件) - Product Requirements Document

## Original Problem Statement
Build a comprehensive, desktop-style POS application ("秘奥软件") as a web-based system with multi-currency support, online store, and admin management. Transform it into a multi-tenant SaaS platform with PWA offline capabilities.

## Tech Stack
- Frontend: React, React Router, TailwindCSS, Shadcn/UI, Recharts, Sonner
- Backend: FastAPI, Pydantic, openpyxl
- Database: MongoDB (database-per-tenant model)

## Architecture
### Multi-Tenant SaaS
- **Database-per-tenant**: Master DB (`test_database`) for admin/tenants, `tenant_{id}` DB for each tenant
- **Token structure**: `{user_id, username, role, tenant_id, exp}`
- **DB routing**: `get_user_db(current_user)` returns tenant DB if `tenant_id` exists, else master DB
- **Access control**: Tenant management endpoints check `role=admin AND no tenant_id`
- **Frontend check**: `isSuperAdmin = user?.role === 'admin' && !user?.tenant_id`

### PWA
- Service worker (`sw.js`) caches static assets, handles offline API gracefully
- `manifest.json` enables app installation
- `PwaInstallPrompt.js` shows install button
- POS page handles offline sales with localStorage queue + auto-sync on reconnect

## Completed Features

### Core POS
- POS Cash Register (shifts, cart, payment, held orders, refunds, keyboard shortcuts)
- Multi-currency (USD/Bs.), Online Store, Product Import, i18n (zh/en/es)
- Printing: 80mm receipt, A4 invoice, price labels

### Phase 2 - Enhancements
- Report Export (Excel), Profit Analysis, Customer Purchase History
- Loyalty Points/Balance, Audit Log, Promotions Engine
- Accounts Receivable/Payable, Data Backup, Dashboard Trends
- Role Permissions, POS Auto-Points ($1=1pt, 100pt=$1)

### Phase 3 - Advanced
- VIP Auto-Upgrade, Product Images, Wholesale Module, Data Restore
- Employee Attendance, Sales Targets, Purchase Returns
- Product Bundles, Cost Price Tracking, Notification Center
- Sidebar Grouped Navigation (9 collapsible groups)

### Phase 4 - Commission System (2026-03-13)
- Configurable commission tiers (base 3%, standard 5%, excellent 8%)
- Monthly commission report with bar chart and detail table

### Phase 5 - Multi-Tenant SaaS & PWA (2026-03-14)
- **Multi-Tenant Architecture**: Database-per-tenant isolation, tenant-aware JWT, super-admin management
- **Tenant Login Flow**: Separate tab for tenant login with tenant ID
- **Tenant Management**: Super-admin page for creating/managing tenants, viewing stats
- **PWA Offline**: Service worker, manifest.json, offline POS with auto-sync
- **Access Control**: SaaS menu only visible for super admins
- **Data Isolation**: All 93+ routes use `get_user_db()` for tenant-scoped data access

## Test Reports
- iteration_14-17: All 100% passed
- iteration_18: Commission features 100% passed
- iteration_19: Multi-tenant 100% passed (18/18 backend + all frontend)

## Credentials
- Super Admin: username=admin, password=admin123 (no tenant ID)
- Test Tenant: Shop 1 (4e151812), Shop 2 (a12da2d7), UI_Test_Tenant (bf11b4b9)

## P1 - Next Tasks
- Backend server.py refactoring into API routers (~3000 lines → modular)
- Wholesale Module improvements
- Enhanced Reporting (complex filters, exports, visualizations)
- UI/UX Polish
