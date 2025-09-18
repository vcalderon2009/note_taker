'use client';

import * as React from 'react';
import { FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card/Card';
import { cn, formatRelativeTime, truncateText } from '@/lib/utils';
import type { Note } from '@/types/api';
import type { NoteSelectHandler } from '@/types/ui';
import { TagDisplay } from '../ui/note/TagManager';
import { CategoryDisplay } from '../ui/category/CategoryDisplay';
import { useCategories } from '@/hooks/useApi';

interface NoteCardProps {
  note: Note;
  isSelected?: boolean;
  onSelect: NoteSelectHandler;
  onTagClick?: (tag: string) => void;
  className?: string;
}

export function NoteCard({ note, isSelected = false, onSelect, onTagClick, className }: NoteCardProps) {
  const { data: categories = [] } = useCategories();
  const category = categories.find(c => c.id === note.category_id);

  const handleClick = () => {
    onSelect(isSelected ? null : note);
  };

  return (
    <Card 
      className={cn(
        'floating-card cursor-pointer transition-all duration-300 hover:shadow-xl group',
        isSelected && 'ring-2 ring-primary shadow-lg scale-[1.02]',
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0 group-hover:from-primary/20 group-hover:to-accent/20 transition-all">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate mb-1 group-hover:text-primary transition-colors" title={note.title}>
              {note.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatRelativeTime(note.created_at)}</span>
              </div>
              {category && (
                <CategoryDisplay category={category} size="sm" />
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-3">
          {truncateText(note.body, 120)}
        </p>
        
        <TagDisplay 
          tags={note.tags || []} 
          onTagClick={onTagClick}
          maxVisible={3}
        />
      </CardContent>
    </Card>
  );
}
