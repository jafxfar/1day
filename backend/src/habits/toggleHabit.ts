
import { computeStreak } from '../lib/streak'
import type { HabitLogRow } from '../lib/types'
import { retoolDb } from '../db';

interface Params {
  habitId: string
}

interface ToggleResult {
  habitId: string
  completedToday: boolean
  currentStreak: number
  longestStreak: number
}

/**
 * Toggle today's completion for a habit.
 *
 * Strategy:
 *   1. UPSERT into habit_logs for (habit_id, today)
 *   2. Recompute streak from log history
 *   3. Write updated streak back to habits row
 *   4. Return minimal diff so the frontend can optimistically update
 */
export default async function toggleHabit(req: { params: Params; user: User }): Promise<ToggleResult> {
  const { habitId } = req.params
  const userId      = req.user.id

  if (!habitId) throw new Error('habitId is required')

  // 1. Verify ownership
  const { data: ownership } = await retoolDb.query<{ id: string }>(
    `SELECT id FROM habits WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [habitId, userId],
  )
  if (!ownership[0]) throw new Error('Habit not found or not owned by user')

  // 2. Toggle: flip completed for today using ON CONFLICT
  const { data: logData } = await retoolDb.query<Pick<HabitLogRow, 'completed'>>(
    `INSERT INTO habit_logs (habit_id, user_id, log_date, completed, completed_at)
     VALUES ($1, $2, CURRENT_DATE, TRUE, NOW())
     ON CONFLICT (habit_id, log_date)
     DO UPDATE SET
       completed    = NOT habit_logs.completed,
       completed_at = CASE WHEN NOT habit_logs.completed THEN NOW() ELSE NULL END
     RETURNING completed`,
    [habitId, userId],
  )

  const completedToday = logData[0]?.completed ?? false

  // 3. Recompute streak from last 365 days of completed logs, newest first
  const { data: logs } = await retoolDb.query<Pick<HabitLogRow, 'log_date'>>(
    `SELECT log_date::text
     FROM   habit_logs
     WHERE  habit_id = $1
       AND  completed = TRUE
       AND  log_date <= CURRENT_DATE
     ORDER  BY log_date DESC
     LIMIT  365`,
    [habitId],
  )

  const completedDates = logs.map(l => l.log_date)
  const currentStreak  = computeStreak(completedDates)

  // 4. Persist streak & update longest if beaten — placeholders in ascending order
  const { data: updated } = await retoolDb.query<{ current_streak: number; longest_streak: number }>(
    `UPDATE habits
     SET current_streak = $1,
         longest_streak = GREATEST(longest_streak, $1),
         updated_at     = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING current_streak, longest_streak`,
    [currentStreak, habitId, userId],
  )

  return {
    habitId,
    completedToday,
    currentStreak:  updated[0]?.current_streak ?? currentStreak,
    longestStreak:  updated[0]?.longest_streak  ?? currentStreak,
  }
}
