import { useMutation } from '@tanstack/react-query'
import { apiClient } from './client'

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginInput {
  username: string
  password: string
}

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: LoginInput) => {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', payload)
      return data
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: { current_password: string; new_password: string }) => {
      await apiClient.post('/auth/change-password', payload)
    },
  })
}
