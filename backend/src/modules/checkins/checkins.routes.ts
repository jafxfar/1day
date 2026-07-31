import { Router, type RequestHandler } from 'express'
import {
  saveEveningReflectionSchema,
  saveMorningCheckinSchema,
} from '@life-os/contracts'
import type { Database } from '../../db.js'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { validate } from '../../lib/validation.js'
import { createCheckinsRepository } from './checkins.repository.js'
import { createCheckinsService } from './checkins.service.js'
import { createCheckinsController } from './checkins.controller.js'

export const createCheckinsRouter = (database: Database, requireAuth: RequestHandler) => {
  const router = Router()
  const controller = createCheckinsController(createCheckinsService(createCheckinsRepository(database)))

  router.use(requireAuth)
  router.get('/today', asyncHandler(controller.today))
  router.post('/morning', validate('body', saveMorningCheckinSchema), asyncHandler(controller.saveMorning))
  router.post('/evening', validate('body', saveEveningReflectionSchema), asyncHandler(controller.saveEvening))
  return router
}
