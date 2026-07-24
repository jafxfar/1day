/**
 * useCurrentUser — fetches the authenticated user from the backend.
 * Replaces the Retool-specific version with a direct /api/auth/me call.
 */
import { useState, useEffect, useCallback } from 'react'

export type CurrentUser = {
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

const API_BASE = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000'

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: 'include',
      })
      if (!res.ok) {
        setUser(null)
      } else {
        const data = await res.json()
        setUser(data)
      }
    } catch (e) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUser()
  }, [fetchUser])

  return { user, loading, refetch: fetchUser, setUser }
}