
import { mapEveningReflection } from '../lib/mappers'
import type { DayCheckinRow } from '../lib/types'
import { retoolDb } from '../db';

interface Params {
  rating: number
  wins: string
  failures: string
  reasons: string
  tags: string[]
  checkinDate?: string  // defaults to today server-side
}

/**
 * Upsert today's evening reflection.
 * Safe to call multiple times — subsequent calls update the existing row.
 */
export default async function saveEveningReflection(req: { params: Params; user: User }) {
  const { rating, wins, failures, reasons, tags, checkinDate } = req.params

  const clampedRating = Math.min(10, Math.max(1, Math.round(rating ?? 5)))
  const safeTags      = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : []
  const date          = checkinDate ?? new Date().toISOString().split('T')[0]!

  const { data } = await retoolDb.query<DayCheckinRow>(
    `INSERT INTO day_checkins
       (user_id, checkin_date, checkin_type, rating, wins, failures, reasons, tags)
     VALUES ($1, $2, 'evening', $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, checkin_date, checkin_type)
     DO UPDATE SET
       rating     = EXCLUDED.rating,
       wins       = EXCLUDED.wins,
       failures   = EXCLUDED.failures,
       reasons    = EXCLUDED.reasons,
       tags       = EXCLUDED.tags,
       updated_at = NOW()
     RETURNING *`,
    [
      req.user.id,
      date,
      clampedRating,
      wins?.trim()     ?? '',
      failures?.trim() ?? '',
      reasons?.trim()  ?? '',
      `{${safeTags.map(t => `"${t.replace(/"/g, '\\"')}"`).join(',')}}`,
    ],
  )

  const row = data[0]
  if (!row) throw new Error('Evening reflection save failed')

  return mapEveningReflection(row)
}
