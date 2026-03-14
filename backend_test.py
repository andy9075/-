import requests
import sys
from datetime import datetime
import json

class POSAPITester:
    def __init__(self, base_url="https://manual-preview-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            "category": None,
            "product": None,
            "warehouse": None,
            "store": None,
            "supplier": None,
            "customer": None,
            "purchase_order": None
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    # Authentication Tests
    def test_init_data(self):
        """Initialize default data including admin user"""
        success, response = self.run_test(
            "Initialize Default Data",
            "POST",
            "init-data",
            200
        )
        return success

    def test_login(self, username="admin", password="admin123"):
        """Test login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token received: {self.token[:20]}...")
            return True
        return False

    def test_get_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    # Dashboard Tests
    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            print(f"   Stats: Sales: {response.get('today_sales_count', 0)}, Products: {response.get('products_count', 0)}")
        return success

    # Category Tests
    def test_create_category(self):
        """Create a test category"""
        success, response = self.run_test(
            "Create Category",
            "POST",
            "categories",
            200,
            data={
                "code": "CAT001",
                "name": "电子产品",
                "sort_order": 1
            }
        )
        if success:
            self.created_ids["category"] = response.get("id")
        return success

    def test_get_categories(self):
        """Get all categories"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )
        return success

    # Product Tests
    def test_create_product(self):
        """Create a test product"""
        success, response = self.run_test(
            "Create Product",
            "POST",
            "products",
            200,
            data={
                "code": "PROD001",
                "barcode": "1234567890",
                "name": "测试商品",
                "category_id": self.created_ids.get("category", ""),
                "unit": "件",
                "cost_price": 50.0,
                "retail_price": 100.0,
                "wholesale_price": 80.0,
                "min_stock": 10,
                "max_stock": 1000,
                "status": "active"
            }
        )
        if success:
            self.created_ids["product"] = response.get("id")
        return success

    def test_get_products(self):
        """Get all products"""
        success, response = self.run_test(
            "Get Products",
            "GET",
            "products",
            200
        )
        return success

    def test_get_product_by_id(self):
        """Get specific product"""
        if not self.created_ids["product"]:
            return False
        success, response = self.run_test(
            "Get Product By ID",
            "GET",
            f"products/{self.created_ids['product']}",
            200
        )
        return success

    # Warehouse Tests
    def test_create_warehouse(self):
        """Create a test warehouse"""
        success, response = self.run_test(
            "Create Warehouse",
            "POST",
            "warehouses",
            200,
            data={
                "code": "WH002",
                "name": "测试仓库",
                "address": "测试地址",
                "is_main": False
            }
        )
        if success:
            self.created_ids["warehouse"] = response.get("id")
        return success

    def test_get_warehouses(self):
        """Get all warehouses"""
        success, response = self.run_test(
            "Get Warehouses",
            "GET",
            "warehouses",
            200
        )
        return success

    def test_get_main_warehouse(self):
        """Get main warehouse info"""
        success, response = self.run_test(
            "Get Main Warehouse",
            "GET",
            "warehouses/main/info",
            200
        )
        return success

    # Store Tests
    def test_create_store(self):
        """Create a test store"""
        success, response = self.run_test(
            "Create Store",
            "POST",
            "stores",
            200,
            data={
                "code": "STORE001",
                "name": "测试门店",
                "type": "retail",
                "address": "测试门店地址",
                "phone": "13800138000",
                "warehouse_id": self.created_ids.get("warehouse"),
                "is_headquarters": False,
                "status": "active"
            }
        )
        if success:
            self.created_ids["store"] = response.get("id")
        return success

    def test_get_stores(self):
        """Get all stores"""
        success, response = self.run_test(
            "Get Stores",
            "GET",
            "stores",
            200
        )
        return success

    # Supplier Tests
    def test_create_supplier(self):
        """Create a test supplier"""
        success, response = self.run_test(
            "Create Supplier",
            "POST",
            "suppliers",
            200,
            data={
                "code": "SUP001",
                "name": "测试供应商",
                "contact": "张三",
                "phone": "13900139000",
                "address": "供应商地址"
            }
        )
        if success:
            self.created_ids["supplier"] = response.get("id")
        return success

    def test_get_suppliers(self):
        """Get all suppliers"""
        success, response = self.run_test(
            "Get Suppliers",
            "GET",
            "suppliers",
            200
        )
        return success

    # Customer Tests
    def test_create_customer(self):
        """Create a test customer"""
        success, response = self.run_test(
            "Create Customer",
            "POST",
            "customers",
            200,
            data={
                "code": "CUST001",
                "name": "测试客户",
                "phone": "13700137000",
                "email": "test@example.com",
                "address": "客户地址",
                "member_level": "normal",
                "points": 0,
                "balance": 0.0
            }
        )
        if success:
            self.created_ids["customer"] = response.get("id")
        return success

    def test_get_customers(self):
        """Get all customers"""
        success, response = self.run_test(
            "Get Customers",
            "GET",
            "customers",
            200
        )
        return success

    # Inventory Tests
    def test_get_inventory(self):
        """Get inventory list"""
        success, response = self.run_test(
            "Get Inventory",
            "GET",
            "inventory",
            200
        )
        return success

    def test_adjust_inventory(self):
        """Test inventory adjustment"""
        if not self.created_ids["product"] or not self.created_ids["warehouse"]:
            return False
        success, response = self.run_test(
            "Adjust Inventory",
            "POST",
            "inventory/adjust",
            200,
            data={
                "product_id": self.created_ids["product"],
                "warehouse_id": self.created_ids["warehouse"], 
                "quantity": 100,
                "reason": "测试入库"
            }
        )
        return success

    # Purchase Order Tests
    def test_create_purchase_order(self):
        """Create a purchase order"""
        if not all([self.created_ids["supplier"], self.created_ids["warehouse"], self.created_ids["product"]]):
            return False
        success, response = self.run_test(
            "Create Purchase Order",
            "POST",
            "purchase-orders",
            200,
            data={
                "supplier_id": self.created_ids["supplier"],
                "warehouse_id": self.created_ids["warehouse"],
                "items": [{
                    "product_id": self.created_ids["product"],
                    "quantity": 50,
                    "unit_price": 45.0,
                    "amount": 2250.0
                }],
                "notes": "测试采购单"
            }
        )
        if success:
            self.created_ids["purchase_order"] = response.get("id")
        return success

    def test_get_purchase_orders(self):
        """Get all purchase orders"""
        success, response = self.run_test(
            "Get Purchase Orders",
            "GET",
            "purchase-orders",
            200
        )
        return success

    def test_receive_purchase_order(self):
        """Test purchase order receiving (入库)"""
        if not self.created_ids["purchase_order"]:
            return False
        success, response = self.run_test(
            "Receive Purchase Order",
            "PUT",
            f"purchase-orders/{self.created_ids['purchase_order']}/receive",
            200
        )
        return success

    # Shop Tests (Public endpoints)
    def test_shop_products(self):
        """Test shop products (public endpoint)"""
        success, response = self.run_test(
            "Shop Products",
            "GET",
            "shop/products",
            200
        )
        if success:
            print(f"   Shop products count: {len(response)}")
        return success

    def test_shop_categories(self):
        """Test shop categories (public endpoint)"""
        success, response = self.run_test(
            "Shop Categories", 
            "GET",
            "shop/categories",
            200
        )
        return success

    def test_create_online_order(self):
        """Test creating online shop order"""
        if not self.created_ids["customer"] or not self.created_ids["product"]:
            return False
        success, response = self.run_test(
            "Create Online Order",
            "POST",
            "shop/orders",
            200,
            data={
                "customer_id": self.created_ids["customer"],
                "items": [{
                    "product_id": self.created_ids["product"],
                    "quantity": 2,
                    "unit_price": 100.0,
                    "discount": 0.0,
                    "amount": 200.0
                }],
                "shipping_address": "配送地址",
                "shipping_phone": "13600136000",
                "shipping_name": "收货人",
                "payment_method": "online",
                "notes": "测试订单"
            }
        )
        return success

    def test_get_online_orders(self):
        """Get online orders"""
        success, response = self.run_test(
            "Get Online Orders",
            "GET",
            "shop/orders",
            200
        )
        return success

    # Reports Tests
    def test_sales_summary(self):
        """Test sales summary report"""
        success, response = self.run_test(
            "Sales Summary Report",
            "GET",
            "reports/sales-summary",
            200
        )
        return success

    def test_inventory_summary(self):
        """Test inventory summary report"""
        success, response = self.run_test(
            "Inventory Summary Report",
            "GET",
            "reports/inventory-summary",
            200
        )
        return success

def main():
    print("🚀 Starting POS Management System API Tests")
    print("=" * 50)
    
    tester = POSAPITester()
    
    # Initialize and login
    if not tester.test_init_data():
        print("❌ Failed to initialize data")
        return 1
        
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1
        
    if not tester.test_get_me():
        print("❌ Get user info failed")
        return 1

    # Dashboard
    tester.test_dashboard_stats()
    
    # Basic CRUD operations
    print("\n📦 Testing Core Entities...")
    tester.test_create_category()
    tester.test_get_categories()
    tester.test_create_product()
    tester.test_get_products()
    tester.test_get_product_by_id()
    tester.test_create_warehouse()
    tester.test_get_warehouses()
    tester.test_get_main_warehouse()
    tester.test_create_store()
    tester.test_get_stores()
    tester.test_create_supplier()
    tester.test_get_suppliers()
    tester.test_create_customer()
    tester.test_get_customers()
    
    # Inventory operations
    print("\n📊 Testing Inventory Management...")
    tester.test_get_inventory()
    tester.test_adjust_inventory()
    
    # Purchase operations
    print("\n🛒 Testing Purchase Management...")
    tester.test_create_purchase_order()
    tester.test_get_purchase_orders()
    tester.test_receive_purchase_order()
    
    # Shop operations (public endpoints)
    print("\n🏪 Testing Online Shop...")
    tester.test_shop_products()
    tester.test_shop_categories()
    tester.test_create_online_order()
    tester.test_get_online_orders()
    
    # Reports
    print("\n📈 Testing Reports...")
    tester.test_sales_summary()
    tester.test_inventory_summary()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"✨ Success Rate: {success_rate:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())