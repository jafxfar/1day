
import { mapMorningCheckin } from '../lib/mappers'
import type { DayCheckinRow } from '../lib/types'
import { retoolDb } from '../db';

interface Params {
  sleepHours: number
  energy: number
  mood: number
  focusText: string
  checkinDate?: string  // defaults to today server-side
}

/**
 * Upsert today's morning checkin.
 * Safe to call multiple times — subsequent calls update the existing row.
 */
export default async function saveMorningCheckin(req: { params: Params; user: User }) {
  const { sleepHours, energy, mood, focusText, checkinDate } = req.params

  const clampedEnergy = Math.min(10, Math.max(1, Math.round(energy ?? 5)))
  const clampedMood   = Math.min(5,  Math.max(1, Math.round(mood   ?? 3)))
  const clampedSleep  = Math.min(12, Math.max(1, Math.round(sleepHours ?? 7)))
  const date          = checkinDate ?? new Date().toISOString().split('T')[0]!

  const { data } = await retoolDb.query<DayCheckinRow>(
    `INSERT INTO day_checkins
       (user_id, checkin_date, checkin_type, sleep_hours, energy, mood, focus_text)
     VALUES ($1, $2, 'morning', $3, $4, $5, $6)
     ON CONFLICT (user_id, checkin_date, checkin_type)
     DO UPDATE SET
       sleep_hours = EXCLUDED.sleep_hours,
       energy      = EXCLUDED.energy,
       mood        = EXCLUDED.mood,
       focus_text  = EXCLUDED.focus_text,
       updated_at  = NOW()
     RETURNING *`,
    [req.user.id, date, clampedSleep, clampedEnergy, clampedMood, focusText?.trim() ?? ''],
  )

  const row = data[0]
  if (!row) throw new Error('Morning checkin save failed')

  return mapMorningCheckin(row)
}
