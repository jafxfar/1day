import { RouterProvider } from 'react-router-dom'
import { SessionProvider } from '../entities/auth/model/SessionProvider'
import { CheckinsProvider } from '../entities/checkins/model/CheckinsProvider'
import { router } from './router'

export const AppProviders = () => (
  <>
    <a
      href="#main-content"
      className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-full bg-primary px-4 py-2 font-bold text-primary-foreground focus:translate-y-0"
    >
      Skip to content
    </a>
    <SessionProvider>
      <CheckinsProvider>
        <RouterProvider router={router} />
      </CheckinsProvider>
    </SessionProvider>
  </>
)
