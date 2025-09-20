import axios, { AxiosInstance } from 'axios';
import type {
  Conversation,
  ConversationCreateRequest,
  Message,
  MessageRequest,
  Note,
  NoteCreateRequest,
  NoteUpdateRequest,
  Task,
  TaskCreateRequest,
  TaskUpdateRequest,
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  OrchestratorResult,
} from '@/types/api';

/**
 * API Client Configuration
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for adding auth headers
    this.client.interceptors.request.use((config) => {
      // Add auth token when available
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Health check
   */
  async health(): Promise<{ status: string; service: string; port: number }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  /**
   * Conversation Management
   */
  async getConversations(): Promise<Conversation[]> {
    const response = await this.client.get('/api/conversations');
    return response.data;
  }

  async getConversation(conversationId: number): Promise<Conversation> {
    const response = await this.client.get(`/api/conversations/${conversationId}`);
    return response.data;
  }

  async createConversation(data?: ConversationCreateRequest): Promise<Conversation> {
    const response = await this.client.post('/api/conversations', data || {});
    return response.data;
  }

  async deleteConversation(conversationId: number): Promise<void> {
    await this.client.delete(`/api/conversations/${conversationId}`);
  }

  async getConversationMessages(conversationId: number): Promise<Message[]> {
    const response = await this.client.get(`/api/conversations/${conversationId}/messages`);
    return response.data;
  }

  /**
   * Message Handling (Core Orchestrator)
   */
  async sendMessage(
    conversationId: number,
    messageRequest: MessageRequest,
    idempotencyKey?: string
  ): Promise<OrchestratorResult> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await this.client.post(
      `/api/conversations/${conversationId}/messages`,
      messageRequest,
      { headers }
    );
    return response.data;
  }

  /**
   * Notes Management
   */
  async getNotes(): Promise<Note[]> {
    const response = await this.client.get('/api/notes');
    return response.data;
  }

  async createNote(noteRequest: NoteCreateRequest): Promise<Note> {
    const response = await this.client.post('/api/notes', noteRequest);
    return response.data;
  }

  async updateNote(noteId: number, updates: NoteUpdateRequest): Promise<Note> {
    const response = await this.client.patch(`/api/notes/${noteId}`, updates);
    return response.data;
  }

  async deleteNote(noteId: number): Promise<void> {
    await this.client.delete(`/api/notes/${noteId}`);
  }

  /**
   * Tasks Management
   */
  async getTasks(): Promise<Task[]> {
    const response = await this.client.get('/api/tasks');
    return response.data;
  }

  async createTask(taskRequest: TaskCreateRequest): Promise<Task> {
    const response = await this.client.post('/api/tasks', taskRequest);
    return response.data;
  }

  async updateTask(taskId: number, updates: TaskUpdateRequest): Promise<Task> {
    const response = await this.client.patch(`/api/tasks/${taskId}`, updates);
    return response.data;
  }

  async deleteTask(taskId: number): Promise<void> {
    await this.client.delete(`/api/tasks/${taskId}`);
  }

  /**
   * Categories Management
   */
  async getCategories(): Promise<Category[]> {
    const response = await this.client.get('/api/categories');
    return response.data;
  }

  async createCategory(categoryRequest: CategoryCreateRequest): Promise<Category> {
    const response = await this.client.post('/api/categories', categoryRequest);
    return response.data;
  }

  async updateCategory(categoryId: number, updates: CategoryUpdateRequest): Promise<Category> {
    const response = await this.client.put(`/api/categories/${categoryId}`, updates);
    return response.data;
  }

  async deleteCategory(categoryId: number): Promise<void> {
    await this.client.delete(`/api/categories/${categoryId}`);
  }

  async getCategoryStats(categoryId: number): Promise<{
    category_id: number;
    notes_count: number;
    tasks_count: number;
    completed_tasks: number;
    pending_tasks: number;
  }> {
    const response = await this.client.get(`/api/categories/${categoryId}/stats`);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export individual service functions for easier testing and mocking
export const conversationService = {
  getAll: () => apiClient.getConversations(),
  get: (id: number) => apiClient.getConversation(id),
  create: (data?: ConversationCreateRequest) => apiClient.createConversation(data),
  delete: (id: number) => apiClient.deleteConversation(id),
  getMessages: (id: number) => apiClient.getConversationMessages(id),
};

export const messageService = {
  send: (conversationId: number, message: MessageRequest, idempotencyKey?: string) =>
    apiClient.sendMessage(conversationId, message, idempotencyKey),
};

export const noteService = {
  getAll: () => apiClient.getNotes(),
  create: (note: NoteCreateRequest) => apiClient.createNote(note),
  update: (id: number, updates: Partial<NoteCreateRequest>) => apiClient.updateNote(id, updates),
  delete: (id: number) => apiClient.deleteNote(id),
};

export const taskService = {
  getAll: () => apiClient.getTasks(),
  create: (task: TaskCreateRequest) => apiClient.createTask(task),
  update: (id: number, updates: TaskUpdateRequest) => apiClient.updateTask(id, updates),
  delete: (id: number) => apiClient.deleteTask(id),
};

export const categoryService = {
  getAll: () => apiClient.getCategories(),
  create: (category: CategoryCreateRequest) => apiClient.createCategory(category),
  update: (id: number, updates: CategoryUpdateRequest) => apiClient.updateCategory(id, updates),
  delete: (id: number) => apiClient.deleteCategory(id),
  getStats: (id: number) => apiClient.getCategoryStats(id),
};

export default apiClient;
