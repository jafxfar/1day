import type { Database } from '../../db.js'

export interface MorningRow {
  checkin_date: string
  mood: number | null
  energy: number | null
  sleep_hours: number | null
  focus_text: string | null
}
export interface EveningRow {
  checkin_date: string
  rating: number | null
  tags: string[]
  wins: string | null
  failures: string | null
}
export interface HabitRecordRow {
  log_date: string
  title: string
  icon: string
  completed: boolean
}
export interface JournalRecordRow {
  entry_date: string
  title: string
  content: string
  mood: number | null
  tags: string[]
}

export const createBiographyRepository = (database: Database) => ({
  getYear: async (userId: number) => {
    const [mornings, evenings, habits, journals] = await Promise.all([
      database.query<MorningRow>(
        `SELECT checkin_date::text, mood, energy, sleep_hours, focus_text
         FROM day_checkins WHERE user_id = $1 AND checkin_type = 'morning'
           AND checkin_date >= CURRENT_DATE - INTERVAL '365 days'
         ORDER BY checkin_date DESC`,
        [userId],
      ),
      database.query<EveningRow>(
        `SELECT checkin_date::text, rating, tags, wins, failures
         FROM day_checkins WHERE user_id = $1 AND checkin_type = 'evening'
           AND checkin_date >= CURRENT_DATE - INTERVAL '365 days'
         ORDER BY checkin_date DESC`,
        [userId],
      ),
      database.query<HabitRecordRow>(
        `SELECT hl.log_date::text, h.title, h.icon, hl.completed
         FROM habit_logs hl JOIN habits h ON h.id = hl.habit_id AND h.deleted_at IS NULL
         WHERE hl.user_id = $1 AND hl.log_date >= CURRENT_DATE - INTERVAL '365 days'
         ORDER BY hl.log_date DESC, h.created_at ASC`,
        [userId],
      ),
      database.query<JournalRecordRow>(
        `SELECT DISTINCT ON (entry_date) entry_date::text, title, content, mood, tags
         FROM journal_entries WHERE user_id = $1 AND deleted_at IS NULL
           AND entry_date >= CURRENT_DATE - INTERVAL '365 days'
         ORDER BY entry_date DESC, created_at DESC`,
        [userId],
      ),
    ])
    return {
      mornings: mornings.rows,
      evenings: evenings.rows,
      habits: habits.rows,
      journals: journals.rows,
    }
  },
})

export type BiographyRepository = ReturnType<typeof createBiographyRepository>
