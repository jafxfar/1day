import type {
  OnboardingState,
  SaveOnboardingProfilePayload,
  SaveOnboardingSetupPayload,
} from '@life-os/contracts'
import { createContext } from 'react'

export type OnboardingContextValue = {
  state: OnboardingState | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<OnboardingState | null>
  saveProfile: (payload: SaveOnboardingProfilePayload) => Promise<OnboardingState | null>
  saveSetup: (payload: SaveOnboardingSetupPayload) => Promise<OnboardingState | null>
  complete: () => Promise<OnboardingState | null>
  skip: () => Promise<OnboardingState | null>
  completeFirstDayFlow: () => Promise<OnboardingState | null>
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(null)
