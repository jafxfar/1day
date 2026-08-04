import { Router, type RequestHandler } from 'express'
import {
  onboardingProfileSchema,
  onboardingSetupSchema,
} from '@life-os/contracts'
import type { Database } from '../../db.js'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { validate } from '../../lib/validation.js'
import { createGoalsRepository } from '../goals/goals.repository.js'
import { createHabitsRepository } from '../habits/habits.repository.js'
import { createOnboardingRepository } from './onboarding.repository.js'
import { createOnboardingService } from './onboarding.service.js'
import { createOnboardingController } from './onboarding.controller.js'

export const createOnboardingRouter = (database: Database, requireAuth: RequestHandler) => {
  const router = Router()
  const controller = createOnboardingController(
    createOnboardingService({
      repository: createOnboardingRepository(database),
      goalsRepository: createGoalsRepository(database),
      habitsRepository: createHabitsRepository(database),
    }),
  )

  router.use(requireAuth)
  router.get('/', asyncHandler(controller.get))
  router.put('/profile', validate('body', onboardingProfileSchema), asyncHandler(controller.saveProfile))
  router.put('/setup', validate('body', onboardingSetupSchema), asyncHandler(controller.saveSetup))
  router.post('/complete', asyncHandler(controller.complete))
  router.post('/skip', asyncHandler(controller.skip))
  router.post('/first-day-complete', asyncHandler(controller.completeFirstDayFlow))

  return router
}
