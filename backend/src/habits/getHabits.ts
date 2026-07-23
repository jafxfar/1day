
import { mapHabit } from '../lib/mappers'
import { computeStreak } from '../lib/streak'
import type { HabitRow, HabitLogRow } from '../lib/types'
import { retoolDb } from '../db';

/**
 * Returns all active habits for the user with:
 *   - completedToday  — did the user check this habit today?
 *   - currentStreak   — recomputed live from habit_logs
 *
 * Two queries, not N+1: one for habits, one for all relevant logs.
 */
export default async function getHabits(req: { params: Record<string, never>; user: User }) {
  const userId = req.user.id

  // 1. Fetch all active habits
  const { data: habits } = await retoolDb.query<HabitRow>(
    `SELECT id, user_id, title, type, icon, category,
            current_streak, longest_streak, is_archived, deleted_at, created_at, updated_at
     FROM   habits
     WHERE  user_id = $1
       AND  deleted_at IS NULL
       AND  is_archived = FALSE
     ORDER BY created_at ASC`,
    [userId],
  )

  if (habits.length === 0) return []

  // 2. Fetch last 365 days of completed logs for all habits in one query
  const habitIds = habits.map(h => h.id)
  const placeholders = habitIds.map((_, i) => `$${i + 2}`).join(', ')

  const { data: logs } = await retoolDb.query<Pick<HabitLogRow, 'habit_id' | 'log_date' | 'completed'>>(
    `SELECT habit_id, log_date::text, completed
     FROM   habit_logs
     WHERE  user_id = $1
       AND  habit_id IN (${placeholders})
       AND  log_date >= CURRENT_DATE - INTERVAL '365 days'
       AND  log_date <= CURRENT_DATE
     ORDER BY habit_id, log_date DESC`,
    [userId, ...habitIds],
  )

  // 3. Group logs by habit_id for O(1) lookups
  const today = new Date().toISOString().split('T')[0]!

  const logsByHabit = new Map<string, { completedToday: boolean; completedDates: string[] }>()

  for (const log of logs) {
    if (!logsByHabit.has(log.habit_id)) {
      logsByHabit.set(log.habit_id, { completedToday: false, completedDates: [] })
    }
    const entry = logsByHabit.get(log.habit_id)!
    if (log.log_date === today && log.completed) {
      entry.completedToday = true
    }
    if (log.completed) {
      entry.completedDates.push(log.log_date)
    }
  }

  // 4. Map habits with live streak
  return habits.map(habit => {
    const logData       = logsByHabit.get(habit.id) ?? { completedToday: false, completedDates: [] }
    const currentStreak = computeStreak(logData.completedDates)
    return mapHabit({ ...habit, current_streak: currentStreak }, logData.completedToday)
  })
}
