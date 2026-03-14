# POS System (Sellox) - Product Requirements Document

## Original Problem Statement
Build a comprehensive POS application as a multi-tenant SaaS system. Branded as **Sellox**.

## Tech Stack
- Frontend: React, React Router, TailwindCSS, Shadcn/UI, Recharts, Sonner
- Backend: FastAPI (17 modular routers)
- Database: MongoDB (database-per-tenant)
- Video Recording: Playwright (automated browser recording)
- Voice Narration: OpenAI TTS via emergentintegrations (Emergent LLM Key)
- Audio/Video Processing: ffmpeg

## Architecture
```
backend/
├── server.py                     (28 lines - app setup)
├── generate_tutorials.py         (Playwright-based video recording)
├── generate_narrated_tutorials.py (TTS + Playwright + ffmpeg pipeline)
├── narration_scripts.py          (Chinese narration text for 7 tutorials)
├── core/                         (DB, auth, models)
├── routers/                      (17 modules)
│   ├── auth, stores, warehouses, suppliers
│   ├── customers, categories, products, inventory
│   ├── purchases, sales, shop, reports
│   ├── settings, employees, tenants, crm, misc
├── uploads/videos/
```

## Completed Features (as of 2026-03-14)
- Core POS, Multi-currency, Online Store, i18n (zh/en/es)
- Printing: 80mm thermal, A4, SENIAT fiscal, dot matrix wholesale
- Tax/IVA Module: multi-rate, tax reports
- User Manuals with PDF export
- Narrated Video Tutorials: Playwright + OpenAI TTS + ffmpeg
- Trial Accounts, Multi-Tenant SaaS, PWA Offline
- Backend fully modularized (17 routers)
- **Change Password**: sidebar button + dialog for all users
- **Wholesale Module (upgraded)**:
  - Stats dashboard (total orders, pending, revenue, items)
  - Order CRUD with status management (pending→completed→delivered→cancelled)
  - Payment tracking (partial payments, unpaid balance)
  - Order detail view with item breakdown
  - Print support (dot-matrix compatible receipt)
  - Status filter tabs
  - Delivery address + notes fields
  - Inventory auto-deduction on order / auto-restore on cancel

## Credentials
- Super Admin: username=admin, password=admin123

## P2 - Future Tasks
- Enhanced Reporting (advanced filters, visualizations, export)
- UI/UX Polish
