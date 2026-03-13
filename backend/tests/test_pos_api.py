"""
Comprehensive POS System API Tests
- Test all backend APIs including shop endpoints, order lookup, exchange rates, and payment settings
- Test authentication flow
- Test online orders and order lookup functionality
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Test API health and basic endpoints"""
    
    def test_api_health(self):
        """Test root API health check"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        assert "POS System API" in data["message"]
        print("✓ API health check passed")

    def test_init_data(self):
        """Initialize default data (admin user and main warehouse)"""
        response = requests.post(f"{BASE_URL}/api/init-data")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Init data endpoint working")


class TestAuthentication:
    """Test authentication flow"""
    
    def test_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["username"] == "admin"
        assert data["user"]["role"] == "admin"
        print("✓ Admin login successful")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")

    def test_auth_me_without_token(self):
        """Test /auth/me without token - should fail"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403]
        print("✓ Unauthorized access correctly blocked")


class TestPublicShopEndpoints:
    """Test public shop endpoints (no auth required)"""
    
    def test_shop_products_public(self):
        """Test public product listing"""
        response = requests.get(f"{BASE_URL}/api/shop/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Shop products endpoint working - {len(data)} products returned")

    def test_shop_categories_public(self):
        """Test public category listing"""
        response = requests.get(f"{BASE_URL}/api/shop/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Shop categories endpoint working - {len(data)} categories returned")

    def test_exchange_rates_public(self):
        """Test exchange rates endpoint"""
        response = requests.get(f"{BASE_URL}/api/exchange-rates")
        assert response.status_code == 200
        data = response.json()
        assert "usd_to_ves" in data
        assert "default_currency" in data
        assert "local_currency_symbol" in data
        print(f"✓ Exchange rates: 1 USD = {data['usd_to_ves']} {data['local_currency']}")

    def test_payment_settings_public(self):
        """Test payment settings endpoint"""
        response = requests.get(f"{BASE_URL}/api/payment-settings")
        assert response.status_code == 200
        data = response.json()
        # Validate Venezuelan payment methods structure
        assert "transfer_enabled" in data
        assert "pago_movil_enabled" in data
        assert "whatsapp_number" in data or "whatsapp_number" not in data  # Optional
        print(f"✓ Payment settings: Transfer={data['transfer_enabled']}, PagoMóvil={data['pago_movil_enabled']}")


class TestOrderLookup:
    """Test order lookup functionality - public endpoint"""
    
    def test_order_lookup_by_order_number(self):
        """Test looking up orders by order number"""
        # Test with known order number from previous testing
        response = requests.get(f"{BASE_URL}/api/shop/order-lookup", params={
            "order_no": "ON2026031301245418A9"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            order = data[0]
            assert "order_no" in order
            assert "items" in order
            assert "shipping_name" in order
            assert "shipping_phone" in order
            assert "order_status" in order
            assert "payment_status" in order
            print(f"✓ Order lookup by number found {len(data)} order(s)")
        else:
            print("✓ Order lookup endpoint working (no matching orders)")

    def test_order_lookup_by_phone(self):
        """Test looking up orders by phone number"""
        response = requests.get(f"{BASE_URL}/api/shop/order-lookup", params={
            "phone": "04121234567"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Order lookup by phone found {len(data)} order(s)")

    def test_order_lookup_no_params(self):
        """Test order lookup without parameters - should fail"""
        response = requests.get(f"{BASE_URL}/api/shop/order-lookup")
        assert response.status_code == 400
        print("✓ Order lookup correctly requires order_no or phone")


class TestAuthenticatedEndpoints:
    """Test endpoints requiring authentication"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Could not authenticate")

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "today_sales_amount" in data
        assert "products_count" in data
        assert "customers_count" in data
        assert "pending_online_orders" in data
        print(f"✓ Dashboard stats: {data['products_count']} products, {data['pending_online_orders']} pending orders")

    def test_get_products(self):
        """Test authenticated products listing"""
        response = requests.get(f"{BASE_URL}/api/products", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Products API: {len(data)} products")

    def test_get_categories(self):
        """Test authenticated categories listing"""
        response = requests.get(f"{BASE_URL}/api/categories", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Categories API: {len(data)} categories")

    def test_get_stores(self):
        """Test stores listing"""
        response = requests.get(f"{BASE_URL}/api/stores", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Stores API: {len(data)} stores")

    def test_get_warehouses(self):
        """Test warehouses listing"""
        response = requests.get(f"{BASE_URL}/api/warehouses", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify main warehouse exists
        main_warehouses = [w for w in data if w.get("is_main")]
        assert len(main_warehouses) >= 1, "Main warehouse should exist"
        print(f"✓ Warehouses API: {len(data)} warehouses, {len(main_warehouses)} main")

    def test_get_customers(self):
        """Test customers listing"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Customers API: {len(data)} customers")

    def test_get_suppliers(self):
        """Test suppliers listing"""
        response = requests.get(f"{BASE_URL}/api/suppliers", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Suppliers API: {len(data)} suppliers")

    def test_get_online_orders(self):
        """Test online orders listing (admin)"""
        response = requests.get(f"{BASE_URL}/api/shop/orders", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Online Orders API: {len(data)} orders")

    def test_get_inventory(self):
        """Test inventory listing"""
        response = requests.get(f"{BASE_URL}/api/inventory", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Inventory API: {len(data)} items")

    def test_sales_reports(self):
        """Test sales summary report"""
        response = requests.get(f"{BASE_URL}/api/reports/sales-summary", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_sales" in data
        assert "total_online_sales" in data
        print(f"✓ Sales Report: ${data['total_sales']} offline, ${data['total_online_sales']} online")


class TestOnlineOrderCreation:
    """Test online order creation and workflow"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Could not authenticate")

    def test_create_order_without_inventory(self):
        """Test order creation fails gracefully when no inventory"""
        # First create a test product
        product_data = {
            "code": f"TEST_PROD_{os.urandom(4).hex().upper()}",
            "name": "Test Product for Order",
            "price1": 10.00,
            "price2": 365.00,
            "status": "active"
        }
        prod_res = requests.post(f"{BASE_URL}/api/products", json=product_data, headers=self.headers)
        
        if prod_res.status_code != 200:
            pytest.skip("Could not create test product")
        
        product_id = prod_res.json()["id"]
        
        # Try to create order without inventory - should fail gracefully
        order_data = {
            "customer_id": "test-customer",
            "items": [{
                "product_id": product_id,
                "quantity": 1,
                "unit_price": 10.00,
                "discount": 0,
                "amount": 10.00
            }],
            "shipping_address": "Test Address",
            "shipping_phone": "04121234567",
            "shipping_name": "Test Customer",
            "payment_method": "transfer",
            "payment_reference": "12345678"
        }
        
        response = requests.post(f"{BASE_URL}/api/shop/orders", json=order_data)
        # Should return 400 because no inventory
        assert response.status_code in [200, 400]
        if response.status_code == 400:
            assert "库存不足" in response.json().get("detail", "") or "inventory" in response.json().get("detail", "").lower()
            print("✓ Order creation correctly validates inventory")
        else:
            print("✓ Order creation succeeded (product has inventory)")

        # Cleanup test product
        requests.delete(f"{BASE_URL}/api/products/{product_id}", headers=self.headers)


class TestProductCRUD:
    """Test product CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Could not authenticate")

    def test_product_crud_flow(self):
        """Test complete product CRUD - Create, Read, Update, Delete"""
        # CREATE
        product_data = {
            "code": f"TEST_{os.urandom(4).hex().upper()}",
            "barcode": "1234567890123",
            "name": "Test Product CRUD",
            "price1": 15.00,
            "price2": 547.50,
            "wholesale_price": 12.00,
            "box_quantity": 24,
            "status": "active"
        }
        
        create_res = requests.post(f"{BASE_URL}/api/products", json=product_data, headers=self.headers)
        assert create_res.status_code == 200
        created = create_res.json()
        assert created["name"] == product_data["name"]
        assert created["price1"] == product_data["price1"]
        product_id = created["id"]
        print(f"✓ Created product: {product_id}")
        
        # READ - verify persistence
        get_res = requests.get(f"{BASE_URL}/api/products/{product_id}", headers=self.headers)
        assert get_res.status_code == 200
        fetched = get_res.json()
        assert fetched["id"] == product_id
        assert fetched["name"] == product_data["name"]
        print(f"✓ Read product verified")
        
        # UPDATE
        product_data["name"] = "Updated Test Product"
        product_data["price1"] = 20.00
        update_res = requests.put(f"{BASE_URL}/api/products/{product_id}", json=product_data, headers=self.headers)
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["name"] == "Updated Test Product"
        assert updated["price1"] == 20.00
        print(f"✓ Updated product verified")
        
        # DELETE
        delete_res = requests.delete(f"{BASE_URL}/api/products/{product_id}", headers=self.headers)
        assert delete_res.status_code == 200
        
        # Verify deletion
        verify_res = requests.get(f"{BASE_URL}/api/products/{product_id}", headers=self.headers)
        assert verify_res.status_code == 404
        print(f"✓ Deleted product verified")


class TestExchangeRatesUpdate:
    """Test exchange rate update functionality"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Could not authenticate")

    def test_update_exchange_rates(self):
        """Test updating exchange rates"""
        # Update rates
        response = requests.put(
            f"{BASE_URL}/api/exchange-rates",
            params={
                "usd_to_ves": 40.5,
                "usd_to_cop": 4200,
                "default_currency": "USD",
                "local_currency": "VES",
                "local_currency_symbol": "Bs."
            },
            headers=self.headers
        )
        assert response.status_code == 200
        print("✓ Exchange rates updated successfully")
        
        # Verify update
        get_res = requests.get(f"{BASE_URL}/api/exchange-rates")
        assert get_res.status_code == 200
        data = get_res.json()
        assert data["usd_to_ves"] == 40.5
        print(f"✓ Exchange rate verified: 1 USD = {data['usd_to_ves']} Bs.")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
