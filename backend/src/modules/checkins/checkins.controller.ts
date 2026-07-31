import type { RequestHandler } from 'express'
import type {
  SaveEveningReflectionPayload,
  SaveMorningCheckinPayload,
} from '@life-os/contracts'
import type { AuthenticatedRequest } from '../../lib/auth.js'
import type { CheckinsService } from './checkins.service.js'

export const createCheckinsController = (service: CheckinsService) => {
  const today: RequestHandler = async (request, response) => {
    response.json(await service.today((request as AuthenticatedRequest).user.id))
  }
  const saveMorning: RequestHandler = async (request, response) => {
    response.json(await service.saveMorning(
      (request as AuthenticatedRequest).user.id,
      request.body as SaveMorningCheckinPayload,
    ))
  }
  const saveEvening: RequestHandler = async (request, response) => {
    response.json(await service.saveEvening(
      (request as AuthenticatedRequest).user.id,
      request.body as SaveEveningReflectionPayload,
    ))
  }
  return { today, saveMorning, saveEvening }
}
