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
import { useGetTodayCheckins } from '../hooks/backend/checkins'
import type { MorningCheckin, EveningReflection, TodayCheckins } from '../lib/types'
import { cast } from '../lib/types'
import { authApi } from '../api/auth'

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
    const { user: authenticatedUser } = await authApi.login({ email, password })
    setUser(authenticatedUser)
    return true
  }

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<boolean> => {
    const { user: registeredUser } = await authApi.register({
      email,
      password,
      firstName,
      lastName,
    })
    setUser(registeredUser)
    return true
  }

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout()
    } catch (caughtError) {
      console.error('Logout error', caughtError)
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
        void fetchCheckins(undefined, { skipCache: true })
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
