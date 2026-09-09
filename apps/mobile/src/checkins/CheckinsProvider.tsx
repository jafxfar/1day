import type {
  EveningReflection,
  MorningCheckin,
  SaveEveningReflectionPayload,
  SaveMorningCheckinPayload,
  TodayCheckins,
} from '@life-os/contracts'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useSession } from '../auth/useSession'
import { checkinsApi } from './api'
import { CheckinsContext, type CheckinsContextValue } from './checkinsContext'

export const CheckinsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useSession()
  const userId = user?.id ?? null
  const [data, setData] = useState<TodayCheckins | null>(null)
  const [dataUserId, setDataUserId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchToday = useCallback(async () => {
    if (!userId) {
      setData(null)
      setDataUserId(null)
      return null
    }

    setIsLoading(true)
    try {
      const next = await checkinsApi.getToday()
      setData(next)
      setDataUserId(userId)
      return next
    } catch {
      setData(null)
      setDataUserId(userId)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setData(null)
      setDataUserId(null)
      setIsLoading(false)
      return
    }

    let isActive = true
    setIsLoading(true)

    void checkinsApi.getToday()
      .then((next) => {
        if (!isActive) return
        setData(next)
        setDataUserId(userId)
      })
      .catch(() => {
        if (!isActive) return
        setData(null)
        setDataUserId(userId)
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [userId])

  const refetch = useCallback(() => {
    void fetchToday()
  }, [fetchToday])

  const saveMorning = useCallback(async (payload: SaveMorningCheckinPayload) => {
    const result = await checkinsApi.saveMorning(payload)
    await fetchToday()
    return result
  }, [fetchToday])

  const saveEvening = useCallback(async (payload: SaveEveningReflectionPayload) => {
    const result = await checkinsApi.saveEvening(payload)
    await fetchToday()
    return result
  }, [fetchToday])

  const resolvedData = userId && dataUserId === userId ? data : null
  const morningCheckin: MorningCheckin | null = resolvedData?.morning ?? null
  const eveningReflection: EveningReflection | null = resolvedData?.evening ?? null
  const resolvedLoading = Boolean(userId && (isLoading || dataUserId !== userId))

  const value = useMemo<CheckinsContextValue>(() => ({
    morningCheckin,
    eveningReflection,
    hasCompletedMorning: morningCheckin !== null,
    hasCompletedEvening: eveningReflection !== null,
    isLoading: resolvedLoading,
    refetch,
    saveMorning,
    saveEvening,
  }), [
    eveningReflection,
    morningCheckin,
    refetch,
    resolvedLoading,
    saveEvening,
    saveMorning,
  ])

  return (
    <CheckinsContext.Provider value={value}>
      {children}
    </CheckinsContext.Provider>
  )
}
