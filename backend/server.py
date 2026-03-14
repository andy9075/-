from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from pathlib import Path
from core import ROOT_DIR

# Import all routers
from routers import auth, stores, warehouses, suppliers, customers, categories
from routers import products, inventory, purchases, sales, shop, reports
from routers import settings, employees, tenants, crm, misc

app = FastAPI(title="Sellox API")

# CORS
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Include all routers with /api prefix
for module in [auth, stores, warehouses, suppliers, customers, categories,
               products, inventory, purchases, sales, shop, reports,
               settings, employees, tenants, crm, misc]:
    app.include_router(module.router, prefix="/api")

# Static files
UPLOAD_DIR = Path(ROOT_DIR) / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "products").mkdir(exist_ok=True)
(UPLOAD_DIR / "videos").mkdir(exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
