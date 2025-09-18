import React from 'react';
import { MessageSquare, Plus, Trash2, Check, X, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation } from '@/types/api';
import { useConversations, useCreateConversation, useDeleteConversation } from '@/hooks/useApi';

interface ConversationListProps {
  currentConversationId: number | null;
  onConversationSelect: (conversationId: number) => void;
  onNewConversation: () => void;
  className?: string;
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onSelect: (conversationId: number) => void;
  onDelete: (conversationId: number) => void;
  onToggleSelect?: (conversationId: number) => void;
}

function ConversationItem({ 
  conversation, 
  isActive, 
  isSelected = false,
  isSelectionMode = false,
  onSelect, 
  onDelete, 
  onToggleSelect 
}: ConversationItemProps) {
  const [showActions, setShowActions] = React.useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Protect "Default Conversation" from deletion
    if (conversation.title === 'Default Conversation' || conversation.title === null || conversation.title === '') {
      alert('The default conversation cannot be deleted.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this conversation?')) {
      onDelete(conversation.id);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleClick = () => {
    if (isSelectionMode) {
      onToggleSelect?.(conversation.id);
    } else {
      onSelect(conversation.id);
    }
  };

  const isProtected = conversation.title === 'Default Conversation' || 
                     conversation.title === null || 
                     conversation.title === '';

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 relative',
        isActive && !isSelectionMode
          ? 'bg-primary/10 border border-primary/20' 
          : isSelected && isSelectionMode
          ? 'bg-destructive/10 border border-destructive/20'
          : 'hover:bg-muted/50 border border-transparent'
      )}
      onClick={handleClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Selection Checkbox */}
      {isSelectionMode && (
        <div className="flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(conversation.id);
            }}
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
              isSelected 
                ? 'bg-destructive border-destructive text-destructive-foreground' 
                : 'border-muted-foreground hover:border-destructive'
            )}
            disabled={isProtected}
          >
            {isSelected && <Check className="w-3 h-3" />}
          </button>
        </div>
      )}

      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors',
        isActive && !isSelectionMode 
          ? 'bg-primary text-primary-foreground' 
          : isSelected && isSelectionMode
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-muted text-muted-foreground'
      )}>
        <MessageSquare className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={cn(
          'text-sm font-medium truncate transition-colors',
          isActive ? 'text-foreground' : 'text-foreground/90'
        )}>
          {conversation.title || 'New Conversation'}
        </h4>
        <p className="text-xs text-muted-foreground">
          {formatDate(conversation.created_at)}
        </p>
      </div>

      {showActions && !isSelectionMode && (
        <div className="flex-shrink-0">
          {/* Only show delete button for non-default conversations */}
          {!isProtected && (
            <button
              onClick={handleDelete}
              className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Delete conversation"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ConversationList({ 
  currentConversationId, 
  onConversationSelect, 
  onNewConversation,
  className 
}: ConversationListProps) {
  const { data: conversations = [], isLoading, error } = useConversations();
  const createConversationMutation = useCreateConversation();
  const deleteConversationMutation = useDeleteConversation();
  
  // Bulk delete state
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedConversationIds, setSelectedConversationIds] = React.useState<number[]>([]);

  const handleNewConversation = async () => {
    try {
      const newConversation = await createConversationMutation.mutateAsync(undefined);
      onConversationSelect(newConversation.id);
      onNewConversation();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      await deleteConversationMutation.mutateAsync(conversationId);
      
      // If we deleted the current conversation, select another one or create new
      if (conversationId === currentConversationId) {
        const remainingConversations = conversations.filter(c => c.id !== conversationId);
        
        if (remainingConversations.length > 0) {
          // Try to find a default conversation first
          const defaultConversation = remainingConversations.find(c => 
            c.title === 'Default Conversation' || c.title === null || c.title === ''
          );
          
          if (defaultConversation) {
            onConversationSelect(defaultConversation.id);
          } else {
            // If no default exists, select the first remaining conversation
            onConversationSelect(remainingConversations[0].id);
          }
        } else {
          // No conversations left, create a new default one
          handleNewConversation();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleToggleSelection = (conversationId: number) => {
    setSelectedConversationIds(prev => 
      prev.includes(conversationId)
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleSelectAll = () => {
    const selectableConversations = conversations.filter(c => 
      !(c.title === 'Default Conversation' || c.title === null || c.title === '')
    );
    setSelectedConversationIds(selectableConversations.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedConversationIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedConversationIds.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedConversationIds.length} conversation${selectedConversationIds.length > 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) return;

    try {
      // Delete all selected conversations
      await Promise.all(
        selectedConversationIds.map(id => deleteConversationMutation.mutateAsync(id))
      );

      // Handle current conversation selection
      if (selectedConversationIds.includes(currentConversationId!)) {
        const remainingConversations = conversations.filter(c => 
          !selectedConversationIds.includes(c.id)
        );
        
        if (remainingConversations.length > 0) {
          const defaultConversation = remainingConversations.find(c => 
            c.title === 'Default Conversation' || c.title === null || c.title === ''
          );
          
          if (defaultConversation) {
            onConversationSelect(defaultConversation.id);
          } else {
            onConversationSelect(remainingConversations[0].id);
          }
        } else {
          handleNewConversation();
        }
      }

      // Exit selection mode
      setIsSelectionMode(false);
      setSelectedConversationIds([]);
    } catch (error) {
      console.error('Failed to delete conversations:', error);
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedConversationIds([]);
  };

  if (error) {
    return (
      <div className={cn('p-4', className)}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Failed to load conversations</p>
        </div>
      </div>
    );
  }

  const selectableConversations = conversations.filter(c => 
    !(c.title === 'Default Conversation' || c.title === null || c.title === '')
  );
  const hasSelectableConversations = selectableConversations.length > 0;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold">
          {isSelectionMode ? `Selected: ${selectedConversationIds.length}` : 'Conversations'}
        </h2>
        <div className="flex items-center gap-2">
          {isSelectionMode ? (
            <>
              {selectedConversationIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={deleteConversationMutation.isPending}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                  title={`Delete ${selectedConversationIds.length} conversation${selectedConversationIds.length > 1 ? 's' : ''}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleCancelSelection}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                title="Cancel selection"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {hasSelectableConversations && (
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                  title="Select conversations to delete"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleNewConversation}
                disabled={createConversationMutation.isPending}
                className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors disabled:opacity-50"
                title="New conversation"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {isSelectionMode && (
        <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border/50">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Select All ({selectableConversations.length})
            </button>
            {selectedConversationIds.length > 0 && (
              <>
                <span className="text-muted-foreground">•</span>
                <button
                  onClick={handleDeselectAll}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Deselect All
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Protected conversations cannot be deleted
          </p>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <button
              onClick={handleNewConversation}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Start your first conversation
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map(conversation => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={conversation.id === currentConversationId}
                  isSelected={selectedConversationIds.includes(conversation.id)}
                  isSelectionMode={isSelectionMode}
                  onSelect={onConversationSelect}
                  onDelete={handleDeleteConversation}
                  onToggleSelect={handleToggleSelection}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
