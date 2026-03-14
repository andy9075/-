"""
Test file for Wholesale Module and Change Password functionality
Iteration 27: Testing wholesale CRUD, stats, status management, and auth/change-password

Features tested:
- GET /api/wholesale-orders - list all wholesale orders
- GET /api/wholesale-orders/stats - get order statistics
- POST /api/wholesale-orders - create new wholesale order
- GET /api/wholesale-orders/{id} - get single order detail
- PUT /api/wholesale-orders/{id} - update order status/payment/notes
- DELETE /api/wholesale-orders/{id} - cancel order (restores inventory)
- PUT /api/auth/change-password - change admin password
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWholesaleModule:
    """Wholesale order CRUD and stats tests"""

    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth token for super admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def test_data(self, auth_headers):
        """Get existing products and customers for testing"""
        products = requests.get(f"{BASE_URL}/api/products", headers=auth_headers).json()
        customers = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers).json()
        return {
            "product": products[0] if products else None,
            "customer": customers[0] if customers else None
        }

    def test_01_get_wholesale_stats(self, auth_headers):
        """Test GET /api/wholesale-orders/stats - verify stats structure"""
        response = requests.get(f"{BASE_URL}/api/wholesale-orders/stats", headers=auth_headers)
        assert response.status_code == 200, f"Stats failed: {response.text}"
        data = response.json()
        # Verify stats structure
        assert "total_orders" in data
        assert "pending" in data
        assert "total_revenue" in data
        assert "total_paid" in data
        assert "total_items" in data
        assert isinstance(data["total_orders"], int)
        assert isinstance(data["pending"], int)
        print(f"Stats: {data}")

    def test_02_get_wholesale_orders_list(self, auth_headers):
        """Test GET /api/wholesale-orders - list all orders"""
        response = requests.get(f"{BASE_URL}/api/wholesale-orders", headers=auth_headers)
        assert response.status_code == 200, f"List failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            order = data[0]
            assert "id" in order
            assert "order_no" in order
            assert order["order_no"].startswith("WS")
            assert "items" in order
            assert "total_amount" in order
            assert "status" in order
            print(f"Found {len(data)} wholesale orders")

    def test_03_create_wholesale_order(self, auth_headers, test_data):
        """Test POST /api/wholesale-orders - create new order"""
        product = test_data["product"]
        customer = test_data["customer"]
        
        if not product or not customer:
            pytest.skip("No products or customers available for testing")
        
        order_data = {
            "customer_id": customer["id"],
            "items": [
                {
                    "product_id": product["id"],
                    "product_name": product["name"],
                    "quantity": 2,
                    "unit_price": product.get("wholesale_price", product.get("price2", 10.0)),
                    "amount": 2 * product.get("wholesale_price", product.get("price2", 10.0))
                }
            ],
            "paid_amount": 0,  # Pending payment
            "payment_method": "cash",
            "notes": "TEST_wholesale_order",
            "delivery_address": "Test delivery address"
        }
        
        response = requests.post(f"{BASE_URL}/api/wholesale-orders", json=order_data, headers=auth_headers)
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        
        # Verify order created
        assert "id" in data
        assert "order_no" in data
        assert data["order_no"].startswith("WS")
        assert data["customer_id"] == customer["id"]
        assert data["status"] == "pending"  # Since paid_amount = 0
        assert len(data["items"]) == 1
        assert data["notes"] == "TEST_wholesale_order"
        
        # Store order_id for subsequent tests
        pytest.created_order_id = data["id"]
        pytest.created_order_no = data["order_no"]
        print(f"Created order: {data['order_no']} with status {data['status']}")

    def test_04_get_single_order_detail(self, auth_headers):
        """Test GET /api/wholesale-orders/{id} - get single order"""
        order_id = getattr(pytest, 'created_order_id', None)
        if not order_id:
            pytest.skip("No order created in previous test")
        
        response = requests.get(f"{BASE_URL}/api/wholesale-orders/{order_id}", headers=auth_headers)
        assert response.status_code == 200, f"Get detail failed: {response.text}"
        data = response.json()
        
        assert data["id"] == order_id
        assert "items" in data
        assert "total_amount" in data
        assert "paid_amount" in data
        print(f"Order detail: {data['order_no']}, total={data['total_amount']}, paid={data['paid_amount']}")

    def test_05_update_order_payment(self, auth_headers):
        """Test PUT /api/wholesale-orders/{id} - update payment"""
        order_id = getattr(pytest, 'created_order_id', None)
        if not order_id:
            pytest.skip("No order created in previous test")
        
        # First get order to check total amount
        get_response = requests.get(f"{BASE_URL}/api/wholesale-orders/{order_id}", headers=auth_headers)
        order = get_response.json()
        total = order.get("total_amount", 0)
        
        # Update with partial payment
        update_data = {"paid_amount": total / 2}
        response = requests.put(f"{BASE_URL}/api/wholesale-orders/{order_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200, f"Update payment failed: {response.text}"
        data = response.json()
        
        assert data["paid_amount"] == total / 2
        assert "updated_at" in data
        print(f"Updated payment to {data['paid_amount']}")

    def test_06_update_order_status(self, auth_headers):
        """Test PUT /api/wholesale-orders/{id} - update status"""
        order_id = getattr(pytest, 'created_order_id', None)
        if not order_id:
            pytest.skip("No order created in previous test")
        
        # Update status to completed
        update_data = {"status": "completed"}
        response = requests.put(f"{BASE_URL}/api/wholesale-orders/{order_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200, f"Update status failed: {response.text}"
        data = response.json()
        
        assert data["status"] == "completed"
        print(f"Updated status to {data['status']}")

    def test_07_update_order_delivered(self, auth_headers):
        """Test PUT /api/wholesale-orders/{id} - mark delivered"""
        order_id = getattr(pytest, 'created_order_id', None)
        if not order_id:
            pytest.skip("No order created in previous test")
        
        update_data = {"status": "delivered"}
        response = requests.put(f"{BASE_URL}/api/wholesale-orders/{order_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200, f"Update to delivered failed: {response.text}"
        data = response.json()
        
        assert data["status"] == "delivered"
        print(f"Marked as delivered")

    def test_08_stats_after_create(self, auth_headers):
        """Test stats reflect the new order"""
        response = requests.get(f"{BASE_URL}/api/wholesale-orders/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Should have at least 2 orders now (1 existing + 1 created)
        assert data["total_orders"] >= 2
        print(f"Updated stats: {data}")

    def test_09_get_nonexistent_order(self, auth_headers):
        """Test GET /api/wholesale-orders/{id} with invalid ID"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/wholesale-orders/{fake_id}", headers=auth_headers)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Correctly returns 404 for non-existent order")

    def test_10_create_and_cancel_order(self, auth_headers, test_data):
        """Test DELETE /api/wholesale-orders/{id} - cancel order (restores inventory)"""
        product = test_data["product"]
        customer = test_data["customer"]
        
        if not product or not customer:
            pytest.skip("No products or customers available")
        
        # Create another order for cancellation
        order_data = {
            "customer_id": customer["id"],
            "items": [
                {
                    "product_id": product["id"],
                    "product_name": product["name"],
                    "quantity": 1,
                    "unit_price": 10.0,
                    "amount": 10.0
                }
            ],
            "paid_amount": 0,
            "payment_method": "cash",
            "notes": "TEST_to_cancel"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/wholesale-orders", json=order_data, headers=auth_headers)
        assert create_response.status_code == 200
        created = create_response.json()
        cancel_order_id = created["id"]
        
        # Cancel the order
        response = requests.delete(f"{BASE_URL}/api/wholesale-orders/{cancel_order_id}", headers=auth_headers)
        assert response.status_code == 200, f"Cancel failed: {response.text}"
        data = response.json()
        
        assert data["status"] == "cancelled"
        
        # Verify order is now cancelled
        get_response = requests.get(f"{BASE_URL}/api/wholesale-orders/{cancel_order_id}", headers=auth_headers)
        cancelled_order = get_response.json()
        assert cancelled_order["status"] == "cancelled"
        print(f"Order {cancel_order_id} cancelled successfully")


class TestChangePassword:
    """Change password endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth token for super admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json().get("token")
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def test_11_change_password_missing_fields(self, auth_headers):
        """Test change password with missing fields"""
        response = requests.put(f"{BASE_URL}/api/auth/change-password", json={}, headers=auth_headers)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("Correctly rejects empty payload")

    def test_12_change_password_wrong_old_password(self, auth_headers):
        """Test change password with wrong old password"""
        response = requests.put(f"{BASE_URL}/api/auth/change-password", json={
            "old_password": "wrongpassword",
            "new_password": "newpassword123"
        }, headers=auth_headers)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "旧密码错误" in response.text or "error" in response.text.lower()
        print("Correctly rejects wrong old password")

    def test_13_change_password_short_new_password(self, auth_headers):
        """Test change password with too short new password"""
        response = requests.put(f"{BASE_URL}/api/auth/change-password", json={
            "old_password": "admin123",
            "new_password": "ab"  # Less than 4 characters
        }, headers=auth_headers)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("Correctly rejects short new password")

    def test_14_change_password_success_and_revert(self, auth_headers):
        """Test successful password change and revert back"""
        new_pwd = "newadmin456"
        
        # Change password
        response = requests.put(f"{BASE_URL}/api/auth/change-password", json={
            "old_password": "admin123",
            "new_password": new_pwd
        }, headers=auth_headers)
        assert response.status_code == 200, f"Change password failed: {response.text}"
        data = response.json()
        assert "密码修改成功" in data.get("message", "") or "success" in str(data).lower()
        print("Password changed successfully")
        
        # Login with new password to get new token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": new_pwd
        })
        assert login_response.status_code == 200, "Login with new password failed"
        new_token = login_response.json().get("token")
        new_headers = {"Authorization": f"Bearer {new_token}", "Content-Type": "application/json"}
        
        # Revert password back to original
        revert_response = requests.put(f"{BASE_URL}/api/auth/change-password", json={
            "old_password": new_pwd,
            "new_password": "admin123"
        }, headers=new_headers)
        assert revert_response.status_code == 200, "Revert password failed"
        print("Password reverted successfully")
        
        # Verify login with original password works
        final_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert final_login.status_code == 200, "Final login verification failed"
        print("Login with original password verified")

    def test_15_change_password_unauthenticated(self):
        """Test change password without auth token"""
        response = requests.put(f"{BASE_URL}/api/auth/change-password", json={
            "old_password": "admin123",
            "new_password": "newpassword"
        })
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("Correctly requires authentication")


class TestAuthAndLogin:
    """Login flow tests"""

    def test_16_login_super_admin(self):
        """Test login for super admin without tenant ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["store_id"] is None  # Super admin has no store
        print("Super admin login successful")

    def test_17_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Correctly rejects invalid credentials")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
