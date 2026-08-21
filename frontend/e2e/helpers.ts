const BASE = process.env.API_BASE_URL ?? 'http://localhost:8000/api/v1'

async function request<T>(method: string, path: string, token?: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${method} ${path} -> ${response.status}: ${text}`)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const apiClient = {
  login: async (username: string, password: string) => {
    const data = await request<{ access_token: string }>('POST', '/auth/login', undefined, {
      username,
      password,
    })
    return data.access_token
  },
  get: <T>(path: string, token: string) => request<T>('GET', path, token),
  post: <T>(path: string, body: unknown, token: string) => request<T>('POST', path, token, body),
  patch: <T>(path: string, body: unknown, token: string) => request<T>('PATCH', path, token, body),
}
