import { useState, useCallback, useRef } from 'react';
import { ThinkingStep } from '../components/chat/ThinkingIndicator';

interface UseThinkingStepsReturn {
  steps: ThinkingStep[];
  currentStepId: string | null;
  isThinking: boolean;
  startThinking: (stepType: keyof typeof THINKING_STEPS) => void;
  updateStep: (stepId: string, updates: Partial<ThinkingStep>) => void;
  completeStep: (stepId: string, details?: string) => void;
  errorStep: (stepId: string, error: string) => void;
  completeThinking: () => void;
  resetThinking: () => void;
}

// Import the thinking steps
import { THINKING_STEPS } from '../components/chat/ThinkingIndicator';

export function useThinkingSteps(): UseThinkingStepsReturn {
  const [steps, setSteps] = useState<ThinkingStep[]>([]);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const updateStep = useCallback((stepId: string, updates: Partial<ThinkingStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  }, []);

  const startThinking = useCallback((stepType: keyof typeof THINKING_STEPS) => {
    const stepTemplates = THINKING_STEPS[stepType];
    const initialSteps: ThinkingStep[] = stepTemplates.map(step => ({
      ...step,
      status: 'pending' as const
    }));

    setSteps(initialSteps);
    setCurrentStepId(stepTemplates[0]?.id || null);
    setIsThinking(true);

    // Clear any existing timeouts
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];

    // Auto-advance to first step
    if (stepTemplates.length > 0) {
      const timeout = setTimeout(() => {
        updateStep(stepTemplates[0].id, { status: 'active' });
      }, 500);
      timeoutRefs.current.push(timeout);
    }
  }, [updateStep]);

  const completeStep = useCallback((stepId: string, details?: string) => {
    updateStep(stepId, { 
      status: 'completed',
      ...(details && { details })
    });

    // Find next pending step
    setSteps(prev => {
      const currentIndex = prev.findIndex(step => step.id === stepId);
      const nextStep = prev.find((step, index) => 
        index > currentIndex && step.status === 'pending'
      );

      if (nextStep) {
        setCurrentStepId(nextStep.id);
        // Auto-advance to next step after a short delay
        const timeout = setTimeout(() => {
          updateStep(nextStep.id, { status: 'active' });
        }, 300);
        timeoutRefs.current.push(timeout);
      } else {
        setCurrentStepId(null);
      }

      return prev;
    });
  }, [updateStep]);

  const errorStep = useCallback((stepId: string, error: string) => {
    updateStep(stepId, { 
      status: 'error',
      details: error
    });
    setCurrentStepId(null);
  }, [updateStep]);

  const completeThinking = useCallback(() => {
    setIsThinking(false);
    setCurrentStepId(null);
    
    // Clear any pending timeouts
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  }, []);

  const resetThinking = useCallback(() => {
    setSteps([]);
    setCurrentStepId(null);
    setIsThinking(false);
    
    // Clear any pending timeouts
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  }, []);

  return {
    steps,
    currentStepId,
    isThinking,
    startThinking,
    updateStep,
    completeStep,
    errorStep,
    completeThinking,
    resetThinking
  };
}
