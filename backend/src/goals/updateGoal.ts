
import { mapGoal } from '../lib/mappers'
import type { GoalCategory, GoalRow } from '../lib/types'
import { retoolDb } from '../db';

interface Params {
  id: string
  title?: string
  description?: string
  category?: GoalCategory
  progress?: number
  deadline?: string | null
  isCompleted?: boolean
}

/**
 * Partial update — only provided fields are changed.
 * progress is clamped to [0, 100] server-side.
 * isCompleted=true sets completed_at; false clears it.
 */
export default async function updateGoal(req: { params: Params; user: User }) {
  const { id, title, description, category, progress, deadline, isCompleted } = req.params

  if (!id) throw new Error('Goal id is required')

  const clampedProgress =
    progress !== undefined ? Math.min(100, Math.max(0, Math.round(progress))) : undefined

  // Build dynamic SET clause to keep placeholder ordering strict
  const setClauses: string[] = ['updated_at = NOW()']
  const params: unknown[]    = [id, req.user.id]  // $1, $2 are always id + user_id
  let idx = 3

  if (title !== undefined)       { setClauses.push(`title = $${idx}`)       ; params.push(title.trim())       ; idx++ }
  if (description !== undefined) { setClauses.push(`description = $${idx}`) ; params.push(description.trim()) ; idx++ }
  if (category !== undefined)    { setClauses.push(`category = $${idx}`)    ; params.push(category)           ; idx++ }
  if (clampedProgress !== undefined) { setClauses.push(`progress = $${idx}`); params.push(clampedProgress)    ; idx++ }
  if (deadline !== undefined)    { setClauses.push(`deadline = $${idx}`)    ; params.push(deadline ?? null)   ; idx++ }
  if (isCompleted !== undefined) {
    setClauses.push(`is_completed = $${idx}`)
    params.push(isCompleted)
    idx++
    if (isCompleted) {
      setClauses.push(`completed_at = NOW()`)
    } else {
      setClauses.push(`completed_at = NULL`)
    }
  }

  const sql = `
    UPDATE goals
    SET    ${setClauses.join(', ')}
    WHERE  id = $1 AND user_id = $2 AND deleted_at IS NULL
    RETURNING *`

  const { data } = await retoolDb.query<GoalRow>(sql, params)

  const row = data[0]
  if (!row) throw new Error('Goal not found or not owned by user')

  return mapGoal(row)
}
