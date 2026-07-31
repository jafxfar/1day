/**
 * useAuth — thin wrapper around the backend auth endpoints.
 * Exposes login, register, logout, and current user state.
 */
import { useState, useCallback } from 'react'
import { authApi, type AuthUser } from '../api/auth'

export type { AuthUser } from '../api/auth'

export const useAuth = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser | null> => {
      setLoading(true)
      setError(null)

      try {
        const { user } = await authApi.login({ email, password })
        return user
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : String(caughtError))
        return null
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
    ): Promise<AuthUser | null> => {
      setLoading(true)
      setError(null)

      try {
        const { user } = await authApi.register({
          email,
          password,
          firstName,
          lastName,
        })
        return user
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : String(caughtError))
        return null
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const logout = useCallback(async (): Promise<void> => {
    await authApi.logout().catch(() => null)
  }, [])

  return { login, register, logout, loading, error, setError }
}
