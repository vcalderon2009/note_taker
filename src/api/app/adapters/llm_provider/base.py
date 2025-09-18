from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, Sequence


@dataclass
class LLMMessage:
    role: str  # user | system | assistant
    content: str


@dataclass
class LLMResponse:
    model_id: str
    content: str
    latency_ms: int | None = None


class LLMProvider(Protocol):
    def generate(
        self,
        model: str,
        messages: Sequence[LLMMessage],
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> LLMResponse:  # noqa: D401
        """Generate a completion given messages."""
        ...
