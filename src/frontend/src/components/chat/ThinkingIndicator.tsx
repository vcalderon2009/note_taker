import React from 'react';
import { cn } from '@/lib/utils';

export interface ThinkingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  icon?: string;
  details?: string;
}

interface ThinkingIndicatorProps {
  steps: ThinkingStep[];
  currentStep?: string;
  isVisible: boolean;
  className?: string;
}

export function ThinkingIndicator({ 
  steps, 
  isVisible, 
  className 
}: ThinkingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "bg-muted/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 space-y-3",
      "animate-in slide-in-from-top-2 duration-300",
      className
    )}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
        <span>AI is thinking...</span>
      </div>
      
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3 text-sm transition-all duration-200",
              step.status === 'completed' && "text-green-600 dark:text-green-400",
              step.status === 'active' && "text-primary font-medium",
              step.status === 'error' && "text-red-600 dark:text-red-400",
              step.status === 'pending' && "text-muted-foreground"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200",
              step.status === 'completed' && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
              step.status === 'active' && "bg-primary text-primary-foreground animate-pulse",
              step.status === 'error' && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
              step.status === 'pending' && "bg-muted text-muted-foreground"
            )}>
              {step.status === 'completed' ? '✓' : 
               step.status === 'error' ? '✗' : 
               step.status === 'active' ? '⟳' : 
               index + 1}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {step.icon && <span className="text-base">{step.icon}</span>}
                <span>{step.label}</span>
              </div>
              {step.details && (
                <div className="text-xs text-muted-foreground mt-1 ml-7">
                  {step.details}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Predefined thinking steps for different scenarios
export const THINKING_STEPS = {
  MESSAGE_ANALYSIS: [
    { id: 'analyze', label: 'Analyzing your message...', icon: '🔍' },
    { id: 'context', label: 'Checking conversation context...', icon: '📚' },
    { id: 'intent', label: 'Determining intent...', icon: '🎯' },
    { id: 'process', label: 'Processing content...', icon: '⚙️' },
    { id: 'create', label: 'Creating items...', icon: '✨' }
  ],
  
  BRAIN_DUMP: [
    { id: 'analyze', label: 'Analyzing brain dump...', icon: '🧠' },
    { id: 'extract', label: 'Extracting key information...', icon: '🔍' },
    { id: 'categorize', label: 'Categorizing content...', icon: '🏷️' },
    { id: 'structure', label: 'Structuring notes...', icon: '📝' },
    { id: 'tasks', label: 'Creating tasks...', icon: '✅' },
    { id: 'finalize', label: 'Finalizing organization...', icon: '✨' }
  ],
  
  SIMPLE_TASK: [
    { id: 'analyze', label: 'Analyzing task request...', icon: '🔍' },
    { id: 'validate', label: 'Validating task details...', icon: '✓' },
    { id: 'create', label: 'Creating task...', icon: '✅' }
  ],
  
  SIMPLE_NOTE: [
    { id: 'analyze', label: 'Analyzing note content...', icon: '🔍' },
    { id: 'extract', label: 'Extracting key information...', icon: '📝' },
    { id: 'create', label: 'Creating note...', icon: '📄' }
  ]
} as const;
