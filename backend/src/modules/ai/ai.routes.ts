import { Router, type RequestHandler } from 'express'
import { sendAiMessageSchema } from '@life-os/contracts'
import type { AppConfig } from '../../config/env.js'
import type { Database } from '../../db.js'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { validate } from '../../lib/validation.js'
import { createOnboardingRepository } from '../onboarding/onboarding.repository.js'
import { createAiController } from './ai.controller.js'
import { createAiRepository } from './ai.repository.js'
import { createAiService } from './ai.service.js'
import { createUserContextBuilder } from './context/userContext.js'
import { createOllamaProvider } from './providers/ollamaProvider.js'

export const createAiRouter = (
  database: Database,
  requireAuth: RequestHandler,
  config: AppConfig,
) => {
  const router = Router()
  const provider = createOllamaProvider({
    baseUrl: config.ai.ollamaBaseUrl,
    model: config.ai.ollamaModel,
  })
  const service = createAiService({
    repository: createAiRepository(database),
    userContextBuilder: createUserContextBuilder(createOnboardingRepository(database)),
    provider,
    aiEnabled: config.ai.enabled,
  })
  const controller = createAiController(service)

  router.get('/health', asyncHandler(controller.health))
  router.use(requireAuth)
  router.get('/psychologist/session', asyncHandler(controller.getPsychologistSession))
  router.post(
    '/psychologist/messages',
    validate('body', sendAiMessageSchema),
    asyncHandler(controller.sendPsychologistMessage),
  )
  router.delete('/psychologist/session', asyncHandler(controller.clearPsychologistSession))

  return router
}
