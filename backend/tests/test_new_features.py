"""
Test Suite: Sellox New Features - Video Tutorials, PDF Export, Trial Tenants
Tests: Video CRUD, Trial tenant creation, Tenant with trial expiry
"""
import pytest
import requests
import os
import json
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestVideoTutorials:
    """Video tutorial management - upload, list, update, delete"""
    
    @pytest.fixture(scope='class')
    def admin_token(self):
        """Login as super admin (admin/admin123)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        return data.get("token")
    
    @pytest.fixture(scope='class')
    def auth_headers(self, admin_token):
        """Auth headers with admin token"""
        return {"Authorization": f"Bearer {admin_token}"}
    
    def test_get_videos_empty(self, auth_headers):
        """GET /api/videos - should return list (may be empty initially)"""
        response = requests.get(f"{BASE_URL}/api/videos", headers=auth_headers)
        assert response.status_code == 200, f"GET videos failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Videos response should be a list"
        print(f"SUCCESS: GET /api/videos returned {len(data)} videos")
    
    def test_upload_video(self, auth_headers):
        """POST /api/videos/upload - upload a test video file"""
        # Create a small test video file (valid MP4 header)
        # Minimal MP4 file structure
        test_content = b'\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom\x00\x00\x00\x08free'
        files = {
            'file': ('test_video.mp4', test_content, 'video/mp4')
        }
        response = requests.post(
            f"{BASE_URL}/api/videos/upload",
            headers=auth_headers,
            files=files
        )
        assert response.status_code == 200, f"Upload video failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Response should have id"
        assert "url" in data, "Response should have url"
        assert "title" in data, "Response should have title"
        assert data["title"] == "test_video", "Title should be filename without extension"
        assert data["category"] == "general", "Default category should be general"
        print(f"SUCCESS: Video uploaded with id={data['id']}, url={data['url']}")
        
        # Store video_id for later tests
        self.__class__.test_video_id = data["id"]
        return data
    
    def test_get_videos_after_upload(self, auth_headers):
        """GET /api/videos - verify uploaded video appears in list"""
        response = requests.get(f"{BASE_URL}/api/videos", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Should have at least one video now
        assert len(data) >= 1, "Should have at least 1 video after upload"
        
        # Find our test video
        video_id = getattr(self.__class__, 'test_video_id', None)
        if video_id:
            found = any(v.get("id") == video_id for v in data)
            assert found, f"Uploaded video {video_id} should appear in list"
            print(f"SUCCESS: Video {video_id} found in video list")
    
    def test_update_video(self, auth_headers):
        """PUT /api/videos/{id} - update video title and category"""
        video_id = getattr(self.__class__, 'test_video_id', None)
        if not video_id:
            pytest.skip("No video_id available - upload test may have failed")
        
        response = requests.put(
            f"{BASE_URL}/api/videos/{video_id}",
            headers=auth_headers,
            json={"title": "Updated Tutorial", "category": "pos"}
        )
        assert response.status_code == 200, f"Update video failed: {response.text}"
        print(f"SUCCESS: Video {video_id} updated")
        
        # Verify update persisted
        get_response = requests.get(f"{BASE_URL}/api/videos", headers=auth_headers)
        videos = get_response.json()
        updated_video = next((v for v in videos if v.get("id") == video_id), None)
        if updated_video:
            assert updated_video.get("title") == "Updated Tutorial", "Title should be updated"
            assert updated_video.get("category") == "pos", "Category should be updated"
            print("SUCCESS: Video update verified via GET")
    
    def test_delete_video(self, auth_headers):
        """DELETE /api/videos/{id} - delete test video"""
        video_id = getattr(self.__class__, 'test_video_id', None)
        if not video_id:
            pytest.skip("No video_id available")
        
        response = requests.delete(
            f"{BASE_URL}/api/videos/{video_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Delete video failed: {response.text}"
        print(f"SUCCESS: Video {video_id} deleted")
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/videos", headers=auth_headers)
        videos = get_response.json()
        found = any(v.get("id") == video_id for v in videos)
        assert not found, "Deleted video should not appear in list"
        print("SUCCESS: Video deletion verified - video no longer in list")


class TestTrialTenants:
    """Trial tenant creation and management"""
    
    @pytest.fixture(scope='class')
    def admin_token(self):
        """Login as super admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json().get("token")
    
    @pytest.fixture(scope='class')
    def auth_headers(self, admin_token):
        return {"Authorization": f"Bearer {admin_token}"}
    
    def test_get_tenants_initially(self, auth_headers):
        """GET /api/tenants - list existing tenants"""
        response = requests.get(f"{BASE_URL}/api/tenants", headers=auth_headers)
        assert response.status_code == 200, f"GET tenants failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Tenants response should be a list"
        print(f"SUCCESS: GET /api/tenants returned {len(data)} tenants")
        self.__class__.initial_tenant_count = len(data)
    
    def test_create_trial_tenant(self, auth_headers):
        """POST /api/tenants with is_trial=true - create trial tenant"""
        tenant_data = {
            "name": "TEST_TrialBusiness",
            "contact_name": "Test Contact",
            "contact_phone": "123456789",
            "plan": "basic",
            "max_users": 5,
            "max_stores": 3,
            "admin_username": "trialadmin",
            "admin_password": "trial123",
            "is_trial": True,
            "trial_days": 7
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tenants",
            headers=auth_headers,
            json=tenant_data
        )
        assert response.status_code == 200, f"Create trial tenant failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Response should have tenant id"
        assert data.get("is_trial") == True, "is_trial should be True"
        assert data.get("trial_days") == 7, "trial_days should be 7"
        assert "trial_expires_at" in data, "Should have trial_expires_at"
        assert data.get("admin_username") == "trialadmin", "admin_username should match"
        
        # Verify trial_expires_at is ~7 days from now
        if data.get("trial_expires_at"):
            expires = datetime.fromisoformat(data["trial_expires_at"].replace("Z", "+00:00"))
            days_until_expiry = (expires - datetime.now().replace(tzinfo=expires.tzinfo)).days
            assert 6 <= days_until_expiry <= 8, f"Trial should expire in ~7 days, got {days_until_expiry}"
        
        print(f"SUCCESS: Trial tenant created with id={data['id']}, expires_at={data.get('trial_expires_at')}")
        self.__class__.test_tenant_id = data["id"]
        return data
    
    def test_get_tenants_shows_trial_info(self, auth_headers):
        """GET /api/tenants - verify trial info in response"""
        response = requests.get(f"{BASE_URL}/api/tenants", headers=auth_headers)
        assert response.status_code == 200
        tenants = response.json()
        
        tenant_id = getattr(self.__class__, 'test_tenant_id', None)
        if not tenant_id:
            pytest.skip("No test_tenant_id available")
        
        # Find our trial tenant
        trial_tenant = next((t for t in tenants if t.get("id") == tenant_id), None)
        assert trial_tenant is not None, f"Trial tenant {tenant_id} should be in list"
        
        # Verify trial fields
        assert trial_tenant.get("is_trial") == True, "is_trial should be True"
        assert "trial_expired" in trial_tenant, "Should have trial_expired field"
        assert "trial_days_left" in trial_tenant, "Should have trial_days_left field"
        assert trial_tenant.get("trial_expired") == False, "New trial should not be expired"
        assert trial_tenant.get("trial_days_left") >= 6, f"Should have ~7 days left, got {trial_tenant.get('trial_days_left')}"
        
        print(f"SUCCESS: Trial tenant shows trial_expired={trial_tenant.get('trial_expired')}, trial_days_left={trial_tenant.get('trial_days_left')}")
    
    def test_create_non_trial_tenant(self, auth_headers):
        """POST /api/tenants with is_trial=false - create regular tenant"""
        tenant_data = {
            "name": "TEST_RegularBusiness",
            "contact_name": "Regular Contact",
            "contact_phone": "987654321",
            "plan": "pro",
            "max_users": 15,
            "max_stores": 10,
            "admin_username": "regularadmin",
            "admin_password": "regular123",
            "is_trial": False,
            "trial_days": 0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tenants",
            headers=auth_headers,
            json=tenant_data
        )
        assert response.status_code == 200, f"Create non-trial tenant failed: {response.text}"
        data = response.json()
        
        assert data.get("is_trial") == False, "is_trial should be False"
        assert data.get("trial_days") == 0 or data.get("trial_days") is None or not data.get("trial_expires_at"), "Non-trial should have no trial expiry"
        
        print(f"SUCCESS: Non-trial tenant created with id={data['id']}")
        self.__class__.non_trial_tenant_id = data["id"]


class TestHealthAndBasics:
    """Basic API health checks"""
    
    def test_api_health(self):
        """Check API is responding"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        print("SUCCESS: /api/health returns 200")
    
    def test_admin_login(self):
        """Verify admin login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Response should have token"
        assert "user" in data, "Response should have user"
        print(f"SUCCESS: Admin login successful, role={data['user'].get('role')}")


class TestVideoRequiresAdmin:
    """Verify video endpoints require admin role"""
    
    def test_video_upload_requires_auth(self):
        """POST /api/videos/upload without auth should fail"""
        test_content = b'\x00\x00\x00\x18ftypmp42'
        files = {'file': ('test.mp4', test_content, 'video/mp4')}
        response = requests.post(f"{BASE_URL}/api/videos/upload", files=files)
        # Should return 401 (no auth) or 403 (forbidden)
        assert response.status_code in [401, 403, 422], f"Should require auth, got {response.status_code}"
        print(f"SUCCESS: Video upload without auth returns {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
