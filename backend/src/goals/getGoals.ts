
import { mapGoal } from '../lib/mappers'
import type { GoalRow } from '../lib/types'
import { retoolDb } from '../db';

/**
 * Returns all active goals for the user as a flat list pre-ordered depth-first
 * via recursive CTE (parents always before their children).
 *
 * The `depth` column (0 = root) is included so the frontend can render nesting
 * without building a tree data structure.
 */
export default async function getGoals(req: { params: Record<string, never>; user: User }) {
  const { data } = await retoolDb.query<GoalRow & { depth: number }>(
    `WITH RECURSIVE goal_tree AS (
       -- Root goals (no parent)
       SELECT g.*, 0 AS depth
       FROM   goals g
       WHERE  g.user_id = $1
         AND  g.parent_id IS NULL
         AND  g.deleted_at IS NULL

       UNION ALL

       -- Children (joined on parent already in the CTE)
       SELECT g.*, gt.depth + 1
       FROM   goals g
       JOIN   goal_tree gt ON g.parent_id = gt.id
       WHERE  g.deleted_at IS NULL
     )
     SELECT id, user_id, title, description, category, progress, deadline,
            is_completed, completed_at, parent_id, period_type, deleted_at,
            created_at, updated_at, depth
     FROM   goal_tree
     ORDER  BY depth, created_at ASC`,
    [req.user.id],
  )

  return data.map(row => mapGoal(row))
}
