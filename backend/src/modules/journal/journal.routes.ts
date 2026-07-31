import { Router, type RequestHandler } from 'express'
import { createJournalEntrySchema, idParamsSchema, journalQuerySchema } from '@life-os/contracts'
import type { Database } from '../../db.js'
import { asyncHandler } from '../../lib/asyncHandler.js'
import { validate } from '../../lib/validation.js'
import { createJournalRepository } from './journal.repository.js'
import { createJournalService } from './journal.service.js'
import { createJournalController } from './journal.controller.js'

export const createJournalRouter = (database: Database, requireAuth: RequestHandler) => {
  const router = Router()
  const controller = createJournalController(createJournalService(createJournalRepository(database)))

  router.use(requireAuth)
  router.get('/', validate('query', journalQuerySchema), asyncHandler(controller.list))
  router.post('/', validate('body', createJournalEntrySchema), asyncHandler(controller.create))
  router.delete('/:id', validate('params', idParamsSchema), asyncHandler(controller.remove))
  return router
}
