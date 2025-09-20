'use client';

import React from 'react';
import { Button } from '../ui/button/Button';
import { cn } from '@/lib/utils';

interface NavigationProps {
  currentView: 'dashboard' | 'chat' | 'notes' | 'tasks';
  onViewChange: (view: 'dashboard' | 'chat' | 'notes' | 'tasks') => void;
  className?: string;
}

export function Navigation({ currentView, onViewChange, className }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
  ] as const;

  return (
    <nav className={cn("flex items-center gap-1 p-2 bg-card/50 backdrop-blur-sm border-b border-border/50", className)}>
      {navItems.map((item) => (
        <Button
          key={item.id}
          variant={currentView === item.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(item.id)}
          className={cn(
            "flex items-center gap-2 transition-all duration-200",
            currentView === item.id 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "hover:bg-muted/50"
          )}
        >
          <span className="text-sm">{item.icon}</span>
          <span className="text-sm font-medium">{item.label}</span>
        </Button>
      ))}
    </nav>
  );
}
