import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loadingUser } = useApp()
  const location = useLocation()

  if (loadingUser) {
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
