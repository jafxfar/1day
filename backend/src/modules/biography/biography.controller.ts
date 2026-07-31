import type { RequestHandler } from 'express'
import type { AuthenticatedRequest } from '../../lib/auth.js'
import type { BiographyService } from './biography.service.js'

export const createBiographyController = (service: BiographyService) => {
  const get: RequestHandler = async (request, response) => {
    response.json(await service.get((request as AuthenticatedRequest).user.id))
  }
  return { get }
}
