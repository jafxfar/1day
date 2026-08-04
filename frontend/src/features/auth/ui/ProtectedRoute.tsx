import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../../../entities/auth/model/useSession'
import { useOnboarding } from '../../../entities/onboarding/model/useOnboarding'
import { PageSkeleton } from '../../../shared/ui/PageSkeleton'

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useSession()
  const { state: onboardingState, isLoading: onboardingLoading } = useOnboarding()
  const location = useLocation()
  const isOnboardingRoute = location.pathname.startsWith('/onboarding')
  const isFirstDayRoute = location.pathname === '/onboarding/first-day'

  if (isLoading || (user && onboardingLoading && !onboardingState)) {
    return <PageSkeleton rows={4} />
  }

  if (!user) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/auth?redirect=${redirectUrl}`} replace />
  }

  if (onboardingState?.status === 'in_progress' && !isOnboardingRoute) {
    const route = onboardingState.profile ? '/onboarding/setup' : '/onboarding/profile'
    return <Navigate to={route} replace />
  }

  if (
    onboardingState?.status === 'completed'
    && !onboardingState.firstDayFlowCompleted
    && !isOnboardingRoute
  ) {
    return <Navigate to="/onboarding/first-day" replace />
  }

  if (
    onboardingState?.status === 'completed'
    && !onboardingState.firstDayFlowCompleted
    && isOnboardingRoute
    && !isFirstDayRoute
  ) {
    return <Navigate to="/onboarding/first-day" replace />
  }

  if (onboardingState?.status !== 'in_progress' && isOnboardingRoute && !isFirstDayRoute) {
    return <Navigate to="/dashboard" replace />
  }

  if (isFirstDayRoute && onboardingState?.firstDayFlowCompleted) {
    return <Navigate to="/morning" replace />
  }

  return <>{children}</>
}
