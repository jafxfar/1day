import type { CreateRoutinePayload, UpdateRoutinePayload } from '@life-os/contracts'
import { AppError } from '../../lib/errors.js'
import { mapRoutine } from '../../lib/mappers.js'
import type { RoutinesRepository } from './routines.repository.js'

export const createRoutinesService = (repository: RoutinesRepository) => ({
  list: async (userId: number) => (await repository.list(userId)).map(mapRoutine),

  create: async (userId: number, payload: CreateRoutinePayload) => {
    const recurrence = payload.recurrence
    const weekdays = recurrence === 'daily' ? [] : (payload.weekdays ?? [])
    if (recurrence === 'weekly' && weekdays.length === 0) {
      throw new AppError(400, 'Pick at least one weekday for weekly routines')
    }

    const row = await repository.create(userId, {
      title: payload.title,
      description: payload.description ?? '',
      recurrence,
      weekdays,
      timeSlot: payload.timeSlot ?? 'anytime',
      timeOfDay: payload.timeOfDay ?? null,
      isActive: payload.isActive ?? true,
    })
    if (!row) throw new AppError(500, 'Routine creation failed')
    return mapRoutine(row)
  },

  update: async (id: string, userId: number, payload: UpdateRoutinePayload) => {
    if (payload.recurrence === 'weekly') {
      const weekdays = payload.weekdays
      if (weekdays !== undefined && weekdays.length === 0) {
        throw new AppError(400, 'Pick at least one weekday for weekly routines')
      }
    }

    const nextPayload = { ...payload }
    if (payload.recurrence === 'daily' && payload.weekdays === undefined) {
      nextPayload.weekdays = []
    }

    const row = await repository.update(id, userId, nextPayload)
    if (!row) throw new AppError(404, 'Routine not found')
    return mapRoutine(row)
  },

  remove: async (id: string, userId: number) => {
    if (!await repository.softDelete(id, userId)) throw new AppError(404, 'Routine not found')
    return { success: true, id }
  },
})

export type RoutinesService = ReturnType<typeof createRoutinesService>
