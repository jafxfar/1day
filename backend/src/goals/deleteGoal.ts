
interface Params {
  id: string
}
import { retoolDb } from '../db';

/** Soft-delete: sets deleted_at, never removes the row. */
export default async function deleteGoal(req: { params: Params; user: User }) {
  const { id } = req.params
  if (!id) throw new Error('Goal id is required')

  const { data } = await retoolDb.query<{ id: string }>(
    `UPDATE goals
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [id, req.user.id],
  )

  if (!data[0]) throw new Error('Goal not found or already deleted')

  return { success: true, id }
}
