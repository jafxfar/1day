import type { Database } from '../../db.js'
import type { HabitLogRow, HabitRow } from '../../lib/types.js'

export const createHabitsRepository = (database: Database) => ({
  list: async (userId: number) => {
    const habits = await database.query<HabitRow>(
      `SELECT * FROM habits
       WHERE user_id = $1 AND deleted_at IS NULL AND is_archived = FALSE
       ORDER BY created_at ASC`,
      [userId],
    )
    if (habits.rows.length === 0) return { habits: [], logs: [] }

    const ids = habits.rows.map(habit => habit.id)
    const logs = await database.query<Pick<HabitLogRow, 'habit_id' | 'log_date' | 'completed'>>(
      `SELECT habit_id, log_date::text, completed FROM habit_logs
       WHERE user_id = $1 AND habit_id = ANY($2::uuid[])
         AND log_date BETWEEN CURRENT_DATE - INTERVAL '365 days' AND CURRENT_DATE
       ORDER BY habit_id, log_date DESC`,
      [userId, ids],
    )
    return { habits: habits.rows, logs: logs.rows }
  },
  create: async (userId: number, title: string, type: string, icon: string, category: string) => {
    const result = await database.query<HabitRow>(
      `INSERT INTO habits (user_id, title, type, icon, category)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, title, type, icon, category],
    )
    return result.rows[0] ?? null
  },
  toggle: async (
    habitId: string,
    userId: number,
    calculateStreak: (dates: string[]) => number,
  ) => {
    const client = await database.connect()
    try {
      await client.query('BEGIN')
      const habit = await client.query<{ id: string }>(
        `SELECT id FROM habits
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
         FOR UPDATE`,
        [habitId, userId],
      )
      if (!habit.rows[0]) {
        await client.query('ROLLBACK')
        return null
      }

      const toggled = await client.query<Pick<HabitLogRow, 'completed'>>(
        `INSERT INTO habit_logs (habit_id, user_id, log_date, completed, completed_at)
         VALUES ($1, $2, CURRENT_DATE, TRUE, NOW())
         ON CONFLICT (habit_id, log_date) DO UPDATE SET
           completed = NOT habit_logs.completed,
           completed_at = CASE WHEN NOT habit_logs.completed THEN NOW() ELSE NULL END
         RETURNING completed`,
        [habitId, userId],
      )
      const logs = await client.query<Pick<HabitLogRow, 'log_date'>>(
        `SELECT log_date::text FROM habit_logs
         WHERE habit_id = $1 AND user_id = $2 AND completed = TRUE
           AND log_date <= CURRENT_DATE
         ORDER BY log_date DESC LIMIT 365`,
        [habitId, userId],
      )
      const currentStreak = calculateStreak(logs.rows.map(log => log.log_date))
      const updated = await client.query<{ current_streak: number; longest_streak: number }>(
        `UPDATE habits SET current_streak = $1,
           longest_streak = GREATEST(longest_streak, $1), updated_at = NOW()
         WHERE id = $2 AND user_id = $3
         RETURNING current_streak, longest_streak`,
        [currentStreak, habitId, userId],
      )
      await client.query('COMMIT')
      return {
        completedToday: toggled.rows[0]?.completed ?? false,
        currentStreak: updated.rows[0]?.current_streak ?? currentStreak,
        longestStreak: updated.rows[0]?.longest_streak ?? currentStreak,
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },
  softDelete: async (id: string, userId: number) => {
    const result = await database.query<{ id: string }>(
      `UPDATE habits SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id`,
      [id, userId],
    )
    return result.rows[0] ?? null
  },
})

export type HabitsRepository = ReturnType<typeof createHabitsRepository>
