# POS System (Sellox) - Product Requirements Document

## Original Problem Statement
Build a comprehensive POS application as a multi-tenant SaaS system. Branded as **Sellox**.

## Tech Stack
- Frontend: React, React Router, TailwindCSS, Shadcn/UI, Recharts, Sonner
- Backend: FastAPI (modular: core/ + server.py)
- Database: MongoDB (database-per-tenant)

## Completed Features
- Core POS, Multi-currency, Online Store, i18n, Printing (80mm + A4 + SENIAT Fiscal + Dot Matrix)
- Reports, Profit Analysis, Loyalty Points, Audit Log, Promotions
- Tax/IVA Module: multi-rate, tax reports, CSV export
- User Manuals (SuperAdmin + Tenant, role-protected, PDF export)
- Video Tutorial Management: screen recording, upload, auto-generate from manual
- Trial Accounts: super admin creates time-limited demo tenants
- Multi-Tenant SaaS, PWA Offline, Sellox Branding
- **Auto Video Generation (2025-03-14)**: Canvas animation + MediaRecorder generates tutorial videos from 7 manual chapters automatically

## Credentials
- Super Admin: username=admin, password=admin123

## P1 - Next Tasks
- Backend router splitting (server.py → routers/)

## P2 - Future Tasks
- Wholesale Module improvements
- Enhanced Reporting
- UI/UX Polish
