import type {
  SaveEveningReflectionPayload,
  SaveMorningCheckinPayload,
} from '@life-os/contracts'
import type { Database } from '../../db.js'
import type { DayCheckinRow } from '../../lib/types.js'

export const createCheckinsRepository = (database: Database) => ({
  today: async (userId: number) => {
    const result = await database.query<DayCheckinRow>(
      `SELECT id, user_id, checkin_date::text, checkin_type, sleep_hours, energy,
              mood, focus_text, rating, wins, failures, reasons, tags, created_at, updated_at
       FROM day_checkins WHERE user_id = $1 AND checkin_date = CURRENT_DATE`,
      [userId],
    )
    return result.rows
  },
  saveMorning: async (userId: number, payload: SaveMorningCheckinPayload) => {
    const result = await database.query<DayCheckinRow>(
      `INSERT INTO day_checkins
         (user_id, checkin_date, checkin_type, sleep_hours, energy, mood, focus_text)
       VALUES ($1, COALESCE($2::date, CURRENT_DATE), 'morning', $3, $4, $5, $6)
       ON CONFLICT (user_id, checkin_date, checkin_type) DO UPDATE SET
         sleep_hours = EXCLUDED.sleep_hours, energy = EXCLUDED.energy,
         mood = EXCLUDED.mood, focus_text = EXCLUDED.focus_text, updated_at = NOW()
       RETURNING *`,
      [userId, payload.checkinDate ?? null, payload.sleepHours, payload.energy, payload.mood, payload.focusText],
    )
    return result.rows[0] ?? null
  },
  saveEvening: async (userId: number, payload: SaveEveningReflectionPayload) => {
    const result = await database.query<DayCheckinRow>(
      `INSERT INTO day_checkins
         (user_id, checkin_date, checkin_type, rating, wins, failures, reasons, tags)
       VALUES ($1, COALESCE($2::date, CURRENT_DATE), 'evening', $3, $4, $5, $6, $7::text[])
       ON CONFLICT (user_id, checkin_date, checkin_type) DO UPDATE SET
         rating = EXCLUDED.rating, wins = EXCLUDED.wins, failures = EXCLUDED.failures,
         reasons = EXCLUDED.reasons, tags = EXCLUDED.tags, updated_at = NOW()
       RETURNING *`,
      [userId, payload.checkinDate ?? null, payload.rating, payload.wins, payload.failures, payload.reasons, payload.tags],
    )
    return result.rows[0] ?? null
  },
})

export type CheckinsRepository = ReturnType<typeof createCheckinsRepository>
