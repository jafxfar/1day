/**
 * useCurrentUser — fetches the authenticated user from the backend.
 * Replaces the Retool-specific version with a direct /api/auth/me call.
 */
import { useState, useEffect, useCallback } from 'react'
import { authApi, type AuthUser } from '../api/auth'

export type CurrentUser = AuthUser

export const useCurrentUser = () => {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    setLoading(true)

    try {
      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isActive = true

    void authApi.getCurrentUser()
      .then((currentUser) => {
        if (isActive) setUser(currentUser)
      })
      .catch(() => {
        if (isActive) setUser(null)
      })
      .finally(() => {
        if (isActive) setLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  return { user, loading, refetch: fetchUser, setUser }
}