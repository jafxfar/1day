
import { mapJournalEntry } from '../lib/mappers'
import type { JournalEntryRow } from '../lib/types'
import { retoolDb } from '../db';

interface Params {
  title: string
  content: string
  mood: number
  energy: number
  tags: string[]
  entryDate?: string  // defaults to today server-side
}

export default async function createJournalEntry(req: { params: Params; user: User }) {
  const { title, content, mood, energy, tags, entryDate } = req.params

  if (!title?.trim())   throw new Error('Title is required')
  if (!content?.trim()) throw new Error('Content is required')

  const clampedMood   = Math.min(10, Math.max(1, Math.round(mood   ?? 5)))
  const clampedEnergy = Math.min(10, Math.max(1, Math.round(energy ?? 5)))
  const safeTags      = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : []

  const { data } = await retoolDb.query<JournalEntryRow>(
    `INSERT INTO journal_entries (user_id, entry_date, title, content, mood, energy, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      req.user.id,
      entryDate ?? new Date().toISOString().split('T')[0],
      title.trim(),
      content.trim(),
      clampedMood,
      clampedEnergy,
      `{${safeTags.map(t => `"${t.replace(/"/g, '\\"')}"`).join(',')}}`,
    ],
  )

  const row = data[0]
  if (!row) throw new Error('Journal entry creation failed')

  return mapJournalEntry(row)
}
