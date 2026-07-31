import {
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useSession } from '../../auth/model/useSession'
import {
  CheckinsContext,
  type CheckinsContextValue,
} from './checkinsContext'
import { useGetTodayCheckins } from './useCheckins'

export const CheckinsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useSession()
  const {
    data,
    loading,
    trigger: fetchTodayCheckins,
  } = useGetTodayCheckins()

  useEffect(() => {
    if (!user) return

    void fetchTodayCheckins()
  }, [fetchTodayCheckins, user])

  const refetch = useCallback(() => {
    if (user) {
      void fetchTodayCheckins(undefined, { skipCache: true })
    }
  }, [fetchTodayCheckins, user])

  const value = useMemo<CheckinsContextValue>(() => {
    const morningCheckin = user ? data?.morning ?? null : null
    const eveningReflection = user ? data?.evening ?? null : null

    return {
      morningCheckin,
      eveningReflection,
      hasCompletedMorning: morningCheckin !== null,
      hasCompletedEvening: eveningReflection !== null,
      isLoading: loading,
      refetch,
    }
  }, [data, loading, refetch, user])

  return (
    <CheckinsContext.Provider value={value}>
      {children}
    </CheckinsContext.Provider>
  )
}
