import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export interface CustomerContact {
  id: number
  full_name: string
  title: string | null
  email: string | null
  phone: string | null
  is_primary: boolean
}

export interface Customer {
  id: number
  customer_code: string
  company_name: string
  customer_type: string
  tax_no: string | null
  tax_office: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  address: string | null
  city: string | null
  district: string | null
  country: string | null
  notes: string | null
  created_at: string
  updated_at: string
  contacts: CustomerContact[]
}

export interface TicketHistory {
  id: number
  ticket_no: string
  subject: string
  priority: string
  status_name: string | null
  created_at: string
}

export interface OrderHistory {
  id: number
  order_no: string
  order_date: string
  total_amount: number
  status: string
}

export interface CustomerHistory {
  customer: Customer
  tickets: TicketHistory[]
  orders: OrderHistory[]
}

export interface CustomerInput {
  company_name: string
  customer_type: string
  tax_no?: string | null
  tax_office?: string | null
  email?: string | null
  phone?: string | null
  mobile?: string | null
  address?: string | null
  city?: string | null
  district?: string | null
  country?: string | null
  notes?: string | null
}

export function useSearchCustomers(q: string) {
  return useQuery({
    queryKey: ['customers', 'search', q],
    queryFn: async () => {
      const { data } = await apiClient.get<Customer[]>('/customers/search', {
        params: { q },
      })
      return data
    },
    placeholderData: (prev) => prev,
  })
}

export function useCustomerHistory(customerId: number | null) {
  return useQuery({
    queryKey: ['customers', customerId, 'history'],
    queryFn: async () => {
      const { data } = await apiClient.get<CustomerHistory>(
        `/customers/${customerId}/history`,
      )
      return data
    },
    enabled: customerId != null,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CustomerInput) => {
      const { data } = await apiClient.post<Customer>('/customers', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  })
}
