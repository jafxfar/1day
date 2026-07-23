
import { mapGoal } from '../lib/mappers'
import type { GoalCategory, GoalRow, PeriodType } from '../lib/types'
import { retoolDb } from '../db';

interface Params {
  title: string
  description: string
  category: GoalCategory
  deadline: string | null
  parentId?: string | null
  periodType?: PeriodType
}

/** Infer the expected child period type from a parent's period type */
function inferChildPeriodType(parentType: PeriodType): PeriodType {
  const map: Record<PeriodType, PeriodType> = {
    long_term: 'monthly',
    monthly:   'weekly',
    weekly:    'daily',
    daily:     'daily',
  }
  return map[parentType]
}

export default async function createGoal(req: { params: Params; user: User }) {
  const { title, description, category, deadline, parentId, periodType } = req.params

  if (!title?.trim()) throw new Error('Goal title is required')

  let resolvedPeriodType: PeriodType = periodType ?? 'long_term'
  let resolvedDepth = 0

  if (parentId) {
    // 1. Validate parent ownership and get its period_type + depth
    const { data: parents } = await retoolDb.query<Pick<GoalRow, 'id' | 'period_type'> & { depth: number }>(
      `WITH RECURSIVE t AS (
         SELECT id, parent_id, period_type, 0 AS depth FROM goals WHERE id = $1 AND user_id = $2
         UNION ALL
         SELECT g.id, g.parent_id, g.period_type, t.depth + 1
         FROM goals g JOIN t ON g.id = t.parent_id
       )
       SELECT id, period_type, MAX(depth) AS depth FROM t GROUP BY id, period_type
       LIMIT 1`,
      [parentId, req.user.id],
    )
    const parent = parents[0]
    if (!parent) throw new Error('Parent goal not found or not owned by user')

    if (!periodType) resolvedPeriodType = inferChildPeriodType(parent.period_type)
    resolvedDepth = parent.depth + 1
  }

  // 2. Insert goal
  const { data } = await retoolDb.query<GoalRow>(
    `INSERT INTO goals (user_id, title, description, category, deadline, parent_id, period_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      req.user.id,
      title.trim(),
      description?.trim() ?? '',
      category,
      deadline ?? null,
      parentId ?? null,
      resolvedPeriodType,
    ],
  )

  const row = data[0]
  if (!row) throw new Error('Goal creation failed')

  return mapGoal({ ...row, depth: resolvedDepth })
}
