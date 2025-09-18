'use client';

import * as React from 'react';
import { Menu, X } from 'lucide-react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { SidebarContainer } from '@/components/sidebar/SidebarContainer';
import { cn } from '@/lib/utils';
import { useConversations, useCreateConversation, useUpdateNote } from '@/hooks/useApi';
import { EditableNote } from '@/components/ui/note/EditableNote';
import type { Note, Task } from '@/types/api';

interface AppLayoutProps {
  className?: string;
}

export function AppLayout({ className }: AppLayoutProps) {
  const [currentConversationId, setCurrentConversationId] = React.useState<number | null>(null);
  const [selectedNote, setSelectedNote] = React.useState<Note | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [sidebarWidth, setSidebarWidth] = React.useState(384); // 24rem in pixels
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  // Listen to collapse events from sidebar header
  React.useEffect(() => {
    const handler = () => setIsSidebarCollapsed(true);
    window.addEventListener('sidebar:collapse', handler as EventListener);
    return () => window.removeEventListener('sidebar:collapse', handler as EventListener);
  }, []);

  const { data: conversations = [], isLoading: isLoadingConversations } = useConversations();
  const createConversationMutation = useCreateConversation();
  const updateNoteMutation = useUpdateNote();

  // Initialize: select latest existing conversation; if none exist, create one
  React.useEffect(() => {
    if (currentConversationId !== null) return;
    if (isLoadingConversations) return;

    const hasConversations = conversations.length > 0;
    if (hasConversations) {
      // Pick the most recently created conversation
      const latest = [...conversations].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      setCurrentConversationId(latest.id);
      return;
    }

    // None exist → create exactly one
    (async () => {
      try {
        const conversation = await createConversationMutation.mutateAsync(undefined);
        setCurrentConversationId(conversation.id);
      } catch (error) {
        console.error('Failed to create initial conversation:', error);
      }
    })();
  }, [currentConversationId, isLoadingConversations, conversations, createConversationMutation]);

  const handleNoteSelect = React.useCallback((note: Note | null) => {
    setSelectedNote(note);
    if (note) {
      setSelectedTask(null); // Clear task selection
    }
  }, []);

  const handleTaskSelect = React.useCallback((task: Task | null) => {
    setSelectedTask(task);
    if (task) {
      setSelectedNote(null); // Clear note selection
    }
  }, []);

  const handleNoteSave = React.useCallback((noteId: number, updates: { title?: string; body?: string }) => {
    updateNoteMutation.mutate({ id: noteId, updates });
  }, [updateNoteMutation]);

  if (!currentConversationId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex h-screen bg-background relative overflow-hidden', className)}>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      {/* Sidebar */}
      <div 
        className={cn(
          "flex-shrink-0 border-r border-border/50 backdrop-blur-sm relative z-10 transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "w-0 hidden" : ""
        )}
        style={{ width: isSidebarCollapsed ? 0 : sidebarWidth }}
      >
        {!isSidebarCollapsed && (
          <div className="h-full bg-card/50 backdrop-blur-sm">
            <SidebarContainer
              onNoteSelect={handleNoteSelect}
              onTaskSelect={handleTaskSelect}
              selectedNote={selectedNote}
              selectedTask={selectedTask}
              currentConversationId={currentConversationId}
              onConversationSelect={setCurrentConversationId}
              onNewConversation={() => {
                // Clear selections when creating new conversation
                setSelectedNote(null);
                setSelectedTask(null);
              }}
            />
          </div>
        )}
      </div>

      {/* Resize Handle */}
      {!isSidebarCollapsed && (
        <div 
          className="w-1 bg-gradient-to-b from-primary/20 to-accent/20 hover:from-primary/40 hover:to-accent/40 cursor-col-resize transition-all duration-200 relative z-20"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = sidebarWidth;

            const handleMouseMove = (e: MouseEvent) => {
              const newWidth = Math.max(300, Math.min(600, startWidth + (e.clientX - startX)));
              setSidebarWidth(newWidth);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Global Sidebar Toggle (visible when collapsed) */}
        {isSidebarCollapsed && (
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className={cn(
                "p-2 rounded-lg bg-card/90 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-card text-primary"
              )}
              title="Show sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className={cn(
          "h-full bg-card/30 backdrop-blur-sm transition-all duration-300",
          isSidebarCollapsed ? "border-l-0" : "border-l border-border/50"
        )}>
          <ChatContainer conversationId={currentConversationId} />
        </div>
      </div>

      {/* Detail Panel (Future Enhancement) */}
      {(selectedNote || selectedTask) && (
        <div className="w-80 border-l border-border/50 bg-card/50 backdrop-blur-sm relative z-10">
          <div className="p-4">
            <h3 className="font-semibold mb-2">
              {selectedNote ? 'Note Details' : 'Task Details'}
            </h3>
            {selectedNote && (
              <div className="group">
                <EditableNote 
                  note={selectedNote} 
                  onSave={handleNoteSave}
                />
              </div>
            )}
            {selectedTask && (
              <div>
                <h4 className="font-medium mb-2">{selectedTask.title}</h4>
                {selectedTask.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedTask.description}
                  </p>
                )}
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <span className="capitalize">{selectedTask.status.replace('_', ' ')}</span>
                  </div>
                  {selectedTask.priority && (
                    <div>
                      <span className="font-medium">Priority:</span>{' '}
                      <span className="capitalize">{selectedTask.priority}</span>
                    </div>
                  )}
                  {selectedTask.due_at && (
                    <div>
                      <span className="font-medium">Due:</span>{' '}
                      <span>{new Date(selectedTask.due_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
