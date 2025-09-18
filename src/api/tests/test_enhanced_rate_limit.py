import time
import pytest


def test_enhanced_rate_limit_messages(client):
    """Test rate limiting on message endpoint with proper headers."""
    headers = {"X-User-Id": "test_user"}
    
    # Send requests up to the limit (10 for messages)
    for i in range(10):
        response = client.post(
            "/api/conversations/1/messages", 
            json={"text": f"test message {i}"}, 
            headers=headers
        )
        assert response.status_code == 200
        
        # Check rate limit headers are present
        assert "x-ratelimit-limit" in response.headers
        assert "x-ratelimit-remaining" in response.headers
        assert "x-ratelimit-reset" in response.headers
        assert response.headers["x-ratelimit-limit"] == "10"
    
    # The 11th request should be rate limited
    response = client.post(
        "/api/conversations/1/messages", 
        json={"text": "rate limited message"}, 
        headers=headers
    )
    assert response.status_code == 429
    
    # Check rate limit response content
    data = response.json()
    assert "detail" in data
    assert "limit" in data
    assert "retry_after" in data
    assert data["limit"] == 10
    
    # Check rate limit headers in 429 response
    assert "x-ratelimit-limit" in response.headers
    assert "x-ratelimit-remaining" in response.headers
    assert response.headers["x-ratelimit-remaining"] == "0"
    assert "retry-after" in response.headers


def test_enhanced_rate_limit_different_endpoints(client):
    """Test that different endpoints have different rate limits."""
    headers = {"X-User-Id": "test_user_2"}
    
    # Messages have limit of 10
    for i in range(10):
        response = client.post(
            "/api/conversations/1/messages", 
            json={"text": f"message {i}"}, 
            headers=headers
        )
        assert response.status_code == 200
    
    # 11th message should be rate limited
    response = client.post(
        "/api/conversations/1/messages", 
        json={"text": "should be limited"}, 
        headers=headers
    )
    assert response.status_code == 429
    
    # But notes have limit of 20, so they should still work
    response = client.post(
        "/api/notes", 
        json={"title": "Test Note", "body": "Should work"}, 
        headers=headers
    )
    assert response.status_code == 200
    assert response.headers["x-ratelimit-limit"] == "20"


def test_enhanced_rate_limit_different_users(client):
    """Test that different users have separate rate limits."""
    # User 1 hits the limit
    headers_user1 = {"X-User-Id": "user_1"}
    for i in range(10):
        response = client.post(
            "/api/conversations/1/messages", 
            json={"text": f"message {i}"}, 
            headers=headers_user1
        )
        assert response.status_code == 200
    
    # User 1's 11th request is rate limited
    response = client.post(
        "/api/conversations/1/messages", 
        json={"text": "should be limited"}, 
        headers=headers_user1
    )
    assert response.status_code == 429
    
    # But user 2 should still be able to make requests
    headers_user2 = {"X-User-Id": "user_2"}
    response = client.post(
        "/api/conversations/1/messages", 
        json={"text": "should work"}, 
        headers=headers_user2
    )
    assert response.status_code == 200
    assert response.headers["x-ratelimit-remaining"] == "9"  # 9 remaining for user 2


def test_enhanced_rate_limit_headers_format(client):
    """Test that rate limit headers are properly formatted."""
    headers = {"X-User-Id": "header_test_user"}
    
    response = client.post(
        "/api/conversations/1/messages", 
        json={"text": "test message"}, 
        headers=headers
    )
    assert response.status_code == 200
    
    # Check header format and values
    assert response.headers["x-ratelimit-limit"] == "10"
    assert response.headers["x-ratelimit-remaining"] == "9"
    assert response.headers["x-ratelimit-window"] == "60"
    
    # Reset time should be a valid timestamp
    reset_time = int(response.headers["x-ratelimit-reset"])
    current_time = int(time.time())
    assert reset_time > current_time
    assert reset_time <= current_time + 60  # Should be within the window


def test_enhanced_rate_limit_no_user_header(client):
    """Test rate limiting works without explicit user header (falls back to IP/anonymous)."""
    # No X-User-Id header provided
    for i in range(10):
        response = client.post(
            "/api/conversations/1/messages", 
            json={"text": f"anonymous message {i}"}
        )
        assert response.status_code == 200
    
    # 11th request should be rate limited
    response = client.post(
        "/api/conversations/1/messages", 
        json={"text": "should be limited"}
    )
    assert response.status_code == 429


def test_enhanced_rate_limit_notes_higher_limit(client):
    """Test that notes endpoint has higher limit than messages."""
    headers = {"X-User-Id": "notes_test_user"}
    
    # Notes should allow 20 requests (vs 10 for messages)
    for i in range(20):
        response = client.post(
            "/api/notes", 
            json={"title": f"Note {i}", "body": f"Content {i}"}, 
            headers=headers
        )
        assert response.status_code == 200
        assert response.headers["x-ratelimit-limit"] == "20"
    
    # 21st request should be rate limited
    response = client.post(
        "/api/notes", 
        json={"title": "Should be limited", "body": "Content"}, 
        headers=headers
    )
    assert response.status_code == 429
    assert response.json()["limit"] == 20
