"""
Multi-Tenant Architecture Tests for POS SaaS System
====================================================
Tests tenant creation, tenant login, data isolation between tenants,
and super admin access control.

Key test areas:
1. Super Admin Login: POST /api/auth/login
2. Create Tenant: POST /api/tenants
3. Tenant Login: POST /api/auth/tenant-login
4. Data Isolation: Products in Tenant 1 NOT visible in Tenant 2
5. Tenant-scoped CRUD: All resources are tenant-isolated
6. GET /api/auth/me - returns user with tenant_id for tenant users
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data prefix for cleanup
TEST_PREFIX = "TEST_MULTITENANT_"

class TestSuperAdminAuth:
    """Super Admin authentication tests"""
    
    def test_super_admin_login_success(self):
        """Test super admin can login with admin/admin123"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        print(f"Super Admin Login Response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["role"] == "admin", "User should have admin role"
        print(f"✓ Super admin login successful - role: {data['user']['role']}")
        
    def test_super_admin_login_invalid_password(self):
        """Test login fails with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Invalid password correctly rejected")
        
    def test_super_admin_me_endpoint(self):
        """Test /api/auth/me for super admin - should NOT have tenant_id"""
        # First login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_res.status_code == 200
        token = login_res.json()["token"]
        
        # Get user info
        me_res = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert me_res.status_code == 200, f"Expected 200, got {me_res.status_code}"
        
        user = me_res.json()
        assert user.get("role") == "admin", "Super admin should have admin role"
        assert "tenant_id" not in user or not user.get("tenant_id"), "Super admin should NOT have tenant_id"
        print(f"✓ Super admin /me endpoint works - no tenant_id")


class TestTenantManagement:
    """Tenant creation and management tests"""
    
    @pytest.fixture
    def super_admin_token(self):
        """Get super admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_create_tenant_success(self, super_admin_token):
        """Test creating a new tenant"""
        unique_name = f"{TEST_PREFIX}Store_{uuid.uuid4().hex[:6]}"
        tenant_data = {
            "name": unique_name,
            "contact_name": "Test Contact",
            "contact_phone": "1234567890",
            "plan": "basic",
            "admin_username": f"admin_{uuid.uuid4().hex[:6]}",
            "admin_password": "test123"
        }
        
        response = requests.post(f"{BASE_URL}/api/tenants", 
            json=tenant_data,
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        print(f"Create Tenant Response: {response.status_code} - {response.text[:200]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain tenant id"
        assert "admin_username" in data, "Response should contain admin_username"
        assert "admin_password" in data, "Response should contain admin_password"
        assert data["status"] == "active", "New tenant should be active"
        
        print(f"✓ Tenant created - ID: {data['id']}, Admin: {data['admin_username']}")
        return data
    
    def test_list_tenants(self, super_admin_token):
        """Test listing all tenants (super admin only)"""
        response = requests.get(f"{BASE_URL}/api/tenants",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Listed {len(data)} tenants")
        
    def test_tenant_cannot_access_tenant_management(self):
        """Test that tenant users cannot access /api/tenants"""
        # First create a tenant
        admin_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        admin_token = admin_res.json()["token"]
        
        tenant_data = {
            "name": f"{TEST_PREFIX}RestrictedTest_{uuid.uuid4().hex[:6]}",
            "admin_username": f"restricted_{uuid.uuid4().hex[:6]}",
            "admin_password": "test123"
        }
        tenant_res = requests.post(f"{BASE_URL}/api/tenants",
            json=tenant_data, headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert tenant_res.status_code == 200
        tenant = tenant_res.json()
        
        # Now login as tenant user
        tenant_login_res = requests.post(f"{BASE_URL}/api/auth/tenant-login", json={
            "tenant_id": tenant["id"],
            "username": tenant["admin_username"],
            "password": tenant["admin_password"]
        })
        assert tenant_login_res.status_code == 200
        tenant_token = tenant_login_res.json()["token"]
        
        # Try to access tenant list - should fail with 403
        list_res = requests.get(f"{BASE_URL}/api/tenants",
            headers={"Authorization": f"Bearer {tenant_token}"}
        )
        assert list_res.status_code == 403, f"Expected 403 for tenant user, got {list_res.status_code}"
        print(f"✓ Tenant user correctly blocked from tenant management")


class TestTenantLogin:
    """Tenant-specific login tests"""
    
    @pytest.fixture
    def create_test_tenant(self):
        """Create a tenant for testing"""
        admin_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        admin_token = admin_res.json()["token"]
        
        tenant_data = {
            "name": f"{TEST_PREFIX}LoginTest_{uuid.uuid4().hex[:6]}",
            "admin_username": f"login_test_{uuid.uuid4().hex[:6]}",
            "admin_password": "testpass123"
        }
        tenant_res = requests.post(f"{BASE_URL}/api/tenants",
            json=tenant_data, headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert tenant_res.status_code == 200
        return tenant_res.json()
    
    def test_tenant_login_success(self, create_test_tenant):
        """Test tenant user can login with tenant-login endpoint"""
        tenant = create_test_tenant
        
        response = requests.post(f"{BASE_URL}/api/auth/tenant-login", json={
            "tenant_id": tenant["id"],
            "username": tenant["admin_username"],
            "password": tenant["admin_password"]
        })
        print(f"Tenant Login Response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert "tenant" in data, "Response should contain tenant info"
        assert data["user"].get("tenant_id") == tenant["id"], "User should have correct tenant_id"
        print(f"✓ Tenant login successful - tenant_id: {data['user'].get('tenant_id')}")
        
    def test_tenant_login_invalid_tenant_id(self):
        """Test login fails with non-existent tenant ID"""
        response = requests.post(f"{BASE_URL}/api/auth/tenant-login", json={
            "tenant_id": "nonexistent123",
            "username": "test",
            "password": "test"
        })
        assert response.status_code == 404, f"Expected 404 for invalid tenant, got {response.status_code}"
        print(f"✓ Invalid tenant ID correctly rejected")
        
    def test_tenant_login_invalid_credentials(self, create_test_tenant):
        """Test login fails with wrong credentials"""
        tenant = create_test_tenant
        
        response = requests.post(f"{BASE_URL}/api/auth/tenant-login", json={
            "tenant_id": tenant["id"],
            "username": tenant["admin_username"],
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Invalid credentials correctly rejected")
        
    def test_tenant_me_endpoint_has_tenant_id(self, create_test_tenant):
        """Test /api/auth/me for tenant user returns tenant_id"""
        tenant = create_test_tenant
        
        # Login as tenant
        login_res = requests.post(f"{BASE_URL}/api/auth/tenant-login", json={
            "tenant_id": tenant["id"],
            "username": tenant["admin_username"],
            "password": tenant["admin_password"]
        })
        assert login_res.status_code == 200
        token = login_res.json()["token"]
        
        # Get user info
        me_res = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert me_res.status_code == 200, f"Expected 200, got {me_res.status_code}"
        
        user = me_res.json()
        assert user.get("tenant_id") == tenant["id"], f"Tenant user should have tenant_id={tenant['id']}"
        print(f"✓ Tenant /me endpoint returns tenant_id: {user.get('tenant_id')}")


class TestDataIsolation:
    """Critical data isolation tests between tenants"""
    
    @pytest.fixture
    def two_tenants(self):
        """Create two separate tenants for isolation testing"""
        admin_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        admin_token = admin_res.json()["token"]
        
        tenants = []
        for i in range(2):
            tenant_data = {
                "name": f"{TEST_PREFIX}IsolationTenant{i+1}_{uuid.uuid4().hex[:6]}",
                "admin_username": f"iso_admin{i+1}_{uuid.uuid4().hex[:6]}",
                "admin_password": f"testpass{i+1}"
            }
            res = requests.post(f"{BASE_URL}/api/tenants",
                json=tenant_data, headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert res.status_code == 200, f"Failed to create tenant {i+1}"
            tenants.append(res.json())
        
        return tenants
    
    def get_tenant_token(self, tenant):
        """Helper to get tenant auth token"""
        res = requests.post(f"{BASE_URL}/api/auth/tenant-login", json={
            "tenant_id": tenant["id"],
            "username": tenant["admin_username"],
            "password": tenant["admin_password"]
        })
        assert res.status_code == 200
        return res.json()["token"]
    
    def test_product_isolation(self, two_tenants):
        """CRITICAL: Products created in Tenant 1 should NOT be visible in Tenant 2"""
        tenant1, tenant2 = two_tenants
        token1 = self.get_tenant_token(tenant1)
        token2 = self.get_tenant_token(tenant2)
        
        # Create product in Tenant 1
        unique_code = f"PROD_{uuid.uuid4().hex[:8]}"
        product_data = {
            "code": unique_code,
            "name": f"{TEST_PREFIX}Isolation_Product",
            "cost_price": 10.0,
            "price1": 15.0,
            "unit": "件"
        }
        create_res = requests.post(f"{BASE_URL}/api/products",
            json=product_data, headers={"Authorization": f"Bearer {token1}"}
        )
        assert create_res.status_code == 200, f"Failed to create product: {create_res.text}"
        product_id = create_res.json()["id"]
        print(f"Created product {product_id} in Tenant 1")
        
        # Verify product exists in Tenant 1
        get1_res = requests.get(f"{BASE_URL}/api/products",
            headers={"Authorization": f"Bearer {token1}"}
        )
        assert get1_res.status_code == 200
        tenant1_products = get1_res.json()
        tenant1_product_ids = [p["id"] for p in tenant1_products]
        assert product_id in tenant1_product_ids, "Product should be visible in Tenant 1"
        print(f"✓ Product {product_id} visible in Tenant 1")
        
        # CRITICAL: Verify product is NOT visible in Tenant 2
        get2_res = requests.get(f"{BASE_URL}/api/products",
            headers={"Authorization": f"Bearer {token2}"}
        )
        assert get2_res.status_code == 200
        tenant2_products = get2_res.json()
        tenant2_product_ids = [p["id"] for p in tenant2_products]
        assert product_id not in tenant2_product_ids, "ISOLATION BREACH: Product should NOT be visible in Tenant 2!"
        print(f"✓ Product {product_id} correctly NOT visible in Tenant 2 - DATA ISOLATION VERIFIED")
        
    def test_store_isolation(self, two_tenants):
        """Stores should be isolated between tenants"""
        tenant1, tenant2 = two_tenants
        token1 = self.get_tenant_token(tenant1)
        token2 = self.get_tenant_token(tenant2)
        
        # Create store in Tenant 1
        store_data = {
            "code": f"STORE_{uuid.uuid4().hex[:6]}",
            "name": f"{TEST_PREFIX}Isolation_Store",
            "type": "retail"
        }
        create_res = requests.post(f"{BASE_URL}/api/stores",
            json=store_data, headers={"Authorization": f"Bearer {token1}"}
        )
        assert create_res.status_code == 200
        store_id = create_res.json()["id"]
        
        # Verify store NOT visible in Tenant 2
        get2_res = requests.get(f"{BASE_URL}/api/stores",
            headers={"Authorization": f"Bearer {token2}"}
        )
        tenant2_stores = get2_res.json()
        tenant2_store_ids = [s["id"] for s in tenant2_stores]
        assert store_id not in tenant2_store_ids, "ISOLATION BREACH: Store should NOT be visible in Tenant 2!"
        print(f"✓ Store isolation verified - store {store_id} not visible in Tenant 2")
        
    def test_category_isolation(self, two_tenants):
        """Categories should be isolated between tenants"""
        tenant1, tenant2 = two_tenants
        token1 = self.get_tenant_token(tenant1)
        token2 = self.get_tenant_token(tenant2)
        
        # Create category in Tenant 1
        cat_data = {
            "code": f"CAT_{uuid.uuid4().hex[:6]}",
            "name": f"{TEST_PREFIX}Isolation_Category"
        }
        create_res = requests.post(f"{BASE_URL}/api/categories",
            json=cat_data, headers={"Authorization": f"Bearer {token1}"}
        )
        assert create_res.status_code == 200
        cat_id = create_res.json()["id"]
        
        # Verify category NOT visible in Tenant 2
        get2_res = requests.get(f"{BASE_URL}/api/categories",
            headers={"Authorization": f"Bearer {token2}"}
        )
        tenant2_cats = get2_res.json()
        tenant2_cat_ids = [c["id"] for c in tenant2_cats]
        assert cat_id not in tenant2_cat_ids, "ISOLATION BREACH: Category should NOT be visible in Tenant 2!"
        print(f"✓ Category isolation verified - category {cat_id} not visible in Tenant 2")
        
    def test_customer_isolation(self, two_tenants):
        """Customers should be isolated between tenants"""
        tenant1, tenant2 = two_tenants
        token1 = self.get_tenant_token(tenant1)
        token2 = self.get_tenant_token(tenant2)
        
        # Create customer in Tenant 1
        cust_data = {
            "code": f"CUST_{uuid.uuid4().hex[:6]}",
            "name": f"{TEST_PREFIX}Isolation_Customer",
            "phone": "1234567890"
        }
        create_res = requests.post(f"{BASE_URL}/api/customers",
            json=cust_data, headers={"Authorization": f"Bearer {token1}"}
        )
        assert create_res.status_code == 200
        cust_id = create_res.json()["id"]
        
        # Verify customer NOT visible in Tenant 2
        get2_res = requests.get(f"{BASE_URL}/api/customers",
            headers={"Authorization": f"Bearer {token2}"}
        )
        tenant2_custs = get2_res.json()
        tenant2_cust_ids = [c["id"] for c in tenant2_custs]
        assert cust_id not in tenant2_cust_ids, "ISOLATION BREACH: Customer should NOT be visible in Tenant 2!"
        print(f"✓ Customer isolation verified - customer {cust_id} not visible in Tenant 2")


class TestTenantStatusControl:
    """Tests for tenant activation/deactivation"""
    
    @pytest.fixture
    def super_admin_token(self):
        res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        return res.json()["token"]
    
    @pytest.fixture
    def test_tenant(self, super_admin_token):
        tenant_data = {
            "name": f"{TEST_PREFIX}StatusTest_{uuid.uuid4().hex[:6]}",
            "admin_username": f"status_admin_{uuid.uuid4().hex[:6]}",
            "admin_password": "testpass"
        }
        res = requests.post(f"{BASE_URL}/api/tenants",
            json=tenant_data, headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        return res.json()
    
    def test_toggle_tenant_status(self, super_admin_token, test_tenant):
        """Test toggling tenant active/inactive status"""
        tenant_id = test_tenant["id"]
        
        # Toggle to inactive
        res = requests.put(f"{BASE_URL}/api/tenants/{tenant_id}/toggle",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        assert res.status_code == 200
        assert res.json()["status"] == "inactive"
        print(f"✓ Tenant toggled to inactive")
        
        # Toggle back to active
        res2 = requests.put(f"{BASE_URL}/api/tenants/{tenant_id}/toggle",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        assert res2.status_code == 200
        assert res2.json()["status"] == "active"
        print(f"✓ Tenant toggled back to active")
        
    def test_inactive_tenant_cannot_login(self, super_admin_token, test_tenant):
        """Inactive tenant users should not be able to login"""
        tenant_id = test_tenant["id"]
        
        # Deactivate tenant
        toggle_res = requests.put(f"{BASE_URL}/api/tenants/{tenant_id}/toggle",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        assert toggle_res.json()["status"] == "inactive"
        
        # Try to login - should fail with 403
        login_res = requests.post(f"{BASE_URL}/api/auth/tenant-login", json={
            "tenant_id": tenant_id,
            "username": test_tenant["admin_username"],
            "password": test_tenant["admin_password"]
        })
        assert login_res.status_code == 403, f"Expected 403 for inactive tenant, got {login_res.status_code}"
        print(f"✓ Inactive tenant correctly blocked from login")
        
        # Re-activate for cleanup
        requests.put(f"{BASE_URL}/api/tenants/{tenant_id}/toggle",
            headers={"Authorization": f"Bearer {super_admin_token}"}
        )


class TestTenantScopedCRUD:
    """Test CRUD operations are properly tenant-scoped"""
    
    @pytest.fixture
    def tenant_with_token(self):
        """Create tenant and return with token"""
        admin_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        admin_token = admin_res.json()["token"]
        
        tenant_data = {
            "name": f"{TEST_PREFIX}CRUD_Test_{uuid.uuid4().hex[:6]}",
            "admin_username": f"crud_admin_{uuid.uuid4().hex[:6]}",
            "admin_password": "crudpass"
        }
        tenant_res = requests.post(f"{BASE_URL}/api/tenants",
            json=tenant_data, headers={"Authorization": f"Bearer {admin_token}"}
        )
        tenant = tenant_res.json()
        
        # Get tenant token
        login_res = requests.post(f"{BASE_URL}/api/auth/tenant-login", json={
            "tenant_id": tenant["id"],
            "username": tenant["admin_username"],
            "password": tenant["admin_password"]
        })
        tenant["token"] = login_res.json()["token"]
        return tenant
    
    def test_product_crud(self, tenant_with_token):
        """Test complete product CRUD within tenant"""
        token = tenant_with_token["token"]
        
        # CREATE
        product_data = {
            "code": f"PROD_{uuid.uuid4().hex[:6]}",
            "name": f"{TEST_PREFIX}CRUD_Product",
            "cost_price": 10.0, "price1": 15.0
        }
        create_res = requests.post(f"{BASE_URL}/api/products",
            json=product_data, headers={"Authorization": f"Bearer {token}"}
        )
        assert create_res.status_code == 200
        product_id = create_res.json()["id"]
        
        # READ
        read_res = requests.get(f"{BASE_URL}/api/products/{product_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert read_res.status_code == 200
        assert read_res.json()["name"] == product_data["name"]
        
        # UPDATE
        update_res = requests.put(f"{BASE_URL}/api/products/{product_id}",
            json={**product_data, "name": "Updated Product"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert update_res.status_code == 200
        assert update_res.json()["name"] == "Updated Product"
        
        # DELETE
        delete_res = requests.delete(f"{BASE_URL}/api/products/{product_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert delete_res.status_code == 200
        
        # VERIFY DELETED
        verify_res = requests.get(f"{BASE_URL}/api/products/{product_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert verify_res.status_code == 404
        
        print(f"✓ Complete product CRUD verified for tenant")
        
    def test_warehouse_crud(self, tenant_with_token):
        """Test warehouse CRUD within tenant"""
        token = tenant_with_token["token"]
        
        # Note: Default warehouse is created with tenant
        # List warehouses
        list_res = requests.get(f"{BASE_URL}/api/warehouses",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert list_res.status_code == 200
        warehouses = list_res.json()
        # Should have at least the default warehouse
        assert len(warehouses) >= 1, "Tenant should have default warehouse"
        print(f"✓ Warehouse listing works for tenant - found {len(warehouses)} warehouses")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
