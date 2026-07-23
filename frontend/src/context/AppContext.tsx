/**
 * Thin app-level context.
 * Only holds state that is genuinely shared across pages:
 *   - Authenticated user info
 *   - Today's checkins (morning + evening) — loaded once on mount/login, refetchable
 *
 * Per-page data (goals, habits, journal) lives in those page components.
 */
import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useCurrentUser, type CurrentUser } from '../hooks/useCurrentUser'
import { useAuthContext } from './AuthContext'
import { useGetTodayCheckins } from '../hooks/backend/checkins'
import type { MorningCheckin, EveningReflection, TodayCheckins } from '../lib/types'
import { cast } from '../lib/types'

const API_BASE = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000'

interface AppContextValue {
  /** Authenticated user info */
  user: CurrentUser | null
  loadingUser: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<boolean>
  logout: () => Promise<void>
  /** Display name from session */
  userName: string
  userEmail: string
  userInitial: string
  /** Today's morning checkin — null if not yet completed */
  morningCheckin: MorningCheckin | null
  /** Today's evening reflection — null if not yet completed */
  eveningReflection: EveningReflection | null
  hasCompletedMorning: boolean
  hasCompletedEvening: boolean
  isLoadingCheckins: boolean
  /** Call after saving a checkin to update the shared state */
  refetchCheckins: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, loading: loadingUser, setUser } = useCurrentUser()
  const { data: rawCheckins, loading: loadingCheckins, trigger: fetchCheckins } = useGetTodayCheckins()

  // Fetch checkins once user is logged in
  useEffect(() => {
    if (user) {
      void fetchCheckins()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        return true
      } else {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Invalid credentials')
      }
    } catch (e) {
      throw e
    }
  }

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        return true
      } else {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Registration failed')
      }
    } catch (e) {
      throw e
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (e) {
      console.error('Logout error', e)
    } finally {
      setUser(null)
    }
  }

  const checkins: TodayCheckins = cast.todayCheckins(rawCheckins)

  const value: AppContextValue = {
    user,
    loadingUser,
    login,
    register,
    logout,
    userName:     user?.firstName ?? 'Friend',
    userEmail:    user?.email     ?? '',
    userInitial:  (user?.firstName?.[0] ?? '?').toUpperCase(),
    morningCheckin:     user ? checkins.morning : null,
    eveningReflection:  user ? checkins.evening : null,
    hasCompletedMorning: user ? checkins.morning != null : false,
    hasCompletedEvening: user ? checkins.evening != null : false,
    isLoadingCheckins:   loadingCheckins,
    refetchCheckins: () => {
      if (user) {
        void fetchCheckins({ skipCache: true })
      }
    },
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be called inside <AppProvider>')
  return ctx
}
