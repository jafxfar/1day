import type {
  OnboardingState,
  SaveOnboardingProfilePayload,
  SaveOnboardingSetupPayload,
} from '@life-os/contracts'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useSession } from '../auth/useSession'
import { onboardingApi } from './api'
import { OnboardingContext, type OnboardingContextValue } from './onboardingContext'

const getErrorMessage = (error: unknown) => (
  error instanceof Error ? error.message : String(error)
)

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useSession()
  const userId = user?.id ?? null
  const [state, setState] = useState<OnboardingState | null>(null)
  const [stateUserId, setStateUserId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyState = useCallback((nextState: OnboardingState | null, nextUserId: number | null) => {
    setState(nextState)
    setStateUserId(nextUserId)
  }, [])

  const refresh = useCallback(async () => {
    if (!userId) {
      applyState(null, null)
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const nextState = await onboardingApi.getState()
      applyState(nextState, userId)
      return nextState
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
      applyState(null, userId)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [applyState, userId])

  useEffect(() => {
    if (!userId) {
      applyState(null, null)
      setIsLoading(false)
      setError(null)
      return
    }

    let isActive = true
    setIsLoading(true)

    void onboardingApi.getState()
      .then(nextState => {
        if (!isActive) {
          return
        }

        setState(nextState)
        setStateUserId(userId)
        setError(null)
        setIsLoading(false)
      })
      .catch(caughtError => {
        if (!isActive) {
          return
        }

        setError(getErrorMessage(caughtError))
        setState(null)
        setStateUserId(userId)
        setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [applyState, userId])

  const runMutation = useCallback(async (
    action: () => Promise<OnboardingState>,
  ) => {
    if (!userId) {
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const nextState = await action()
      applyState(nextState, userId)
      return nextState
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
      return null
    } finally {
      setIsLoading(false)
    }
  }, [applyState, userId])

  const saveProfile = useCallback((payload: SaveOnboardingProfilePayload) => (
    runMutation(() => onboardingApi.saveProfile(payload))
  ), [runMutation])

  const saveSetup = useCallback((payload: SaveOnboardingSetupPayload) => (
    runMutation(() => onboardingApi.saveSetup(payload))
  ), [runMutation])

  const complete = useCallback(() => (
    runMutation(() => onboardingApi.complete())
  ), [runMutation])

  const skip = useCallback(() => (
    runMutation(() => onboardingApi.skip())
  ), [runMutation])

  const completeFirstDayFlow = useCallback(() => (
    runMutation(() => onboardingApi.completeFirstDayFlow())
  ), [runMutation])

  const resolvedState = userId && stateUserId === userId ? state : null
  const resolvedLoading = Boolean(userId && (isLoading || stateUserId !== userId))
  const resolvedError = userId && stateUserId === userId ? error : null

  const value = useMemo<OnboardingContextValue>(() => ({
    state: resolvedState,
    isLoading: resolvedLoading,
    error: resolvedError,
    refresh,
    saveProfile,
    saveSetup,
    complete,
    skip,
    completeFirstDayFlow,
  }), [
    complete,
    completeFirstDayFlow,
    refresh,
    resolvedError,
    resolvedLoading,
    resolvedState,
    saveProfile,
    saveSetup,
    skip,
  ])

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}
