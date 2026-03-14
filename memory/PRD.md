# POS System (秘奥软件) - Product Requirements Document

## Original Problem Statement
Build a comprehensive, desktop-style POS application ("秘奥软件") as a web-based system with multi-currency support, online store, and admin management.

## Tech Stack
- Frontend: React, React Router, TailwindCSS, Shadcn/UI, Recharts, Sonner
- Backend: FastAPI, Pydantic, openpyxl
- Database: MongoDB

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
- Daily commission in daily settlement page
- Commission rules editable in commission page UI

## Test Reports
- iteration_14-17: All 100% passed
- iteration_18: Commission features 100% passed

## P1 - Next Tasks
- Backend server.py refactoring into API routers
- Offline Mode sync enhancement

## Test Credentials
- Username: admin / Password: admin123
