import type { UpdateGoalPayload } from '@life-os/contracts'
import type { Database } from '../../db.js'
import type { GoalRow, NodeType, TaskType } from '../../lib/types.js'

export type CreateGoalValues = {
  title: string
  description: string
  category: string
  deadline: string | null
  parentId: string | null
  nodeType: NodeType
  taskType: TaskType | null
}

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
  findById: async (id: string, userId: number) => {
    const result = await database.query<GoalRow & { depth: number }>(
      `WITH RECURSIVE tree AS (
         SELECT g.*, 0 AS depth
         FROM goals g
         WHERE g.user_id = $1 AND g.parent_id IS NULL AND g.deleted_at IS NULL
         UNION ALL
         SELECT g.*, tree.depth + 1
         FROM goals g JOIN tree ON g.parent_id = tree.id
         WHERE g.deleted_at IS NULL
       )
       SELECT * FROM tree WHERE id = $2`,
      [userId, id],
    )
    return result.rows[0] ?? null
  },
  create: async (userId: number, values: CreateGoalValues) => {
    const result = await database.query<GoalRow>(
      `INSERT INTO goals (
         user_id, title, description, category, deadline, parent_id, node_type, task_type
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        userId,
        values.title,
        values.description,
        values.category,
        values.deadline,
        values.parentId,
        values.nodeType,
        values.taskType,
      ],
    )
    return result.rows[0] ?? null
  },
  createTreeTransactional: async (
    userId: number,
    nodes: Array<{
      tempId: string
      parentTempId: string | null
      values: Omit<CreateGoalValues, 'parentId'>
    }>,
  ) => {
    const client = await database.connect()
    const created: GoalRow[] = []
    const idByTemp = new Map<string, string>()
    try {
      await client.query('BEGIN')
      for (const node of nodes) {
        const parentId = node.parentTempId
          ? (idByTemp.get(node.parentTempId) ?? null)
          : null
        if (node.parentTempId && !parentId) {
          throw new Error('Failed to resolve goal tree parents')
        }

        const result = await client.query<GoalRow>(
          `INSERT INTO goals (
             user_id, title, description, category, deadline, parent_id, node_type, task_type
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            userId,
            node.values.title,
            node.values.description,
            node.values.category,
            node.values.deadline,
            parentId,
            node.values.nodeType,
            node.values.taskType,
          ],
        )
        const row = result.rows[0]
        if (!row) throw new Error('Goal creation failed')
        idByTemp.set(node.tempId, row.id)
        created.push(row)
      }
      await client.query('COMMIT')
      return created
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
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
    if (values.taskType !== undefined) add('task_type', values.taskType)
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
      `WITH RECURSIVE descendants AS (
         SELECT id FROM goals
         WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
         UNION ALL
         SELECT g.id FROM goals g
         JOIN descendants d ON g.parent_id = d.id
         WHERE g.deleted_at IS NULL
       )
       UPDATE goals SET deleted_at = NOW(), updated_at = NOW()
       WHERE id IN (SELECT id FROM descendants)
       RETURNING id`,
      [id, userId],
    )
    return result.rows[0] ?? null
  },
})

export type GoalsRepository = ReturnType<typeof createGoalsRepository>
