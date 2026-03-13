"""
Test suite for POS System updates - iteration 4
Testing:
1. POST /api/inventory/transfer - transfer stock between warehouses
2. GET /api/transfer-logs - transfer history
3. GET /api/shop/order-lookup - order lookup with product details
4. Product prices and box calculation logic
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
AUTH_TOKEN = None


@pytest.fixture(scope="module")
def auth_token():
    """Get admin authentication token"""
    global AUTH_TOKEN
    if AUTH_TOKEN:
        return AUTH_TOKEN
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    AUTH_TOKEN = response.json().get("token")
    return AUTH_TOKEN


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Create authenticated session"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestTransferAPIs:
    """Test inventory transfer endpoints"""
    
    def test_get_warehouses(self, api_client):
        """Verify warehouses exist for transfer tests"""
        response = api_client.get(f"{BASE_URL}/api/warehouses")
        assert response.status_code == 200
        warehouses = response.json()
        assert len(warehouses) >= 1, "Need at least 1 warehouse"
        print(f"Found {len(warehouses)} warehouses: {[w['name'] for w in warehouses]}")
        
        # Check for main warehouse
        main_wh = [w for w in warehouses if w.get('is_main')]
        assert len(main_wh) > 0, "Main warehouse not found"
        print(f"Main warehouse: {main_wh[0]['name']}")
    
    def test_get_products_for_transfer(self, api_client):
        """Verify products exist with price fields"""
        response = api_client.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        assert len(products) >= 1, "Need at least 1 product"
        
        # Check MRG001 product exists with multi-price fields
        mrg001 = [p for p in products if p.get('code') == 'MRG001']
        if mrg001:
            p = mrg001[0]
            print(f"MRG001: cost={p.get('cost_price')}, price1={p.get('price1')}, price2={p.get('price2')}, price3={p.get('price3')}, box_qty={p.get('box_quantity')}")
            assert 'price1' in p, "Product should have price1"
            assert 'price2' in p, "Product should have price2"
            assert 'price3' in p, "Product should have price3"
    
    def test_get_inventory(self, api_client):
        """Check inventory for transfer source"""
        response = api_client.get(f"{BASE_URL}/api/inventory")
        assert response.status_code == 200
        inventory = response.json()
        print(f"Found {len(inventory)} inventory records")
        
        # Find items with positive stock
        positive_stock = [i for i in inventory if i.get('quantity', 0) > 0]
        print(f"Items with stock: {len(positive_stock)}")
    
    def test_transfer_logs_endpoint(self, api_client):
        """GET /api/transfer-logs should return transfer history"""
        response = api_client.get(f"{BASE_URL}/api/transfer-logs")
        assert response.status_code == 200
        logs = response.json()
        assert isinstance(logs, list), "Should return list"
        print(f"Found {len(logs)} transfer logs")
        
        if len(logs) > 0:
            log = logs[0]
            assert 'product_id' in log, "Log should have product_id"
            assert 'from_warehouse_id' in log, "Log should have from_warehouse_id"
            assert 'to_warehouse_id' in log, "Log should have to_warehouse_id"
            assert 'quantity' in log, "Log should have quantity"
    
    def test_inventory_transfer(self, api_client):
        """POST /api/inventory/transfer should transfer stock"""
        # Get warehouses
        wh_res = api_client.get(f"{BASE_URL}/api/warehouses")
        warehouses = wh_res.json()
        
        # Get products
        prod_res = api_client.get(f"{BASE_URL}/api/products")
        products = prod_res.json()
        
        # Get inventory
        inv_res = api_client.get(f"{BASE_URL}/api/inventory")
        inventory = inv_res.json()
        
        # Find an item with stock to transfer
        source_inv = None
        for inv in inventory:
            if inv.get('quantity', 0) >= 1:
                source_inv = inv
                break
        
        if not source_inv:
            # Create some stock first via inventory adjust
            if len(warehouses) >= 1 and len(products) >= 1:
                adjust_res = api_client.post(f"{BASE_URL}/api/inventory/adjust", json={
                    "product_id": products[0]['id'],
                    "warehouse_id": warehouses[0]['id'],
                    "quantity": 10,
                    "reason": "Test stock for transfer"
                })
                assert adjust_res.status_code == 200
                source_inv = {
                    "product_id": products[0]['id'],
                    "warehouse_id": warehouses[0]['id'],
                    "quantity": 10
                }
        
        if not source_inv:
            pytest.skip("No inventory to transfer")
        
        # Find destination warehouse (different from source)
        dest_wh = None
        for w in warehouses:
            if w['id'] != source_inv['warehouse_id']:
                dest_wh = w
                break
        
        if not dest_wh:
            # Create a test warehouse
            new_wh_res = api_client.post(f"{BASE_URL}/api/warehouses", json={
                "code": "WH_TEST",
                "name": "测试仓库",
                "address": "Test",
                "is_main": False
            })
            if new_wh_res.status_code == 200:
                dest_wh = new_wh_res.json()
            else:
                pytest.skip("Cannot create destination warehouse")
        
        # Perform transfer
        transfer_res = api_client.post(f"{BASE_URL}/api/inventory/transfer", params={
            "product_id": source_inv['product_id'],
            "from_warehouse_id": source_inv['warehouse_id'],
            "to_warehouse_id": dest_wh['id'],
            "quantity": 1
        })
        
        assert transfer_res.status_code == 200, f"Transfer failed: {transfer_res.text}"
        result = transfer_res.json()
        assert result.get('message') == "库存调拨成功"
        print(f"Transfer successful: {result}")
        
        # Verify transfer log was created
        logs_res = api_client.get(f"{BASE_URL}/api/transfer-logs")
        logs = logs_res.json()
        assert len(logs) > 0, "Should have at least one transfer log"
        
        # Check latest log matches our transfer
        latest = logs[0]
        assert latest['product_id'] == source_inv['product_id']
        assert latest['quantity'] == 1
        print(f"Transfer log verified: from {latest['from_warehouse_id']} to {latest['to_warehouse_id']}")
    
    def test_transfer_insufficient_stock(self, api_client):
        """Transfer should fail with insufficient stock"""
        wh_res = api_client.get(f"{BASE_URL}/api/warehouses")
        warehouses = wh_res.json()
        
        prod_res = api_client.get(f"{BASE_URL}/api/products")
        products = prod_res.json()
        
        if len(warehouses) < 2 or len(products) < 1:
            pytest.skip("Need 2 warehouses and 1 product")
        
        # Try to transfer more than available
        transfer_res = api_client.post(f"{BASE_URL}/api/inventory/transfer", params={
            "product_id": products[0]['id'],
            "from_warehouse_id": warehouses[0]['id'],
            "to_warehouse_id": warehouses[1]['id'],
            "quantity": 99999  # Likely more than stock
        })
        
        # Should fail with 400 or 500
        assert transfer_res.status_code in [400, 500], "Should fail for insufficient stock"
        print(f"Correctly rejected: {transfer_res.json()}")


class TestOrderLookup:
    """Test shop order lookup with items"""
    
    def test_order_lookup_by_phone(self, api_client):
        """Order lookup should include product details"""
        # Try looking up existing order
        response = api_client.get(f"{BASE_URL}/api/shop/order-lookup", params={
            "phone": "04121234567"
        })
        
        assert response.status_code == 200
        orders = response.json()
        
        if len(orders) > 0:
            order = orders[0]
            print(f"Found order: {order.get('order_no')}")
            
            # Check items have product details
            items = order.get('items', [])
            if len(items) > 0:
                item = items[0]
                assert 'product_name' in item, "Item should have product_name"
                assert 'quantity' in item, "Item should have quantity"
                assert 'unit_price' in item, "Item should have unit_price"
                print(f"Item: {item.get('product_name')} x{item.get('quantity')} @ ${item.get('unit_price')}")
        else:
            print("No orders found for phone 04121234567")
    
    def test_order_lookup_by_order_no(self, api_client):
        """Order lookup by order number"""
        response = api_client.get(f"{BASE_URL}/api/shop/order-lookup", params={
            "order_no": "ON2026031301245418A9"
        })
        
        assert response.status_code == 200
        orders = response.json()
        
        if len(orders) > 0:
            order = orders[0]
            assert order.get('order_no') == "ON2026031301245418A9"
            print(f"Order lookup successful: {order.get('order_no')}")
            
            # Verify items have product details
            for item in order.get('items', []):
                print(f"  - {item.get('product_name', 'Unknown')}: {item.get('quantity')} x ${item.get('unit_price', 0):.2f}")
        else:
            print("Order ON2026031301245418A9 not found")


class TestProductPrices:
    """Test product price fields for POS"""
    
    def test_product_has_multi_price_fields(self, api_client):
        """Products should have price1, price2, price3, box_quantity"""
        response = api_client.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        
        for p in products[:3]:  # Check first 3
            assert 'price1' in p, f"Product {p['code']} missing price1"
            assert 'price2' in p, f"Product {p['code']} missing price2"
            assert 'price3' in p, f"Product {p['code']} missing price3"
            assert 'box_quantity' in p, f"Product {p['code']} missing box_quantity"
            print(f"Product {p['code']}: p1=${p['price1']}, p2=${p['price2']}, p3=${p['price3']}, box={p['box_quantity']}")
    
    def test_mrg001_pricing(self, api_client):
        """MRG001 should have correct calculated prices"""
        response = api_client.get(f"{BASE_URL}/api/products", params={"search": "MRG001"})
        assert response.status_code == 200
        products = response.json()
        
        mrg001 = [p for p in products if p.get('code') == 'MRG001']
        if mrg001:
            p = mrg001[0]
            # Expected: cost=10, margin1=50%, margin2=30%, margin3=20%
            # price1=15, price2=13, price3=12
            assert p.get('price1') == 15 or abs(p.get('price1', 0) - 15) < 0.1, f"price1 should be ~15, got {p.get('price1')}"
            assert p.get('price2') == 13 or abs(p.get('price2', 0) - 13) < 0.1, f"price2 should be ~13, got {p.get('price2')}"
            assert p.get('price3') == 12 or abs(p.get('price3', 0) - 12) < 0.1, f"price3 should be ~12, got {p.get('price3')}"
            print(f"MRG001 pricing verified: ${p['price1']} / ${p['price2']} / ${p['price3']}")
        else:
            print("MRG001 not found, skipping price verification")


class TestExchangeRates:
    """Test exchange rate for Bs. toggle"""
    
    def test_get_exchange_rates(self, api_client):
        """GET /api/exchange-rates should return VES rate"""
        response = api_client.get(f"{BASE_URL}/api/exchange-rates")
        assert response.status_code == 200
        rates = response.json()
        
        assert 'usd_to_ves' in rates, "Should have usd_to_ves"
        assert rates['usd_to_ves'] > 0, "Rate should be positive"
        print(f"Exchange rate: 1 USD = {rates['usd_to_ves']} VES")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
