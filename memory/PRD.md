# POS System - PRD

## Tech Stack
Backend: FastAPI + MongoDB | Frontend: React + TailwindCSS + Shadcn/UI | Auth: JWT

## Implemented Features

### POS Cashier - Full Screen Layout
- Full-screen cart table: #, Product Name, Qty(+/-), Price Type(arrows), Unit Price, Amount
- Product search popup: TABLE format (Code/Name/Cost/Price1/Price2/Price3/Actions), category tabs
- Per-item price arrows: cycle through Price1 -> Price2 -> Box Price
- Currency toggle: Header arrows switch $/Bs.
- Keyboard shortcuts: F1=search, F2=checkout, F3=clear cart, ESC=close popups

### Box Quantity Logic (Bug Fixed)
- When price mode is "Box", quantity represents boxes (not individual items)
- Each box has `box_quantity` items (e.g., 12 items per box)
- Unit price = items_per_box × per_item_price (e.g., 12 × $16.50 = $198/box)
- Amount = boxes × items_per_box × per_item_price
- Detail line shows: `12×$16.50=$198.00/box (24pcs)`

### Multi-Language Support (i18n)
- 3 languages: Chinese (zh), English (en), Spanish (es)
- LangContext.js with translations for all UI text
- Admin sidebar: language switcher buttons at bottom
- POS header: separate language switcher
- Applied to: Login, Dashboard, Sidebar, Products, POS, Sales Report, Payment Modal, Shift Modal, Online Shop

### Online/Offline Mode
- POS detects network status via navigator.onLine + event listeners
- Header shows green "Online" or red "Offline" indicator with pending count
- Offline sales saved to localStorage as pending orders
- Auto-sync when connection restored

### Sales Report
- Backend: GET /api/sales-report with store_id, start_date, end_date filters
- Frontend: /admin/sales-report with store dropdown, date range pickers
- Report shows: total sales, total orders, total items, per-store breakdown, order list
- Print button for window.print()

### Online Shop
- Product catalog with category filter tabs and search bar
- Products use price1, show stock count
- Cart, checkout with shipping info (Bank Transfer, Pago Movil)
- Order tracking, WhatsApp contact link
- Multi-language support

### Multi-Price System
- Cost + Margin: cost x (1+margin%) = auto-calculated price
- 3 tiers: margin1->price1, margin2->price2, margin3->price3(box)

### Warehouse Transfer
- /admin/transfers: searchable product dropdown for transfers
- Inventory overview, transfer history logs

### Admin Panel
- Dashboard, store/warehouse/product/category/customer/supplier CRUD
- Exchange rates, payment settings, online order management

## Links
- Admin: /admin
- POS: /pos
- Shop: /shop

## Credentials: admin / admin123

## Backlog
- P2: Refactor App.js (4200+ lines) into separate component files
- P2: Refactor server.py (1544 lines) into separate route modules
- P3: Product images, barcode scanner, loyalty system
