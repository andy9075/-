# POS System - PRD

## Tech Stack
Backend: FastAPI + MongoDB | Frontend: React + TailwindCSS + Shadcn/UI | Auth: JWT

## Implemented Features

### POS Cashier
- Full-screen cart table with product search popup (F1)
- Per-item price arrows: cycle Price1 → Price2 → Box
- Box mode: qty=boxes, unit=per-box price, detail shows `12×$16.50=$198/box`
- Currency toggle $/Bs. with dual display (Bs mode shows both currencies)
- **F9 Payment Modal**: 4 methods with shortcuts:
  - F5=Cash, F6=Card, F7=Biopago, F8=Transfer
  - Discount % input (validated: can't go below cost price)
  - Dual currency total when Bs mode
- F1=Search, F3=Clear cart, ESC=Close popups
- Online/offline indicator + auto-sync

### Multi-Language (i18n)
- Chinese/English/Spanish across ALL pages
- Admin sidebar, POS header, Shop header all have language switchers
- Persisted in localStorage

### Online Shop
- Category filter tabs + search bar
- Language switcher (中/EN/ES)
- Products use price1, show stock
- Cart, checkout with shipping info

### Admin Panel
- Dashboard, CRUD for stores/warehouses/products/categories/customers/suppliers
- **Online Orders**: expandable rows showing full order item details (product name, qty, price, amount)
- Sales Report with date/store filters + print
- Exchange rates, payment settings

### Multi-Price System
- Cost + Margin: cost × (1+margin%) = auto-calculated price
- 3 tiers: margin1→price1, margin2→price2, margin3→price3(box)

### Other
- Warehouse transfers with searchable products
- Offline POS mode with localStorage sync
- Order items store product_name for display

## Links
- Admin: /admin | POS: /pos | Shop: /shop

## Credentials: admin / admin123

## Backlog
- P2: Refactor App.js (4200+ lines) into components
- P2: Refactor server.py into route modules
- P3: Product images, barcode scanner, loyalty system
