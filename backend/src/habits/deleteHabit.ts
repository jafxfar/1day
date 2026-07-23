import { retoolDb } from '../db';

interface Params {
  id: string
}

/** Soft-delete: sets deleted_at, preserves historical logs. */
export default async function deleteHabit(req: { params: Params; user: User }) {
  const { id } = req.params
  if (!id) throw new Error('Habit id is required')

  const { data } = await retoolDb.query<{ id: string }>(
    `UPDATE habits
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [id, req.user.id],
  )

  if (!data[0]) throw new Error('Habit not found or already deleted')

  return { success: true, id }
}
