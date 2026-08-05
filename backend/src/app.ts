import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import type { Database } from './db.js'
import type { AppConfig } from './config/env.js'
import { errorHandler, notFoundHandler } from './lib/errors.js'
import { createAuthRouter } from './modules/auth/auth.routes.js'
import { createGoalsRouter } from './modules/goals/goals.routes.js'
import { createHabitsRouter } from './modules/habits/habits.routes.js'
import { createRoutinesRouter } from './modules/routines/routines.routes.js'
import { createJournalRouter } from './modules/journal/journal.routes.js'
import { createCheckinsRouter } from './modules/checkins/checkins.routes.js'
import { createBiographyRouter } from './modules/biography/biography.routes.js'
import { createOnboardingRouter } from './modules/onboarding/onboarding.routes.js'

export interface AppDependencies {
  database: Database
  isDatabaseReady: () => Promise<boolean>
}

export const createApp = (config: AppConfig, dependencies: AppDependencies) => {
  const app = express()

  app.disable('x-powered-by')
  app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(null, false)
    },
  }))
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  app.get('/api/health', (_request, response) => response.json({ ok: true }))
  app.get('/api/readiness', async (_request, response, next) => {
    try {
      const ready = await dependencies.isDatabaseReady()
      response.status(ready ? 200 : 503).json({ ok: ready })
    } catch (error) {
      next(error)
    }
  })

  const auth = createAuthRouter(dependencies.database, config)
  app.use('/api/auth', auth.router)
  app.use('/api/goals', createGoalsRouter(dependencies.database, auth.requireAuth))
  app.use('/api/habits', createHabitsRouter(dependencies.database, auth.requireAuth))
  app.use('/api/routines', createRoutinesRouter(dependencies.database, auth.requireAuth))
  app.use('/api/journal', createJournalRouter(dependencies.database, auth.requireAuth))
  app.use('/api/checkins', createCheckinsRouter(dependencies.database, auth.requireAuth))
  app.use('/api/biography', createBiographyRouter(dependencies.database, auth.requireAuth))
  app.use('/api/onboarding', createOnboardingRouter(dependencies.database, auth.requireAuth))

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
