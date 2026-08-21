import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { WorkflowState } from './tickets'
import { apiClient } from './client'

export interface Task {
  id: number
  title: string
  description: string | null
  priority: string
  status_id: number
  status_code: string | null
  status_name: string | null
  status_color: string | null
  assigned_to_id: number | null
  assigned_to_name: string | null
  assigned_by_name: string | null
  related_ticket_id: number | null
  due_at: string | null
  created_at: string
  updated_at: string
}

export interface TaskAssignment {
  id: number
  user_name: string | null
  assigned_by_name: string | null
  assigned_at: string
}

export interface TaskDetail {
  task: Task
  assignments: TaskAssignment[]
}

export interface TaskInput {
  title: string
  description?: string | null
  priority: string
  assigned_to_id?: number | null
  related_ticket_id?: number | null
  due_at?: string | null
}

export function useTasks(params?: {
  status_code?: string
  priority?: string
  assigned_to?: number
}) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: async () => {
      const { data } = await apiClient.get<Task[]>('/tasks', { params })
      return data
    },
  })
}

export function useTaskDetail(taskId: number | null) {
  return useQuery({
    queryKey: ['tasks', taskId, 'detail'],
    queryFn: async () => {
      const { data } = await apiClient.get<TaskDetail>(`/tasks/${taskId}/detail`)
      return data
    },
    enabled: taskId != null,
  })
}

export function useTaskStates() {
  return useQuery({
    queryKey: ['workflow', 'states', 'task'],
    queryFn: async () => {
      const { data } = await apiClient.get<WorkflowState[]>('/workflow/states', {
        params: { category: 'task' },
      })
      return data
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TaskInput) => {
      const { data } = await apiClient.post<Task>('/tasks', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useChangeTaskStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, status_code }: { taskId: number; status_code: string }) => {
      const { data } = await apiClient.post<Task>(`/tasks/${taskId}/status`, { status_code })
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId, 'detail'] })
      queryClient.invalidateQueries({ queryKey: ['me', 'activity'] })
    },
  })
}

export function useAssignTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, to_user_id }: { taskId: number; to_user_id: number }) => {
      const { data } = await apiClient.post<Task>(`/tasks/${taskId}/assign`, { to_user_id })
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId, 'detail'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      taskId,
      payload,
    }: {
      taskId: number
      payload: Partial<Pick<Task, 'description' | 'title' | 'priority' | 'due_at'>>
    }) => {
      const { data } = await apiClient.patch<Task>(`/tasks/${taskId}`, payload)
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId, 'detail'] })
      queryClient.invalidateQueries({ queryKey: ['me', 'activity'] })
    },
  })
}
