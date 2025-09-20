from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    service: str = "api"
    port: int


class NoteCreate(BaseModel):
    title: str
    body: str
    tags: list[str] | None = None


class NoteUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    tags: list[str] | None = None
    category_id: int | None = None


class NoteOut(NoteCreate):
    id: int
    user_id: int
    conversation_id: int | None = None
    category_id: int | None = None
    created_at: datetime
    updated_at: datetime


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    due_at: datetime | None = None
    status: str = Field(default="todo")
    priority: int | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    due_at: datetime | None = None
    status: str | None = None
    priority: int | None = None
    category_id: int | None = None


class TaskOut(TaskCreate):
    id: int
    user_id: int
    conversation_id: int | None = None
    category_id: int | None = None
    created_at: datetime
    updated_at: datetime


class CategoryCreate(BaseModel):
    name: str
    description: str | None = None
    color: str | None = None  # Hex color code
    icon: str | None = None   # Icon name/emoji


class CategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    icon: str | None = None


class CategoryOut(CategoryCreate):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


class OrchestratorNoteResult(BaseModel):
    type: Literal["note"]
    note: NoteOut


class OrchestratorTaskResult(BaseModel):
    type: Literal["task"]
    task: TaskOut


class OrchestratorBrainDumpResult(BaseModel):
    type: Literal["brain_dump"]
    summary: str
    notes: list[NoteOut]
    tasks: list[TaskOut]
    total_items: int


OrchestratorResult = OrchestratorNoteResult | OrchestratorTaskResult | OrchestratorBrainDumpResult


class MessageIn(BaseModel):
    text: str


class MessageOut(BaseModel):
    id: int
    conversation_id: int
    role: Literal["user", "assistant", "system"]
    content: str
    tokens_in: int | None = None
    tokens_out: int | None = None
    latency_ms: int | None = None
    created_at: datetime


class ConversationCreate(BaseModel):
    title: str | None = None


class ConversationOut(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
