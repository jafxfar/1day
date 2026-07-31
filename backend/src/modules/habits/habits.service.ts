import type { CreateHabitPayload } from '@life-os/contracts'
import { AppError } from '../../lib/errors.js'
import { mapHabit } from '../../lib/mappers.js'
import { computeStreak } from '../../lib/streak.js'
import type { HabitsRepository } from './habits.repository.js'

export const createHabitsService = (repository: HabitsRepository) => ({
  list: async (userId: number) => {
    const { habits, logs } = await repository.list(userId)
    const today = new Date().toISOString().slice(0, 10)
    const byHabit = new Map<string, { dates: string[]; completedToday: boolean }>()

    for (const log of logs) {
      const data = byHabit.get(log.habit_id) ?? { dates: [], completedToday: false }
      if (log.completed) data.dates.push(log.log_date)
      if (log.completed && log.log_date === today) data.completedToday = true
      byHabit.set(log.habit_id, data)
    }

    return habits.map(habit => {
      const data = byHabit.get(habit.id) ?? { dates: [], completedToday: false }
      return mapHabit({ ...habit, current_streak: computeStreak(data.dates) }, data.completedToday)
    })
  },
  create: async (userId: number, payload: CreateHabitPayload) => {
    const row = await repository.create(
      userId,
      payload.title,
      payload.type,
      payload.icon ?? '🎯',
      payload.category ?? 'general',
    )
    if (!row) throw new AppError(500, 'Habit creation failed')
    return mapHabit(row, false)
  },
  toggle: async (habitId: string, userId: number) => {
    const result = await repository.toggle(habitId, userId, computeStreak)
    if (!result) throw new AppError(404, 'Habit not found')
    return { habitId, ...result }
  },
  remove: async (id: string, userId: number) => {
    if (!await repository.softDelete(id, userId)) throw new AppError(404, 'Habit not found')
    return { success: true, id }
  },
})

export type HabitsService = ReturnType<typeof createHabitsService>
