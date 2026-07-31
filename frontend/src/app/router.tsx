import { Navigate, createBrowserRouter } from 'react-router-dom'
import { Suspense, type ReactNode } from 'react'
import { ProtectedRoute } from '../features/auth/ui/ProtectedRoute'
import { PageSkeleton } from '../shared/ui/PageSkeleton'
import {
  AICoach,
  Auth,
  Biography,
  CalendarPage,
  Dashboard,
  EveningReflection,
  Goals,
  Habits,
  Journal,
  MorningExperience,
  Profile,
  Welcome,
} from './routePages'

const page = (content: ReactNode) => (
  <Suspense fallback={<PageSkeleton />}>{content}</Suspense>
)

const protectedPage = (content: ReactNode) => (
  <ProtectedRoute>{page(content)}</ProtectedRoute>
)

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/welcome" replace /> },
  { path: '/welcome', element: page(<Welcome />) },
  { path: '/auth', element: page(<Auth />) },
  { path: '/morning', element: protectedPage(<MorningExperience />) },
  { path: '/evening', element: protectedPage(<EveningReflection />) },
  { path: '/dashboard', element: protectedPage(<Dashboard />) },
  { path: '/goals', element: protectedPage(<Goals />) },
  { path: '/habits', element: protectedPage(<Habits />) },
  { path: '/journal', element: protectedPage(<Journal />) },
  { path: '/calendar', element: protectedPage(<CalendarPage />) },
  { path: '/biography', element: protectedPage(<Biography />) },
  { path: '/ai', element: protectedPage(<AICoach />) },
  { path: '/profile', element: protectedPage(<Profile />) },
  { path: '*', element: <Navigate to="/welcome" replace /> },
])
