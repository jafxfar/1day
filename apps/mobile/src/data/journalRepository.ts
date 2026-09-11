import type { CreateJournalEntryPayload, JournalEntry } from '@life-os/contracts'
import { ApiError } from '../api/client'
import { getDatabase } from '../db/client'
import { parseJsonArray, toJsonArray } from '../db/schema'
import { createId, nowIso, todayIsoDate } from '../lib/ids'
import { mapJournalEntry, type JournalRow } from './mappers'
import { requireUserId } from './requireUser'

export type GetJournalEntriesPayload = {
  limit?: number
  offset?: number
}

export const journalRepository = {
  getAll: async (payload: GetJournalEntriesPayload = {}): Promise<JournalEntry[]> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const limit = payload.limit ?? 50
    const offset = payload.offset ?? 0

    const rows = await db.getAllAsync<JournalRow>(
      `SELECT * FROM journal_entries
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY entry_date DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset],
    )

    return rows.map(row => mapJournalEntry(row, parseJsonArray<string>(row.tags_json)))
  },

  create: async (payload: CreateJournalEntryPayload): Promise<JournalEntry> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const id = createId()
    const createdAt = nowIso()
    const entryDate = payload.entryDate ?? todayIsoDate()
    const tags = payload.tags ?? []

    await db.runAsync(
      `INSERT INTO journal_entries (
         id, user_id, entry_date, title, content, mood, energy, tags_json, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        entryDate,
        payload.title,
        payload.content,
        payload.mood,
        payload.energy,
        toJsonArray(tags),
        createdAt,
        createdAt,
      ],
    )

    const row = await db.getFirstAsync<JournalRow>('SELECT * FROM journal_entries WHERE id = ?', [id])
    if (!row) throw new ApiError('Journal entry creation failed', 500)
    return mapJournalEntry(row, parseJsonArray<string>(row.tags_json))
  },

  delete: async (id: string): Promise<{ success: boolean; id: string }> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const result = await db.runAsync(
      `UPDATE journal_entries SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [nowIso(), nowIso(), id, userId],
    )
    if (result.changes === 0) throw new ApiError('Journal entry not found', 404)
    return { success: true, id }
  },
}
