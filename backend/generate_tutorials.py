"""
Auto-generate video tutorials by recording real browser operations.
Uses Playwright to automate and record actual user interactions.
"""
import asyncio
import os
import shutil
from pathlib import Path
from playwright.async_api import async_playwright

APP_URL = os.environ.get("APP_URL", "http://localhost:3000")
UPLOAD_DIR = Path(__file__).parent / "uploads" / "videos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ADMIN_USER = "admin"
ADMIN_PASS = "admin123"


async def login(page, username=ADMIN_USER, password=ADMIN_PASS, tenant_id=None):
    """Login to the app"""
    await page.goto(f"{APP_URL}/login")
    await page.wait_for_timeout(2000)
    if tenant_id:
        tab = page.locator('button:has-text("商家登录")')
        await tab.click(force=True)
        await page.wait_for_timeout(500)
        await page.locator('[data-testid="tenant-id-input"]').fill(tenant_id)
        await page.locator('[data-testid="tenant-username-input"]').fill(username)
        await page.locator('[data-testid="tenant-password-input"]').fill(password)
        await page.locator('[data-testid="tenant-login-submit"]').click(force=True)
    else:
        await page.locator('[data-testid="login-username"]').fill(username)
        await page.locator('[data-testid="login-password"]').fill(password)
        await page.locator('[data-testid="login-submit"]').click(force=True)
    await page.wait_for_timeout(4000)


async def record_tutorial(context_factory, name, action_fn):
    """Record a single tutorial video"""
    video_dir = UPLOAD_DIR / f"_tmp_{name}"
    video_dir.mkdir(exist_ok=True)

    context = await context_factory(
        viewport={"width": 1280, "height": 720},
        record_video_dir=str(video_dir),
        record_video_size={"width": 1280, "height": 720},
    )
    page = await context.new_page()
    try:
        await action_fn(page)
    except Exception as e:
        print(f"  Error in {name}: {e}")
    await page.wait_for_timeout(1000)
    await context.close()

    # Find the recorded video
    videos = list(video_dir.glob("*.webm"))
    if videos:
        dest = UPLOAD_DIR / f"{name}.webm"
        shutil.move(str(videos[0]), str(dest))
        print(f"  Saved: {dest.name} ({dest.stat().st_size / 1024 / 1024:.1f} MB)")
        shutil.rmtree(video_dir, ignore_errors=True)
        return dest
    shutil.rmtree(video_dir, ignore_errors=True)
    return None


# ========== Tutorial Actions ==========

async def tutorial_pos(page):
    """POS收银操作"""
    await login(page)
    # Navigate to POS
    await page.goto(f"{APP_URL}/pos")
    await page.wait_for_timeout(3000)

    # Login to POS
    try:
        inputs = await page.locator('input').all()
        if len(inputs) >= 2:
            await inputs[0].fill(ADMIN_USER)
            await inputs[1].fill(ADMIN_PASS)
            await page.wait_for_timeout(500)
        btn = page.locator('[data-testid="pos-login-btn"]')
        if await btn.count() > 0:
            await btn.click(force=True)
        else:
            btn = page.locator('[data-testid="pos-login-btn-manual"]')
            if await btn.count() > 0:
                await btn.click(force=True)
        await page.wait_for_timeout(3000)
    except:
        pass

    # Select store if dialog appears
    try:
        store_btn = page.locator('[data-testid="store-select-btn"]').first
        if await store_btn.count() > 0:
            await store_btn.click(force=True)
            await page.wait_for_timeout(2000)
    except:
        pass

    # Start shift if needed
    try:
        shift_btn = page.locator('[data-testid="start-shift-btn"]')
        if await shift_btn.count() > 0:
            cash_input = page.locator('[data-testid="shift-cash-input"]')
            if await cash_input.count() > 0:
                await cash_input.fill("100")
            await shift_btn.click(force=True)
            await page.wait_for_timeout(2000)
    except:
        pass

    # Search and add products
    try:
        search = page.locator('[data-testid="pos-search"]')
        if await search.count() > 0:
            await search.click()
            await page.wait_for_timeout(500)
            await search.fill("a")
            await page.wait_for_timeout(1000)
        # Click first product result
        product = page.locator('[data-testid^="product-item-"]').first
        if await product.count() > 0:
            await product.click(force=True)
            await page.wait_for_timeout(800)
            await product.click(force=True)
            await page.wait_for_timeout(800)
    except:
        pass

    await page.wait_for_timeout(2000)

    # Show F2 inventory lookup
    try:
        await page.keyboard.press("F2")
        await page.wait_for_timeout(3000)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(1000)
    except:
        pass

    # Checkout
    try:
        await page.keyboard.press("F9")
        await page.wait_for_timeout(3000)
    except:
        pass
    await page.wait_for_timeout(2000)


async def tutorial_products(page):
    """商品管理"""
    await login(page)
    await page.goto(f"{APP_URL}/admin/products")
    await page.wait_for_timeout(3000)

    # Scroll through products
    await page.mouse.wheel(0, 300)
    await page.wait_for_timeout(2000)

    # Click add product
    try:
        btn = page.locator('[data-testid="add-product-btn"]')
        if await btn.count() > 0:
            await btn.click(force=True)
            await page.wait_for_timeout(2000)

            # Fill form
            await page.locator('input').first.fill("DEMO001")
            await page.wait_for_timeout(500)
            inputs = await page.locator('input').all()
            if len(inputs) > 2:
                await inputs[2].fill("演示商品")
                await page.wait_for_timeout(500)

            await page.mouse.wheel(0, 300)
            await page.wait_for_timeout(2000)

            # Show tax rate selector
            tax_sel = page.locator('[data-testid="product-tax-rate"]')
            if await tax_sel.count() > 0:
                await tax_sel.click(force=True)
                await page.wait_for_timeout(1500)
                await page.keyboard.press("Escape")
                await page.wait_for_timeout(500)

            # Cancel
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(1000)
    except:
        pass
    await page.wait_for_timeout(2000)


async def tutorial_inventory(page):
    """库存管理"""
    await login(page)

    # Warehouses
    await page.goto(f"{APP_URL}/admin/warehouses")
    await page.wait_for_timeout(3000)

    # Inventory
    await page.goto(f"{APP_URL}/admin/inventory")
    await page.wait_for_timeout(3000)
    await page.mouse.wheel(0, 200)
    await page.wait_for_timeout(2000)

    # Stock alerts
    await page.goto(f"{APP_URL}/admin/stock-alerts")
    await page.wait_for_timeout(3000)
    await page.wait_for_timeout(2000)


async def tutorial_sales(page):
    """销售管理"""
    await login(page)

    await page.goto(f"{APP_URL}/admin/sales")
    await page.wait_for_timeout(3000)
    await page.mouse.wheel(0, 200)
    await page.wait_for_timeout(2000)

    # Daily settlement
    await page.goto(f"{APP_URL}/admin/settlement")
    await page.wait_for_timeout(3000)
    await page.wait_for_timeout(2000)


async def tutorial_customers(page):
    """客户管理"""
    await login(page)

    await page.goto(f"{APP_URL}/admin/customers")
    await page.wait_for_timeout(3000)
    await page.mouse.wheel(0, 200)
    await page.wait_for_timeout(2000)


async def tutorial_reports(page):
    """报表与分析"""
    await login(page)

    # Dashboard
    await page.goto(f"{APP_URL}/admin/dashboard")
    await page.wait_for_timeout(4000)
    await page.mouse.wheel(0, 300)
    await page.wait_for_timeout(2000)

    # Tax report
    await page.goto(f"{APP_URL}/admin/tax-report")
    await page.wait_for_timeout(2000)
    try:
        gen_btn = page.locator('[data-testid="generate-tax-report"]')
        if await gen_btn.count() > 0:
            await gen_btn.click(force=True)
            await page.wait_for_timeout(3000)
    except:
        pass
    await page.wait_for_timeout(2000)

    # Profit analysis
    await page.goto(f"{APP_URL}/admin/profit-analysis")
    await page.wait_for_timeout(3000)
    await page.wait_for_timeout(2000)


async def tutorial_settings(page):
    """系统设置"""
    await login(page)

    await page.goto(f"{APP_URL}/admin/settings")
    await page.wait_for_timeout(3000)
    await page.mouse.wheel(0, 400)
    await page.wait_for_timeout(2000)
    await page.mouse.wheel(0, 400)
    await page.wait_for_timeout(2000)

    # Employee management
    await page.goto(f"{APP_URL}/admin/employees")
    await page.wait_for_timeout(3000)
    await page.wait_for_timeout(2000)


# ========== Main ==========

TUTORIALS = [
    ("pos_tutorial", "POS 收银操作教程", "pos", tutorial_pos),
    ("products_tutorial", "商品管理教程", "products", tutorial_products),
    ("inventory_tutorial", "库存管理教程", "inventory", tutorial_inventory),
    ("sales_tutorial", "销售与退款教程", "sales", tutorial_sales),
    ("customers_tutorial", "客户管理教程", "customers", tutorial_customers),
    ("reports_tutorial", "报表与分析教程", "reports", tutorial_reports),
    ("settings_tutorial", "系统设置教程", "settings", tutorial_settings),
]


async def generate_all(app_url=None):
    if app_url:
        global APP_URL
        APP_URL = app_url

    print(f"Generating tutorials from: {APP_URL}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        results = []

        for filename, title, category, action in TUTORIALS:
            print(f"\nRecording: {title}...")
            video_path = await record_tutorial(browser.new_context, filename, action)
            if video_path:
                results.append((filename, title, category, video_path))
            else:
                print(f"  FAILED: No video produced")

        await browser.close()

    print(f"\nDone! Generated {len(results)}/{len(TUTORIALS)} videos")
    return results


if __name__ == "__main__":
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else APP_URL
    asyncio.run(generate_all(url))
