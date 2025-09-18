// UI State Types
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentInput: string;
}

export interface SidebarState {
  activeTab: 'notes' | 'tasks';
  isExpanded: boolean;
  selectedNote: Note | null;
  selectedTask: Task | null;
}

export interface AppState {
  currentConversationId: number | null;
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
}

// Component Props Types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Event Handler Types
export type MessageHandler = (message: string) => void;
export type NoteSelectHandler = (note: Note | null) => void;
export type TaskSelectHandler = (task: Task | null) => void;
export type TaskUpdateHandler = (taskId: number, updates: Partial<Task>) => void;

// Import Message type from api.ts
import type { Message, Note, Task, User } from './api';
