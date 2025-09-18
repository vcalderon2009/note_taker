'use client';

import * as React from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { cn, generateId } from '@/lib/utils';
import { useSendMessage, useConversationMessages } from '@/hooks/useApi';
import type { Message } from '@/types/api';
import type { MessageHandler } from '@/types/ui';

interface ChatContainerProps {
  conversationId: number;
  className?: string;
}

export function ChatContainer({ conversationId, className }: ChatContainerProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [optimisticMessages, setOptimisticMessages] = React.useState<Message[]>([]);

  // Fetch conversation messages
  const { data: messages = [], isLoading, error } = useConversationMessages(conversationId);
  
  // Send message mutation
  const sendMessageMutation = useSendMessage();

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

    // Add AI thinking indicator
    const thinkingMessage: Message = {
      id: tempId - 1,
      conversation_id: conversationId,
      role: 'assistant',
      content: '__THINKING__', // Special marker for thinking state
      created_at: new Date().toISOString(),
    };

    setOptimisticMessages(prev => [...prev, thinkingMessage]);

    try {
      // Send the message
      const result = await sendMessageMutation.mutateAsync({
        conversationId,
        message: { text: messageText },
        idempotencyKey,
      });

      // Replace thinking message with actual response
      const assistantMessage: Message = {
        id: tempId - 1,
        conversation_id: conversationId,
        role: 'assistant',
        content: `Created ${result.type}: ${result.type === 'note' ? result.note.title : result.task.title}`,
        created_at: new Date().toISOString(),
      };

      setOptimisticMessages(prev => 
        prev.map(msg => msg.id === tempId - 1 ? assistantMessage : msg)
      );

      // Clear optimistic messages after a delay (real messages will replace them)
      setTimeout(() => {
        setOptimisticMessages([]);
      }, 2000);

    } catch (error) {
      // Replace thinking message with error message
      const errorMessage: Message = {
        id: tempId - 1,
        conversation_id: conversationId,
        role: 'assistant',
        content: '__ERROR__', // Special marker for error state
        created_at: new Date().toISOString(),
      };

      setOptimisticMessages(prev => 
        prev.map(msg => msg.id === tempId - 1 ? errorMessage : msg)
      );

      console.error('Failed to send message:', error);

      // Remove error message after delay
      setTimeout(() => {
        setOptimisticMessages(prev => prev.filter(msg => msg.id !== tempId - 1));
      }, 5000);
    }
  }, [conversationId, sendMessageMutation]);

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
              </div>
            ))}
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
