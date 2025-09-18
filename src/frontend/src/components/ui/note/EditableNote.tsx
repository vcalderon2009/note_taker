'use client';

import * as React from 'react';
import { Edit3, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button/Button';
import { Input } from '@/components/ui/input/Input';
import { cn } from '@/lib/utils';
import type { Note } from '@/types/api';

interface EditableNoteProps {
  note: Note;
  onSave: (noteId: number, updates: { title?: string; body?: string }) => void;
  className?: string;
}

export function EditableNote({ note, onSave, className }: EditableNoteProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [title, setTitle] = React.useState(note.title);
  const [body, setBody] = React.useState(note.body);

  const handleSave = () => {
    const updates: { title?: string; body?: string } = {};
    
    if (title !== note.title) {
      updates.title = title;
    }
    
    if (body !== note.body) {
      updates.body = body;
    }

    if (Object.keys(updates).length > 0) {
      onSave(note.id, updates);
    }
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(note.title);
    setBody(note.body);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Title Section */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="font-medium"
            placeholder="Note title..."
            autoFocus
          />
        ) : (
          <h4 className="font-medium flex-1">{note.title}</h4>
        )}
        
        {!isEditing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit3 className="h-4 w-4" />
            <span className="sr-only">Edit note</span>
          </Button>
        )}
      </div>

      {/* Body Section */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full min-h-[100px] p-3 rounded-lg border border-border/50 bg-card/50",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
              "resize-vertical text-sm"
            )}
            placeholder="Note content..."
          />
          
          {/* Edit Actions */}
          <div className="flex items-center gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-8 px-3"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="h-8 px-3"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Press Ctrl+Enter to save, Escape to cancel
          </p>
        </div>
      ) : (
        <div className="group">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {note.body}
          </p>
        </div>
      )}

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2">
          {note.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
