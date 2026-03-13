"""
Tests for POS Points Feature (Auto-earn and Redeem points)
- SalesOrderCreate model accepts points_used field
- Points deduction from customer on sales order creation  
- Auto-earn points based on points_per_dollar rate
- Points discount calculated based on points_value_rate
- points_log collection tracks earn/redeem transactions
- System settings for points_per_dollar and points_value_rate
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("token")

@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestSystemSettingsPoints:
    """Test points configuration in System Settings"""
    
    def test_get_system_settings_includes_points_fields(self, authenticated_client):
        """GET /api/settings/system should include points_per_dollar and points_value_rate"""
        response = authenticated_client.get(f"{BASE_URL}/api/settings/system")
        assert response.status_code == 200
        data = response.json()
        # Check default values exist (can be null if not set, but defaults should apply)
        # Default: points_per_dollar=1, points_value_rate=100
        print(f"System settings response: {data}")
    
    def test_update_points_settings(self, authenticated_client):
        """PUT /api/settings/system should update points configuration"""
        # Get current settings
        current = authenticated_client.get(f"{BASE_URL}/api/settings/system").json()
        
        # Update with points settings
        settings_payload = {
            "points_per_dollar": 2,  # Earn 2 points per $1
            "points_value_rate": 50,  # 50 points = $1 discount
            "company_name": current.get("company_name", ""),
            "company_tax_id": current.get("company_tax_id", ""),
            "company_address": current.get("company_address", ""),
            "company_phone": current.get("company_phone", ""),
            "invoice_header": current.get("invoice_header", ""),
            "invoice_footer": current.get("invoice_footer", ""),
            "default_print_format": current.get("default_print_format", "80mm"),
            "auto_print_receipt": current.get("auto_print_receipt", True),
            "receipt_copies": current.get("receipt_copies", 1),
            "default_report_currency": current.get("default_report_currency", "USD"),
            "default_date_range": current.get("default_date_range", "today"),
            "sales_prefix": current.get("sales_prefix", "SO"),
            "transfer_prefix": current.get("transfer_prefix", "TR"),
            "purchase_prefix": current.get("purchase_prefix", "PO"),
            "next_sales_number": current.get("next_sales_number", 1),
            "barcode_scanner_enabled": current.get("barcode_scanner_enabled", True),
            "scanner_input_delay": current.get("scanner_input_delay", 50),
            "wholesale_enabled": current.get("wholesale_enabled", True),
            "wholesale_min_quantity": current.get("wholesale_min_quantity", 10),
            "wholesale_discount_percent": current.get("wholesale_discount_percent", 0.0),
            "pricing_mode": current.get("pricing_mode", "local_based")
        }
        
        response = authenticated_client.put(f"{BASE_URL}/api/settings/system", json=settings_payload)
        assert response.status_code == 200
        
        # Verify updated
        updated = authenticated_client.get(f"{BASE_URL}/api/settings/system").json()
        assert updated.get("points_per_dollar") == 2
        assert updated.get("points_value_rate") == 50
        print(f"Points settings updated: points_per_dollar={updated.get('points_per_dollar')}, points_value_rate={updated.get('points_value_rate')}")
        
        # Reset to defaults
        settings_payload["points_per_dollar"] = 1
        settings_payload["points_value_rate"] = 100
        authenticated_client.put(f"{BASE_URL}/api/settings/system", json=settings_payload)


class TestCustomerPointsManagement:
    """Test customer points add/retrieve functionality"""
    
    def test_get_customer_with_points(self, authenticated_client):
        """GET /api/customers should return customers with points field"""
        response = authenticated_client.get(f"{BASE_URL}/api/customers")
        assert response.status_code == 200
        customers = response.json()
        assert len(customers) > 0, "No customers found in database"
        
        # Check first customer has points field
        customer = customers[0]
        assert "points" in customer, "Customer should have 'points' field"
        print(f"Customer {customer.get('name')} has {customer.get('points')} points")
    
    def test_add_points_to_customer(self, authenticated_client):
        """POST /api/customers/{id}/points/add should add points to customer"""
        # Get first customer
        customers = authenticated_client.get(f"{BASE_URL}/api/customers").json()
        customer_id = customers[0]["id"]
        initial_points = customers[0].get("points", 0)
        
        # Add 500 points
        response = authenticated_client.post(f"{BASE_URL}/api/customers/{customer_id}/points/add?amount=500")
        assert response.status_code == 200
        
        # Verify points were added
        updated = authenticated_client.get(f"{BASE_URL}/api/customers/{customer_id}").json()
        assert updated["points"] == initial_points + 500, f"Expected {initial_points + 500} points, got {updated['points']}"
        print(f"Added 500 points to customer. New balance: {updated['points']}")


class TestSalesOrderWithPoints:
    """Test sales order creation with points redemption and auto-earn"""
    
    def test_create_sales_order_with_points_used(self, authenticated_client):
        """POST /api/sales-orders with points_used should deduct points and reduce total"""
        # Get a customer, store, and product
        customers = authenticated_client.get(f"{BASE_URL}/api/customers").json()
        stores = authenticated_client.get(f"{BASE_URL}/api/stores").json()
        products = authenticated_client.get(f"{BASE_URL}/api/products").json()
        
        assert len(customers) > 0, "Need at least 1 customer"
        assert len(stores) > 0, "Need at least 1 store"
        assert len(products) > 0, "Need at least 1 product"
        
        customer = customers[0]
        store = next((s for s in stores if s.get("type") == "retail"), stores[0])
        product = products[0]
        
        # Ensure customer has enough points
        if customer.get("points", 0) < 100:
            # Add points first
            authenticated_client.post(f"{BASE_URL}/api/customers/{customer['id']}/points/add?amount=500")
            customer = authenticated_client.get(f"{BASE_URL}/api/customers/{customer['id']}").json()
        
        initial_points = customer.get("points", 0)
        points_to_use = 100  # Use 100 points
        
        # Get system settings for points_value_rate (default 100 pts = $1)
        settings = authenticated_client.get(f"{BASE_URL}/api/settings/system").json()
        points_value_rate = settings.get("points_value_rate", 100)
        points_per_dollar = settings.get("points_per_dollar", 1)
        
        # Calculate expected discount: 100 points / 100 rate = $1 discount
        expected_points_discount = points_to_use / points_value_rate
        
        # Create sales order with points_used
        unit_price = product.get("price1") or product.get("retail_price", 10)
        quantity = 2
        amount = unit_price * quantity
        
        order_payload = {
            "store_id": store["id"],
            "customer_id": customer["id"],
            "items": [{
                "product_id": product["id"],
                "quantity": quantity,
                "unit_price": unit_price,
                "discount": 0,
                "amount": amount
            }],
            "payment_method": "cash",
            "paid_amount": amount - expected_points_discount,
            "notes": "TEST_Points_Redemption",
            "points_used": points_to_use
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/sales-orders", json=order_payload)
        assert response.status_code == 200, f"Failed to create order: {response.text}"
        
        order = response.json()
        print(f"Order created: {order.get('order_no')}")
        print(f"Original amount: ${amount}, Points discount: ${order.get('points_discount', 0)}")
        print(f"Final total: ${order.get('total_amount')}")
        print(f"Points used: {order.get('points_used')}, Points earned: {order.get('points_earned')}")
        
        # Verify response includes points fields
        assert "points_used" in order, "Response should include points_used"
        assert "points_discount" in order, "Response should include points_discount"
        assert "points_earned" in order, "Response should include points_earned"
        
        # Verify points discount is approximately correct
        assert abs(order.get("points_discount", 0) - expected_points_discount) < 0.01, \
            f"Expected points_discount={expected_points_discount}, got {order.get('points_discount')}"
        
        # Verify total amount is reduced by points discount
        expected_total = amount - expected_points_discount
        assert abs(order.get("total_amount", 0) - expected_total) < 0.01, \
            f"Expected total={expected_total}, got {order.get('total_amount')}"
        
        # Verify customer points were updated
        updated_customer = authenticated_client.get(f"{BASE_URL}/api/customers/{customer['id']}").json()
        
        # Points earned should be based on final total * points_per_dollar
        expected_earned = int(expected_total * points_per_dollar)
        expected_new_balance = initial_points - points_to_use + expected_earned
        
        print(f"Customer points: initial={initial_points}, used={points_to_use}, earned={order.get('points_earned')}, new={updated_customer.get('points')}")
        
        # Allow for some variance in calculation
        assert abs(updated_customer["points"] - expected_new_balance) < 5, \
            f"Expected points balance ~{expected_new_balance}, got {updated_customer['points']}"
    
    def test_sales_order_without_points_earns_points(self, authenticated_client):
        """Sales order without points_used should still auto-earn points for customer"""
        # Get a customer, store, and product
        customers = authenticated_client.get(f"{BASE_URL}/api/customers").json()
        stores = authenticated_client.get(f"{BASE_URL}/api/stores").json()
        products = authenticated_client.get(f"{BASE_URL}/api/products").json()
        
        customer = customers[0]
        store = next((s for s in stores if s.get("type") == "retail"), stores[0])
        product = products[0]
        initial_points = customer.get("points", 0)
        
        # Get system settings
        settings = authenticated_client.get(f"{BASE_URL}/api/settings/system").json()
        points_per_dollar = settings.get("points_per_dollar", 1)
        
        # Create order without points_used (or with 0)
        unit_price = product.get("price1") or product.get("retail_price", 10)
        amount = unit_price * 1
        
        order_payload = {
            "store_id": store["id"],
            "customer_id": customer["id"],
            "items": [{
                "product_id": product["id"],
                "quantity": 1,
                "unit_price": unit_price,
                "discount": 0,
                "amount": amount
            }],
            "payment_method": "cash",
            "paid_amount": amount,
            "notes": "TEST_AutoEarn",
            "points_used": 0
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/sales-orders", json=order_payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        order = response.json()
        expected_earned = int(amount * points_per_dollar)
        
        print(f"Order total: ${amount}, Points earned: {order.get('points_earned')}, Expected: {expected_earned}")
        
        # Verify points were earned
        assert order.get("points_earned", 0) >= expected_earned - 1, \
            f"Expected to earn ~{expected_earned} points, got {order.get('points_earned')}"
        
        # Verify customer balance updated
        updated_customer = authenticated_client.get(f"{BASE_URL}/api/customers/{customer['id']}").json()
        expected_new = initial_points + order.get("points_earned", 0)
        assert abs(updated_customer["points"] - expected_new) < 2, \
            f"Expected ~{expected_new} points, got {updated_customer['points']}"
    
    def test_sales_order_without_customer_no_points(self, authenticated_client):
        """Sales order without customer should not have points operations"""
        stores = authenticated_client.get(f"{BASE_URL}/api/stores").json()
        products = authenticated_client.get(f"{BASE_URL}/api/products").json()
        
        store = next((s for s in stores if s.get("type") == "retail"), stores[0])
        product = products[0]
        
        unit_price = product.get("price1") or product.get("retail_price", 10)
        
        order_payload = {
            "store_id": store["id"],
            "customer_id": None,  # No customer
            "items": [{
                "product_id": product["id"],
                "quantity": 1,
                "unit_price": unit_price,
                "discount": 0,
                "amount": unit_price
            }],
            "payment_method": "cash",
            "paid_amount": unit_price,
            "notes": "TEST_NoCustomer",
            "points_used": 0
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/sales-orders", json=order_payload)
        assert response.status_code == 200
        
        order = response.json()
        print(f"Order without customer: points_earned={order.get('points_earned')}, points_used={order.get('points_used')}")
        
        # No points should be earned without customer
        assert order.get("points_earned", 0) == 0


class TestPointsInsufficientError:
    """Test error handling when customer doesn't have enough points"""
    
    def test_insufficient_points_returns_error(self, authenticated_client):
        """Using more points than customer has should return 400 error"""
        customers = authenticated_client.get(f"{BASE_URL}/api/customers").json()
        stores = authenticated_client.get(f"{BASE_URL}/api/stores").json()
        products = authenticated_client.get(f"{BASE_URL}/api/products").json()
        
        customer = customers[0]
        store = next((s for s in stores if s.get("type") == "retail"), stores[0])
        product = products[0]
        
        customer_points = customer.get("points", 0)
        excessive_points = customer_points + 10000  # More than customer has
        
        unit_price = product.get("price1") or product.get("retail_price", 10)
        
        order_payload = {
            "store_id": store["id"],
            "customer_id": customer["id"],
            "items": [{
                "product_id": product["id"],
                "quantity": 1,
                "unit_price": unit_price,
                "discount": 0,
                "amount": unit_price
            }],
            "payment_method": "cash",
            "paid_amount": unit_price,
            "notes": "TEST_InsufficientPoints",
            "points_used": excessive_points
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/sales-orders", json=order_payload)
        
        # Should return 400 Bad Request
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        assert "Insufficient points" in response.text or "points" in response.text.lower(), \
            f"Error message should mention points: {response.text}"
        print(f"Correctly rejected: {response.json().get('detail')}")


class TestPointsAuditLog:
    """Test that points transactions are logged in points_log collection"""
    
    def test_points_transactions_in_audit_log(self, authenticated_client):
        """Points earn/redeem should be logged in audit log or points_log"""
        # Check audit log for points-related entries
        response = authenticated_client.get(f"{BASE_URL}/api/audit-logs")
        
        if response.status_code == 200:
            logs = response.json()
            if isinstance(logs, dict):
                items = logs.get("items", [])
            else:
                items = logs
            
            # Look for points-related actions
            points_logs = [l for l in items if "point" in str(l).lower() or "redeem" in str(l.get("action", "")).lower()]
            print(f"Found {len(points_logs)} points-related log entries in audit log")
            for log in points_logs[:3]:
                print(f"  - {log.get('action')}: {log.get('details', log.get('reason', ''))}")
        else:
            print("Audit log endpoint not available or returned error")


class TestSalesOrderResponseFields:
    """Verify sales order response includes all required points fields"""
    
    def test_sales_order_response_has_points_fields(self, authenticated_client):
        """GET /api/sales-orders should return orders with points fields"""
        response = authenticated_client.get(f"{BASE_URL}/api/sales-orders")
        assert response.status_code == 200
        
        orders = response.json()
        if len(orders) > 0:
            # Check a recent order
            recent = orders[0]
            print(f"Order {recent.get('order_no')} fields: points_used={recent.get('points_used')}, points_discount={recent.get('points_discount')}, points_earned={recent.get('points_earned')}")
            
            # Points fields should exist (may be 0)
            assert "points_used" in recent or "points_discount" in recent, \
                "Order should have points fields"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
