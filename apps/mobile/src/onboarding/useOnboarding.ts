import { useContext } from 'react'
import { OnboardingContext } from './onboardingContext'

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)

  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }

  return context
}
