'use client';

import * as React from 'react';
import { FileText, CheckSquare, Plus, Search, Filter, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button/Button';
import { Input } from '@/components/ui/input/Input';
import { NoteCard } from './NoteCard';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import { useNotes, useTasks } from '@/hooks/useApi';
import type { Note, Task } from '@/types/api';
import type { NoteSelectHandler, TaskSelectHandler } from '@/types/ui';
import { ConversationList } from './ConversationList';
import { NotesFilter, NotesFilterState, applyNotesFilter } from './NotesFilter';

interface SidebarContainerProps {
  className?: string;
  onNoteSelect: NoteSelectHandler;
  onTaskSelect: TaskSelectHandler;
  selectedNote: Note | null;
  selectedTask: Task | null;
  currentConversationId?: number | null;
  onConversationSelect?: (conversationId: number) => void;
  onNewConversation?: () => void;
}

type TabType = 'conversations' | 'notes' | 'tasks';

export function SidebarContainer({ 
  className, 
  onNoteSelect, 
  onTaskSelect,
  selectedNote,
  selectedTask,
  currentConversationId,
  onConversationSelect,
  onNewConversation
}: SidebarContainerProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>('conversations');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showCompleted, setShowCompleted] = React.useState(false);
  
  // Notes filter state
  const [notesFilter, setNotesFilter] = React.useState<NotesFilterState>({
    searchQuery: '',
    selectedTags: [],
    selectedCategories: [],
    sortBy: 'created',
    sortOrder: 'desc',
    dateRange: 'all'
  });

  // Fetch data
  const { data: notes = [], isLoading: notesLoading, error: notesError } = useNotes();
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useTasks();

  // Filter functions
  const filteredNotes = React.useMemo(() => {
    return applyNotesFilter(notes, notesFilter);
  }, [notes, notesFilter]);

  const filteredTasks = React.useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = showCompleted || task.status !== 'completed';
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      // Sort by: incomplete first, then by due date, then by created date
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      
      if (a.due_at && b.due_at) {
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      }
      if (a.due_at && !b.due_at) return -1;
      if (!a.due_at && b.due_at) return 1;
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tasks, searchQuery, showCompleted]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Clear selections when switching tabs
    if (tab === 'notes') {
      onTaskSelect(null);
    } else {
      onNoteSelect(null);
    }
  };

  const handleTagClick = (tag: string) => {
    setNotesFilter(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
    // Switch to notes tab if not already there
    if (activeTab !== 'notes') {
      setActiveTab('notes');
    }
  };

  const isLoading = activeTab === 'notes' ? notesLoading : tasksLoading;
  const error = activeTab === 'notes' ? notesError : tasksError;
  const isEmpty = activeTab === 'notes' ? filteredNotes.length === 0 : filteredTasks.length === 0;

  return (
    <div className={cn('flex flex-col h-full bg-background/50 backdrop-blur-sm', className)}>
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gradient">Workspace</h2>
            <p className="text-sm text-muted-foreground">Organize your thoughts</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Collapse sidebar button */}
            <Button 
              size="icon" 
              variant="ghost" 
              className="rounded-xl hover:bg-muted hover:text-foreground transition-all"
              onClick={() => {
                // Dispatch a custom event to collapse sidebar from header
                window.dispatchEvent(new CustomEvent('sidebar:collapse'));
              }}
              title="Collapse sidebar"
            >
              <span className="sr-only">Collapse sidebar</span>
              {/* Using MessageSquare rotated as a simple caret-like icon */}
              <MessageSquare className="h-5 w-5 rotate-180" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gradient-to-r from-muted/50 to-accent/20 rounded-xl p-1 backdrop-blur-sm border border-border/30">
          <button
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200',
              activeTab === 'conversations' 
                ? 'bg-card text-foreground shadow-md border border-border/50' 
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            )}
            onClick={() => handleTabChange('conversations')}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chats</span>
          </button>
          <button
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200',
              activeTab === 'notes' 
                ? 'bg-card text-foreground shadow-md border border-border/50' 
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            )}
            onClick={() => handleTabChange('notes')}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Notes</span>
            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-xs font-semibold">
              {notes.length}
            </span>
          </button>
          <button
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200',
              activeTab === 'tasks' 
                ? 'bg-card text-foreground shadow-md border border-border/50' 
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            )}
            onClick={() => handleTabChange('tasks')}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Tasks</span>
            <span className="bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded-full text-xs font-semibold">
              {tasks.filter(t => t.status !== 'completed').length}
            </span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      {activeTab !== 'conversations' && (
      <div className="p-6 border-b border-border/50">
        {activeTab === 'notes' ? (
          <NotesFilter
            notes={notes}
            filterState={notesFilter}
            onFilterChange={setNotesFilter}
          />
        ) : (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 rounded-xl border-border/50 bg-card/30 backdrop-blur-sm focus:bg-card/50 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={showCompleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
                className={cn(
                  "text-xs rounded-lg transition-all",
                  showCompleted 
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-md" 
                    : "border-border/50 hover:bg-card/50"
                )}
              >
                <Filter className="h-3 w-3 mr-1" />
                {showCompleted ? 'Hide' : 'Show'} Completed
              </Button>
            </div>
          </>
        )}
      </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'conversations' ? (
          <ConversationList
            currentConversationId={currentConversationId || null}
            onConversationSelect={onConversationSelect || (() => {})}
            onNewConversation={onNewConversation || (() => {})}
          />
        ) : (
          <div className="p-6">
            {error ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <div className="w-6 h-6 rounded-full bg-destructive/20" />
                </div>
                <p className="text-muted-foreground mb-2">Failed to load {activeTab}</p>
                <p className="text-sm text-muted-foreground">Please try refreshing</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent mx-auto mb-4 animate-spin" />
                <div className="text-muted-foreground">Loading {activeTab}...</div>
              </div>
            ) : isEmpty ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6">
                  {activeTab === 'notes' ? <FileText className="h-8 w-8 text-primary" /> : <CheckSquare className="h-8 w-8 text-accent-foreground" />}
                </div>
                <h3 className="text-lg font-semibold mb-2">No {activeTab} found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ? 'Try adjusting your search terms' : `Start by creating your first ${activeTab.slice(0, -1)} in the chat`}
                </p>
                {!searchQuery && (
                  <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-border/50 rounded-xl p-4 text-sm text-muted-foreground">
                    💡 Type in the chat to automatically create {activeTab}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {activeTab === 'notes' ? (
                  filteredNotes.map((note, index) => (
                    <div key={note.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <NoteCard
                        note={note}
                        isSelected={selectedNote?.id === note.id}
                        onSelect={onNoteSelect}
                        onTagClick={handleTagClick}
                      />
                    </div>
                  ))
                ) : (
                  filteredTasks.map((task, index) => (
                    <div key={task.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <TaskCard
                        task={task}
                        isSelected={selectedTask?.id === task.id}
                        onSelect={onTaskSelect}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
