'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/api';

interface CategoryDisplayProps {
  category: Category | null;
  showIcon?: boolean;
  showColor?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CategoryDisplay({ 
  category, 
  showIcon = true, 
  showColor = true, 
  size = 'md',
  className 
}: CategoryDisplayProps) {
  if (!category) {
    return (
      <span className={cn(
        'text-muted-foreground text-xs',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        size === 'lg' && 'text-base',
        className
      )}>
        No category
      </span>
    );
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50',
      sizeClasses[size],
      className
    )}>
      {showIcon && (
        <span className={cn(iconSizes[size])}>
          {category.icon || '📝'}
        </span>
      )}
      <span className="truncate max-w-24">{category.name}</span>
      {showColor && (
        <div 
          className={cn(
            'rounded-full flex-shrink-0',
            size === 'sm' && 'w-2 h-2',
            size === 'md' && 'w-2.5 h-2.5',
            size === 'lg' && 'w-3 h-3'
          )}
          style={{ backgroundColor: category.color || '#6b7280' }}
        />
      )}
    </div>
  );
}
