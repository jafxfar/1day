import { Navigate, createBrowserRouter } from 'react-router-dom'
import { Suspense, type ReactNode } from 'react'
import { ProtectedRoute } from '../features/auth/ui/ProtectedRoute'
import { PageSkeleton } from '../shared/ui/PageSkeleton'
import {
  AICoach,
  AppSetupWizard,
  Auth,
  Biography,
  CalendarPage,
  Dashboard,
  EveningReflection,
  FirstDayBridge,
  Goals,
  GoalBuilder,
  Habits,
  Introduction,
  Journal,
  MorningExperience,
  Profile,
  ProfileOnboarding,
  Welcome,
} from './routePages'

const page = (content: ReactNode) => (
  <Suspense fallback={<PageSkeleton />}>{content}</Suspense>
)

const protectedPage = (content: ReactNode) => (
  <ProtectedRoute>{page(content)}</ProtectedRoute>
)

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/introduction" replace /> },
  { path: '/introduction', element: page(<Introduction />) },
  { path: '/welcome', element: page(<Welcome />) },
  { path: '/auth', element: page(<Auth />) },
  { path: '/onboarding/profile', element: protectedPage(<ProfileOnboarding />) },
  { path: '/onboarding/setup', element: protectedPage(<AppSetupWizard />) },
  { path: '/onboarding/first-day', element: protectedPage(<FirstDayBridge />) },
  { path: '/morning', element: protectedPage(<MorningExperience />) },
  { path: '/evening', element: protectedPage(<EveningReflection />) },
  { path: '/dashboard', element: protectedPage(<Dashboard />) },
  { path: '/goals', element: protectedPage(<Goals />) },
  { path: '/goals/new', element: protectedPage(<GoalBuilder />) },
  { path: '/habits', element: protectedPage(<Habits />) },
  { path: '/journal', element: protectedPage(<Journal />) },
  { path: '/calendar', element: protectedPage(<CalendarPage />) },
  { path: '/biography', element: protectedPage(<Biography />) },
  { path: '/ai', element: protectedPage(<AICoach />) },
  { path: '/profile', element: protectedPage(<Profile />) },
  { path: '*', element: <Navigate to="/introduction" replace /> },
])
