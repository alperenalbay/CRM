import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export interface Product {
  id: number
  code: string
  name: string
  unit_price: number
  vat_rate: number
  unit: string | null
  is_active: boolean
}

export interface ProductInput {
  code: string
  name: string
  unit_price: number
  vat_rate: number
  unit?: string | null
}

export interface OrderItem {
  id: number
  product_id: number
  product_code: string | null
  product_name: string | null
  quantity: number
  unit_price: number
  line_total: number
}

export interface OrderItemInput {
  product_id: number
  quantity: number
  unit_price?: number | null
}

export interface SalesOrder {
  id: number
  order_no: string
  customer_id: number
  customer_name: string | null
  order_date: string
  total_amount: number
  status: string
  created_by_name: string | null
  created_at: string
}

export interface SalesOrderDetail extends SalesOrder {
  items: OrderItem[]
}

export interface OrderInput {
  customer_id: number
  status: string
  items: OrderItemInput[]
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await apiClient.get<Product[]>('/products')
      return data
    },
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ProductInput) => {
      const { data } = await apiClient.post<Product>('/products', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      productId,
      payload,
    }: {
      productId: number
      payload: Partial<ProductInput> & { is_active?: boolean }
    }) => {
      const { data } = await apiClient.patch<Product>(`/products/${productId}`, payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (productId: number) => {
      await apiClient.delete(`/products/${productId}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useOrders(params?: { customer_id?: number; status?: string }) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const { data } = await apiClient.get<SalesOrder[]>('/orders', { params })
      return data
    },
  })
}

export function useOrderDetail(orderId: number | null) {
  return useQuery({
    queryKey: ['orders', orderId, 'detail'],
    queryFn: async () => {
      const { data } = await apiClient.get<SalesOrderDetail>(`/orders/${orderId}`)
      return data
    },
    enabled: orderId != null,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: OrderInput) => {
      const { data } = await apiClient.post<SalesOrderDetail>('/orders', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const { data } = await apiClient.patch<SalesOrder>(`/orders/${orderId}`, { status })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders', undefined, 'detail'] })
    },
  })
}
