/**
 * useAuth — thin wrapper around the backend auth endpoints.
 * Exposes login, register, logout, and current user state.
 */
import { useState, useCallback } from 'react'

const API_BASE = import.meta.env['VITE_API_URL'] ?? ''

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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string }
    throw new Error(body.error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser | null> => {
      setLoading(true)
      setError(null)
      try {
        const { user } = await apiFetch<{ user: AuthUser }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setLoading(false)
        return user
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        setLoading(false)
        return null
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
        const { user } = await apiFetch<{ user: AuthUser }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, firstName, lastName }),
        })
        setLoading(false)
        return user
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        setLoading(false)
        return null
      }
    },
    [],
  )

  const logout = useCallback(async (): Promise<void> => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => null)
  }, [])

  return { login, register, logout, loading, error, setError }
}
