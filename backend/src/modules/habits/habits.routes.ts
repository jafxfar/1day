import { Router, type RequestHandler } from 'express'
import { createHabitSchema, habitIdParamsSchema, idParamsSchema } from '@life-os/contracts'
import type { Database } from '../../db.js'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { validate } from '../../lib/validation.js'
import { createHabitsRepository } from './habits.repository.js'
import { createHabitsService } from './habits.service.js'
import { createHabitsController } from './habits.controller.js'

export const createHabitsRouter = (database: Database, requireAuth: RequestHandler) => {
  const router = Router()
  const controller = createHabitsController(createHabitsService(createHabitsRepository(database)))

  router.use(requireAuth)
  router.get('/', asyncHandler(controller.list))
  router.post('/', validate('body', createHabitSchema), asyncHandler(controller.create))
  router.post('/:habitId/toggle', validate('params', habitIdParamsSchema), asyncHandler(controller.toggle))
  router.delete('/:id', validate('params', idParamsSchema), asyncHandler(controller.remove))
  return router
}
