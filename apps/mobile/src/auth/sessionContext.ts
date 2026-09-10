import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@life-os/contracts'
import { createContext } from 'react'

export type SessionContextValue = {
  user: AuthUser | null
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const SessionContext = createContext<SessionContextValue | null>(null)
