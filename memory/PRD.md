# POS System - PRD

## Tech Stack
Backend: FastAPI + MongoDB | Frontend: React + TailwindCSS + Shadcn/UI | Auth: JWT

## Implemented Features

### POS Cashier - Full Screen Layout
- Full-screen cart table: #, Product Name, Qty(+/-), Price Type(arrows), Unit Price, Amount
- Product search popup: TABLE format (Code/Name/Cost/Price1/Price2/Price3/Actions), category tabs
- Per-item price arrows: cycle through Price1 -> Price2 -> Box Price
- Currency toggle: Header arrows switch $/Bs.
- Box calculation: Shows `2boxes x $16.5 = $33.00 (24pcs)` format

### Box Quantity Logic
- When price mode is "Box", quantity represents boxes (not individual items)
- Each box has `box_quantity` items (e.g., 12 items per box)
- Cart displays: boxes count, unit box price, total amount, and total pieces
- Payment sends actual item count to backend (boxes * items_per_box)

### Multi-Language Support (i18n)
- 3 languages: Chinese (zh), English (en), Spanish (es)
- LangContext.js with translations for all UI text
- Admin sidebar: language switcher buttons at bottom
- POS header: separate language switcher
- Applied t() function to: Login, Dashboard, Sidebar, Products, POS (all screens), Sales Report, Payment Modal, Shift Modal
- Language persisted in localStorage

### Online/Offline Mode
- POS detects network status via navigator.onLine + event listeners
- Header shows green "Online" or red "Offline" indicator with pending count
- Offline sales saved to localStorage as pending orders
- Auto-sync when connection restored
- Fallback: if online payment fails, saves offline automatically

### Sales Report
- Backend: GET /api/sales-report with store_id, start_date, end_date filters
- Frontend: /admin/sales-report with store dropdown, date range pickers
- Report shows: total sales, total orders, total items
- Per-store breakdown with product details
- Order list with item details
- Print button for window.print()

### Multi-Price System
- Cost + Margin: cost x (1+margin%) = auto-calculated price
- 3 tiers: margin1->price1, margin2->price2, margin3->price3(box)
- Admin form: input cost + 3 margins with real-time calculation

### Warehouse Transfer
- /admin/transfers: searchable product dropdown for transfers
- Inventory overview: product x warehouse stock matrix
- Transfer history logs

### Online Store
- Product catalog, cart, checkout (Bank Transfer, Pago Movil)
- Order tracking with full item details

### Admin Panel
- Dashboard, store/warehouse/product/category/customer/supplier CRUD
- Exchange rates, payment settings, online order management
- Fixed: toast spam from auth errors (removed StrictMode + auth error filtering)

## Credentials: admin / admin123

## Backlog
- P2: Refactor App.js (4100+ lines) into separate component files
- P2: Refactor server.py (1544 lines) into separate route modules
- P3: Product images, barcode scanner, loyalty system
