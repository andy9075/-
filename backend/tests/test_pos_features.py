"""
Test POS System Features:
1. Auth - Login with admin/admin123
2. Products - Product listing and product import
3. Stores - Store management
"""

import pytest
import requests
import os
import json
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_token():
    """Login and get auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in response"
    assert "user" in data, "No user in response"
    return data["token"]


@pytest.fixture
def headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
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
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestProducts:
    """Product management tests"""
    
    def test_get_products(self, headers):
        """Test product listing"""
        response = requests.get(f"{BASE_URL}/api/products", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Check product fields
        product = data[0]
        assert "id" in product
        assert "code" in product
        assert "name" in product
        assert "price1" in product
        assert "price2" in product
        assert "price3" in product
        assert "box_quantity" in product
    
    def test_product_import_template(self, headers):
        """Test product import template download"""
        response = requests.get(f"{BASE_URL}/api/products/import/template", headers=headers)
        assert response.status_code == 200
        content = response.text
        # Verify CSV headers
        assert "code" in content.lower()
        assert "name" in content.lower()
        assert "cost_price" in content.lower()
        assert "margin1" in content.lower()
        assert "price1" in content.lower()
    
    def test_product_import_csv(self, headers):
        """Test product import via CSV file"""
        csv_content = """code,name,category,unit,cost_price,margin1,margin2,margin3,price1,price2,price3,items_per_box,barcode,min_stock,wholesale_price,status
TEST_IMPORT001,Test Import Product,General,pcs,10.00,30,20,10,13.00,12.00,11.00,12,TEST123456789,5,11.50,active"""
        
        files = {'file': ('test_import.csv', io.BytesIO(csv_content.encode('utf-8')), 'text/csv')}
        response = requests.post(
            f"{BASE_URL}/api/products/import?mode=skip",
            files=files,
            headers={"Authorization": headers["Authorization"]}
        )
        assert response.status_code == 200
        data = response.json()
        assert "created" in data
        assert "updated" in data
        assert "skipped" in data
        assert "failed" in data
    
    def test_product_import_json(self, headers):
        """Test product import via JSON file"""
        json_content = json.dumps([{
            "code": "TEST_JSON001",
            "name": "Test JSON Import",
            "cost_price": 15.00,
            "margin1": 25,
            "margin2": 20,
            "margin3": 15,
            "unit": "pcs",
            "status": "active"
        }])
        
        files = {'file': ('test_import.json', io.BytesIO(json_content.encode('utf-8')), 'application/json')}
        response = requests.post(
            f"{BASE_URL}/api/products/import?mode=skip",
            files=files,
            headers={"Authorization": headers["Authorization"]}
        )
        assert response.status_code == 200
        data = response.json()
        assert "created" in data


class TestStores:
    """Store management tests"""
    
    def test_get_stores(self, headers):
        """Test store listing"""
        response = requests.get(f"{BASE_URL}/api/stores", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestWarehouses:
    """Warehouse management tests"""
    
    def test_get_warehouses(self, headers):
        """Test warehouse listing"""
        response = requests.get(f"{BASE_URL}/api/warehouses", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestCustomers:
    """Customer management tests"""
    
    def test_get_customers(self, headers):
        """Test customer listing"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestExchangeRates:
    """Exchange rates tests"""
    
    def test_get_exchange_rates(self):
        """Test exchange rates (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/exchange-rates")
        assert response.status_code == 200
        data = response.json()
        assert "usd_to_ves" in data or "type" in data


class TestPaymentSettings:
    """Payment settings tests"""
    
    def test_get_payment_settings(self):
        """Test payment settings (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/payment-settings")
        assert response.status_code == 200
        data = response.json()
        assert "type" in data or "transfer_enabled" in data


class TestDashboard:
    """Dashboard stats tests"""
    
    def test_get_dashboard_stats(self, headers):
        """Test dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "products_count" in data
        assert "today_sales_amount" in data


# Cleanup test products
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data(auth_token):
    """Cleanup test data after tests"""
    yield
    headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    # Get all products
    response = requests.get(f"{BASE_URL}/api/products", headers=headers)
    if response.status_code == 200:
        products = response.json()
        for product in products:
            if product.get("code", "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/products/{product['id']}", headers=headers)
