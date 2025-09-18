from __future__ import annotations

import time

import requests

from ...config.settings import settings
from .base import LLMMessage, LLMResponse


class OllamaProvider:
    def __init__(self, host: str | None = None) -> None:
        self.host = host or settings.ollama_host or "http://localhost:11434"

    def generate(
        self,
        model: str,
        messages: list[LLMMessage],
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> LLMResponse:
        url = f"{self.host}/api/chat"
        payload = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "options": {
                "temperature": temperature,
                **({"num_predict": max_tokens} if max_tokens else {}),
            },
            "stream": False,
        }
        t0 = time.time()
        r = requests.post(url, json=payload, timeout=60)
        r.raise_for_status()
        data = r.json()
        content = data.get("message", {}).get("content", "")
        latency_ms = int((time.time() - t0) * 1000)
        return LLMResponse(model_id=model, content=content, latency_ms=latency_ms)
