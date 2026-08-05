import type { RequestHandler } from 'express'
import type { CreateRoutinePayload, UpdateRoutinePayload } from '@life-os/contracts'
import type { AuthenticatedRequest } from '../../lib/auth.js'
import type { RoutinesService } from './routines.service.js'

export const createRoutinesController = (service: RoutinesService) => {
  const list: RequestHandler = async (request, response) => {
    response.json(await service.list((request as AuthenticatedRequest).user.id))
  }
  const create: RequestHandler = async (request, response) => {
    response.status(201).json(await service.create(
      (request as AuthenticatedRequest).user.id,
      request.body as CreateRoutinePayload,
    ))
  }
  const update: RequestHandler = async (request, response) => {
    response.json(await service.update(
      request.params.id as string,
      (request as AuthenticatedRequest).user.id,
      request.body as UpdateRoutinePayload,
    ))
  }
  const remove: RequestHandler = async (request, response) => {
    response.json(await service.remove(
      request.params.id as string,
      (request as AuthenticatedRequest).user.id,
    ))
  }
  return { list, create, update, remove }
}
