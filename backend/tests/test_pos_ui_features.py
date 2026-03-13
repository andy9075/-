"""
Test POS UI features - iteration 5
Tests for: Full-screen cart, product search popup, price mode switching, currency toggle, shop order lookup
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAuthAndSetup:
    """Authentication and setup tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("token")
    
    def test_api_health(self):
        """Test API is running"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        assert "running" in response.json().get("status", "")
        print("✓ API health check passed")
    
    def test_login(self, auth_token):
        """Test login returns token"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print("✓ Login returns valid token")


class TestProductsAPI:
    """Product API tests for POS"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json().get("token")
    
    def test_get_products(self, auth_token):
        """Test GET /api/products returns products"""
        response = requests.get(
            f"{BASE_URL}/api/products",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        print(f"✓ GET /api/products returns {len(products)} products")
    
    def test_product_has_price_fields(self, auth_token):
        """Test products have price1, price2, price3, box_quantity fields"""
        response = requests.get(
            f"{BASE_URL}/api/products?search=MRG001",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        products = response.json()
        
        if len(products) > 0:
            product = products[0]
            assert "price1" in product, "Missing price1 field"
            assert "price2" in product, "Missing price2 field"
            assert "price3" in product, "Missing price3 field"
            assert "box_quantity" in product, "Missing box_quantity field"
            print(f"✓ MRG001 product has price fields: p1=${product.get('price1')}, p2=${product.get('price2')}, p3=${product.get('price3')}")
        else:
            pytest.skip("MRG001 product not found")
    
    def test_product_search(self, auth_token):
        """Test product search by name/code"""
        # Search by name
        response = requests.get(
            f"{BASE_URL}/api/products?search=利率测试",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        products = response.json()
        if len(products) > 0:
            print(f"✓ Product search by name returns results")
        else:
            print("! Product search returned no results (may be expected)")


class TestCategoriesAPI:
    """Category API tests for product search popup"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json().get("token")
    
    def test_get_categories(self, auth_token):
        """Test GET /api/categories returns categories for popup tabs"""
        response = requests.get(
            f"{BASE_URL}/api/categories",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)
        print(f"✓ GET /api/categories returns {len(categories)} categories")


class TestExchangeRatesAPI:
    """Exchange rates API tests for currency toggle"""
    
    def test_get_exchange_rates(self):
        """Test GET /api/exchange-rates returns rates (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/exchange-rates")
        assert response.status_code == 200
        rates = response.json()
        
        assert "usd_to_ves" in rates, "Missing usd_to_ves field"
        assert rates["usd_to_ves"] > 0, "Invalid usd_to_ves rate"
        print(f"✓ GET /api/exchange-rates returns usd_to_ves={rates['usd_to_ves']}")


class TestShopOrderLookup:
    """Shop order lookup API tests"""
    
    def test_order_lookup_by_order_number(self):
        """Test order lookup returns items with product details"""
        response = requests.get(
            f"{BASE_URL}/api/shop/order-lookup?order_no=ON2026031301245418A9"
        )
        assert response.status_code == 200
        orders = response.json()
        
        if len(orders) > 0:
            order = orders[0]
            assert "items" in order, "Missing items field"
            assert len(order["items"]) > 0, "Order has no items"
            
            item = order["items"][0]
            assert "product_name" in item, "Missing product_name in item"
            assert "product_code" in item, "Missing product_code in item"
            assert "quantity" in item, "Missing quantity in item"
            assert "unit_price" in item, "Missing unit_price in item"
            assert "amount" in item, "Missing amount in item"
            
            print(f"✓ Order lookup returns items with: product_name={item['product_name']}, qty={item['quantity']}, price=${item['unit_price']}")
        else:
            pytest.skip("Test order not found")
    
    def test_order_lookup_by_phone(self):
        """Test order lookup by phone number"""
        response = requests.get(
            f"{BASE_URL}/api/shop/order-lookup?phone=04121234567"
        )
        assert response.status_code == 200
        orders = response.json()
        
        if len(orders) > 0:
            print(f"✓ Order lookup by phone returns {len(orders)} orders")
        else:
            pytest.skip("No orders found for test phone")


class TestTransferAPI:
    """Transfer API tests for warehouse transfers"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json().get("token")
    
    def test_get_warehouses(self, auth_token):
        """Test GET /api/warehouses returns warehouses"""
        response = requests.get(
            f"{BASE_URL}/api/warehouses",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        warehouses = response.json()
        assert isinstance(warehouses, list)
        assert len(warehouses) > 0, "No warehouses found"
        
        # Check for main warehouse
        main_warehouses = [w for w in warehouses if w.get("is_main")]
        assert len(main_warehouses) > 0, "No main warehouse found"
        print(f"✓ GET /api/warehouses returns {len(warehouses)} warehouses, main: {main_warehouses[0]['name']}")
    
    def test_get_transfer_logs(self, auth_token):
        """Test GET /api/transfer-logs returns transfer history"""
        response = requests.get(
            f"{BASE_URL}/api/transfer-logs",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        logs = response.json()
        assert isinstance(logs, list)
        
        if len(logs) > 0:
            log = logs[0]
            assert "product_id" in log, "Missing product_id"
            assert "from_warehouse_id" in log, "Missing from_warehouse_id"
            assert "to_warehouse_id" in log, "Missing to_warehouse_id"
            assert "quantity" in log, "Missing quantity"
            print(f"✓ GET /api/transfer-logs returns {len(logs)} transfer records")
        else:
            print("✓ GET /api/transfer-logs returns empty list (no transfers yet)")


class TestInventoryAPI:
    """Inventory API tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json().get("token")
    
    def test_get_inventory(self, auth_token):
        """Test GET /api/inventory returns inventory"""
        response = requests.get(
            f"{BASE_URL}/api/inventory",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        inventory = response.json()
        assert isinstance(inventory, list)
        print(f"✓ GET /api/inventory returns {len(inventory)} inventory records")


class TestStoresAPI:
    """Stores API tests for POS store selection"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        return response.json().get("token")
    
    def test_get_stores(self, auth_token):
        """Test GET /api/stores returns retail stores"""
        response = requests.get(
            f"{BASE_URL}/api/stores",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        stores = response.json()
        assert isinstance(stores, list)
        
        retail_stores = [s for s in stores if s.get("type") == "retail"]
        if len(retail_stores) > 0:
            print(f"✓ GET /api/stores returns {len(stores)} stores, {len(retail_stores)} retail")
        else:
            print(f"✓ GET /api/stores returns {len(stores)} stores")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
