from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.orm import Task
from ..models.schemas import TaskCreate, TaskOut

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskOut])
def list_tasks(db: Session = Depends(get_db)):
    rows = db.query(Task).order_by(Task.created_at.desc()).all()
    return rows


@router.post("", response_model=TaskOut)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    row = Task(
        user_id=1,
        title=payload.title,
        description=payload.description,
        due_at=payload.due_at,
        status=payload.status,
        priority=payload.priority,
    )
    db.add(row)
    db.flush()
    db.refresh(row)
    return row
