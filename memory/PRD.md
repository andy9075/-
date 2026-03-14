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

## Architecture (Refactored)
```
backend/
├── server.py                     (28 lines - app setup)
├── generate_tutorials.py         (Playwright-based video recording)
├── generate_narrated_tutorials.py (TTS + Playwright + ffmpeg pipeline)
├── narration_scripts.py          (Chinese narration text for 7 tutorials)
├── core/                         (DB, auth, models)
├── routers/                      (17 modules, ~3070 lines)
│   ├── auth, stores, warehouses, suppliers
│   ├── customers, categories, products, inventory
│   ├── purchases, sales, shop, reports
│   ├── settings, employees, tenants, crm, misc
├── uploads/videos/               (Recorded tutorial videos)
```

## Completed Features
- Core POS, Multi-currency, Online Store, i18n
- Printing: 80mm thermal, A4, SENIAT fiscal, dot matrix wholesale
- Tax/IVA Module: multi-rate, tax reports
- User Manuals with PDF export
- **Narrated Video Tutorials**: Playwright auto-records 7 tutorials + OpenAI TTS Chinese voice-over + ffmpeg merge
- Trial Accounts, Multi-Tenant SaaS, PWA Offline
- Backend fully modularized (17 routers)

## Credentials
- Super Admin: username=admin, password=admin123

## P1 - Upcoming Tasks
- Wholesale Module (B2B operations)

## P2 - Future Tasks
- Enhanced Reporting (advanced filters, visualizations, export)
- UI/UX Polish
