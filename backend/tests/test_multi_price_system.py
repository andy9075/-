"""
Test Suite for POS Multi-Price System with Margins
Tests the core features:
1. Product creation with cost_price and margins
2. Auto-calculation of price1/price2/price3 based on margins
3. Product update with margin recalculation
4. Proper return of all margin/price fields
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://saas-pos-test.preview.emergentagent.com')
if BASE_URL.endswith('/'):
    BASE_URL = BASE_URL.rstrip('/')

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["token"]

@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Create auth headers for API requests"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }

class TestProductPriceCalculation:
    """Tests for product price auto-calculation based on cost and margins"""
    
    def test_create_product_with_margins_auto_calculates_prices(self, auth_headers):
        """
        Test: POST /api/products with cost_price=10, margin1=50, margin2=30, margin3=20
        Expected: price1=15, price2=13, price3=12
        Formula: price = cost × (1 + margin%)
        """
        product_data = {
            "code": "TEST_MARGIN_001",
            "name": "Test Margin Product",
            "cost_price": 10.0,
            "margin1": 50.0,  # 50% margin -> price1 = 10 * 1.5 = 15
            "margin2": 30.0,  # 30% margin -> price2 = 10 * 1.3 = 13
            "margin3": 20.0,  # 20% margin -> price3 = 10 * 1.2 = 12
            "unit": "件",
            "status": "active"
        }
        
        response = requests.post(f"{BASE_URL}/api/products", json=product_data, headers=auth_headers)
        assert response.status_code == 200, f"Create product failed: {response.text}"
        
        product = response.json()
        
        # Verify auto-calculated prices
        assert product["price1"] == 15.0, f"Expected price1=15, got {product['price1']}"
        assert product["price2"] == 13.0, f"Expected price2=13, got {product['price2']}"
        assert product["price3"] == 12.0, f"Expected price3=12, got {product['price3']}"
        
        # Verify margins are stored correctly
        assert product["margin1"] == 50.0, f"Expected margin1=50, got {product['margin1']}"
        assert product["margin2"] == 30.0, f"Expected margin2=30, got {product['margin2']}"
        assert product["margin3"] == 20.0, f"Expected margin3=20, got {product['margin3']}"
        
        # Verify cost price is stored
        assert product["cost_price"] == 10.0, f"Expected cost_price=10, got {product['cost_price']}"
        
        # Store product_id for cleanup
        self.__class__.test_product_id = product["id"]
        print(f"✓ Product created with auto-calculated prices: price1={product['price1']}, price2={product['price2']}, price3={product['price3']}")
    
    def test_update_product_margins_recalculates_prices(self, auth_headers):
        """
        Test: PUT /api/products/{id} with updated margins
        Expected: prices should be recalculated
        """
        product_id = getattr(self.__class__, 'test_product_id', None)
        if not product_id:
            pytest.skip("No test product created")
        
        update_data = {
            "code": "TEST_MARGIN_001",
            "name": "Test Margin Product Updated",
            "cost_price": 20.0,  # Changed cost
            "margin1": 25.0,    # 25% margin -> price1 = 20 * 1.25 = 25
            "margin2": 15.0,    # 15% margin -> price2 = 20 * 1.15 = 23
            "margin3": 10.0,    # 10% margin -> price3 = 20 * 1.1 = 22
            "unit": "件",
            "status": "active"
        }
        
        response = requests.put(f"{BASE_URL}/api/products/{product_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200, f"Update product failed: {response.text}"
        
        product = response.json()
        
        # Verify recalculated prices
        assert product["price1"] == 25.0, f"Expected price1=25, got {product['price1']}"
        assert product["price2"] == 23.0, f"Expected price2=23, got {product['price2']}"
        assert product["price3"] == 22.0, f"Expected price3=22, got {product['price3']}"
        
        print(f"✓ Product prices recalculated after update: price1={product['price1']}, price2={product['price2']}, price3={product['price3']}")
    
    def test_get_products_returns_all_margin_fields(self, auth_headers):
        """
        Test: GET /api/products returns margin1/margin2/margin3 and price3 fields
        """
        response = requests.get(f"{BASE_URL}/api/products", headers=auth_headers)
        assert response.status_code == 200, f"Get products failed: {response.text}"
        
        products = response.json()
        assert len(products) > 0, "No products found"
        
        # Find our test product or any product
        for product in products:
            # Check all required fields are present
            required_fields = ["margin1", "margin2", "margin3", "price1", "price2", "price3", "cost_price"]
            for field in required_fields:
                assert field in product, f"Field '{field}' missing from product response"
            
            print(f"✓ Product '{product['name']}': margin1={product.get('margin1', 0)}%, margin2={product.get('margin2', 0)}%, margin3={product.get('margin3', 0)}%")
            break
    
    def test_verify_existing_mrg001_product(self, auth_headers):
        """
        Test: Verify product MRG001 has correct prices from context
        Expected: cost=10, margin1=50, margin2=30, margin3=20 → price1=15, price2=13, price3=12
        """
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "MRG001"}, headers=auth_headers)
        assert response.status_code == 200, f"Get products failed: {response.text}"
        
        products = response.json()
        mrg_products = [p for p in products if p.get("code") == "MRG001"]
        
        if mrg_products:
            product = mrg_products[0]
            print(f"✓ Found MRG001 product: cost={product.get('cost_price')}, price1={product.get('price1')}, price2={product.get('price2')}, price3={product.get('price3')}")
            
            # Verify expected values based on context
            if product.get("cost_price") == 10:
                assert product.get("price1") == 15.0, f"Expected price1=15, got {product.get('price1')}"
                assert product.get("price2") == 13.0, f"Expected price2=13, got {product.get('price2')}"
                assert product.get("price3") == 12.0, f"Expected price3=12, got {product.get('price3')}"
        else:
            print("⚠ MRG001 product not found - may need to be created")
    
    def test_cleanup_test_product(self, auth_headers):
        """Cleanup: Delete test product"""
        product_id = getattr(self.__class__, 'test_product_id', None)
        if product_id:
            response = requests.delete(f"{BASE_URL}/api/products/{product_id}", headers=auth_headers)
            if response.status_code in [200, 404]:
                print("✓ Test product cleaned up")


class TestExchangeRates:
    """Tests for exchange rate settings used in Bs. mode"""
    
    def test_get_exchange_rates(self, auth_headers):
        """Test: GET /api/exchange-rates returns usd_to_ves rate"""
        response = requests.get(f"{BASE_URL}/api/exchange-rates")
        assert response.status_code == 200, f"Get exchange rates failed: {response.text}"
        
        rates = response.json()
        assert "usd_to_ves" in rates, "Missing usd_to_ves in exchange rates"
        
        # Default is 36.5 but context says 40.5
        print(f"✓ Exchange rate: 1 USD = {rates['usd_to_ves']} Bs.")


class TestPOSPriceModeAPI:
    """Tests for APIs that POS uses for price mode functionality"""
    
    def test_products_api_has_all_price_fields_for_pos(self, auth_headers):
        """
        Test: Verify products API returns all fields needed for POS price switching
        """
        response = requests.get(f"{BASE_URL}/api/products", headers=auth_headers)
        assert response.status_code == 200
        
        products = response.json()
        if products:
            product = products[0]
            
            # POS needs these fields for price mode switching
            pos_required_fields = ["price1", "price2", "price3", "retail_price", "wholesale_price"]
            for field in pos_required_fields:
                assert field in product, f"POS required field '{field}' missing"
            
            print(f"✓ Product has all POS price fields: price1={product.get('price1')}, price2={product.get('price2')}, price3={product.get('price3')}")


class TestAdminProductTable:
    """Tests to verify admin product table columns"""
    
    def test_admin_product_list_fields(self, auth_headers):
        """
        Test: Verify admin product list has fields for:
        编码, 商品名称, 成本价, 利率1%, 价格1, 利率2%, 价格2, 利率3%, 价格3(整箱)
        """
        response = requests.get(f"{BASE_URL}/api/products", headers=auth_headers)
        assert response.status_code == 200
        
        products = response.json()
        if products:
            product = products[0]
            
            # Fields required for admin table columns
            admin_table_fields = {
                "code": "编码",
                "name": "商品名称",
                "cost_price": "成本价",
                "margin1": "利率1%",
                "price1": "价格1",
                "margin2": "利率2%",
                "price2": "价格2",
                "margin3": "利率3%",
                "price3": "价格3(整箱)"
            }
            
            for field, label in admin_table_fields.items():
                assert field in product, f"Admin table field '{field}' ({label}) missing from API response"
            
            print(f"✓ All admin table fields present for product: {product.get('code')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
