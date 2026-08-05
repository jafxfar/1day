import { Router, type RequestHandler } from 'express'
import {
  createRoutineSchema,
  idParamsSchema,
  updateRoutineSchema,
} from '@life-os/contracts'
import type { Database } from '../../db.js'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { validate } from '../../lib/validation.js'
import { createRoutinesRepository } from './routines.repository.js'
import { createRoutinesService } from './routines.service.js'
import { createRoutinesController } from './routines.controller.js'

export const createRoutinesRouter = (database: Database, requireAuth: RequestHandler) => {
  const router = Router()
  const controller = createRoutinesController(
    createRoutinesService(createRoutinesRepository(database)),
  )

  router.use(requireAuth)
  router.get('/', asyncHandler(controller.list))
  router.post('/', validate('body', createRoutineSchema), asyncHandler(controller.create))
  router.patch(
    '/:id',
    validate('params', idParamsSchema),
    validate('body', updateRoutineSchema),
    asyncHandler(controller.update),
  )
  router.delete('/:id', validate('params', idParamsSchema), asyncHandler(controller.remove))
  return router
}
