/**
 * AuthContext — app-wide authentication state.
 * Wraps useCurrentUser and exposes a refresh function so login/logout
 * can synchronise the global user across all pages.
 */
import { createContext, useContext, type ReactNode } from 'react'
import { useCurrentUser, type CurrentUser } from '../hooks/useCurrentUser'

interface AuthContextValue {
  user: CurrentUser | null
  loading: boolean
  /** Call after login, register, or logout to sync the global user. */
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading, refetch } = useCurrentUser()

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: refetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be called inside <AuthProvider>')
  return ctx
}
