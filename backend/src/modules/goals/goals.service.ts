import type { CreateGoalPayload, PeriodType, UpdateGoalPayload } from '@life-os/contracts'
import { AppError } from '../../lib/errors.js'
import { mapGoal } from '../../lib/mappers.js'
import type { GoalsRepository } from './goals.repository.js'

const childPeriodByParent: Record<PeriodType, PeriodType> = {
  long_term: 'monthly',
  monthly: 'weekly',
  weekly: 'daily',
  daily: 'daily',
}

export const createGoalsService = (repository: GoalsRepository) => ({
  list: async (userId: number) => (await repository.list(userId)).map(mapGoal),
  create: async (userId: number, payload: CreateGoalPayload) => {
    let periodType = payload.periodType ?? 'long_term'
    let depth = 0

    if (payload.parentId) {
      const parent = await repository.findParent(payload.parentId, userId)
      if (!parent) throw new AppError(404, 'Parent goal not found')
      periodType = payload.periodType ?? childPeriodByParent[parent.period_type]
      depth = parent.depth + 1
    }

    const row = await repository.create(userId, {
      title: payload.title,
      description: payload.description ?? '',
      category: payload.category,
      deadline: payload.deadline,
      parentId: payload.parentId ?? null,
      periodType,
    })
    if (!row) throw new AppError(500, 'Goal creation failed')
    return mapGoal({ ...row, depth })
  },
  update: async (id: string, userId: number, payload: UpdateGoalPayload) => {
    const row = await repository.update(id, userId, payload)
    if (!row) throw new AppError(404, 'Goal not found')
    return mapGoal(row)
  },
  remove: async (id: string, userId: number) => {
    if (!await repository.softDelete(id, userId)) throw new AppError(404, 'Goal not found')
    return { success: true, id }
  },
})

export type GoalsService = ReturnType<typeof createGoalsService>
