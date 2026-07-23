import { retoolDb } from '../db';

import { mapJournalEntry } from '../lib/mappers'
import type { JournalEntryRow } from '../lib/types'

interface Params {
  limit?: number
  offset?: number
}

/**
 * Paginated journal entries for the authenticated user, newest first.
 * Defaults: limit=50, offset=0.
 */
export default async function getJournalEntries(req: { params: Params; user: User }) {
  const limit  = Math.min(req.params.limit  ?? 50, 200)  // cap at 200
  const offset = req.params.offset ?? 0

  const { data } = await retoolDb.query<JournalEntryRow>(
    `SELECT id, user_id, entry_date::text, title, content, mood, energy, tags,
            deleted_at, created_at, updated_at
     FROM   journal_entries
     WHERE  user_id = $1
       AND  deleted_at IS NULL
     ORDER  BY entry_date DESC, created_at DESC
     LIMIT  $2
     OFFSET $3`,
    [req.user.id, limit, offset],
  )

  return data.map(mapJournalEntry)
}
