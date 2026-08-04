import { useCallback, useContext } from 'react'
import type {
  SaveOnboardingProfilePayload,
  SaveOnboardingSetupPayload,
} from '@life-os/contracts'
import { OnboardingContext } from './onboardingContext'

const useOnboardingContext = () => {
  const context = useContext(OnboardingContext)

  if (!context) {
    throw new Error('useOnboarding hooks must be used within OnboardingProvider')
  }

  return context
}

export const useOnboarding = () => useOnboardingContext()

export const useGetOnboardingState = () => {
  const { state, isLoading, error, refresh } = useOnboardingContext()

  const trigger = useCallback(async () => refresh(), [refresh])

  return {
    data: state ?? undefined,
    loading: isLoading,
    error,
    trigger,
  }
}

export const useSaveOnboardingProfile = () => {
  const { isLoading, error, saveProfile } = useOnboardingContext()

  const trigger = useCallback(async (payload: SaveOnboardingProfilePayload) => (
    saveProfile(payload)
  ), [saveProfile])

  return {
    loading: isLoading,
    error,
    trigger,
  }
}

export const useSaveOnboardingSetup = () => {
  const { isLoading, error, saveSetup } = useOnboardingContext()

  const trigger = useCallback(async (payload: SaveOnboardingSetupPayload) => (
    saveSetup(payload)
  ), [saveSetup])

  return {
    loading: isLoading,
    error,
    trigger,
  }
}

export const useCompleteOnboarding = () => {
  const { isLoading, error, complete } = useOnboardingContext()

  const trigger = useCallback(async () => complete(), [complete])

  return {
    loading: isLoading,
    error,
    trigger,
  }
}

export const useSkipOnboarding = () => {
  const { isLoading, error, skip } = useOnboardingContext()

  const trigger = useCallback(async () => skip(), [skip])

  return {
    loading: isLoading,
    error,
    trigger,
  }
}

export const useCompleteFirstDayFlow = () => {
  const { isLoading, error, completeFirstDayFlow } = useOnboardingContext()

  const trigger = useCallback(async () => completeFirstDayFlow(), [completeFirstDayFlow])

  return {
    loading: isLoading,
    error,
    trigger,
  }
}
