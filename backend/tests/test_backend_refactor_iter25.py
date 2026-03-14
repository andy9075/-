"""
Backend Refactoring Test - Iteration 25
Tests all API endpoints after server.py split into modular routers
Verifies no breaking changes from the refactoring
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthRoutes:
    """Tests for auth.py router"""
    
    @pytest.fixture(scope='class')
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123",
            "tab": "admin"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        return data["token"]
    
    def test_login(self):
        """Test POST /api/auth/login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123",
            "tab": "admin"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["username"] == "admin"
        assert data["user"]["role"] == "admin"
        print("✓ POST /api/auth/login works")
    
    def test_init_data(self, auth_token):
        """Test POST /api/init-data"""
        response = requests.post(f"{BASE_URL}/api/init-data", 
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        print("✓ POST /api/init-data works")
    
    def test_auth_permissions(self, auth_token):
        """Test GET /api/auth/permissions"""
        response = requests.get(f"{BASE_URL}/api/auth/permissions",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict) or isinstance(data, list)
        print("✓ GET /api/auth/permissions works")


class TestProductsRoutes:
    """Tests for products.py router"""
    
    @pytest.fixture(scope='class')
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123", "tab": "admin"
        })
        return response.json()["token"]
    
    def test_get_products(self, auth_token):
        """Test GET /api/products"""
        response = requests.get(f"{BASE_URL}/api/products",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/products works - {len(data)} products")


class TestStoresRoutes:
    """Tests for stores.py router"""
    
    @pytest.fixture(scope='class')
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123", "tab": "admin"
        })
        return response.json()["token"]
    
    def test_get_stores(self, auth_token):
        """Test GET /api/stores"""
        response = requests.get(f"{BASE_URL}/api/stores",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/stores works - {len(data)} stores")


class TestCategoriesRoutes:
    """Tests for categories.py router"""
    
    @pytest.fixture(scope='class')
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123", "tab": "admin"
        })
        return response.json()["token"]
    
    def test_get_categories(self, auth_token):
        """Test GET /api/categories"""
        response = requests.get(f"{BASE_URL}/api/categories",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/categories works - {len(data)} categories")


class TestWarehousesRoutes:
    """Tests for warehouses.py router"""
    
    @pytest.fixture(scope='class')
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123", "tab": "admin"
        })
        return response.json()["token"]
    
    def test_get_warehouses(self, auth_token):
        """Test GET /api/warehouses"""
        response = requests.get(f"{BASE_URL}/api/warehouses",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/warehouses works - {len(data)} warehouses")


class TestCustomersRoutes:
    """Tests for customers.py router"""
    
    @pytest.fixture(scope='class')
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123", "tab": "admin"
        })
        return response.json()["token"]
    
    def test_get_customers(self, auth_token):
        """Test GET /api/customers"""
        response = requests.get(f"{BASE_URL}/api/customers",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/customers works - {len(data)} customers")


class TestSalesRoutes:
    """Tests for sales.py router"""
    
    @pytest.fixture(scope='class')
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123", "tab": "admin"
        })
        return response.json()["token"]
    
    def test_get_sales_orders(self, auth_token):
        """Test GET /api/sales-orders"""
        response = requests.get(f"{BASE_URL}/api/sales-orders",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/sales-orders works - {len(data)} orders")


class TestEmployeesRoutes:
    """Tests for employees.py router"""
    
    @pytest.fixture(scope='class')
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123", "tab": "admin"
        })
        return response.json()["token"]
    
    def test_get_employees(self, auth_token):
        """Test GET /api/employees"""
        response = requests.get(f"{BASE_URL}/api/employees",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/employees works - {len(data)} employees")


class TestMiscRoutes:
    """Tests for misc.py router - videos, audit logs"""
    
    @pytest.fixture(scope='class')
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123", "tab": "admin"
        })
        return response.json()["token"]
    
    def test_get_videos(self, auth_token):
        """Test GET /api/videos"""
        response = requests.get(f"{BASE_URL}/api/videos",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/videos works - {len(data)} videos")
    
    def test_get_audit_logs(self, auth_token):
        """Test GET /api/audit-logs - returns paginated data"""
        response = requests.get(f"{BASE_URL}/api/audit-logs",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        # API returns paginated dict with items array
        assert isinstance(data, dict)
        assert "items" in data
        assert isinstance(data["items"], list)
        print(f"✓ GET /api/audit-logs works - {len(data['items'])} logs")


class TestSettingsRoutes:
    """Tests for settings.py router"""
    
    @pytest.fixture(scope='class')
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123", "tab": "admin"
        })
        return response.json()["token"]
    
    def test_get_system_settings(self, auth_token):
        """Test GET /api/settings/system"""
        response = requests.get(f"{BASE_URL}/api/settings/system",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print("✓ GET /api/settings/system works")


class TestReportsRoutes:
    """Tests for reports.py router"""
    
    @pytest.fixture(scope='class')
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123", "tab": "admin"
        })
        return response.json()["token"]
    
    def test_get_tax_report(self, auth_token):
        """Test GET /api/reports/tax"""
        response = requests.get(f"{BASE_URL}/api/reports/tax",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print("✓ GET /api/reports/tax works")
    
    def test_get_dashboard_stats(self, auth_token):
        """Test GET /api/dashboard/stats"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print("✓ GET /api/dashboard/stats works")


class TestTenantsRoutes:
    """Tests for tenants.py router"""
    
    @pytest.fixture(scope='class')
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123", "tab": "admin"
        })
        return response.json()["token"]
    
    def test_get_tenants(self, auth_token):
        """Test GET /api/tenants"""
        response = requests.get(f"{BASE_URL}/api/tenants",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/tenants works - {len(data)} tenants")


class TestSuppliersRoutes:
    """Tests for suppliers.py router"""
    
    @pytest.fixture(scope='class')
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123", "tab": "admin"
        })
        return response.json()["token"]
    
    def test_get_suppliers(self, auth_token):
        """Test GET /api/suppliers"""
        response = requests.get(f"{BASE_URL}/api/suppliers",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/suppliers works - {len(data)} suppliers")


class TestPurchasesRoutes:
    """Tests for purchases.py router"""
    
    @pytest.fixture(scope='class')
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123", "tab": "admin"
        })
        return response.json()["token"]
    
    def test_get_purchase_orders(self, auth_token):
        """Test GET /api/purchase-orders"""
        response = requests.get(f"{BASE_URL}/api/purchase-orders",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/purchase-orders works - {len(data)} purchases")


class TestInventoryRoutes:
    """Tests for inventory.py router"""
    
    @pytest.fixture(scope='class')
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123", "tab": "admin"
        })
        return response.json()["token"]
    
    def test_get_inventory(self, auth_token):
        """Test GET /api/inventory"""
        response = requests.get(f"{BASE_URL}/api/inventory",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/inventory works - {len(data)} inventory items")
    
    def test_get_transfer_logs(self, auth_token):
        """Test GET /api/transfer-logs"""
        response = requests.get(f"{BASE_URL}/api/transfer-logs",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/transfer-logs works - {len(data)} transfers")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
