/**
 * useCurrentUser — fetches the authenticated user from the backend.
 * Replaces the Retool-specific version with a direct /api/auth/me call.
 */
import { useState, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env['VITE_API_URL'] ?? ''

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

async function fetchCurrentUser(): Promise<CurrentUser> {
  const res = await fetch(API_BASE + '/api/auth/me', { credentials: 'include' })
  if (!res.ok) throw new Error('Not authenticated')
  return res.json() as Promise<CurrentUser>
}

export function useCurrentUser(): {
  user: CurrentUser | null
  loading: boolean
  refetch: () => void
} {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetchCurrentUser()
      .then((data) => {
        setUser(data)
        setLoading(false)
      })
      .catch(() => {
        setUser(null)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { user, loading, refetch: load }
}
