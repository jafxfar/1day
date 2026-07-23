import { retoolDb } from '../db';

interface Params {
  id: string
}

/** Soft-delete a journal entry. */
export default async function deleteJournalEntry(req: { params: Params; user: User }) {
  const { id } = req.params
  if (!id) throw new Error('Entry id is required')

  const { data } = await retoolDb.query<{ id: string }>(
    `UPDATE journal_entries
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [id, req.user.id],
  )

  if (!data[0]) throw new Error('Entry not found or already deleted')

  return { success: true, id }
}
