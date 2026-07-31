import type { UpdateGoalPayload } from '@life-os/contracts'
import type { Database } from '../../db.js'
import type { GoalRow, PeriodType } from '../../lib/types.js'

export const createGoalsRepository = (database: Database) => ({
  list: async (userId: number) => {
    const result = await database.query<GoalRow & { depth: number }>(
      `WITH RECURSIVE goal_tree AS (
         SELECT g.*, 0 AS depth FROM goals g
         WHERE g.user_id = $1 AND g.parent_id IS NULL AND g.deleted_at IS NULL
         UNION ALL
         SELECT g.*, gt.depth + 1 FROM goals g
         JOIN goal_tree gt ON g.parent_id = gt.id
         WHERE g.deleted_at IS NULL
       )
       SELECT * FROM goal_tree ORDER BY depth, created_at ASC`,
      [userId],
    )
    return result.rows
  },
  findParent: async (id: string, userId: number) => {
    const result = await database.query<Pick<GoalRow, 'id' | 'period_type'> & { depth: number }>(
      `WITH RECURSIVE tree AS (
         SELECT id, parent_id, period_type, 0 AS depth
         FROM goals
         WHERE user_id = $1 AND parent_id IS NULL AND deleted_at IS NULL
         UNION ALL
         SELECT g.id, g.parent_id, g.period_type, tree.depth + 1
         FROM goals g JOIN tree ON g.parent_id = tree.id
         WHERE g.deleted_at IS NULL
       )
       SELECT id, period_type, depth FROM tree WHERE id = $2`,
      [userId, id],
    )
    return result.rows[0] ?? null
  },
  create: async (
    userId: number,
    values: {
      title: string
      description: string
      category: string
      deadline: string | null
      parentId: string | null
      periodType: PeriodType
    },
  ) => {
    const result = await database.query<GoalRow>(
      `INSERT INTO goals (user_id, title, description, category, deadline, parent_id, period_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, values.title, values.description, values.category, values.deadline, values.parentId, values.periodType],
    )
    return result.rows[0] ?? null
  },
  update: async (id: string, userId: number, values: UpdateGoalPayload) => {
    const clauses = ['updated_at = NOW()']
    const parameters: unknown[] = [id, userId]

    const add = (column: string, value: unknown) => {
      parameters.push(value)
      clauses.push(`${column} = $${parameters.length}`)
    }

    if (values.title !== undefined) add('title', values.title)
    if (values.description !== undefined) add('description', values.description)
    if (values.category !== undefined) add('category', values.category)
    if (values.progress !== undefined) add('progress', Math.round(values.progress))
    if (values.deadline !== undefined) add('deadline', values.deadline)
    if (values.isCompleted !== undefined) {
      add('is_completed', values.isCompleted)
      clauses.push(values.isCompleted ? 'completed_at = NOW()' : 'completed_at = NULL')
    }

    const result = await database.query<GoalRow>(
      `UPDATE goals SET ${clauses.join(', ')}
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *`,
      parameters,
    )
    return result.rows[0] ?? null
  },
  softDelete: async (id: string, userId: number) => {
    const result = await database.query<{ id: string }>(
      `UPDATE goals SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id`,
      [id, userId],
    )
    return result.rows[0] ?? null
  },
})

export type GoalsRepository = ReturnType<typeof createGoalsRepository>
