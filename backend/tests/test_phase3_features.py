"""
Phase 3 Feature Tests - 12 New Features
Testing: Wholesale, Attendance, Sales Targets, Purchase Returns, Bundles, 
Notifications, VIP Rules, Product Image, Backup/Restore
"""
import pytest
import requests
import os
import json
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["token"]

@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }

@pytest.fixture(scope="module")
def test_data(auth_headers):
    """Get existing test data - products, customers, suppliers, stores"""
    data = {}
    # Get products
    resp = requests.get(f"{BASE_URL}/api/products", headers=auth_headers)
    if resp.status_code == 200 and resp.json():
        data["product"] = resp.json()[0]
    # Get customers
    resp = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers)
    if resp.status_code == 200 and resp.json():
        data["customer"] = resp.json()[0]
    # Get suppliers
    resp = requests.get(f"{BASE_URL}/api/suppliers", headers=auth_headers)
    if resp.status_code == 200 and resp.json():
        data["supplier"] = resp.json()[0]
    # Get stores
    resp = requests.get(f"{BASE_URL}/api/stores", headers=auth_headers)
    if resp.status_code == 200 and resp.json():
        data["store"] = resp.json()[0]
    return data


# ==================== 1. VIP Rules ====================
class TestVIPRules:
    """VIP auto-upgrade rules endpoint tests"""
    
    def test_get_vip_rules(self, auth_headers):
        """GET /api/settings/vip-rules should return VIP level rules"""
        response = requests.get(f"{BASE_URL}/api/settings/vip-rules", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "levels" in data
        assert isinstance(data["levels"], list)
        assert len(data["levels"]) >= 1
        # Check level structure
        level = data["levels"][0]
        assert "name" in level
        assert "min_spent" in level
        print(f"✓ VIP Rules: {len(data['levels'])} levels configured")
    
    def test_update_vip_rules(self, auth_headers):
        """PUT /api/settings/vip-rules should update VIP rules"""
        new_rules = {
            "levels": [
                {"name": "normal", "label": "普通会员", "min_spent": 0, "points_multiplier": 1, "discount_percent": 0},
                {"name": "silver", "label": "银卡会员", "min_spent": 200, "points_multiplier": 1.5, "discount_percent": 3},
                {"name": "gold", "label": "金卡会员", "min_spent": 500, "points_multiplier": 2, "discount_percent": 5},
                {"name": "vip", "label": "VIP会员", "min_spent": 1000, "points_multiplier": 3, "discount_percent": 8}
            ]
        }
        response = requests.put(f"{BASE_URL}/api/settings/vip-rules", headers=auth_headers, json=new_rules)
        assert response.status_code == 200, f"Failed: {response.text}"
        print("✓ VIP Rules updated successfully")
    
    def test_check_customer_upgrades(self, auth_headers):
        """POST /api/customers/check-upgrades should run upgrade check"""
        response = requests.post(f"{BASE_URL}/api/customers/check-upgrades", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "total" in data
        assert "upgraded" in data
        print(f"✓ Customer upgrade check: {data['upgraded']}/{data['total']} upgraded")


# ==================== 2. Wholesale Orders ====================
class TestWholesaleOrders:
    """Wholesale order CRUD tests"""
    
    def test_get_wholesale_orders(self, auth_headers):
        """GET /api/wholesale-orders should return list"""
        response = requests.get(f"{BASE_URL}/api/wholesale-orders", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        assert isinstance(response.json(), list)
        print(f"✓ Wholesale orders: {len(response.json())} orders")
    
    def test_create_wholesale_order(self, auth_headers, test_data):
        """POST /api/wholesale-orders should create order"""
        if not test_data.get("customer") or not test_data.get("product"):
            pytest.skip("No customer or product data available")
        
        order_data = {
            "customer_id": test_data["customer"]["id"],
            "items": [{
                "product_id": test_data["product"]["id"],
                "product_name": test_data["product"]["name"],
                "quantity": 5,
                "unit_price": test_data["product"].get("price2", 10),
                "amount": 5 * test_data["product"].get("price2", 10)
            }],
            "paid_amount": 50,
            "payment_method": "cash"
        }
        response = requests.post(f"{BASE_URL}/api/wholesale-orders", headers=auth_headers, json=order_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert "order_no" in data
        assert data["order_no"].startswith("WS")
        assert data["type"] == "wholesale"
        print(f"✓ Wholesale order created: {data['order_no']}")


# ==================== 3. Attendance ====================
class TestAttendance:
    """Employee attendance clock-in/clock-out tests"""
    
    def test_get_attendance_records(self, auth_headers):
        """GET /api/attendance should return list"""
        response = requests.get(f"{BASE_URL}/api/attendance", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        assert isinstance(response.json(), list)
        print(f"✓ Attendance records: {len(response.json())} records")
    
    def test_clock_in(self, auth_headers):
        """POST /api/attendance/clock-in should clock in user"""
        response = requests.post(f"{BASE_URL}/api/attendance/clock-in", headers=auth_headers)
        # Could be 200 (success) or 400 (already clocked in)
        if response.status_code == 200:
            data = response.json()
            assert "id" in data
            assert "clock_in" in data
            print(f"✓ Clocked in successfully")
        elif response.status_code == 400:
            print(f"✓ Already clocked in today (expected)")
        else:
            pytest.fail(f"Unexpected response: {response.status_code} - {response.text}")
    
    def test_clock_out(self, auth_headers):
        """POST /api/attendance/clock-out should clock out user"""
        response = requests.post(f"{BASE_URL}/api/attendance/clock-out", headers=auth_headers)
        # Could be 200 (success) or 400 (not clocked in or already clocked out)
        if response.status_code == 200:
            data = response.json()
            assert "clock_out" in data
            print(f"✓ Clocked out successfully, hours: {data.get('hours')}")
        elif response.status_code == 400:
            print(f"✓ Cannot clock out (not clocked in or already clocked out)")
        else:
            pytest.fail(f"Unexpected response: {response.status_code} - {response.text}")
    
    def test_attendance_filter_by_date(self, auth_headers):
        """GET /api/attendance with date filter should work"""
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.get(f"{BASE_URL}/api/attendance", headers=auth_headers, params={
            "start_date": today,
            "end_date": today
        })
        assert response.status_code == 200, f"Failed: {response.text}"
        print(f"✓ Attendance filter by date works: {len(response.json())} records today")


# ==================== 4. Sales Targets ====================
class TestSalesTargets:
    """Sales targets CRUD tests"""
    
    created_target_id = None
    
    def test_create_sales_target(self, auth_headers, test_data):
        """POST /api/sales-targets should create target"""
        today = datetime.now()
        target_data = {
            "name": "TEST_Monthly Sales Target",
            "target_amount": 10000,
            "period": "monthly",
            "start_date": today.strftime("%Y-%m-01"),
            "end_date": (today + timedelta(days=30)).strftime("%Y-%m-%d"),
            "employee_id": "",
            "store_id": test_data.get("store", {}).get("id", "")
        }
        response = requests.post(f"{BASE_URL}/api/sales-targets", headers=auth_headers, json=target_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data
        TestSalesTargets.created_target_id = data["id"]
        print(f"✓ Sales target created: {data['name']}")
    
    def test_get_sales_targets(self, auth_headers):
        """GET /api/sales-targets should return list with progress"""
        response = requests.get(f"{BASE_URL}/api/sales-targets", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        if data:
            target = data[0]
            # Should have progress calculated
            assert "actual" in target or "progress" in target
        print(f"✓ Sales targets: {len(data)} targets")
    
    def test_delete_sales_target(self, auth_headers):
        """DELETE /api/sales-targets/{id} should delete"""
        if not TestSalesTargets.created_target_id:
            pytest.skip("No target created to delete")
        response = requests.delete(f"{BASE_URL}/api/sales-targets/{TestSalesTargets.created_target_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        print(f"✓ Sales target deleted")


# ==================== 5. Purchase Returns ====================
class TestPurchaseReturns:
    """Purchase returns CRUD tests"""
    
    created_return_id = None
    
    def test_create_purchase_return(self, auth_headers, test_data):
        """POST /api/purchase-returns should create return"""
        if not test_data.get("supplier") or not test_data.get("product"):
            pytest.skip("No supplier or product data available")
        
        return_data = {
            "supplier_id": test_data["supplier"]["id"],
            "reason": "TEST_Defective items",
            "items": [{
                "product_id": test_data["product"]["id"],
                "product_name": test_data["product"]["name"],
                "quantity": 2,
                "amount": 2 * test_data["product"].get("cost_price", 5)
            }]
        }
        response = requests.post(f"{BASE_URL}/api/purchase-returns", headers=auth_headers, json=return_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert "return_no" in data
        assert data["return_no"].startswith("PR")
        assert data["status"] == "pending"
        TestPurchaseReturns.created_return_id = data["id"]
        print(f"✓ Purchase return created: {data['return_no']}")
    
    def test_get_purchase_returns(self, auth_headers):
        """GET /api/purchase-returns should return list"""
        response = requests.get(f"{BASE_URL}/api/purchase-returns", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        assert isinstance(response.json(), list)
        print(f"✓ Purchase returns: {len(response.json())} returns")
    
    def test_approve_purchase_return(self, auth_headers):
        """PUT /api/purchase-returns/{id}/approve should approve"""
        if not TestPurchaseReturns.created_return_id:
            pytest.skip("No return created to approve")
        response = requests.put(f"{BASE_URL}/api/purchase-returns/{TestPurchaseReturns.created_return_id}/approve", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        assert response.json()["status"] == "approved"
        print("✓ Purchase return approved")


# ==================== 6. Product Bundles ====================
class TestBundles:
    """Product bundle CRUD tests"""
    
    created_bundle_id = None
    
    def test_create_bundle(self, auth_headers, test_data):
        """POST /api/bundles should create bundle"""
        if not test_data.get("product"):
            pytest.skip("No product data available")
        
        bundle_data = {
            "name": "TEST_Holiday Bundle",
            "description": "Test bundle for Phase 3",
            "items": [{
                "product_id": test_data["product"]["id"],
                "product_name": test_data["product"]["name"],
                "quantity": 2
            }],
            "bundle_price": 50,
            "original_price": 70
        }
        response = requests.post(f"{BASE_URL}/api/bundles", headers=auth_headers, json=bundle_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["name"] == "TEST_Holiday Bundle"
        assert data["bundle_price"] == 50
        TestBundles.created_bundle_id = data["id"]
        print(f"✓ Bundle created: {data['name']}")
    
    def test_get_bundles(self, auth_headers):
        """GET /api/bundles should return list with product names"""
        response = requests.get(f"{BASE_URL}/api/bundles", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        if data:
            bundle = data[0]
            assert "items" in bundle
            # Should have product names populated
            if bundle["items"]:
                assert "product_name" in bundle["items"][0] or "product_id" in bundle["items"][0]
        print(f"✓ Bundles: {len(data)} bundles")
    
    def test_update_bundle(self, auth_headers):
        """PUT /api/bundles/{id} should update bundle"""
        if not TestBundles.created_bundle_id:
            pytest.skip("No bundle created to update")
        update_data = {
            "name": "TEST_Holiday Bundle Updated",
            "bundle_price": 45
        }
        response = requests.put(f"{BASE_URL}/api/bundles/{TestBundles.created_bundle_id}", headers=auth_headers, json=update_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["bundle_price"] == 45
        print("✓ Bundle updated")
    
    def test_delete_bundle(self, auth_headers):
        """DELETE /api/bundles/{id} should delete bundle"""
        if not TestBundles.created_bundle_id:
            pytest.skip("No bundle created to delete")
        response = requests.delete(f"{BASE_URL}/api/bundles/{TestBundles.created_bundle_id}", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        print("✓ Bundle deleted")


# ==================== 7. Notifications ====================
class TestNotifications:
    """Notification center tests"""
    
    def test_get_notifications(self, auth_headers):
        """GET /api/notifications should return aggregated alerts"""
        response = requests.get(f"{BASE_URL}/api/notifications", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "count" in data
        assert "items" in data
        assert isinstance(data["items"], list)
        # Check notification structure if any exist
        if data["items"]:
            notif = data["items"][0]
            assert "type" in notif
            assert "severity" in notif
            assert "title" in notif
        print(f"✓ Notifications: {data['count']} alerts")


# ==================== 8. Product Image Upload ====================
class TestProductImage:
    """Product image upload/delete tests"""
    
    def test_product_image_endpoint_exists(self, auth_headers, test_data):
        """POST /api/products/{id}/image endpoint should exist"""
        if not test_data.get("product"):
            pytest.skip("No product data available")
        
        # Test with empty file - should fail validation but prove endpoint exists
        files = {'file': ('test.txt', b'invalid', 'text/plain')}
        response = requests.post(
            f"{BASE_URL}/api/products/{test_data['product']['id']}/image",
            headers={"Authorization": auth_headers["Authorization"]},
            files=files
        )
        # 400 means endpoint exists but rejected invalid format
        assert response.status_code in [200, 400], f"Unexpected: {response.status_code} - {response.text}"
        print("✓ Product image endpoint exists")
    
    def test_delete_product_image_endpoint(self, auth_headers, test_data):
        """DELETE /api/products/{id}/image endpoint should exist"""
        if not test_data.get("product"):
            pytest.skip("No product data available")
        
        response = requests.delete(
            f"{BASE_URL}/api/products/{test_data['product']['id']}/image",
            headers=auth_headers
        )
        # 200 or 404 (no image to delete) are both valid
        assert response.status_code in [200, 404], f"Unexpected: {response.status_code} - {response.text}"
        print("✓ Product image delete endpoint exists")


# ==================== 9. Backup/Restore ====================
class TestBackupRestore:
    """Data backup restore test"""
    
    def test_restore_endpoint_exists(self, auth_headers):
        """POST /api/backup/restore endpoint should exist"""
        # Test with invalid JSON to verify endpoint exists
        files = {'file': ('backup.json', b'{}', 'application/json')}
        response = requests.post(
            f"{BASE_URL}/api/backup/restore",
            headers={"Authorization": auth_headers["Authorization"]},
            files=files
        )
        # Should accept empty backup (restore nothing) or reject invalid
        assert response.status_code in [200, 400, 403], f"Unexpected: {response.status_code} - {response.text}"
        print("✓ Backup restore endpoint exists")


# ==================== 10. Cost Price History ====================
class TestCostPriceHistory:
    """Cost price tracking tests"""
    
    def test_get_cost_history(self, auth_headers, test_data):
        """GET /api/products/{id}/cost-history should return history"""
        if not test_data.get("product"):
            pytest.skip("No product data available")
        
        response = requests.get(
            f"{BASE_URL}/api/products/{test_data['product']['id']}/cost-history",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        assert isinstance(response.json(), list)
        print(f"✓ Cost history: {len(response.json())} records")


# ==================== Dashboard ====================
class TestDashboard:
    """Dashboard stats test"""
    
    def test_get_dashboard_stats(self, auth_headers):
        """GET /api/dashboard/stats should return stats"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "today_sales_amount" in data
        assert "products_count" in data
        print(f"✓ Dashboard stats: {data['products_count']} products, ${data['today_sales_amount']} today")


# ==================== Cleanup ====================
class TestCleanup:
    """Cleanup TEST_ prefixed data"""
    
    def test_cleanup_test_data(self, auth_headers):
        """Clean up test data created during testing"""
        # Clean up wholesale orders (can't delete via API, skip)
        
        # Clean up sales targets with TEST_ prefix
        resp = requests.get(f"{BASE_URL}/api/sales-targets", headers=auth_headers)
        if resp.status_code == 200:
            for target in resp.json():
                if target.get("name", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/sales-targets/{target['id']}", headers=auth_headers)
        
        # Clean up bundles with TEST_ prefix
        resp = requests.get(f"{BASE_URL}/api/bundles", headers=auth_headers)
        if resp.status_code == 200:
            for bundle in resp.json():
                if bundle.get("name", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/bundles/{bundle['id']}", headers=auth_headers)
        
        print("✓ Test data cleanup completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
