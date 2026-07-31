import { Router } from 'express'
import { loginSchema, registerSchema } from '@life-os/contracts'
import type { Database } from '../../db.js'
import type { AppConfig } from '../../config/env.js'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { createAuthTools } from '../../lib/auth.js'
import { validate } from '../../lib/validation.js'
import { createAuthRepository } from './auth.repository.js'
import { createAuthService } from './auth.service.js'
import { createAuthController } from './auth.controller.js'

export const createAuthRouter = (database: Database, config: AppConfig) => {
  const router = Router()
  const authTools = createAuthTools(config)
  const repository = createAuthRepository(database)
  const service = createAuthService(repository)
  const controller = createAuthController(service, authTools, config)

  router.post('/register', validate('body', registerSchema), asyncHandler(controller.register))
  router.post('/login', validate('body', loginSchema), asyncHandler(controller.login))
  router.post('/logout', controller.logout)
  router.get('/me', authTools.requireAuth, controller.me)

  return { router, requireAuth: authTools.requireAuth }
}
