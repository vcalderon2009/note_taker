from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List

from ..db import get_db
from ..models.orm import Conversation, Message, User
from ..models.schemas import ConversationCreate, ConversationOut, MessageOut

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.options("")
async def conversations_options():
    """Handle CORS preflight requests for conversations endpoint."""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )


@router.post("", response_model=ConversationOut)
async def create_conversation(
    conversation: ConversationCreate,
    db: Session = Depends(get_db)
):
    """Create a new conversation."""
    # For now, use user_id = 1 (default user)
    # In the future, this would come from authentication
    user_id = 1
    
    # Ensure user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_conversation = Conversation(
        user_id=user_id,
        title=conversation.title or "New Conversation"
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    
    return db_conversation


@router.get("", response_model=List[ConversationOut])
async def list_conversations(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """List all conversations for the current user."""
    # For now, use user_id = 1 (default user)
    user_id = 1
    
    conversations = db.query(Conversation)\
        .filter(Conversation.user_id == user_id)\
        .order_by(Conversation.created_at.desc())\
        .offset(offset)\
        .limit(limit)\
        .all()
    
    return conversations


@router.get("/{conversation_id}", response_model=ConversationOut)
async def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific conversation."""
    conversation = db.query(Conversation)\
        .filter(Conversation.id == conversation_id)\
        .first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversation


@router.get("/{conversation_id}/messages", response_model=List[MessageOut])
async def get_conversation_messages(
    conversation_id: int,
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


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    """Delete a conversation and all its messages."""
    conversation = db.query(Conversation)\
        .filter(Conversation.id == conversation_id)\
        .first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Delete all messages first
    db.query(Message)\
        .filter(Message.conversation_id == conversation_id)\
        .delete()
    
    # Delete the conversation
    db.delete(conversation)
    db.commit()

    # Ensure at least one conversation exists for the user
    user_id = conversation.user_id
    remaining = db.query(Conversation).filter(Conversation.user_id == user_id).count()
    if remaining == 0:
        new_conv = Conversation(user_id=user_id, title="New Conversation")
        db.add(new_conv)
        db.commit()
        db.refresh(new_conv)
        return {"message": "Conversation deleted successfully", "new_conversation_id": new_conv.id}

    return {"message": "Conversation deleted successfully"}
