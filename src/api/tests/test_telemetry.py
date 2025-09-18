import json
import pytest
from unittest.mock import patch, MagicMock


def test_telemetry_middleware_adds_request_id(client):
    """Test that telemetry middleware adds request ID and response time headers."""
    headers = {"X-User-Id": "telemetry_test_user"}
    
    response = client.get("/health", headers=headers)
    
    assert response.status_code == 200
    assert "x-request-id" in response.headers
    assert "x-response-time" in response.headers
    
    # Request ID should be a valid UUID-like string
    request_id = response.headers["x-request-id"]
    assert len(request_id) > 30  # UUID is 36 chars with hyphens
    
    # Response time should be a non-negative integer (could be 0 for very fast requests)
    response_time = int(response.headers["x-response-time"])
    assert response_time >= 0


def test_telemetry_logs_message_processing(client):
    """Test that telemetry logs are generated for message processing."""
    headers = {"X-User-Id": "telemetry_message_test_user"}
    
    with patch('app.services.orchestrator_service.telemetry.log_user_activity') as mock_log_activity, \
         patch('app.services.orchestrator_service.telemetry.log_orchestrator_result') as mock_log_result, \
         patch('app.services.orchestrator_service.telemetry.log_llm_call') as mock_log_llm:
        
        response = client.post(
            "/api/conversations/1/messages", 
            json={"text": "Test message for telemetry"}, 
            headers=headers
        )
        
        assert response.status_code == 200
        
        # Verify user activity was logged
        mock_log_activity.assert_called_once()
        activity_call = mock_log_activity.call_args
        assert activity_call[1]["action"] == "send_message"
        assert activity_call[1]["resource_type"] == "message"
        assert activity_call[1]["user_id"] == "1"  # User ID from conversation
        
        # Verify orchestrator result was logged
        mock_log_result.assert_called_once()
        result_call = mock_log_result.call_args
        assert result_call[1]["input_type"] in ["simple_message", "brain_dump"]
        assert result_call[1]["success"] is True
        assert result_call[1]["items_created"] >= 1
        
        # Verify LLM call was logged
        mock_log_llm.assert_called_once()
        llm_call = mock_log_llm.call_args
        assert llm_call[1]["model"] == "test-model"
        assert llm_call[1]["provider"] == "ollama"
        assert llm_call[1]["success"] is True
        assert llm_call[1]["total_tokens"] > 0


def test_telemetry_logs_request_lifecycle(client):
    """Test that telemetry logs request start and end."""
    headers = {"X-User-Id": "telemetry_lifecycle_test_user"}
    
    with patch('app.middleware.telemetry.telemetry.log_request_start') as mock_log_start, \
         patch('app.middleware.telemetry.telemetry.log_request_end') as mock_log_end:
        
        response = client.get("/health", headers=headers)
        
        assert response.status_code == 200
        
        # Verify request start was logged
        mock_log_start.assert_called_once()
        start_call = mock_log_start.call_args
        assert start_call[0][0].method == "GET"  # First arg is the request
        assert start_call[0][2] == "telemetry_lifecycle_test_user"  # Third arg is user_id
        
        # Verify request end was logged
        mock_log_end.assert_called_once()
        end_call = mock_log_end.call_args
        # Should have context dict and response
        assert len(end_call[0]) >= 2
        assert end_call[1].get("error") is None  # No error for successful request


def test_telemetry_tracks_performance_metrics(client):
    """Test that performance metrics are tracked."""
    headers = {"X-User-Id": "telemetry_performance_test_user"}
    
    response = client.post(
        "/api/conversations/1/messages", 
        json={"text": "Performance test message"}, 
        headers=headers
    )
    
    assert response.status_code == 200
    
    # Check that response time header is present and reasonable
    response_time = int(response.headers.get("x-response-time", 0))
    assert 0 < response_time < 10000  # Should be between 0 and 10 seconds


def test_telemetry_handles_errors_gracefully(client):
    """Test that telemetry handles errors without breaking the request."""
    headers = {"X-User-Id": "telemetry_error_test_user"}
    
    # Test with invalid conversation ID
    response = client.post(
        "/api/conversations/999999/messages", 
        json={"text": "This should fail"}, 
        headers=headers
    )
    
    assert response.status_code == 404
    
    # Even for error responses, telemetry headers should be present
    assert "x-request-id" in response.headers
    assert "x-response-time" in response.headers


@pytest.mark.asyncio
async def test_telemetry_logger_formats_json():
    """Test that telemetry logger outputs structured JSON logs."""
    from app.telemetry.logger import TelemetryLogger
    
    # Mock the logger at the instance level
    with patch('app.telemetry.logger.structlog.get_logger') as mock_get_logger:
        mock_logger = MagicMock()
        mock_get_logger.return_value = mock_logger
        
        # Create logger after mocking
        logger = TelemetryLogger("test-service")
        
        # Test user activity logging
        logger.log_user_activity(
            user_id="test_user",
            action="test_action",
            resource_type="test_resource",
            metadata={"key": "value"}
        )
        
        # Verify structured logging call
        mock_logger.info.assert_called()
        call_args = mock_logger.info.call_args
        assert "User activity" in call_args[0]
        assert call_args[1]["event_type"] == "user_activity"
        assert call_args[1]["user_id"] == "test_user"
        assert call_args[1]["action"] == "test_action"


def test_telemetry_tracks_different_endpoints(client):
    """Test that telemetry tracks different endpoints with appropriate rate limits."""
    headers = {"X-User-Id": "telemetry_endpoints_test_user"}
    
    # Test health endpoint
    response = client.get("/health", headers=headers)
    assert response.status_code == 200
    assert "x-request-id" in response.headers
    
    # Test notes endpoint
    response = client.post("/api/notes", json={"title": "Test", "body": "Test"}, headers=headers)
    assert response.status_code == 200
    assert "x-request-id" in response.headers
    assert response.headers["x-ratelimit-limit"] == "20"  # Notes have 20/min limit
    
    # Test tasks endpoint
    response = client.post("/api/tasks", json={"title": "Test Task"}, headers=headers)
    assert response.status_code == 200
    assert "x-request-id" in response.headers
    assert response.headers["x-ratelimit-limit"] == "20"  # Tasks have 20/min limit
