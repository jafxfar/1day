import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@life-os/contracts'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from './api'
import { SessionContext, type SessionContextValue } from './sessionContext'
import { tokenStore } from './tokenStore'

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = await tokenStore.get()
      if (!token) {
        setUser(null)
        return
      }
      setUser(await authApi.getCurrentUser())
    } catch {
      await tokenStore.clear()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isActive = true

    void (async () => {
      try {
        const token = await tokenStore.get()
        if (!token) {
          if (isActive) setUser(null)
          return
        }
        const currentUser = await authApi.getCurrentUser()
        if (isActive) setUser(currentUser)
      } catch {
        await tokenStore.clear()
        if (isActive) setUser(null)
      } finally {
        if (isActive) setIsLoading(false)
      }
    })()

    return () => {
      isActive = false
    }
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authApi.login(payload)
    if (typeof response?.token !== 'string' || !response.token) {
      throw new Error('Login succeeded but no token was returned by the API')
    }
    await tokenStore.set(response.token)
    setUser(response.user)
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authApi.register(payload)
    if (typeof response?.token !== 'string' || !response.token) {
      throw new Error('Register succeeded but no token was returned by the API')
    }
    await tokenStore.set(response.token)
    setUser(response.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Cookie logout is best-effort for Bearer clients
    } finally {
      await tokenStore.clear()
      setUser(null)
    }
  }, [])

  const value = useMemo<SessionContextValue>(() => ({
    user,
    isLoading,
    login,
    register,
    logout,
    refresh,
  }), [isLoading, login, logout, refresh, register, user])

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}
