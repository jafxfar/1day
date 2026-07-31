import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../../../entities/auth/model/useSession'
import { PageSkeleton } from '../../../shared/ui/PageSkeleton'

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useSession()
  const location = useLocation()

  if (isLoading) {
    return <PageSkeleton rows={4} />
  }

  if (!user) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/auth?redirect=${redirectUrl}`} replace />
  }

  return <>{children}</>
}
