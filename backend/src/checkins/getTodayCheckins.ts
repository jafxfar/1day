
import { mapMorningCheckin, mapEveningReflection } from '../lib/mappers'
import type { DayCheckinRow, TodayCheckins } from '../lib/types'
import { retoolDb } from '../db';

/**
 * Returns both morning and evening checkins for today in one query.
 * Either or both may be null if not yet completed.
 */
export default async function getTodayCheckins(
  req: { params: Record<string, never>; user: User },
): Promise<TodayCheckins> {
  const { data } = await retoolDb.query<DayCheckinRow>(
    `SELECT id, user_id, checkin_date::text, checkin_type,
            sleep_hours, energy, mood, focus_text,
            rating, wins, failures, reasons, tags,
            created_at, updated_at
     FROM   day_checkins
     WHERE  user_id = $1
       AND  checkin_date = CURRENT_DATE`,
    [req.user.id],
  )

  let morning: TodayCheckins['morning'] = null
  let evening: TodayCheckins['evening'] = null

  for (const row of data) {
    if (row.checkin_type === 'morning') morning = mapMorningCheckin(row)
    if (row.checkin_type === 'evening') evening = mapEveningReflection(row)
  }

  return { morning, evening }
}
