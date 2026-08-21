import { create } from 'zustand'
import type { MeResponse } from '@/api/users'

interface AuthState {
  me: MeResponse | null
  setMe: (me: MeResponse | null) => void
  can: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  me: null,
  setMe: (me) => set({ me }),
  can: (permission) => {
    const { me } = get()
    if (!me) return false
    if (me.role === 'admin') return true
    return me.permissions.includes(permission)
  },
}))

export function useCanCreateUsers() {
  return useAuthStore((s) => s.can('users.create'))
}

export function useCanUpdateUsers() {
  return useAuthStore((s) => s.can('users.update'))
}

export function useCanManageGroups() {
  return useAuthStore((s) => s.can('groups.manage'))
}
