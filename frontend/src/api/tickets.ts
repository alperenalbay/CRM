import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { AVAILABILITY_LABELS, type Availability } from './users'

export interface WorkflowState {
  id: number
  code: string
  name: string
  color: string | null
  category: string
  sort_order: number
  is_default: boolean
}

export interface Agent {
  id: number
  username: string
  full_name: string | null
  role_code: string | null
  availability: string
}

export function agentDisplayName(agent: Agent): string {
  const base = agent.full_name ?? agent.username
  if (agent.availability && agent.availability !== 'uygun') {
    const label = AVAILABILITY_LABELS[agent.availability as Availability] ?? agent.availability
    return `${base} (${label})`
  }
  return base
}

export interface Ticket {
  id: number
  ticket_no: string
  customer_id: number
  customer_name: string | null
  subject: string
  description: string | null
  priority: string
  status_id: number
  status_code: string | null
  status_name: string | null
  status_color: string | null
  assigned_to_id: number | null
  assigned_to_name: string | null
  created_by: number
  created_by_name: string | null
  created_at: string
  updated_at: string
  due_at: string | null
  closed_at: string | null
}

export interface TicketActivity {
  id: number
  user_name: string | null
  action: string
  detail: string | null
  created_at: string
}

export interface TicketTransfer {
  id: number
  from_user_name: string | null
  to_user_name: string | null
  reason: string | null
  transferred_by_name: string | null
  transferred_at: string
}

export interface TicketStatusHistory {
  id: number
  from_status_name: string | null
  to_status_name: string | null
  comment: string | null
  changed_by_name: string | null
  created_at: string
}

export interface TicketDetail {
  ticket: Ticket
  activities: TicketActivity[]
  transfers: TicketTransfer[]
  status_history: TicketStatusHistory[]
}

export interface TicketInput {
  customer_id: number
  subject: string
  description?: string | null
  priority: string
  assigned_to_id?: number | null
  due_at?: string | null
}

export interface TicketFilters {
  q?: string
  status_code?: string
  priority?: string
  assigned_to?: number
}

export function useTickets(filters: TicketFilters) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<Ticket[]>('/tickets', { params: filters })
      return data
    },
  })
}

export function useTicketDetail(ticketId: number | null) {
  return useQuery({
    queryKey: ['tickets', ticketId, 'detail'],
    queryFn: async () => {
      const { data } = await apiClient.get<TicketDetail>(`/tickets/${ticketId}/detail`)
      return data
    },
    enabled: ticketId != null,
  })
}

export function useTicketStates() {
  return useQuery({
    queryKey: ['workflow', 'states', 'ticket'],
    queryFn: async () => {
      const { data } = await apiClient.get<WorkflowState[]>('/workflow/states', {
        params: { category: 'ticket' },
      })
      return data
    },
  })
}

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data } = await apiClient.get<Agent[]>('/users/agents')
      return data
    },
    refetchInterval: 30_000,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TicketInput) => {
      const { data } = await apiClient.post<Ticket>('/tickets', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  })
}

export function useChangeStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      ticketId,
      status_code,
      comment,
    }: {
      ticketId: number
      status_code: string
      comment?: string
    }) => {
      const { data } = await apiClient.post<Ticket>(`/tickets/${ticketId}/status`, {
        status_code,
        comment,
      })
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.ticketId, 'detail'] })
      queryClient.invalidateQueries({ queryKey: ['me', 'activity'] })
    },
  })
}

export function useTransferTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      ticketId,
      to_user_id,
      reason,
    }: {
      ticketId: number
      to_user_id: number
      reason?: string
    }) => {
      const { data } = await apiClient.post<Ticket>(`/tickets/${ticketId}/transfer`, {
        to_user_id,
        reason,
      })
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.ticketId, 'detail'] })
    },
  })
}

export function useAddComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, comment }: { ticketId: number; comment: string }) => {
      const { data } = await apiClient.post<TicketActivity>(
        `/tickets/${ticketId}/comments`,
        { comment },
      )
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.ticketId, 'detail'] })
      queryClient.invalidateQueries({ queryKey: ['me', 'activity'] })
    },
  })
}
