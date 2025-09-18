'use client';

import * as React from 'react';
import { CheckSquare, Square, Calendar, Flag, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card/Card';
import { Button } from '@/components/ui/button/Button';
import { cn, formatRelativeTime, getPriorityColor } from '@/lib/utils';
import { useUpdateTask, useUpdateTaskStatus, useCategories } from '@/hooks/useApi';
import { TaskStatusButton } from '@/components/ui/task/TaskStatusButton';
import { CategoryDisplay } from '@/components/ui/category/CategoryDisplay';
import type { Task } from '@/types/api';
import type { TaskSelectHandler } from '@/types/ui';

interface TaskCardProps {
  task: Task;
  isSelected?: boolean;
  onSelect: TaskSelectHandler;
  className?: string;
}

export function TaskCard({ task, isSelected = false, onSelect, className }: TaskCardProps) {
  const updateTaskMutation = useUpdateTask();
  const updateTaskStatusMutation = useUpdateTaskStatus();
  const { data: categories = [] } = useCategories();
  const category = categories.find(c => c.id === task.category_id);

  const handleClick = () => {
    onSelect(isSelected ? null : task);
  };

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    updateTaskMutation.mutate({
      id: task.id,
      updates: { status: newStatus }
    });
  };

  const handleStatusChange = (taskId: number, newStatus: 'todo' | 'in_progress' | 'completed' | 'cancelled') => {
    updateTaskStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const isCompleted = task.status === 'completed';
  const isOverdue = task.due_at && new Date(task.due_at) < new Date() && !isCompleted;

  return (
    <Card 
      className={cn(
        'floating-card cursor-pointer transition-all duration-300 hover:shadow-xl group',
        isSelected && 'ring-2 ring-primary shadow-lg scale-[1.02]',
        isCompleted && 'opacity-75',
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 hover:bg-primary/10 rounded-lg transition-all flex-shrink-0"
            onClick={handleToggleComplete}
            disabled={updateTaskMutation.isPending}
          >
            {isCompleted ? (
              <CheckSquare className="h-5 w-5 text-green-600" />
            ) : (
              <Square className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            )}
          </Button>
          
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'font-semibold text-sm truncate mb-2 group-hover:text-primary transition-colors',
              isCompleted && 'line-through text-muted-foreground'
            )} title={task.title}>
              {task.title}
            </h3>
            
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* Enhanced Status Management */}
              <TaskStatusButton 
                task={task} 
                onStatusChange={handleStatusChange}
                className="flex-shrink-0"
              />

              {/* Priority Badge */}
              {task.priority && (
                <span className={cn(
                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border',
                  getPriorityColor(task.priority),
                  'border-current/20'
                )}>
                  <Flag className="h-3 w-3 mr-1" />
                  {task.priority}
                </span>
              )}

              {/* Category Display */}
              {category && (
                <CategoryDisplay category={category} size="sm" />
              )}
            </div>

            {/* Due Date */}
            {task.due_at && (
              <div className={cn(
                'flex items-center gap-1 mb-1 text-xs',
                isOverdue ? 'text-red-600' : 'text-muted-foreground'
              )}>
                <Calendar className="h-3 w-3" />
                <span>Due {formatRelativeTime(task.due_at)}</span>
                {isOverdue && (
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    OVERDUE
                  </span>
                )}
              </div>
            )}

            {/* Created Date */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Created {formatRelativeTime(task.created_at)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {task.description && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
