from __future__ import annotations

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.orm import Note
from ..models.schemas import NoteCreate, NoteOut

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("", response_model=list[NoteOut])
def list_notes(db: Session = Depends(get_db)):
    rows = db.query(Note).order_by(Note.created_at.desc()).all()
    return rows


@router.post("", response_model=NoteOut)
def create_note(payload: NoteCreate, db: Session = Depends(get_db)):
    row = Note(user_id=1, title=payload.title, body=payload.body, tags=payload.tags)
    db.add(row)
    db.flush()
    db.refresh(row)
    return row


@router.patch("/{note_id}", response_model=NoteOut)
def update_note(note_id: int, updates: Dict[str, Any], db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Update fields that are provided
    if "title" in updates and updates["title"] is not None:
        note.title = updates["title"]
    if "body" in updates and updates["body"] is not None:
        note.body = updates["body"]
    if "tags" in updates:
        note.tags = updates["tags"]
    
    db.commit()
    db.refresh(note)
    return note
