# POS System - PRD

## Tech Stack
Backend: FastAPI + MongoDB | Frontend: React + TailwindCSS + Shadcn/UI | Auth: JWT

## Implemented Features

### POS Cashier
- **Multi-user login**: Cashier avatar list, click to select, enter password
- Full-screen cart table with decimal quantity support (0.5kg, 1.5, etc.)
- Product search popup (F1), barcode scanner (Enter key in search)
- Per-item price arrows: Price1 → Price2 → Box
- Box mode: qty=boxes, unit=per-box price
- **F9 Payment Modal**: F5=Cash, F6=Card, F7=Biopago, F8=Transfer + discount %
- **F4 Hold Order** / **F10 Recall Order** - save & restore pending orders
- **F11 Refund** - return items by order number
- Currency toggle $/Bs. with dual display (Bs shows both)
- Online/offline indicator + auto-sync
- F3=Clear cart, ESC=Close popups

### Admin - System Settings (/admin/settings)
- Company info: name, tax ID, address, phone, invoice header/footer
- Print: 80mm receipt / A4 invoice, auto-print, copies
- Barcode scanner: enable/disable, input delay
- Wholesale: enable, min quantity, discount %
- Document numbering: SO/TR/PO prefixes
- Report currency: USD/VES

### Admin - Employee Management (/admin/employees)
- CRUD for cashiers/staff with roles (admin, manager, cashier, staff)
- Permissions: can_discount, can_refund, max_discount %
- Assign to specific store

### Admin - Stock Alerts (/admin/stock-alerts)
- Products below min_stock show critical (red) or warning (yellow)

### Admin - Stock Taking (/admin/stock-taking)
- Select warehouse, auto-load products with system qty
- Input actual qty, shows difference
- Draft or confirmed (confirmed auto-adjusts inventory)

### Reports
- Sales Report: date/store filter, print
- Daily Settlement: by date, payment method breakdown, gross profit
- Bestsellers/Slowsellers: top/bottom products by sales

### Multi-Language (i18n)
- Chinese/English/Spanish across ALL pages
- Admin sidebar, POS header, Shop header switchers

### Online Shop
- Category filter tabs + search + language switcher
- Cart, checkout with shipping info

### Other
- Multi-price (cost+margin), warehouse transfers, online orders with item details
- Offline POS, exchange rates, payment settings

## Links
Admin: /admin | POS: /pos | Shop: /shop

## Credentials: admin / admin123

## Backlog
- P1: Print receipt/invoice (80mm + A4 CSS @media print)
- P1: Barcode label printing
- P1: UI/background design improvement
- P2: Refactor App.js into components
- P2: Refactor server.py into route modules
- P3: Member/loyalty pricing
- P3: Product images
