"""
Video Narration API Tests - Iteration 26
Testing the new voice-over narration feature for video tutorials.
Endpoints:
- GET /api/videos - List videos
- POST /api/videos/generate-tutorials - Trigger narrated video generation (admin only)
- PUT /api/videos/{video_id} - Update video title/category
- DELETE /api/videos/{video_id} - Delete a video
- POST /api/videos/upload - Upload video file
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestVideoNarrationAPIs:
    """Video CRUD and narration generation tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Admin login
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json().get("token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
    def test_01_get_videos_list(self):
        """GET /api/videos - should return list of videos"""
        response = self.session.get(f"{BASE_URL}/api/videos")
        assert response.status_code == 200, f"Failed to get videos: {response.text}"
        
        videos = response.json()
        assert isinstance(videos, list), "Response should be a list"
        print(f"Found {len(videos)} videos")
        
        # Verify video structure if any exist
        if videos:
            video = videos[0]
            assert "id" in video, "Video should have id"
            assert "title" in video, "Video should have title"
            assert "url" in video, "Video should have url"
            assert "category" in video, "Video should have category"
            print(f"First video: {video.get('title')}")
            
    def test_02_generate_tutorials_endpoint(self):
        """POST /api/videos/generate-tutorials - should trigger background generation"""
        response = self.session.post(f"{BASE_URL}/api/videos/generate-tutorials")
        assert response.status_code == 200, f"Generate tutorials failed: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should have message"
        # Check for Chinese message about voice narration
        assert "语音" in data["message"] or "正在生成" in data["message"], \
            f"Response should mention narration generation: {data['message']}"
        print(f"Generate response: {data['message']}")
        
    def test_03_generate_tutorials_requires_admin(self):
        """POST /api/videos/generate-tutorials - should reject non-admin users"""
        # Create new session without admin privileges
        new_session = requests.Session()
        response = new_session.post(f"{BASE_URL}/api/videos/generate-tutorials")
        # Should fail with 401 (no auth) or 403 (no permission)
        assert response.status_code in [401, 403], \
            f"Endpoint should require authentication: {response.status_code}"
        
    def test_04_update_video(self):
        """PUT /api/videos/{video_id} - should update video title/category"""
        # First, get existing videos
        response = self.session.get(f"{BASE_URL}/api/videos")
        assert response.status_code == 200
        videos = response.json()
        
        if not videos:
            pytest.skip("No videos available to update")
            
        video_id = videos[0]["id"]
        original_title = videos[0]["title"]
        
        # Update video
        new_title = f"TEST_{original_title}_updated"
        response = self.session.put(f"{BASE_URL}/api/videos/{video_id}", json={
            "title": new_title,
            "category": "general"
        })
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        # Verify update via GET
        response = self.session.get(f"{BASE_URL}/api/videos")
        updated_video = next((v for v in response.json() if v["id"] == video_id), None)
        assert updated_video is not None
        assert updated_video["title"] == new_title, "Title should be updated"
        
        # Restore original title
        self.session.put(f"{BASE_URL}/api/videos/{video_id}", json={"title": original_title})
        print(f"Updated video {video_id} title successfully")
        
    def test_05_delete_video_nonexistent(self):
        """DELETE /api/videos/{video_id} - should return 404 for non-existent video"""
        response = self.session.delete(f"{BASE_URL}/api/videos/nonexistent123")
        assert response.status_code == 404, f"Should return 404: {response.status_code}"
        
    def test_06_upload_video_invalid_format(self):
        """POST /api/videos/upload - should reject invalid file formats"""
        # Create a dummy text file
        files = {"file": ("test.txt", b"not a video", "text/plain")}
        headers = {"Authorization": self.session.headers["Authorization"]}
        
        response = requests.post(f"{BASE_URL}/api/videos/upload", files=files, headers=headers)
        assert response.status_code == 400, f"Should reject invalid format: {response.status_code}"
        
    def test_07_video_has_correct_structure(self):
        """Verify video documents have all required fields"""
        response = self.session.get(f"{BASE_URL}/api/videos")
        assert response.status_code == 200
        videos = response.json()
        
        if not videos:
            pytest.skip("No videos to verify structure")
            
        for video in videos[:5]:  # Check first 5
            assert "id" in video
            assert "title" in video
            assert "url" in video
            assert "category" in video
            # URL should start with /api/uploads/videos/
            assert video["url"].startswith("/api/uploads/videos/"), \
                f"Video URL malformed: {video['url']}"
        print(f"Verified structure of {min(5, len(videos))} videos")


class TestNarrationScriptsExist:
    """Verify narration scripts are properly configured"""
    
    def test_narration_scripts_import(self):
        """Verify narration scripts can be imported"""
        import sys
        sys.path.insert(0, '/app/backend')
        
        try:
            from narration_scripts import NARRATION_SCRIPTS
            assert NARRATION_SCRIPTS is not None
            assert isinstance(NARRATION_SCRIPTS, dict)
            
            expected_tutorials = [
                "pos_tutorial", "products_tutorial", "inventory_tutorial",
                "sales_tutorial", "customers_tutorial", "reports_tutorial",
                "settings_tutorial"
            ]
            
            for tutorial in expected_tutorials:
                assert tutorial in NARRATION_SCRIPTS, f"Missing tutorial: {tutorial}"
                script = NARRATION_SCRIPTS[tutorial]
                assert "title" in script, f"{tutorial} missing title"
                assert "segments" in script, f"{tutorial} missing segments"
                assert len(script["segments"]) > 0, f"{tutorial} has no segments"
                
            print(f"Verified {len(expected_tutorials)} narration scripts")
        except ImportError as e:
            pytest.fail(f"Could not import narration_scripts: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
