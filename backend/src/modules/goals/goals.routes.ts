import { Router, type RequestHandler } from 'express'
import {
  createGoalSchema,
  createGoalTreeSchema,
  idParamsSchema,
  updateGoalSchema,
} from '@life-os/contracts'
import type { Database } from '../../db.js'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { validate } from '../../lib/validation.js'
import { createGoalsRepository } from './goals.repository.js'
import { createGoalsService } from './goals.service.js'
import { createGoalsController } from './goals.controller.js'

export const createGoalsRouter = (database: Database, requireAuth: RequestHandler) => {
  const router = Router()
  const controller = createGoalsController(createGoalsService(createGoalsRepository(database)))

  router.use(requireAuth)
  router.get('/', asyncHandler(controller.list))
  router.post('/tree', validate('body', createGoalTreeSchema), asyncHandler(controller.createTree))
  router.post('/', validate('body', createGoalSchema), asyncHandler(controller.create))
  router.patch('/:id', validate('params', idParamsSchema), validate('body', updateGoalSchema), asyncHandler(controller.update))
  router.delete('/:id', validate('params', idParamsSchema), asyncHandler(controller.remove))
  return router
}
