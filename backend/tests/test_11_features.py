"""
Test suite for 11 new features in POS System:
1. Report Export (Excel)
2. Profit Analysis
3. Customer Purchase History
4. Loyalty Points/Balance
5. Audit Log
6. Promotions Engine
7. Accounts Receivable/Payable
8. Data Backup Export
9. Dashboard Sales Trends
10. Role Permissions
11. Report Export buttons (covered in UI test)
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def headers(self, token):
        """Auth headers"""
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_login_success(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print("✓ Admin login successful")


class TestDashboardTrends:
    """Feature 9: Dashboard Sales Trends"""
    
    @pytest.fixture(scope="class")
    def headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_trends_7_days(self, headers):
        """Test 7-day sales trends"""
        response = requests.get(f"{BASE_URL}/api/dashboard/trends?days=7", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 7
        for entry in data:
            assert "date" in entry
            assert "sales" in entry
            assert "count" in entry
        print(f"✓ 7-day trends returned {len(data)} days")
    
    def test_trends_30_days(self, headers):
        """Test 30-day sales trends"""
        response = requests.get(f"{BASE_URL}/api/dashboard/trends?days=30", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 30
        print(f"✓ 30-day trends returned {len(data)} days")


class TestProfitAnalysis:
    """Feature 2: Profit Analysis"""
    
    @pytest.fixture(scope="class")
    def headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_profit_analysis_endpoint(self, headers):
        """Test profit analysis returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/reports/profit-analysis", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total_revenue" in data
        assert "total_cost" in data
        assert "total_profit" in data
        assert "overall_margin" in data
        print(f"✓ Profit analysis: revenue=${data['total_revenue']}, profit=${data['total_profit']}, margin={data['overall_margin']}%")


class TestAuditLog:
    """Feature 5: Audit Log"""
    
    @pytest.fixture(scope="class")
    def headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_audit_logs_endpoint(self, headers):
        """Test audit logs retrieval"""
        response = requests.get(f"{BASE_URL}/api/audit-logs", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        print(f"✓ Audit logs: total={data['total']}, page={data['page']}")
    
    def test_audit_logs_with_filter(self, headers):
        """Test audit logs with action filter"""
        response = requests.get(f"{BASE_URL}/api/audit-logs?action=create", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        print(f"✓ Audit logs filtered by action=create")


class TestPromotions:
    """Feature 6: Promotions Engine"""
    
    @pytest.fixture(scope="class")
    def headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    created_promo_id = None
    
    def test_create_promotion(self, headers):
        """Test creating a promotion"""
        payload = {
            "name": "TEST_NewYearSale",
            "type": "discount",
            "discount_value": 15,
            "min_amount": 50,
            "start_date": "2026-01-01",
            "end_date": "2026-01-31",
            "status": "active",
            "description": "Test promotion"
        }
        response = requests.post(f"{BASE_URL}/api/promotions", json=payload, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == "TEST_NewYearSale"
        TestPromotions.created_promo_id = data["id"]
        print(f"✓ Created promotion: {data['name']} (id={data['id']})")
    
    def test_get_promotions(self, headers):
        """Test listing promotions"""
        response = requests.get(f"{BASE_URL}/api/promotions", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} promotions")
    
    def test_update_promotion(self, headers):
        """Test updating a promotion"""
        if not TestPromotions.created_promo_id:
            pytest.skip("No promotion ID from create test")
        payload = {"discount_value": 20, "status": "inactive"}
        response = requests.put(
            f"{BASE_URL}/api/promotions/{TestPromotions.created_promo_id}",
            json=payload, headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["discount_value"] == 20
        print(f"✓ Updated promotion discount to 20%")
    
    def test_delete_promotion(self, headers):
        """Test deleting a promotion"""
        if not TestPromotions.created_promo_id:
            pytest.skip("No promotion ID from create test")
        response = requests.delete(
            f"{BASE_URL}/api/promotions/{TestPromotions.created_promo_id}",
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ Deleted promotion {TestPromotions.created_promo_id}")


class TestAccountsReceivablePayable:
    """Feature 7: Accounts Receivable/Payable"""
    
    @pytest.fixture(scope="class")
    def headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    receivable_id = None
    payable_id = None
    
    def test_create_receivable(self, headers):
        """Test creating an accounts receivable record"""
        payload = {
            "party_name": "TEST_Customer_A",
            "amount": 500,
            "due_date": "2026-02-15",
            "notes": "Test receivable"
        }
        response = requests.post(f"{BASE_URL}/api/accounts/receivable", json=payload, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["type"] == "receivable"
        TestAccountsReceivablePayable.receivable_id = data["id"]
        print(f"✓ Created receivable: ${data['amount']} from {data['party_name']}")
    
    def test_get_receivables(self, headers):
        """Test listing receivables"""
        response = requests.get(f"{BASE_URL}/api/accounts/receivable", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} receivables")
    
    def test_create_payable(self, headers):
        """Test creating an accounts payable record"""
        payload = {
            "party_name": "TEST_Supplier_B",
            "amount": 300,
            "due_date": "2026-02-20",
            "notes": "Test payable"
        }
        response = requests.post(f"{BASE_URL}/api/accounts/payable", json=payload, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["type"] == "payable"
        TestAccountsReceivablePayable.payable_id = data["id"]
        print(f"✓ Created payable: ${data['amount']} to {data['party_name']}")
    
    def test_get_payables(self, headers):
        """Test listing payables"""
        response = requests.get(f"{BASE_URL}/api/accounts/payable", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} payables")
    
    def test_mark_partial_payment(self, headers):
        """Test marking partial payment"""
        if not TestAccountsReceivablePayable.receivable_id:
            pytest.skip("No receivable ID")
        response = requests.put(
            f"{BASE_URL}/api/accounts/{TestAccountsReceivablePayable.receivable_id}/pay?amount=200",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["paid_amount"] == 200
        assert data["status"] == "partial"
        print(f"✓ Marked partial payment: ${data['paid_amount']}")


class TestCustomerFeatures:
    """Features 3 & 4: Customer Purchase History and Loyalty Points/Balance"""
    
    @pytest.fixture(scope="class")
    def headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def customer_id(self, headers):
        """Get or create a test customer"""
        # First try to get existing customers
        response = requests.get(f"{BASE_URL}/api/customers", headers=headers)
        if response.status_code == 200:
            customers = response.json()
            if customers:
                return customers[0]["id"]
        # Create a new customer if none exist
        payload = {
            "code": "TEST001",
            "name": "Test Customer",
            "phone": "1234567890"
        }
        response = requests.post(f"{BASE_URL}/api/customers", json=payload, headers=headers)
        return response.json().get("id")
    
    def test_purchase_history(self, headers, customer_id):
        """Test customer purchase history endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/customers/{customer_id}/purchase-history",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        assert "total_spent" in data
        assert "order_count" in data
        print(f"✓ Customer purchase history: {data['order_count']} orders, ${data['total_spent']} total")
    
    def test_add_points(self, headers, customer_id):
        """Test adding loyalty points"""
        response = requests.post(
            f"{BASE_URL}/api/customers/{customer_id}/points/add?amount=100&reason=test",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "points" in data
        print(f"✓ Added points, new balance: {data['points']}")
    
    def test_redeem_points(self, headers, customer_id):
        """Test redeeming loyalty points"""
        response = requests.post(
            f"{BASE_URL}/api/customers/{customer_id}/points/redeem?amount=50&reason=test",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "points" in data
        print(f"✓ Redeemed points, new balance: {data['points']}")
    
    def test_topup_balance(self, headers, customer_id):
        """Test balance topup"""
        response = requests.post(
            f"{BASE_URL}/api/customers/{customer_id}/balance/topup?amount=50.00&reason=test",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "balance" in data
        print(f"✓ Topped up balance, new balance: ${data['balance']}")


class TestReportExport:
    """Feature 1 & 11: Report Export (Excel)"""
    
    @pytest.fixture(scope="class")
    def headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_export_sales_report(self, headers):
        """Test sales report export endpoint"""
        response = requests.get(f"{BASE_URL}/api/reports/export/sales", headers=headers)
        assert response.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", "")
        print(f"✓ Sales report export returned Excel file ({len(response.content)} bytes)")
    
    def test_export_inventory_report(self, headers):
        """Test inventory report export endpoint"""
        response = requests.get(f"{BASE_URL}/api/reports/export/inventory", headers=headers)
        assert response.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", "")
        print(f"✓ Inventory report export returned Excel file ({len(response.content)} bytes)")


class TestDataBackup:
    """Feature 8: Data Backup Export"""
    
    @pytest.fixture(scope="class")
    def headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_backup_export(self, headers):
        """Test database backup export"""
        response = requests.get(f"{BASE_URL}/api/backup/export", headers=headers)
        assert response.status_code == 200
        assert "application/json" in response.headers.get("content-type", "")
        data = response.json()
        assert "exported_at" in data
        assert "version" in data
        # Check that at least some collections are present
        expected_collections = ["products", "customers", "stores"]
        for col in expected_collections:
            assert col in data, f"Missing collection: {col}"
        print(f"✓ Backup export returned JSON with {len(data)} collections")


class TestRolePermissions:
    """Feature 10: Role Permissions"""
    
    @pytest.fixture(scope="class")
    def headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_permissions(self, headers):
        """Test permissions endpoint"""
        response = requests.get(f"{BASE_URL}/api/auth/permissions", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "role" in data
        assert "permissions" in data
        assert data["role"] == "admin"
        perms = data["permissions"]
        assert perms.get("can_discount") == True
        assert perms.get("can_refund") == True
        assert perms.get("can_export") == True
        print(f"✓ Got permissions for role={data['role']}: {perms}")


class TestExistingEndpoints:
    """Verify existing report endpoints still work"""
    
    @pytest.fixture(scope="class")
    def headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}"}
    
    def test_sales_summary(self, headers):
        """Test sales summary endpoint"""
        response = requests.get(f"{BASE_URL}/api/reports/sales-summary", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_sales" in data
        assert "by_payment_method" in data
        print(f"✓ Sales summary: ${data['total_sales']}")
    
    def test_dashboard_stats(self, headers):
        """Test dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "today_sales_amount" in data
        assert "products_count" in data
        print(f"✓ Dashboard stats: products={data['products_count']}")


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Clean up TEST_ prefixed data after all tests"""
    yield
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        if response.status_code == 200:
            token = response.json().get("token")
            headers = {"Authorization": f"Bearer {token}"}
            # Clean up test promotions
            promos = requests.get(f"{BASE_URL}/api/promotions", headers=headers).json()
            for p in promos:
                if p.get("name", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/promotions/{p['id']}", headers=headers)
            print("✓ Cleaned up test data")
    except Exception as e:
        print(f"Cleanup warning: {e}")
