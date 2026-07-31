import { request } from './client'

export interface AuthUser {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
  profilePhotoUrl: string | null
  groups: Array<{ id: number; name: string }>
  metadata: Record<string, unknown>
  sid: string
  externalIdentifier: string | null
  locale: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload extends LoginPayload {
  firstName: string
  lastName: string
}

type AuthResponse = {
  user: AuthUser
}

export const authApi = {
  getCurrentUser: () => request<AuthUser>('/api/auth/me'),
  login: (payload: LoginPayload) => request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: payload,
  }),
  register: (payload: RegisterPayload) => request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: payload,
  }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', {
    method: 'POST',
  }),
}
