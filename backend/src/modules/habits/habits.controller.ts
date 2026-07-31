import type { RequestHandler } from 'express'
import type { CreateHabitPayload } from '@life-os/contracts'
import type { AuthenticatedRequest } from '../../lib/auth.js'
import type { HabitsService } from './habits.service.js'

export const createHabitsController = (service: HabitsService) => {
  const list: RequestHandler = async (request, response) => {
    response.json(await service.list((request as AuthenticatedRequest).user.id))
  }
  const create: RequestHandler = async (request, response) => {
    response.status(201).json(await service.create(
      (request as AuthenticatedRequest).user.id,
      request.body as CreateHabitPayload,
    ))
  }
  const toggle: RequestHandler = async (request, response) => {
    response.json(await service.toggle(
      request.params.habitId as string,
      (request as AuthenticatedRequest).user.id,
    ))
  }
  const remove: RequestHandler = async (request, response) => {
    response.json(await service.remove(
      request.params.id as string,
      (request as AuthenticatedRequest).user.id,
    ))
  }
  return { list, create, toggle, remove }
}
