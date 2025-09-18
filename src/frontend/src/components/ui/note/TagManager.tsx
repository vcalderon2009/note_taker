import React from 'react';
import { X, Plus, Tag, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input/Input';
import { Button } from '@/components/ui/button/Button';

interface TagManagerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
  placeholder?: string;
  maxTags?: number;
}

export function TagManager({ 
  tags, 
  onTagsChange, 
  className, 
  placeholder = "Add tags...",
  maxTags = 10 
}: TagManagerProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [isInputFocused, setIsInputFocused] = React.useState(false);

  const handleAddTag = (tagText: string) => {
    const cleanTag = tagText.trim().toLowerCase();
    
    if (!cleanTag || tags.includes(cleanTag) || tags.length >= maxTags) {
      return;
    }

    onTagsChange([...tags, cleanTag]);
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  const handleInputSubmit = () => {
    if (inputValue.trim()) {
      handleAddTag(inputValue);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Existing Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20 hover:from-primary/15 hover:to-accent/15 transition-colors group"
            >
              <Hash className="h-2.5 w-2.5" />
              <span className="font-medium">{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 p-0.5 rounded-full hover:bg-primary/20 transition-colors opacity-60 hover:opacity-100"
                title="Remove tag"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Tag Input */}
      {tags.length < maxTags && (
        <div className={cn(
          'flex items-center gap-2 p-2 rounded-lg border transition-all duration-200',
          isInputFocused 
            ? 'border-primary/50 bg-card/80 shadow-sm' 
            : 'border-border/50 bg-card/40 hover:bg-card/60'
        )}>
          <Tag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder={placeholder}
            className="flex-1 border-none bg-transparent p-0 text-sm focus:ring-0 placeholder:text-muted-foreground/70"
          />
          {inputValue.trim() && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleInputSubmit}
              className="h-6 w-6 p-0 hover:bg-primary/10"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Helper Text */}
      <div className="text-xs text-muted-foreground">
        {tags.length < maxTags ? (
          <>Press Enter or comma to add tags • {tags.length}/{maxTags}</>
        ) : (
          <>Maximum {maxTags} tags reached</>
        )}
      </div>
    </div>
  );
}

// Tag Display Component for read-only contexts
interface TagDisplayProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
  maxVisible?: number;
  className?: string;
}

export function TagDisplay({ 
  tags, 
  onTagClick, 
  maxVisible = 3, 
  className 
}: TagDisplayProps) {
  if (!tags || tags.length === 0) return null;

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = Math.max(0, tags.length - maxVisible);

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <Tag className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <div className="flex gap-1 flex-wrap">
        {visibleTags.map((tag, index) => (
          <button
            key={index}
            onClick={() => onTagClick?.(tag)}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gradient-to-r from-primary/5 to-accent/5 text-primary border border-primary/20 transition-colors',
              onTagClick && 'hover:from-primary/10 hover:to-accent/10 hover:border-primary/30 cursor-pointer'
            )}
          >
            <Hash className="h-2.5 w-2.5" />
            {tag}
          </button>
        ))}
        {remainingCount > 0 && (
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            +{remainingCount}
          </span>
        )}
      </div>
    </div>
  );
}
