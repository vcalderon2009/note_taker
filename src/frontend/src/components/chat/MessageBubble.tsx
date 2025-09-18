'use client';

import * as React from 'react';
import { User, Bot, Clock, Brain, AlertCircle, Loader2 } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Message } from '@/types/api';

interface MessageBubbleProps {
  message: Message;
  className?: string;
}

export function MessageBubble({ message, className }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isThinking = message.content === '__THINKING__';
  const isError = message.content === '__ERROR__';

  if (isSystem) {
    return (
      <div className={cn('flex justify-center my-6', className)}>
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 text-muted-foreground px-4 py-2 rounded-full text-xs border border-border/50">
          {message.content}
        </div>
      </div>
    );
  }

  // Special handling for thinking state
  if (isThinking) {
    return (
      <div className={cn('flex gap-4 mb-6', className)}>
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-gradient-to-r from-blue-100 to-purple-100 text-blue-600 border border-border/50">
          <Brain className="h-5 w-5 animate-pulse" />
        </div>
        <div className="flex flex-col max-w-[75%]">
          <div className="px-5 py-3 rounded-2xl rounded-bl-md text-sm shadow-sm border bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50 text-blue-700">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI is thinking...</span>
            </div>
            <div className="mt-2 text-xs text-blue-600/70">
              Analyzing your message and creating the perfect response
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Processing...</span>
          </div>
        </div>
      </div>
    );
  }

  // Special handling for error state
  if (isError) {
    return (
      <div className={cn('flex gap-4 mb-6', className)}>
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-gradient-to-r from-red-100 to-orange-100 text-red-600 border border-red-200/50">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="flex flex-col max-w-[75%]">
          <div className="px-5 py-3 rounded-2xl rounded-bl-md text-sm shadow-sm border bg-gradient-to-r from-red-50 to-orange-50 border-red-200/50 text-red-700">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4" />
              <span>Something went wrong</span>
            </div>
            <div className="mt-2 text-xs text-red-600/70">
              Failed to process your message. Please try again.
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Error occurred</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-4 mb-6', isUser && 'flex-row-reverse', className)}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md',
        isUser 
          ? 'bg-gradient-to-r from-primary to-accent text-white' 
          : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 border border-border/50'
      )}>
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      {/* Message Content */}
      <div className={cn(
        'flex flex-col max-w-[75%]',
        isUser && 'items-end'
      )}>
        <div className={cn(
          'px-5 py-3 rounded-2xl text-sm shadow-sm border',
          isUser 
            ? 'bg-gradient-to-r from-primary to-accent text-white rounded-br-md shadow-lg' 
            : 'bg-card border-border/50 text-card-foreground rounded-bl-md hover:shadow-md transition-shadow'
        )}>
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        </div>
        
        {/* Metadata */}
        <div className={cn(
          'flex items-center gap-2 mt-2 text-xs text-muted-foreground',
          isUser && 'flex-row-reverse'
        )}>
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(message.created_at)}</span>
          {message.latency_ms && (
            <>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                {message.latency_ms}ms
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
