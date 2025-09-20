'use client';

import * as React from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ThinkingIndicator, THINKING_STEPS } from './ThinkingIndicator';
import { ThinkingStepsCollapsible } from './ThinkingStepsCollapsible';
import { MessageClassifier } from '../../services/messageClassifier';
import { cn, generateId } from '@/lib/utils';
import { useSendMessage, useConversationMessages } from '@/hooks/useApi';
import { useThinkingSteps } from '@/hooks/useThinkingSteps';
import type { Message } from '@/types/api';
import type { MessageHandler } from '@/types/ui';

interface ChatContainerProps {
  conversationId: number;
  className?: string;
}

interface CompletedThinking {
  id: string;
  steps: import('./ThinkingIndicator').ThinkingStep[];
  stepType: string;
  messageId: number;
}

export function ChatContainer({ conversationId, className }: ChatContainerProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [optimisticMessages, setOptimisticMessages] = React.useState<Message[]>([]);
  const [completedThinkingSteps, setCompletedThinkingSteps] = React.useState<CompletedThinking[]>([]);

  // Fetch conversation messages
  const { data: messages = [], isLoading, error } = useConversationMessages(conversationId);
  
  // Send message mutation
  const sendMessageMutation = useSendMessage();
  
  // Thinking steps management
  const {
    steps,
    currentStepId,
    isThinking,
    startThinking,
    completeStep,
    errorStep,
    completeThinking,
    resetThinking
  } = useThinkingSteps();

  // Combine real messages with optimistic updates
  const allMessages = React.useMemo(() => {
    const messageMap = new Map<number, Message>();
    
    // Add real messages
    messages.forEach(msg => messageMap.set(msg.id, msg));
    
    // Add optimistic messages (they have negative IDs)
    optimisticMessages.forEach(msg => {
      if (msg.id < 0) {
        messageMap.set(msg.id, msg);
      }
    });

    return Array.from(messageMap.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messages, optimisticMessages]);

  // Auto-scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  // Helper function to get step details
  const getStepDetails = (stepId: string, messageText: string): string => {
    switch (stepId) {
      case 'analyze':
        return `Processing "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`;
      case 'context':
        return 'Reviewing conversation history...';
      case 'intent':
        return messageText.length > 100 ? 'Detected complex input (brain dump)' : 'Detected simple request';
      case 'process':
        return 'Structuring information...';
      case 'create':
        return 'Creating items...';
      case 'extract':
        return 'Identifying key points...';
      case 'categorize':
        return 'Organizing by category...';
      case 'structure':
        return 'Formatting notes...';
      case 'tasks':
        return 'Generating action items...';
      case 'finalize':
        return 'Finalizing organization...';
      default:
        return '';
    }
  };

  // Helper function to format response (currently unused but kept for future use)
  // const formatResponse = (result: { type: string; note?: { title: string }; task?: { title: string }; notes?: unknown[]; tasks?: unknown[] }): string => {
  //   if (result.type === 'brain_dump') {
  //     const noteCount = result.notes?.length || 0;
  //     const taskCount = result.tasks?.length || 0;
  //     return `✨ Organized your brain dump: Created ${noteCount} note${noteCount !== 1 ? 's' : ''} and ${taskCount} task${taskCount !== 1 ? 's' : ''}`;
  //   } else if (result.type === 'note' && result.note) {
  //     return `📝 Created note: "${result.note.title}"`;
  //   } else if (result.type === 'task' && result.task) {
  //     return `✅ Created task: "${result.task.title}"`;
  //   }
  //   return 'Processing complete!';
  // };

  const handleSendMessage: MessageHandler = React.useCallback(async (messageText: string) => {
    const tempId = -Date.now(); // Negative ID for optimistic updates
    const idempotencyKey = generateId();
    
    // Add optimistic user message
    const optimisticUserMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };

    setOptimisticMessages(prev => [...prev, optimisticUserMessage]);

        // Use LLM-based classification instead of keyword matching
        let stepType: keyof typeof THINKING_STEPS = 'MESSAGE_ANALYSIS';
        // let classificationReasoning = '';
    
    try {
      console.log('Classifying message with LLM:', messageText);
      const classification = await MessageClassifier.classifyMessage(messageText);
      stepType = classification.classification as keyof typeof THINKING_STEPS;
      // classificationReasoning = classification.reasoning;
      
      console.log('LLM Classification result:', {
        messageText: messageText.substring(0, 50) + '...',
        classification: classification.classification,
        confidence: classification.confidence,
        reasoning: classification.reasoning
      });
    } catch (error) {
      console.error('Classification failed, using fallback:', error);
      // Fallback to simple heuristics if LLM classification fails
      const isLongMessage = messageText.length > 100;
      const hasMultipleItems = messageText.includes(' and ') || messageText.includes(',') || messageText.includes(';');
      const isMeetingNotes = messageText.toLowerCase().includes('meeting') || messageText.toLowerCase().includes('notes');
      
      if (isLongMessage && (hasMultipleItems || isMeetingNotes)) {
        stepType = 'BRAIN_DUMP';
      } else if (messageText.toLowerCase().includes('task') || messageText.toLowerCase().includes('todo')) {
        stepType = 'SIMPLE_TASK';
      } else if (messageText.toLowerCase().includes('note') || messageText.toLowerCase().includes('remember')) {
        stepType = 'SIMPLE_NOTE';
      }
      // classificationReasoning = 'Fallback classification due to LLM error';
    }

    // Start thinking process
    startThinking(stepType);

    try {
      // Simulate thinking steps progression
      const currentSteps = THINKING_STEPS[stepType];
      const stepDuration = 1200; // 1.2 seconds per step
      const totalThinkingTime = currentSteps.length * stepDuration + 500;
      
      // Start API call but don't wait for it
      const apiPromise = sendMessageMutation.mutateAsync({
        conversationId,
        message: { text: messageText },
        idempotencyKey,
      });
      
      // Progress through steps
      let stepIndex = 0;
      const progressSteps = () => {
        if (stepIndex < currentSteps.length) {
          const step = currentSteps[stepIndex];
          completeStep(step.id, getStepDetails(step.id, messageText));
          stepIndex++;
          
          if (stepIndex < currentSteps.length) {
            setTimeout(progressSteps, stepDuration);
          }
        }
      };
      
      // Start first step after a short delay
      setTimeout(progressSteps, 500);

      // Wait for both API response AND thinking time
      const [/* result */] = await Promise.all([
        apiPromise,
        new Promise(resolve => setTimeout(resolve, totalThinkingTime))
      ]);

      // Save completed thinking steps before clearing
      const completedThinking: CompletedThinking = {
        id: generateId(),
        steps: [...steps],
        stepType,
        messageId: tempId
      };
      setCompletedThinkingSteps(prev => [...prev, completedThinking]);

      completeThinking();

      // Clear optimistic messages since we have the real response
      setOptimisticMessages([]);
      resetThinking();

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Complete thinking with error
      if (currentStepId) {
        errorStep(currentStepId, 'Processing failed');
      }
      completeThinking();

      // Add error message
      const errorMessage: Message = {
        id: tempId - 1,
        conversation_id: conversationId,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        created_at: new Date().toISOString(),
      };

      setOptimisticMessages(prev => [...prev, errorMessage]);
    }
  }, [conversationId, sendMessageMutation, startThinking, completeStep, errorStep, completeThinking, resetThinking, steps, currentStepId]);

  if (error) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>Failed to load conversation</p>
            <p className="text-sm">Please try refreshing the page</p>
          </div>
        </div>
        <ChatInput onSendMessage={handleSendMessage} disabled />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gradient">AI Assistant</h1>
            <p className="text-sm text-muted-foreground">Ready to help with notes and tasks</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent mx-auto mb-4 animate-spin" />
              <div className="text-muted-foreground">Loading conversation...</div>
            </div>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-gradient">Welcome to Your AI Assistant</h2>
              <p className="text-muted-foreground mb-4">Start a conversation to create notes, manage tasks, or organize your thoughts.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">Create Notes</span>
                <span className="px-3 py-1 bg-accent/10 text-accent-foreground text-sm rounded-full">Manage Tasks</span>
                <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">Organize Ideas</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {allMessages.map((message) => (
              <div key={message.id} className="animate-fade-in">
                <MessageBubble message={message} />
                
                {/* Show completed thinking steps for user messages */}
                {message.role === 'user' && (
                  <>
                    {completedThinkingSteps
                      .filter(thinking => thinking.messageId === message.id)
                      .map(thinking => (
                        <ThinkingStepsCollapsible
                          key={thinking.id}
                          steps={thinking.steps}
                          stepType={thinking.stepType}
                          isCompleted={true}
                          className="mt-3"
                        />
                      ))}
                  </>
                )}
              </div>
            ))}
            
            {/* Active Thinking Indicator */}
            <ThinkingIndicator
              steps={steps}
              isVisible={isThinking}
              className="mx-auto max-w-2xl"
            />
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <ChatInput 
          onSendMessage={handleSendMessage}
          disabled={sendMessageMutation.isPending}
          placeholder="Type your message, note, or task..."
        />
      </div>
    </div>
  );
}
