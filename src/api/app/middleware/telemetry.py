from __future__ import annotations

import uuid
import time
from typing import Dict, Any

from fastapi import Request
from ..telemetry.logger import telemetry


class TelemetryMiddleware:
    """
    Middleware to automatically track all HTTP requests and responses.
    
    Features:
    - Automatic request/response logging
    - Request ID generation and propagation
    - Performance tracking
    - Error monitoring
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
            
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        request = Request(scope, receive)
        
        # Extract user ID from headers or fallback to client IP
        user_id = (
            request.headers.get("X-User-Id") 
            or request.headers.get("Authorization", "").replace("Bearer ", "")[:20]
            or request.client.host if request.client else "unknown"
        )
        
        # Start request tracking
        context = telemetry.log_request_start(request, request_id, user_id)
        
        # Add request ID to request state for use in routes
        request.state.request_id = request_id
        request.state.user_id = user_id
        
        # Intercept response to add headers
        response_captured = {}
        
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                # Capture response info and add telemetry headers
                response_captured["status_code"] = message["status"]
                headers = list(message.get("headers", []))
                
                # Add telemetry headers
                headers.extend([
                    (b"x-request-id", request_id.encode()),
                    (b"x-response-time", str(int((time.time() - context["start_time"]) * 1000)).encode()),
                ])
                
                message = {**message, "headers": headers}
            
            await send(message)
        
        try:
            # Process request through the middleware chain
            await self.app(scope, receive, send_wrapper)
            
            # Create a mock response object for logging
            class MockResponse:
                def __init__(self, status_code):
                    self.status_code = status_code
                    self.body = b""  # We don't have access to the body here
            
            mock_response = MockResponse(response_captured.get("status_code", 200))
            telemetry.log_request_end(context, mock_response)
            
        except Exception as error:
            # Log error
            class MockErrorResponse:
                def __init__(self):
                    self.status_code = 500
                    self.body = b""
            
            mock_response = MockErrorResponse()
            telemetry.log_request_end(context, mock_response, error)
            telemetry.log_error(error, request_id=request_id, user_id=user_id)
            
            # Re-raise the exception to let FastAPI handle it
            raise
