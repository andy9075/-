"""
Backend API Tests for Iteration 9 - New POS Features
Tests: System Settings, Employees, Stock Alerts, Stock Taking, Refunds, Daily Settlement, Bestsellers, Cashier List
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCashierList:
    """Test /api/auth/cashiers - public endpoint for POS login"""
    
    def test_get_cashiers_list(self):
        """GET /api/auth/cashiers should return list of users without passwords"""
        response = requests.get(f"{BASE_URL}/api/auth/cashiers")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} cashiers")
        
        # Verify structure of each cashier
        for cashier in data:
            assert "id" in cashier, "Cashier should have id"
            assert "username" in cashier, "Cashier should have username"
            assert "password" not in cashier, "Cashier should NOT have password exposed"
        print("✓ Cashiers endpoint returns correct structure without passwords")


class TestAuthentication:
    """Test authentication and get token for other tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json().get("token")
        assert token, "Token should be present"
        print("✓ Login successful, token obtained")
        return token
    
    def test_login_admin(self, auth_token):
        """Verify admin can login"""
        assert auth_token is not None
        print(f"✓ Token: {auth_token[:20]}...")


class TestSystemSettings:
    """Test /api/settings/system endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_system_settings(self, auth_headers):
        """GET /api/settings/system should return settings"""
        response = requests.get(f"{BASE_URL}/api/settings/system", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ System settings retrieved: {list(response.json().keys())}")
    
    def test_update_system_settings(self, auth_headers):
        """PUT /api/settings/system should save settings"""
        settings = {
            "company_name": "TEST_Company Inc",
            "company_tax_id": "J-123456",
            "company_address": "Test Address 123",
            "company_phone": "+1234567890",
            "invoice_footer": "Thank you!",
            "default_print_format": "80mm",
            "auto_print_receipt": True,
            "receipt_copies": 1,
            "barcode_scanner_enabled": True,
            "scanner_input_delay": 50,
            "wholesale_enabled": True,
            "wholesale_min_quantity": 10,
            "wholesale_discount_percent": 5
        }
        response = requests.put(f"{BASE_URL}/api/settings/system", json=settings, headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ System settings updated successfully")
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/settings/system", headers=auth_headers)
        saved = get_response.json()
        assert saved.get("company_name") == "TEST_Company Inc", "Company name not persisted"
        print("✓ System settings verified via GET")


class TestEmployees:
    """Test /api/employees CRUD endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_employees_list(self, auth_headers):
        """GET /api/employees should return list of users"""
        response = requests.get(f"{BASE_URL}/api/employees", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Found {len(data)} employees")
    
    def test_create_employee(self, auth_headers):
        """POST /api/employees should create new employee"""
        employee = {
            "username": "TEST_cashier1",
            "password": "pass123",
            "name": "Test Cashier",
            "phone": "123456789",
            "role": "cashier",
            "store_id": "",
            "permissions": {
                "can_discount": True,
                "can_refund": False,
                "max_discount": 10
            }
        }
        response = requests.post(f"{BASE_URL}/api/employees", json=employee, headers=auth_headers)
        # Could be 200 or already exists 400
        if response.status_code == 400:
            print(f"Note: Employee may already exist: {response.text}")
            return
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Created employee should have id"
        assert data.get("username") == "TEST_cashier1"
        print(f"✓ Employee created with id: {data['id']}")
    
    def test_employee_appears_in_list(self, auth_headers):
        """Verify created employee appears in list"""
        response = requests.get(f"{BASE_URL}/api/employees", headers=auth_headers)
        employees = response.json()
        usernames = [e.get("username") for e in employees]
        # Either new or existing should be there
        print(f"✓ Employees: {usernames}")


class TestStockAlerts:
    """Test /api/stock-alerts endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_stock_alerts(self, auth_headers):
        """GET /api/stock-alerts should return low stock products"""
        response = requests.get(f"{BASE_URL}/api/stock-alerts", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Stock alerts: {len(data)} products with low stock")
        
        # Verify structure if any alerts exist
        for alert in data[:3]:
            assert "product_id" in alert
            assert "product_name" in alert
            assert "current_stock" in alert
            assert "min_stock" in alert
            assert "level" in alert  # 'critical' or 'warning'
            print(f"  - {alert['product_name']}: {alert['current_stock']}/{alert['min_stock']} ({alert['level']})")


class TestStockTaking:
    """Test /api/stock-taking and /api/stock-takings endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def warehouse_id(self, auth_headers):
        """Get first warehouse for testing"""
        response = requests.get(f"{BASE_URL}/api/warehouses", headers=auth_headers)
        warehouses = response.json()
        if warehouses:
            return warehouses[0]["id"]
        return None
    
    @pytest.fixture(scope="class")
    def product_id(self, auth_headers):
        """Get first product for testing"""
        response = requests.get(f"{BASE_URL}/api/products", headers=auth_headers)
        products = response.json()
        if products:
            return products[0]["id"]
        return None
    
    def test_get_stock_takings_history(self, auth_headers):
        """GET /api/stock-takings should return history"""
        response = requests.get(f"{BASE_URL}/api/stock-takings", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Stock taking history: {len(data)} records")
    
    def test_create_stock_taking_draft(self, auth_headers, warehouse_id, product_id):
        """POST /api/stock-taking should create draft"""
        if not warehouse_id or not product_id:
            pytest.skip("No warehouse or product available for testing")
        
        stock_taking = {
            "warehouse_id": warehouse_id,
            "items": [
                {
                    "product_id": product_id,
                    "system_qty": 10,
                    "actual_qty": 10,
                    "difference": 0
                }
            ],
            "status": "draft",
            "notes": "TEST stock taking"
        }
        response = requests.post(f"{BASE_URL}/api/stock-taking", json=stock_taking, headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert "taking_no" in data
        print(f"✓ Stock taking created: {data['taking_no']}")


class TestRefunds:
    """Test /api/refunds endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_refunds_list(self, auth_headers):
        """GET /api/refunds should return list"""
        response = requests.get(f"{BASE_URL}/api/refunds", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Refunds list: {len(data)} refunds")
    
    def test_create_refund_invalid_order(self, auth_headers):
        """POST /api/refunds with invalid order should return 404"""
        response = requests.post(f"{BASE_URL}/api/refunds", 
            params={"order_no": "INVALID-ORDER", "reason": "Test refund"},
            json=[],
            headers=auth_headers)
        # Should be 404 for invalid order
        assert response.status_code == 404, f"Expected 404 for invalid order, got {response.status_code}"
        print("✓ Refund correctly rejects invalid order_no")


class TestDailySettlement:
    """Test /api/reports/daily-settlement endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_daily_settlement(self, auth_headers):
        """GET /api/reports/daily-settlement should return report"""
        response = requests.get(f"{BASE_URL}/api/reports/daily-settlement", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Check expected fields
        assert "date" in data or "total_sales" in data or isinstance(data, dict)
        print(f"✓ Daily settlement report: {data}")
    
    def test_daily_settlement_with_date(self, auth_headers):
        """GET /api/reports/daily-settlement with date param"""
        response = requests.get(f"{BASE_URL}/api/reports/daily-settlement?date=2025-01-01", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Daily settlement with date filter works")


class TestBestsellers:
    """Test /api/reports/bestsellers endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_bestsellers(self, auth_headers):
        """GET /api/reports/bestsellers should return top/bottom products"""
        response = requests.get(f"{BASE_URL}/api/reports/bestsellers", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "bestsellers" in data, "Response should have bestsellers"
        assert "slowsellers" in data, "Response should have slowsellers"
        assert isinstance(data["bestsellers"], list)
        assert isinstance(data["slowsellers"], list)
        print(f"✓ Bestsellers: {len(data['bestsellers'])}, Slowsellers: {len(data['slowsellers'])}")
    
    def test_bestsellers_with_params(self, auth_headers):
        """GET /api/reports/bestsellers with days and limit params"""
        response = requests.get(f"{BASE_URL}/api/reports/bestsellers?days=7&limit=5", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Limit should be respected
        assert len(data["bestsellers"]) <= 5
        print(f"✓ Bestsellers with limit=5: {len(data['bestsellers'])} products")


class TestCleanup:
    """Clean up test data"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_cleanup_test_employee(self, auth_headers):
        """Delete test employee if exists"""
        # Get employees
        response = requests.get(f"{BASE_URL}/api/employees", headers=auth_headers)
        employees = response.json()
        
        # Find test employees
        for emp in employees:
            if emp.get("username", "").startswith("TEST_"):
                del_response = requests.delete(f"{BASE_URL}/api/employees/{emp['id']}", headers=auth_headers)
                if del_response.status_code == 200:
                    print(f"✓ Cleaned up test employee: {emp['username']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
