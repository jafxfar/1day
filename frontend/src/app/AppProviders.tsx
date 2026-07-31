import { RouterProvider } from 'react-router-dom'
import { SessionProvider } from '../entities/auth/model/SessionProvider'
import { CheckinsProvider } from '../entities/checkins/model/CheckinsProvider'
import { router } from './router'

export const AppProviders = () => (
  <SessionProvider>
    <CheckinsProvider>
      <RouterProvider router={router} />
    </CheckinsProvider>
  </SessionProvider>
)
