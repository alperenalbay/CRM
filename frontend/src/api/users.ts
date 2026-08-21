import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export interface MeResponse {
  id: number
  username: string
  full_name: string | null
  email: string | null
  role: string | null
  is_active: boolean
  permissions: string[]
  groups: string[]
  availability: string
}

export type Availability = 'uygun' | 'yemekte' | 'disarda' | 'molada'

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  uygun: 'Uygun',
  yemekte: 'Yemekte',
  disarda: 'Dışarıda',
  molada: 'Molada',
}

export const AVAILABILITY_COLORS: Record<Availability, string> = {
  uygun: 'green',
  yemekte: 'orange',
  disarda: 'magenta',
  molada: 'blue',
}

export interface RoleOut {
  id: number
  code: string
  name: string
}

export interface UserOut {
  id: number
  username: string
  full_name: string | null
  email: string | null
  role: string | null
  is_active: boolean
  permissions: string[]
  groups: string[]
  availability: string
}

export interface UserCreateInput {
  username: string
  full_name?: string | null
  email?: string | null
  password: string
  role_code: string
  group_ids?: number[]
}

export interface UserUpdateInput {
  full_name?: string | null
  email?: string | null
  password?: string | null
  role_code?: string | null
  group_ids?: number[] | null
  is_active?: boolean
}

export interface PermissionOut {
  code: string
  name: string
  module: string
}

export interface PermissionGroupOut {
  id: number
  code: string
  name: string
  description: string | null
  is_active: boolean
  permissions: PermissionOut[]
  user_ids: number[]
}

export interface PermissionGroupCreateInput {
  code: string
  name: string
  description?: string | null
  permission_codes: string[]
  user_ids?: number[]
}

export interface PermissionGroupUpdateInput {
  name?: string
  description?: string | null
  is_active?: boolean
  permission_codes?: string[]
  user_ids?: number[]
}

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get<MeResponse>('/auth/me')
      return data
    },
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (availability: Availability) => {
      const { data } = await apiClient.patch<MeResponse>('/users/me/status', {
        availability,
      })
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

export interface TodayActivityItem {
  kind: 'ticket' | 'task'
  id: number
  ref: string | null
  title: string
  action: string
  detail: string | null
  customer_name: string | null
  created_at: string
}

export interface TodayActivityOut {
  username: string
  full_name: string | null
  availability: string
  items: TodayActivityItem[]
}

export function useTodayActivity() {
  return useQuery({
    queryKey: ['me', 'activity'],
    queryFn: async () => {
      const { data } = await apiClient.get<TodayActivityOut>('/users/me/activity')
      return data
    },
    refetchInterval: 60_000,
  })
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await apiClient.get<UserOut[]>('/users')
      return data
    },
  })
}

export function useRoles() {
  return useQuery({
    queryKey: ['users', 'roles'],
    queryFn: async () => {
      const { data } = await apiClient.get<RoleOut[]>('/users/roles')
      return data
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UserCreateInput) => {
      const { data } = await apiClient.post<UserOut>('/users', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: UserUpdateInput }) => {
      const { data } = await apiClient.patch<UserOut>(`/users/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function usePermissionGroups() {
  return useQuery({
    queryKey: ['permission-groups'],
    queryFn: async () => {
      const { data } = await apiClient.get<PermissionGroupOut[]>('/groups')
      return data
    },
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data } = await apiClient.get<PermissionOut[]>('/permissions')
      return data
    },
  })
}

export function useCreatePermissionGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: PermissionGroupCreateInput) => {
      const { data } = await apiClient.post<PermissionGroupOut>('/groups', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-groups'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useUpdatePermissionGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number
      payload: PermissionGroupUpdateInput
    }) => {
      const { data } = await apiClient.patch<PermissionGroupOut>(
        `/groups/${id}`,
        payload,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-groups'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}
