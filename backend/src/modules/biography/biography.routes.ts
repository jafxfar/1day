import { Router, type RequestHandler } from 'express'
import type { Database } from '../../db.js'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { createBiographyRepository } from './biography.repository.js'
import { createBiographyService } from './biography.service.js'
import { createBiographyController } from './biography.controller.js'

export const createBiographyRouter = (database: Database, requireAuth: RequestHandler) => {
  const router = Router()
  const controller = createBiographyController(
    createBiographyService(createBiographyRepository(database)),
  )
  router.use(requireAuth)
  router.get('/', asyncHandler(controller.get))
  return router
}
