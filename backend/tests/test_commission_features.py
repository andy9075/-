"""
Commission Feature Tests - Iteration 18
Tests for Employee Commission Auto-Calculation feature:
- Commission rules endpoints (GET/PUT)
- Monthly commission report endpoint
- Daily commission report endpoint
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
AUTH_TOKEN = None


class TestCommissionFeatures:
    """Test commission-related API endpoints"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get auth token"""
        global AUTH_TOKEN
        if AUTH_TOKEN is None:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            if response.status_code == 200:
                AUTH_TOKEN = response.json().get("token")
            else:
                pytest.skip("Authentication failed - cannot proceed with tests")
        self.headers = {"Authorization": f"Bearer {AUTH_TOKEN}", "Content-Type": "application/json"}

    # ==================== Commission Rules Tests ====================
    
    def test_get_commission_rules_returns_3_tiers(self):
        """GET /api/settings/commission-rules should return 3 default tiers"""
        response = requests.get(f"{BASE_URL}/api/settings/commission-rules", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "tiers" in data, "Response should contain 'tiers' array"
        
        tiers = data["tiers"]
        assert len(tiers) == 3, f"Expected 3 tiers, got {len(tiers)}"
        
        # Verify tier names
        tier_names = [t["name"] for t in tiers]
        assert "base" in tier_names, "Should have 'base' tier"
        assert "standard" in tier_names, "Should have 'standard' tier"
        assert "excellent" in tier_names, "Should have 'excellent' tier"
        
        print(f"✓ Commission rules returned 3 tiers: {tier_names}")

    def test_commission_rules_default_values(self):
        """Verify default commission rates: base 3%, standard 5%, excellent 8%"""
        response = requests.get(f"{BASE_URL}/api/settings/commission-rules", headers=self.headers)
        assert response.status_code == 200
        
        tiers = response.json()["tiers"]
        tier_map = {t["name"]: t for t in tiers}
        
        # Verify default rates
        assert tier_map["base"]["rate"] == 3, "Base tier should have 3% rate"
        assert tier_map["base"]["min_progress"] == 0, "Base tier min_progress should be 0"
        
        assert tier_map["standard"]["rate"] == 5, "Standard tier should have 5% rate"
        assert tier_map["standard"]["min_progress"] == 60, "Standard tier min_progress should be 60"
        
        assert tier_map["excellent"]["rate"] == 8, "Excellent tier should have 8% rate"
        assert tier_map["excellent"]["min_progress"] == 100, "Excellent tier min_progress should be 100"
        
        print("✓ Default commission rates verified: base=3%, standard=5%, excellent=8%")

    def test_update_commission_rules(self):
        """PUT /api/settings/commission-rules should update rules"""
        # First, save original rules
        original = requests.get(f"{BASE_URL}/api/settings/commission-rules", headers=self.headers).json()
        
        # Update rules with new values
        new_rules = {
            "tiers": [
                {"name": "base", "min_progress": 0, "rate": 4},
                {"name": "standard", "min_progress": 50, "rate": 6},
                {"name": "excellent", "min_progress": 90, "rate": 10}
            ]
        }
        
        response = requests.put(f"{BASE_URL}/api/settings/commission-rules", 
                              headers=self.headers, json=new_rules)
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        # Verify update
        verify = requests.get(f"{BASE_URL}/api/settings/commission-rules", headers=self.headers)
        updated_tiers = verify.json()["tiers"]
        updated_map = {t["name"]: t for t in updated_tiers}
        
        assert updated_map["base"]["rate"] == 4, "Base rate should be updated to 4%"
        assert updated_map["standard"]["min_progress"] == 50, "Standard min_progress should be 50"
        assert updated_map["excellent"]["rate"] == 10, "Excellent rate should be updated to 10%"
        
        print("✓ Commission rules updated successfully")
        
        # Restore original rules
        requests.put(f"{BASE_URL}/api/settings/commission-rules", 
                    headers=self.headers, json=original)
        print("✓ Original rules restored")

    # ==================== Monthly Commission Report Tests ====================
    
    def test_get_commission_report_returns_employees(self):
        """GET /api/reports/commission returns employee commission data"""
        current_month = datetime.now().strftime("%Y-%m")
        response = requests.get(f"{BASE_URL}/api/reports/commission", 
                               headers=self.headers, params={"month": current_month})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "month" in data, "Response should contain 'month'"
        assert "employees" in data, "Response should contain 'employees'"
        assert "total_commission" in data, "Response should contain 'total_commission'"
        
        print(f"✓ Commission report for {current_month}: {len(data['employees'])} employees, total=${data['total_commission']}")

    def test_commission_report_employee_fields(self):
        """Commission report employees should have all required fields"""
        current_month = datetime.now().strftime("%Y-%m")
        response = requests.get(f"{BASE_URL}/api/reports/commission", 
                               headers=self.headers, params={"month": current_month})
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data["employees"]) > 0:
            emp = data["employees"][0]
            required_fields = ["employee_id", "employee_name", "role", "sales", 
                            "target", "progress", "rate", "tier", "commission"]
            
            for field in required_fields:
                assert field in emp, f"Employee should have '{field}' field"
            
            print(f"✓ Employee fields verified: {list(emp.keys())}")
        else:
            print("⚠ No employees with sales data to verify fields")

    def test_commission_report_month_selector(self):
        """Commission report should accept different months"""
        # Test with March 2026 (the month mentioned in context)
        response = requests.get(f"{BASE_URL}/api/reports/commission", 
                               headers=self.headers, params={"month": "2026-03"})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["month"] == "2026-03", "Month should match requested month"
        
        print(f"✓ Commission report for 2026-03: {len(data['employees'])} employees")

    def test_commission_calculation_logic(self):
        """Verify commission is calculated as sales * rate%"""
        response = requests.get(f"{BASE_URL}/api/reports/commission", 
                               headers=self.headers, params={"month": "2026-03"})
        
        assert response.status_code == 200
        data = response.json()
        
        for emp in data["employees"]:
            if emp["sales"] > 0:
                expected_commission = round(emp["sales"] * emp["rate"] / 100, 2)
                actual_commission = emp["commission"]
                
                # Allow small floating point differences
                assert abs(expected_commission - actual_commission) < 0.02, \
                    f"Commission mismatch for {emp['employee_name']}: expected {expected_commission}, got {actual_commission}"
                
                print(f"✓ {emp['employee_name']}: ${emp['sales']} * {emp['rate']}% = ${emp['commission']}")

    # ==================== Daily Commission Report Tests ====================
    
    def test_get_daily_commission_report(self):
        """GET /api/reports/daily-commission returns daily employee sales data"""
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.get(f"{BASE_URL}/api/reports/daily-commission", 
                               headers=self.headers, params={"date": today})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "date" in data, "Response should contain 'date'"
        assert "employees" in data, "Response should contain 'employees'"
        
        print(f"✓ Daily commission report for {today}: {len(data['employees'])} employees with sales")

    def test_daily_commission_employee_fields(self):
        """Daily commission report employees should have sales and estimated_commission"""
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.get(f"{BASE_URL}/api/reports/daily-commission", 
                               headers=self.headers, params={"date": today})
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data["employees"]) > 0:
            emp = data["employees"][0]
            required_fields = ["employee_name", "sales", "count", "estimated_commission"]
            
            for field in required_fields:
                assert field in emp, f"Daily employee should have '{field}' field"
            
            print(f"✓ Daily commission fields verified: {list(emp.keys())}")
        else:
            print("⚠ No employees with daily sales to verify fields")

    # ==================== Integration with Daily Settlement ====================
    
    def test_daily_settlement_page_endpoint(self):
        """GET /api/reports/daily-settlement should work (for integration testing)"""
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.get(f"{BASE_URL}/api/reports/daily-settlement", 
                               headers=self.headers, params={"date": today})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "date" in data or "total_sales" in data, "Daily settlement should return valid data"
        
        print(f"✓ Daily settlement endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
