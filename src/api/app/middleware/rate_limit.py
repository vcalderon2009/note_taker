from __future__ import annotations

import time
from collections import deque
from typing import Deque

from fastapi import Request


class SimpleRateLimitMiddleware:
    def __init__(
        self, app, limit: int = 10, window_seconds: int = 60, header_name: str = "X-User-Id"
    ) -> None:
        self.app = app
        self.limit = limit
        self.window = window_seconds
        self.header_name = header_name
        self._buckets: dict[str, Deque[float]] = {}

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        request = Request(scope, receive)
        # Only rate-limit message posts for now
        if request.method == "POST" and request.url.path.endswith("/messages"):
            user_key = request.headers.get(self.header_name) or request.client.host or "anon"
            now = time.time()
            bucket = self._buckets.setdefault(user_key, deque())
            # Evict old
            cutoff = now - self.window
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            if len(bucket) >= self.limit:
                await send(
                    {
                        "type": "http.response.start",
                        "status": 429,
                        "headers": [(b"content-type", b"application/json")],
                    }
                )
                await send(
                    {
                        "type": "http.response.body",
                        "body": b'{"detail":"rate limit exceeded"}',
                        "more_body": False,
                    }
                )
                return
            bucket.append(now)
        await self.app(scope, receive, send)
