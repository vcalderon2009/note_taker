from __future__ import annotations

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.orm import Category
from ..models.schemas import CategoryCreate, CategoryOut, CategoryUpdate

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    """Get all categories for the current user."""
    categories = db.query(Category).filter(Category.user_id == 1).order_by(Category.name).all()
    return categories


@router.post("", response_model=CategoryOut)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category."""
    # Check if category name already exists for this user
    existing = db.query(Category).filter(
        Category.user_id == 1, 
        Category.name == payload.name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
    
    category = Category(
        user_id=1,
        name=payload.name,
        description=payload.description,
        color=payload.color,
        icon=payload.icon
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/{category_id}", response_model=CategoryOut)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get a specific category."""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == 1
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return category


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)):
    """Update a category."""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == 1
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if new name conflicts with existing category
    if payload.name and payload.name != category.name:
        existing = db.query(Category).filter(
            Category.user_id == 1,
            Category.name == payload.name,
            Category.id != category_id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Category name already exists")
    
    # Update fields that are provided
    if payload.name is not None:
        category.name = payload.name
    if payload.description is not None:
        category.description = payload.description
    if payload.color is not None:
        category.color = payload.color
    if payload.icon is not None:
        category.icon = payload.icon
    
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Delete a category. This will set category_id to NULL for all associated notes and tasks."""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == 1
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Update all notes and tasks to remove the category reference
    from ..models.orm import Note, Task
    
    db.query(Note).filter(Note.category_id == category_id).update({"category_id": None})
    db.query(Task).filter(Task.category_id == category_id).update({"category_id": None})
    
    # Delete the category
    db.delete(category)
    db.commit()
    
    return {"message": "Category deleted successfully"}


@router.get("/{category_id}/stats")
def get_category_stats(category_id: int, db: Session = Depends(get_db)):
    """Get statistics for a category (number of notes and tasks)."""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == 1
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    from ..models.orm import Note, Task
    
    notes_count = db.query(Note).filter(Note.category_id == category_id).count()
    tasks_count = db.query(Task).filter(Task.category_id == category_id).count()
    completed_tasks = db.query(Task).filter(
        Task.category_id == category_id,
        Task.status == "completed"
    ).count()
    
    return {
        "category_id": category_id,
        "notes_count": notes_count,
        "tasks_count": tasks_count,
        "completed_tasks": completed_tasks,
        "pending_tasks": tasks_count - completed_tasks
    }
