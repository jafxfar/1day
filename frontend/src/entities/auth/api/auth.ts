import {
  apiRoutes,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from '@life-os/contracts'
import { request } from '../../../shared/api/client'

type AuthResponse = {
  user: AuthUser
}

export const authApi = {
  getCurrentUser: () => request<AuthUser>(apiRoutes.auth.me),
  login: (payload: LoginPayload) => request<AuthResponse>(apiRoutes.auth.login, {
    method: 'POST',
    body: payload,
  }),
  register: (payload: RegisterPayload) => request<AuthResponse>(apiRoutes.auth.register, {
    method: 'POST',
    body: payload,
  }),
  logout: () => request<{ ok: boolean }>(apiRoutes.auth.logout, {
    method: 'POST',
  }),
}
