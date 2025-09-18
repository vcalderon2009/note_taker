from __future__ import annotations

from fastapi import APIRouter, Depends, Path, Header, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from ..db import get_db
from ..models.schemas import MessageIn, MessageOut, OrchestratorResult
from ..models.orm import Conversation, Message
from ..services.orchestrator_service import OrchestratorService

router = APIRouter(prefix="/api/conversations/{conversation_id}/messages", tags=["messages"])


@router.get("", response_model=List[MessageOut])
async def list_messages(
    conversation_id: int = Path(...),
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get messages for a specific conversation."""
    # Verify conversation exists
    conversation = db.query(Conversation)\
        .filter(Conversation.id == conversation_id)\
        .first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = db.query(Message)\
        .filter(Message.conversation_id == conversation_id)\
        .order_by(Message.created_at.asc())\
        .offset(offset)\
        .limit(limit)\
        .all()
    
    return messages


@router.post("", response_model=OrchestratorResult)
async def post_message(
    payload: MessageIn,
    request: Request,
    conversation_id: int = Path(...),
    db: Session = Depends(get_db),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key")
):
    """Send a message and get orchestrator response."""
    # Verify conversation exists
    conversation = db.query(Conversation)\
        .filter(Conversation.id == conversation_id)\
        .first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Initialize orchestrator service
    service = OrchestratorService()
    
    # Get request ID from telemetry middleware
    request_id = getattr(request.state, "request_id", None)
    
    # Handle the message with proper user context
    result = service.handle_message(
        db=db, 
        user_id=conversation.user_id, 
        conversation_id=conversation_id, 
        text=payload.text,
        request_id=request_id
    )
    
    return result
