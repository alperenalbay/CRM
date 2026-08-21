import { useQuery } from '@tanstack/react-query'
import type { Ticket } from './tickets'
import { apiClient } from './client'

export interface DashboardSummary {
  customer_count: number
  open_ticket_count: number
  closed_ticket_count: number
  open_task_count: number
  sales_total: number
  order_count: number
  recent_tickets: Ticket[]
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary')
      return data
    },
  })
}
