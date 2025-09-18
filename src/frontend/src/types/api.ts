// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Core Entity Types
export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
}

export interface ConversationCreateRequest {
  title?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_in?: number;
  tokens_out?: number;
  latency_ms?: number;
  created_at: string;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  user_id: number;
  conversation_id: number;
  category_id: number | null;
  title: string;
  body: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  conversation_id: number;
  category_id: number | null;
  title: string;
  description: string | null;
  due_at: string | null;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | null;
  created_at: string;
  updated_at: string;
}

// Orchestrator Response Types
export interface OrchestratorNoteResult {
  type: 'note';
  note: Note;
}

export interface OrchestratorTaskResult {
  type: 'task';
  task: Task;
}

export type OrchestratorResult = OrchestratorNoteResult | OrchestratorTaskResult;

// API Request Types
export interface MessageRequest {
  text: string;
}

export interface NoteCreateRequest {
  title: string;
  body: string;
  tags?: string[];
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  due_at?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  due_at?: string;
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
}

// Category Request Types
export interface CategoryCreateRequest {
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
}

export interface CategoryUpdateRequest {
  name?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
}
