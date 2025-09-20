'use client';

import React from 'react';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThinkingStep } from './ThinkingIndicator';

interface ThinkingStepsCollapsibleProps {
  steps: ThinkingStep[];
  stepType: string;
  isCompleted: boolean;
  className?: string;
}

export function ThinkingStepsCollapsible({ 
  steps, 
  stepType, 
  isCompleted, 
  className 
}: ThinkingStepsCollapsibleProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!isCompleted || steps.length === 0) return null;

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;

  const getStepTypeLabel = (type: string) => {
    switch (type) {
      case 'BRAIN_DUMP': return 'Brain Dump Analysis';
      case 'SIMPLE_TASK': return 'Task Creation';
      case 'SIMPLE_NOTE': return 'Note Creation';
      case 'MESSAGE_ANALYSIS': return 'Message Analysis';
      default: return 'AI Processing';
    }
  };

  return (
    <div className={cn(
      "bg-muted/30 border border-border/30 rounded-lg p-3 mb-4",
      "transition-all duration-200 hover:bg-muted/40",
      className
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {getStepTypeLabel(stepType)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({completedSteps}/{totalSteps} steps)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {isExpanded ? 'Hide' : 'Show'} details
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                  step.status === 'completed' 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {step.status === 'completed' ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <div className={cn(
                    "text-sm",
                    step.status === 'completed' 
                      ? "text-foreground" 
                      : "text-muted-foreground"
                  )}>
                    {step.label}
                  </div>
                  {step.details && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {step.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
