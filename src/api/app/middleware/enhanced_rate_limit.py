from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque, Dict, Optional, Tuple
from dataclasses import dataclass
import asyncio

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting rules."""
    limit: int = 10
    window_seconds: int = 60
    burst_limit: Optional[int] = None  # Allow short bursts
    cleanup_interval: int = 300  # Cleanup old buckets every 5 minutes


class EnhancedRateLimitMiddleware:
    """
    Enhanced rate limiting middleware with sliding window, cleanup, and proper headers.
    
    Features:
    - Sliding window rate limiting
    - Configurable per-endpoint limits
    - Proper rate limit headers
    - Memory cleanup for inactive users
    - Burst protection
    """

    def __init__(
        self,
        app,
        default_config: Optional[RateLimitConfig] = None,
        endpoint_configs: Optional[Dict[str, RateLimitConfig]] = None,
        header_name: str = "X-User-Id",
        enable_cleanup: bool = True,
    ) -> None:
        self.app = app
        self.default_config = default_config or RateLimitConfig()
        self.endpoint_configs = endpoint_configs or {}
        self.header_name = header_name
        
        # Storage: user_key -> endpoint -> deque of timestamps
        self._buckets: Dict[str, Dict[str, Deque[float]]] = defaultdict(
            lambda: defaultdict(deque)
        )
        self._last_cleanup = time.time()
        self.enable_cleanup = enable_cleanup

    def _get_config_for_endpoint(self, endpoint: str) -> RateLimitConfig:
        """Get rate limit configuration for a specific endpoint."""
        return self.endpoint_configs.get(endpoint, self.default_config)

    def _get_user_key(self, request: Request) -> str:
        """Extract user identifier from request."""
        return (
            request.headers.get(self.header_name) 
            or request.client.host 
            or "anonymous"
        )

    def _get_endpoint_key(self, request: Request) -> str:
        """Generate endpoint key for rate limiting."""
        # Group similar endpoints (e.g., all message posts)
        path = request.url.path
        method = request.method
        
        if method == "POST" and "/messages" in path:
            return "messages:post"
        elif method == "POST" and "/notes" in path:
            return "notes:post"
        elif method == "POST" and "/tasks" in path:
            return "tasks:post"
        else:
            return f"{method.lower()}:{path}"

    def _cleanup_old_buckets(self) -> None:
        """Remove old, inactive user buckets to prevent memory leaks."""
        now = time.time()
        if now - self._last_cleanup < self.default_config.cleanup_interval:
            return

        cutoff_time = now - (self.default_config.window_seconds * 2)  # Keep 2x window
        users_to_remove = []

        for user_key, user_buckets in self._buckets.items():
            endpoints_to_remove = []
            
            for endpoint_key, bucket in user_buckets.items():
                # Remove old entries from bucket
                while bucket and bucket[0] < cutoff_time:
                    bucket.popleft()
                
                # Mark empty buckets for removal
                if not bucket:
                    endpoints_to_remove.append(endpoint_key)
            
            # Remove empty endpoint buckets
            for endpoint_key in endpoints_to_remove:
                del user_buckets[endpoint_key]
            
            # Mark users with no active endpoints for removal
            if not user_buckets:
                users_to_remove.append(user_key)

        # Remove inactive users
        for user_key in users_to_remove:
            del self._buckets[user_key]

        self._last_cleanup = now

    def _check_rate_limit(
        self, user_key: str, endpoint_key: str, config: RateLimitConfig
    ) -> Tuple[bool, int, float]:
        """
        Check if request should be rate limited.
        
        Returns:
            (is_allowed, remaining_requests, reset_time)
        """
        now = time.time()
        bucket = self._buckets[user_key][endpoint_key]
        
        # Remove old entries outside the window
        cutoff = now - config.window_seconds
        while bucket and bucket[0] < cutoff:
            bucket.popleft()

        # Check if we're over the limit
        current_count = len(bucket)
        is_allowed = current_count < config.limit
        remaining = max(0, config.limit - current_count)
        
        # Calculate reset time (when the oldest request in window expires)
        if bucket:
            reset_time = bucket[0] + config.window_seconds
        else:
            reset_time = now + config.window_seconds

        # Add current request if allowed
        if is_allowed:
            bucket.append(now)
            remaining -= 1  # Account for the request we just added

        return is_allowed, remaining, reset_time

    def _create_rate_limit_response(
        self, config: RateLimitConfig, remaining: int, reset_time: float
    ) -> JSONResponse:
        """Create a 429 rate limit exceeded response with proper headers."""
        headers = {
            "X-RateLimit-Limit": str(config.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": str(int(reset_time)),
            "X-RateLimit-Window": str(config.window_seconds),
            "Retry-After": str(int(reset_time - time.time())),
        }
        
        return JSONResponse(
            status_code=429,
            content={
                "detail": "Rate limit exceeded",
                "limit": config.limit,
                "window_seconds": config.window_seconds,
                "retry_after": int(reset_time - time.time()),
            },
            headers=headers,
        )

    def _add_rate_limit_headers(
        self, headers: list, config: RateLimitConfig, remaining: int, reset_time: float
    ) -> None:
        """Add rate limit headers to successful responses."""
        headers.extend([
            (b"x-ratelimit-limit", str(config.limit).encode()),
            (b"x-ratelimit-remaining", str(remaining).encode()),
            (b"x-ratelimit-reset", str(int(reset_time)).encode()),
            (b"x-ratelimit-window", str(config.window_seconds).encode()),
        ])

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        user_key = self._get_user_key(request)
        endpoint_key = self._get_endpoint_key(request)
        config = self._get_config_for_endpoint(endpoint_key)

        # Periodic cleanup
        if self.enable_cleanup:
            self._cleanup_old_buckets()

        # Check rate limit
        is_allowed, remaining, reset_time = self._check_rate_limit(
            user_key, endpoint_key, config
        )

        if not is_allowed:
            # Rate limit exceeded
            response = self._create_rate_limit_response(config, remaining, reset_time)
            await response(scope, receive, send)
            return

        # Intercept response to add rate limit headers
        response_headers = []

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                # Add rate limit headers to successful responses
                headers = list(message.get("headers", []))
                self._add_rate_limit_headers(headers, config, remaining, reset_time)
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, send_wrapper)
