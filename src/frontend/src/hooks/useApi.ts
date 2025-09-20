import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  conversationService, 
  messageService, 
  noteService, 
  taskService,
  categoryService
} from '@/services/api';
import type {
  ConversationCreateRequest,
  MessageRequest,
  NoteUpdateRequest,
  TaskUpdateRequest,
  CategoryUpdateRequest,
} from '@/types/api';

/**
 * Query Keys for React Query
 */
export const queryKeys = {
  conversations: ['conversations'] as const,
  conversationMessages: (id: number) => ['conversations', id, 'messages'] as const,
  notes: ['notes'] as const,
  tasks: ['tasks'] as const,
  categories: ['categories'] as const,
};

/**
 * Conversation Hooks
 */
export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: conversationService.getAll,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data?: ConversationCreateRequest) => conversationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: conversationService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

export function useConversationMessages(conversationId: number | null) {
  return useQuery({
    queryKey: queryKeys.conversationMessages(conversationId!),
    queryFn: () => conversationService.getMessages(conversationId!),
    enabled: conversationId !== null,
  });
}

/**
 * Message Hooks
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      conversationId, 
      message, 
      idempotencyKey 
    }: { 
      conversationId: number; 
      message: MessageRequest; 
      idempotencyKey?: string;
    }) => messageService.send(conversationId, message, idempotencyKey),
    onSuccess: (_, variables) => {
      // Invalidate conversation messages to refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.conversationMessages(variables.conversationId) 
      });
      // Invalidate notes and tasks as they might have been created
      queryClient.invalidateQueries({ queryKey: queryKeys.notes });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
}

/**
 * Notes Hooks
 */
export function useNotes() {
  return useQuery({
    queryKey: queryKeys.notes,
    queryFn: noteService.getAll,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: noteService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: NoteUpdateRequest }) =>
      noteService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: noteService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes });
    },
  });
}

/**
 * Tasks Hooks
 */
export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: taskService.getAll,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: TaskUpdateRequest }) =>
      taskService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'todo' | 'in_progress' | 'completed' | 'cancelled' }) =>
      taskService.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
}

/**
 * Category Hooks
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: categoryService.getAll,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: CategoryUpdateRequest }) =>
      categoryService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useCategoryStats(categoryId: number) {
  return useQuery({
    queryKey: ['categories', categoryId, 'stats'],
    queryFn: () => categoryService.getStats(categoryId),
    enabled: !!categoryId,
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
}
