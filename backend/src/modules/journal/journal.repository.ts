import type { CreateJournalEntryPayload, JournalQuery } from '@life-os/contracts'
import type { Database } from '../../db.js'
import type { JournalEntryRow } from '../../lib/types.js'

export const createJournalRepository = (database: Database) => ({
  list: async (userId: number, query: JournalQuery) => {
    const result = await database.query<JournalEntryRow>(
      `SELECT id, user_id, entry_date::text, title, content, mood, energy, tags,
              deleted_at, created_at, updated_at
       FROM journal_entries
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY entry_date DESC, created_at DESC LIMIT $2 OFFSET $3`,
      [userId, query.limit, query.offset],
    )
    return result.rows
  },
  create: async (userId: number, payload: CreateJournalEntryPayload) => {
    const result = await database.query<JournalEntryRow>(
      `INSERT INTO journal_entries (user_id, entry_date, title, content, mood, energy, tags)
       VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3, $4, $5, $6, $7::text[])
       RETURNING *`,
      [userId, payload.entryDate ?? null, payload.title, payload.content, payload.mood, payload.energy, payload.tags],
    )
    return result.rows[0] ?? null
  },
  softDelete: async (id: string, userId: number) => {
    const result = await database.query<{ id: string }>(
      `UPDATE journal_entries SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id`,
      [id, userId],
    )
    return result.rows[0] ?? null
  },
})

export type JournalRepository = ReturnType<typeof createJournalRepository>
