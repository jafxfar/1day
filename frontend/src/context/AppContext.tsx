
/**
 * Thin app-level context.
 * Only holds state that is genuinely shared across pages:
 *   - Authenticated user info
 *   - Today's checkins (morning + evening) — loaded once on mount, refetchable
 *
 * Per-page data (goals, habits, journal) lives in those page components.
 */
import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useAuthContext } from './AuthContext'
import { useGetTodayCheckins } from '../hooks/backend/checkins'
import type { MorningCheckin, EveningReflection, TodayCheckins } from '../lib/types'
import { cast } from '../lib/types'

interface AppContextValue {
  /** Display name from Retool session */
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
  const { user }     = useAuthContext()
  const { data: rawCheckins, loading: loadingCheckins, trigger: fetchCheckins } = useGetTodayCheckins()

  // Fetch once on mount
  useEffect(() => {
    void fetchCheckins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkins: TodayCheckins = cast.todayCheckins(rawCheckins)

  const value: AppContextValue = {
    userName:     user?.firstName ?? 'Friend',
    userEmail:    user?.email     ?? '',
    userInitial:  (user?.firstName?.[0] ?? '?').toUpperCase(),
    morningCheckin:     checkins.morning,
    eveningReflection:  checkins.evening,
    hasCompletedMorning: checkins.morning != null,
    hasCompletedEvening: checkins.evening != null,
    isLoadingCheckins:   loadingCheckins,
    refetchCheckins: () => void fetchCheckins({ skipCache: true }),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be called inside <AppProvider>')
  return ctx
}
