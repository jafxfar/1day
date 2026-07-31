import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../../../entities/auth/model/useSession'

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useSession()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/auth?redirect=${redirectUrl}`} replace />
  }

  return <>{children}</>
}
