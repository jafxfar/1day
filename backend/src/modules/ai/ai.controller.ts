import type { RequestHandler } from 'express'
import type { SendAiMessagePayload } from '@life-os/contracts'
import type { AuthenticatedRequest } from '../../lib/auth.js'
import type { AiService } from './ai.service.js'

export const createAiController = (service: AiService) => {
  const health: RequestHandler = async (_request, response) => {
    response.json(await service.health())
  }

  const getPsychologistSession: RequestHandler = async (request, response) => {
    response.json(await service.getPsychologistSession(
      (request as AuthenticatedRequest).user.id,
    ))
  }

  const sendPsychologistMessage: RequestHandler = async (request, response) => {
    response.status(201).json(await service.sendPsychologistMessage(
      (request as AuthenticatedRequest).user.id,
      request.body as SendAiMessagePayload,
    ))
  }

  const clearPsychologistSession: RequestHandler = async (request, response) => {
    response.json(await service.clearPsychologistSession(
      (request as AuthenticatedRequest).user.id,
    ))
  }

  return {
    health,
    getPsychologistSession,
    sendPsychologistMessage,
    clearPsychologistSession,
  }
}
