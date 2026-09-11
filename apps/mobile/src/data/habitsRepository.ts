import type { CreateHabitPayload, Habit } from '@life-os/contracts'
import { ApiError } from '../api/client'
import { getDatabase } from '../db/client'
import { createId, nowIso, todayIsoDate } from '../lib/ids'
import { computeStreak } from '../lib/streak'
import { mapHabit, type HabitRow } from './mappers'
import { requireUserId } from './requireUser'

export type ToggleHabitResponse = {
  habitId: string
  completedToday: boolean
  currentStreak: number
  longestStreak: number
}

type HabitLogRow = {
  habit_id: string
  log_date: string
  completed: number
}

export const habitsRepository = {
  getAll: async (): Promise<Habit[]> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const habits = await db.getAllAsync<HabitRow>(
      `SELECT * FROM habits
       WHERE user_id = ? AND deleted_at IS NULL AND is_archived = 0
       ORDER BY created_at ASC`,
      [userId],
    )

    if (habits.length === 0) return []

    const since = (() => {
      const date = new Date()
      date.setDate(date.getDate() - 365)
      return date.toISOString().slice(0, 10)
    })()

    const placeholders = habits.map(() => '?').join(',')
    const logs = await db.getAllAsync<HabitLogRow>(
      `SELECT habit_id, log_date, completed FROM habit_logs
       WHERE user_id = ? AND habit_id IN (${placeholders})
         AND log_date >= ? AND log_date <= ?
       ORDER BY habit_id, log_date DESC`,
      [userId, ...habits.map(habit => habit.id), since, todayIsoDate()],
    )

    const today = todayIsoDate()
    const byHabit = new Map<string, { dates: string[]; completedToday: boolean }>()

    for (const log of logs) {
      const data = byHabit.get(log.habit_id) ?? { dates: [], completedToday: false }
      if (log.completed) data.dates.push(log.log_date)
      if (log.completed && log.log_date === today) data.completedToday = true
      byHabit.set(log.habit_id, data)
    }

    return habits.map((habit) => {
      const data = byHabit.get(habit.id) ?? { dates: [], completedToday: false }
      const currentStreak = computeStreak(data.dates)
      return mapHabit({ ...habit, current_streak: currentStreak }, data.completedToday)
    })
  },

  create: async (payload: CreateHabitPayload): Promise<Habit> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const id = createId()
    const createdAt = nowIso()

    await db.runAsync(
      `INSERT INTO habits (id, user_id, title, type, icon, category, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        payload.title,
        payload.type,
        payload.icon ?? '🎯',
        payload.category ?? 'general',
        createdAt,
        createdAt,
      ],
    )

    const row = await db.getFirstAsync<HabitRow>('SELECT * FROM habits WHERE id = ?', [id])
    if (!row) throw new ApiError('Habit creation failed', 500)
    return mapHabit(row, false)
  },

  toggle: async (habitId: string): Promise<ToggleHabitResponse> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const today = todayIsoDate()
    const now = nowIso()

    const habit = await db.getFirstAsync<{ id: string; longest_streak: number }>(
      `SELECT id, longest_streak FROM habits
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [habitId, userId],
    )
    if (!habit) throw new ApiError('Habit not found', 404)

    const existing = await db.getFirstAsync<{ id: string; completed: number }>(
      `SELECT id, completed FROM habit_logs
       WHERE habit_id = ? AND user_id = ? AND log_date = ?`,
      [habitId, userId, today],
    )

    let completedToday = false
    if (!existing) {
      await db.runAsync(
        `INSERT INTO habit_logs (id, habit_id, user_id, log_date, completed, completed_at, created_at)
         VALUES (?, ?, ?, ?, 1, ?, ?)`,
        [createId(), habitId, userId, today, now, now],
      )
      completedToday = true
    } else {
      completedToday = !existing.completed
      await db.runAsync(
        `UPDATE habit_logs SET completed = ?, completed_at = ?
         WHERE id = ?`,
        [completedToday ? 1 : 0, completedToday ? now : null, existing.id],
      )
    }

    const completedLogs = await db.getAllAsync<{ log_date: string }>(
      `SELECT log_date FROM habit_logs
       WHERE habit_id = ? AND user_id = ? AND completed = 1 AND log_date <= ?
       ORDER BY log_date DESC LIMIT 365`,
      [habitId, userId, today],
    )

    const currentStreak = computeStreak(completedLogs.map(log => log.log_date))
    const longestStreak = Math.max(habit.longest_streak, currentStreak)

    await db.runAsync(
      `UPDATE habits SET current_streak = ?, longest_streak = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [currentStreak, longestStreak, now, habitId, userId],
    )

    return {
      habitId,
      completedToday,
      currentStreak,
      longestStreak,
    }
  },

  delete: async (id: string): Promise<{ success: boolean; id: string }> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const result = await db.runAsync(
      `UPDATE habits SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [nowIso(), nowIso(), id, userId],
    )
    if (result.changes === 0) throw new ApiError('Habit not found', 404)
    return { success: true, id }
  },
}
