from __future__ import annotations

import hashlib
from typing import Callable

from fastapi import Request


class IdempotencyMiddleware:
    def __init__(self, app, header_name: str = "Idempotency-Key") -> None:
        self.app = app
        self.header_name = header_name
        self.cache: dict[str, tuple[int, bytes, list[tuple[bytes, bytes]]]] = {}

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        request = Request(scope, receive)
        key = request.headers.get(self.header_name)
        if not key:
            await self.app(scope, receive, send)
            return
        fingerprint = hashlib.sha256((request.url.path + "|" + key).encode()).hexdigest()
        if fingerprint in self.cache:
            status, body, headers = self.cache[fingerprint]

            async def responder(send_callable: Callable):
                await send_callable(
                    {"type": "http.response.start", "status": status, "headers": headers}
                )
                await send_callable(
                    {"type": "http.response.body", "body": body, "more_body": False}
                )

            await responder(send)
            return

        captured: dict[str, object] = {}

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                captured["status"] = message["status"]
                captured["headers"] = message.get("headers", [])
            if message["type"] == "http.response.body":
                captured["body"] = message.get("body", b"")
            await send(message)

        await self.app(scope, receive, send_wrapper)
        if "status" in captured and "body" in captured:
            self.cache[fingerprint] = (
                int(captured["status"]),
                bytes(captured["body"]),
                list(captured.get("headers", [])),
            )
