'use client';

import * as React from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button/Button';
import { Input } from '@/components/ui/input/Input';
import { cn } from '@/lib/utils';
import type { MessageHandler } from '@/types/ui';

interface ChatInputProps {
  onSendMessage: MessageHandler;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type your message...",
  className 
}: ChatInputProps) {
  const [message, setMessage] = React.useState('');
  const [isComposing, setIsComposing] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('flex gap-3 p-6', className)}>
      <div className="flex-1 relative">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-12 h-12 rounded-xl border-border/50 bg-card/50 backdrop-blur-sm shadow-sm focus:shadow-md focus:ring-2 focus:ring-primary/20 transition-all"
        />
        {message.trim() && !disabled && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            ⏎ Send
          </div>
        )}
        {disabled && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing...
          </div>
        )}
      </div>
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !message.trim()}
        className={cn(
          "h-12 w-12 rounded-xl shadow-md transition-all duration-200",
          disabled
            ? "bg-blue-100 text-blue-600 cursor-not-allowed"
            : message.trim() 
              ? "bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:scale-105 text-white" 
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
        )}
      >
        {disabled ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className={cn("h-5 w-5 transition-transform", message.trim() && "scale-110")} />
        )}
        <span className="sr-only">{disabled ? "Processing" : "Send message"}</span>
      </Button>
    </form>
  );
}
