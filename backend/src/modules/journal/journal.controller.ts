import type { RequestHandler } from 'express'
import type { CreateJournalEntryPayload, JournalQuery } from '@life-os/contracts'
import type { AuthenticatedRequest } from '../../lib/auth.js'
import type { JournalService } from './journal.service.js'

export const createJournalController = (service: JournalService) => {
  const list: RequestHandler = async (request, response) => {
    response.json(await service.list(
      (request as AuthenticatedRequest).user.id,
      response.locals.query as JournalQuery,
    ))
  }
  const create: RequestHandler = async (request, response) => {
    response.status(201).json(await service.create(
      (request as AuthenticatedRequest).user.id,
      request.body as CreateJournalEntryPayload,
    ))
  }
  const remove: RequestHandler = async (request, response) => {
    response.json(await service.remove(
      request.params.id as string,
      (request as AuthenticatedRequest).user.id,
    ))
  }
  return { list, create, remove }
}
