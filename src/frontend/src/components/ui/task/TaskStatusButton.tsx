'use client';

import * as React from 'react';
import { Check, Clock, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button/Button';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/api';

interface TaskStatusButtonProps {
  task: Task;
  onStatusChange: (taskId: number, newStatus: 'todo' | 'in_progress' | 'completed' | 'cancelled') => void;
  className?: string;
}

const statusConfig = {
  todo: {
    icon: Clock,
    label: 'To Do',
    color: 'text-gray-600 bg-gray-100 hover:bg-gray-200',
    nextStatus: 'in_progress' as const,
    nextLabel: 'Start'
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200',
    nextStatus: 'in_progress' as const,
    nextLabel: 'Start'
  },
  in_progress: {
    icon: Play,
    label: 'In Progress',
    color: 'text-blue-600 bg-blue-100 hover:bg-blue-200',
    nextStatus: 'completed' as const,
    nextLabel: 'Complete'
  },
  completed: {
    icon: Check,
    label: 'Completed',
    color: 'text-green-600 bg-green-100 hover:bg-green-200',
    nextStatus: 'todo' as const,
    nextLabel: 'Reopen'
  },
  cancelled: {
    icon: X,
    label: 'Cancelled',
    color: 'text-red-600 bg-red-100 hover:bg-red-200',
    nextStatus: 'todo' as const,
    nextLabel: 'Reopen'
  }
} as const;

export function TaskStatusButton({ task, onStatusChange, className }: TaskStatusButtonProps) {
  const config = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.todo;
  const Icon = config.icon;

  const handleStatusChange = () => {
    onStatusChange(task.id, config.nextStatus);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Current Status Display */}
      <div className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        config.color
      )}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </div>

      {/* Action Button */}
      {task.status !== 'completed' && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleStatusChange}
          className="h-6 px-2 text-xs"
        >
          {config.nextLabel}
        </Button>
      )}

      {/* Quick Actions for Completed Tasks */}
      {task.status === 'completed' && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleStatusChange}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {config.nextLabel}
        </Button>
      )}
    </div>
  );
}
