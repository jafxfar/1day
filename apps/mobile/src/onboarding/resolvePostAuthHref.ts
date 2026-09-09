import type { OnboardingState } from '@life-os/contracts'
import type { Href } from 'expo-router'

export const resolvePostAuthHref = (state: OnboardingState | null): Href => {
  if (!state || state.status === 'in_progress') {
    return state?.profile
      ? '/(onboarding)/setup'
      : '/(onboarding)/profile'
  }

  if (state.status === 'completed' && !state.firstDayFlowCompleted) {
    return '/(onboarding)/first-day'
  }

  return '/(app)/morning'
}
