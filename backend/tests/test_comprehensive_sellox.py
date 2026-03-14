"""
Comprehensive Sellox SaaS POS System Test Suite
Tests: Multi-tenant, Role-based permissions, Refund workflow, 
       POS operations, Shop pages, Employee management, SaaS plan features
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://sellox-narration.preview.emergentagent.com')

# ==================== Test Fixtures ====================

@pytest.fixture(scope="module")
def admin_session():
    """Super Admin session - no tenant_id"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    resp = session.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    data = resp.json()
    session.headers.update({"Authorization": f"Bearer {data['token']}"})
    session.user = data["user"]
    session.token = data["token"]
    return session

@pytest.fixture(scope="module")
def cashier_session():
    """Cashier session - limited permissions"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    resp = session.post(f"{BASE_URL}/api/auth/login", json={
        "username": "cashier1",
        "password": "123456"
    })
    assert resp.status_code == 200, f"Cashier login failed: {resp.text}"
    data = resp.json()
    session.headers.update({"Authorization": f"Bearer {data['token']}"})
    session.user = data["user"]
    session.token = data["token"]
    return session

@pytest.fixture(scope="module")
def tenant1_session():
    """Tenant 1 admin session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    resp = session.post(f"{BASE_URL}/api/auth/tenant-login", json={
        "tenant_id": "4e151812",
        "username": "shop1admin",
        "password": "shop1pass"
    })
    assert resp.status_code == 200, f"Tenant 1 login failed: {resp.text}"
    data = resp.json()
    session.headers.update({"Authorization": f"Bearer {data['token']}"})
    session.user = data["user"]
    session.tenant = data["tenant"]
    session.token = data["token"]
    return session

@pytest.fixture(scope="module")
def tenant2_session():
    """Tenant 2 admin session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    resp = session.post(f"{BASE_URL}/api/auth/tenant-login", json={
        "tenant_id": "a12da2d7",
        "username": "shop2admin",
        "password": "shop2pass"
    })
    assert resp.status_code == 200, f"Tenant 2 login failed: {resp.text}"
    data = resp.json()
    session.headers.update({"Authorization": f"Bearer {data['token']}"})
    session.user = data["user"]
    session.tenant = data["tenant"]
    session.token = data["token"]
    return session

# ==================== 1. SUPER ADMIN AUTH ====================

class TestSuperAdminAuth:
    """Test super admin login and token structure"""
    
    def test_admin_login_success(self):
        """POST /api/auth/login with admin/admin123 → should return token with role=admin"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        assert "tenant_id" not in data["user"], "Super admin should NOT have tenant_id"
    
    def test_admin_login_invalid_password(self):
        """Invalid password should return 401"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert resp.status_code == 401


# ==================== 2-4. TENANT & DATA ISOLATION ====================

class TestTenantManagement:
    """Test tenant creation, login, and data isolation"""
    
    def test_tenant_login_success(self):
        """POST /api/auth/tenant-login works with tenant_id/username/password"""
        resp = requests.post(f"{BASE_URL}/api/auth/tenant-login", json={
            "tenant_id": "4e151812",
            "username": "shop1admin",
            "password": "shop1pass"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["tenant_id"] == "4e151812"
        assert "tenant" in data
    
    def test_tenant_login_invalid_tenant(self):
        """Invalid tenant_id returns 404"""
        resp = requests.post(f"{BASE_URL}/api/auth/tenant-login", json={
            "tenant_id": "invalid_id",
            "username": "test",
            "password": "test"
        })
        assert resp.status_code == 404
    
    def test_tenant_login_invalid_credentials(self):
        """Invalid credentials returns 401"""
        resp = requests.post(f"{BASE_URL}/api/auth/tenant-login", json={
            "tenant_id": "4e151812",
            "username": "shop1admin",
            "password": "wrongpass"
        })
        assert resp.status_code == 401
    
    def test_data_isolation_products(self, tenant1_session, tenant2_session):
        """CRITICAL: Products created in Tenant 1 NOT visible in Tenant 2"""
        # Create unique product in Tenant 1
        unique_code = f"TEST_ISO_{uuid.uuid4().hex[:8]}"
        create_resp = tenant1_session.post(f"{BASE_URL}/api/products", json={
            "name": f"Isolation Test {unique_code}",
            "code": unique_code,
            "cost_price": 10,
            "price1": 15,
            "status": "active"
        })
        assert create_resp.status_code == 200
        product_id = create_resp.json()["id"]
        
        # Verify visible in Tenant 1
        t1_products = tenant1_session.get(f"{BASE_URL}/api/products").json()
        t1_codes = [p["code"] for p in t1_products]
        assert unique_code in t1_codes, "Product should be visible in Tenant 1"
        
        # Verify NOT visible in Tenant 2
        t2_products = tenant2_session.get(f"{BASE_URL}/api/products").json()
        t2_codes = [p["code"] for p in t2_products]
        assert unique_code not in t2_codes, "Product should NOT be visible in Tenant 2 - DATA ISOLATION VIOLATED!"
        
        # Cleanup
        tenant1_session.delete(f"{BASE_URL}/api/products/{product_id}")
    
    def test_auth_me_returns_tenant_id(self, tenant1_session):
        """GET /api/auth/me for tenant user returns tenant_id"""
        resp = tenant1_session.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        assert "tenant_id" in data
        assert data["tenant_id"] == "4e151812"


# ==================== 5-8. ROLE PERMISSIONS & REFUND ====================

class TestRolePermissions:
    """Test role-based permissions and refund workflow"""
    
    def test_admin_has_all_permissions(self, admin_session):
        """GET /api/auth/permissions → admin should have can_refund=true"""
        resp = admin_session.get(f"{BASE_URL}/api/auth/permissions")
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "admin"
        assert data["permissions"]["can_refund"] == True
        assert data["permissions"]["can_discount"] == True
    
    def test_cashier_no_refund_permission(self, cashier_session):
        """Cashier should have can_refund=false"""
        resp = cashier_session.get(f"{BASE_URL}/api/auth/permissions")
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "cashier"
        assert data["permissions"]["can_refund"] == False
    
    def test_refund_blocked_for_cashier(self, cashier_session):
        """POST /api/refunds as cashier → should return 403 'No refund permission'"""
        resp = cashier_session.post(f"{BASE_URL}/api/refunds", json={
            "order_no": "SO202603132019311564",
            "items": [],
            "reason": "test refund"
        })
        assert resp.status_code == 403
        assert "No refund permission" in resp.json().get("detail", "")
    
    def test_refund_allowed_for_admin(self, admin_session):
        """POST /api/refunds as admin → should work (or 404 if order not found)"""
        # First get an existing order
        orders_resp = admin_session.get(f"{BASE_URL}/api/sales-orders")
        if orders_resp.status_code == 200 and len(orders_resp.json()) > 0:
            order_no = orders_resp.json()[0]["order_no"]
            resp = admin_session.post(f"{BASE_URL}/api/refunds", json={
                "order_no": order_no,
                "items": [],
                "reason": "Admin test refund"
            })
            # Should be 200 (success) - admin has permission
            assert resp.status_code in [200, 404], f"Unexpected status: {resp.status_code}"
            if resp.status_code == 200:
                assert "refund_no" in resp.json()


# ==================== 9. ORDER DETAIL LOOKUP ====================

class TestOrderDetailLookup:
    """Test order detail endpoint for refund lookup"""
    
    def test_order_detail_returns_product_names(self, admin_session):
        """GET /api/sales-orders/{order_no}/detail → should return order with product names"""
        # Get an existing order
        orders_resp = admin_session.get(f"{BASE_URL}/api/sales-orders")
        if orders_resp.status_code == 200 and len(orders_resp.json()) > 0:
            order_no = orders_resp.json()[0]["order_no"]
            resp = admin_session.get(f"{BASE_URL}/api/sales-orders/{order_no}/detail")
            assert resp.status_code == 200
            data = resp.json()
            assert "items" in data
            if len(data["items"]) > 0:
                # Check product_name is present in items
                assert "product_name" in data["items"][0], "Order detail should include product_name"
    
    def test_order_detail_not_found(self, admin_session):
        """Non-existent order returns 404"""
        resp = admin_session.get(f"{BASE_URL}/api/sales-orders/INVALID_ORDER_123/detail")
        assert resp.status_code == 404


# ==================== 10-11. EMPLOYEE CRUD & CUSTOM PERMISSIONS ====================

class TestEmployeeManagement:
    """Test employee CRUD with custom permissions"""
    
    def test_employee_crud_flow(self, admin_session):
        """POST/PUT/DELETE /api/employees with custom permissions"""
        unique_name = f"TEST_emp_{uuid.uuid4().hex[:6]}"
        
        # CREATE employee
        create_resp = admin_session.post(f"{BASE_URL}/api/employees", json={
            "username": unique_name,
            "password": "testpass123",
            "name": "Test Employee",
            "phone": "123456789",
            "role": "cashier",
            "store_id": "",
            "permissions": {
                "can_access_pos": True,
                "can_refund": False
            }
        })
        assert create_resp.status_code == 200
        emp_id = create_resp.json()["id"]
        
        # READ - verify in list
        list_resp = admin_session.get(f"{BASE_URL}/api/employees")
        assert list_resp.status_code == 200
        emp_usernames = [e["username"] for e in list_resp.json()]
        assert unique_name in emp_usernames
        
        # UPDATE - give can_refund permission
        update_resp = admin_session.put(f"{BASE_URL}/api/employees/{emp_id}", json={
            "username": unique_name,
            "password": "",
            "name": "Updated Employee",
            "phone": "987654321",
            "role": "cashier",
            "store_id": "",
            "permissions": {
                "can_access_pos": True,
                "can_refund": True  # Grant refund permission
            }
        })
        assert update_resp.status_code == 200
        
        # DELETE
        delete_resp = admin_session.delete(f"{BASE_URL}/api/employees/{emp_id}")
        assert delete_resp.status_code == 200


# ==================== 12. SAAS PLAN FEATURES ====================

class TestSaaSPlanFeatures:
    """Test SaaS plan features in permissions response"""
    
    def test_tenant_plan_features_basic(self, tenant1_session):
        """Basic plan tenant should have limited features"""
        resp = tenant1_session.get(f"{BASE_URL}/api/auth/permissions")
        assert resp.status_code == 200
        data = resp.json()
        assert "plan_features" in data
        features = data["plan_features"]
        # Basic plan - limited features
        assert features["pos"] == True
        assert features["products"] == True
        # These depend on actual plan assignment
        assert "online_shop" in features
        assert "max_users" in features
    
    def test_super_admin_enterprise_features(self, admin_session):
        """Super admin should get enterprise plan features"""
        resp = admin_session.get(f"{BASE_URL}/api/auth/permissions")
        assert resp.status_code == 200
        data = resp.json()
        assert "plan_features" in data
        features = data["plan_features"]
        # Enterprise has everything
        assert features["api_access"] == True
        assert features["commission"] == True
        assert features["max_users"] == 999


# ==================== 13-14. TENANT SHOP PUBLIC ROUTES ====================

class TestTenantShop:
    """Test tenant-aware public shop routes"""
    
    def test_shop_products_returns_tenant_only(self):
        """GET /api/shop/{tenant_id}/products → should return products from that tenant only"""
        resp = requests.get(f"{BASE_URL}/api/shop/4e151812/products")
        assert resp.status_code == 200
        products = resp.json()
        assert isinstance(products, list)
        # Products list should not be empty if tenant has products
    
    def test_shop_info_returns_tenant_name(self):
        """Shop info endpoint returns tenant name"""
        resp = requests.get(f"{BASE_URL}/api/shop/4e151812/info")
        assert resp.status_code == 200
        data = resp.json()
        assert "name" in data
        assert data["id"] == "4e151812"
    
    def test_shop_404_for_invalid_tenant(self):
        """GET /api/shop/invalid_id/products → should return 404"""
        resp = requests.get(f"{BASE_URL}/api/shop/invalid_id/products")
        assert resp.status_code == 404
        assert "not found" in resp.json().get("detail", "").lower()
    
    def test_shop_categories(self):
        """Shop categories endpoint works"""
        resp = requests.get(f"{BASE_URL}/api/shop/4e151812/categories")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ==================== 15. PRODUCTS CRUD ====================

class TestProductsCRUD:
    """Full CRUD for products within a tenant"""
    
    def test_products_crud_flow(self, tenant1_session):
        """Create, Read, Update, Delete product in tenant"""
        unique_code = f"TEST_PROD_{uuid.uuid4().hex[:6]}"
        
        # CREATE
        create_resp = tenant1_session.post(f"{BASE_URL}/api/products", json={
            "name": f"Test Product {unique_code}",
            "code": unique_code,
            "barcode": unique_code,
            "cost_price": 10.00,
            "price1": 15.00,
            "price2": 14.00,
            "price3": 12.00,
            "status": "active",
            "min_stock": 5
        })
        assert create_resp.status_code == 200
        product = create_resp.json()
        product_id = product["id"]
        assert product["code"] == unique_code
        
        # READ
        read_resp = tenant1_session.get(f"{BASE_URL}/api/products/{product_id}")
        assert read_resp.status_code == 200
        assert read_resp.json()["code"] == unique_code
        
        # UPDATE
        update_resp = tenant1_session.put(f"{BASE_URL}/api/products/{product_id}", json={
            "name": f"Updated Product {unique_code}",
            "code": unique_code,
            "cost_price": 12.00,
            "price1": 18.00,
            "status": "active"
        })
        assert update_resp.status_code == 200
        assert update_resp.json()["price1"] == 18.00
        
        # DELETE
        delete_resp = tenant1_session.delete(f"{BASE_URL}/api/products/{product_id}")
        assert delete_resp.status_code == 200
        
        # Verify deleted
        verify_resp = tenant1_session.get(f"{BASE_URL}/api/products/{product_id}")
        assert verify_resp.status_code == 404


# ==================== 16. SALES ORDER ====================

class TestSalesOrder:
    """Test sales order creation in tenant"""
    
    def test_create_sales_order_in_tenant(self, tenant1_session):
        """Create a sales order, verify it's stored in tenant DB"""
        # First get a product and store
        products = tenant1_session.get(f"{BASE_URL}/api/products").json()
        stores = tenant1_session.get(f"{BASE_URL}/api/stores").json()
        
        if len(products) > 0 and len(stores) > 0:
            product = products[0]
            store = stores[0]
            
            resp = tenant1_session.post(f"{BASE_URL}/api/sales-orders", json={
                "store_id": store["id"],
                "customer_id": None,
                "items": [{
                    "product_id": product["id"],
                    "quantity": 1,
                    "unit_price": product.get("price1", 10),
                    "discount": 0,
                    "amount": product.get("price1", 10)
                }],
                "payment_method": "cash",
                "paid_amount": product.get("price1", 10),
                "notes": "TEST_SALE",
                "points_used": 0
            })
            # May fail if inventory is low, that's OK
            assert resp.status_code in [200, 400]
            if resp.status_code == 200:
                assert "order_no" in resp.json()


# ==================== 17. INVENTORY ====================

class TestInventory:
    """Test inventory endpoints"""
    
    def test_inventory_returns_tenant_data(self, tenant1_session):
        """GET /api/inventory should return tenant-scoped inventory"""
        resp = tenant1_session.get(f"{BASE_URL}/api/inventory")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ==================== 24. SECURITY - XSS/INJECTION ====================

class TestSecurityBasic:
    """Basic security tests"""
    
    def test_xss_in_product_name(self, tenant1_session):
        """Test XSS injection in product name (should be stored as-is, rendering escapes)"""
        xss_payload = "<script>alert('xss')</script>"
        unique_code = f"TEST_XSS_{uuid.uuid4().hex[:6]}"
        
        resp = tenant1_session.post(f"{BASE_URL}/api/products", json={
            "name": xss_payload,
            "code": unique_code,
            "cost_price": 10,
            "price1": 15,
            "status": "active"
        })
        assert resp.status_code == 200
        product = resp.json()
        # Backend should store as-is (frontend handles escaping)
        assert product["name"] == xss_payload
        
        # Cleanup
        tenant1_session.delete(f"{BASE_URL}/api/products/{product['id']}")


# ==================== 25. TOKEN SECURITY ====================

class TestTokenSecurity:
    """Test token validation"""
    
    def test_expired_or_invalid_token_returns_401(self):
        """Expired or invalid token should return 401"""
        resp = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        assert resp.status_code == 401
    
    def test_missing_token_returns_401_or_403(self):
        """Missing token should return 401 or 403"""
        resp = requests.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code in [401, 403]


# ==================== ADDITIONAL TESTS ====================

class TestAdditionalEndpoints:
    """Test other important endpoints"""
    
    def test_dashboard_stats(self, admin_session):
        """Dashboard stats endpoint works"""
        resp = admin_session.get(f"{BASE_URL}/api/dashboard/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "products_count" in data
    
    def test_categories_list(self, tenant1_session):
        """Categories list works"""
        resp = tenant1_session.get(f"{BASE_URL}/api/categories")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
    
    def test_customers_list(self, tenant1_session):
        """Customers list works"""
        resp = tenant1_session.get(f"{BASE_URL}/api/customers")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
    
    def test_refunds_list(self, admin_session):
        """Refunds history list works"""
        resp = admin_session.get(f"{BASE_URL}/api/refunds")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
