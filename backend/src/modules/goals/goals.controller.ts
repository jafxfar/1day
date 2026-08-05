import type { RequestHandler } from 'express'
import type {
  CreateGoalPayload,
  CreateGoalTreePayload,
  UpdateGoalPayload,
} from '@life-os/contracts'
import type { AuthenticatedRequest } from '../../lib/auth.js'
import type { GoalsService } from './goals.service.js'

export const createGoalsController = (service: GoalsService) => {
  const list: RequestHandler = async (request, response) => {
    response.json(await service.list((request as AuthenticatedRequest).user.id))
  }
  const create: RequestHandler = async (request, response) => {
    response.status(201).json(await service.create(
      (request as AuthenticatedRequest).user.id,
      request.body as CreateGoalPayload,
    ))
  }
  const createTree: RequestHandler = async (request, response) => {
    response.status(201).json(await service.createTree(
      (request as AuthenticatedRequest).user.id,
      request.body as CreateGoalTreePayload,
    ))
  }
  const update: RequestHandler = async (request, response) => {
    response.json(await service.update(
      request.params.id as string,
      (request as AuthenticatedRequest).user.id,
      request.body as UpdateGoalPayload,
    ))
  }
  const remove: RequestHandler = async (request, response) => {
    response.json(await service.remove(
      request.params.id as string,
      (request as AuthenticatedRequest).user.id,
    ))
  }
  return { list, create, createTree, update, remove }
}
