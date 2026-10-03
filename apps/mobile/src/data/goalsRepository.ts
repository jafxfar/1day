import {
  childNodeTypeByParent,
  requiredParentNodeType,
  type CreateGoalPayload,
  type CreateGoalTreePayload,
  type Goal,
  type NodeType,
  type TaskType,
  type UpdateGoalPayload,
} from '@life-os/contracts'
import { ApiError } from '../api/client'
import { getDatabase } from '../db/client'
import { createId, nowIso } from '../lib/ids'
import { mapGoal, type GoalRow } from './mappers'
import { requireUserId } from './requireUser'

const assertTaskType = (nodeType: NodeType, taskType: TaskType | null | undefined) => {
  if (nodeType === 'task') {
    return taskType ?? 'other'
  }
  if (taskType) throw new ApiError('Only tasks can have a task type', 400)
  return null
}

const computeDepths = (rows: GoalRow[]): Map<string, number> => {
  const byId = new Map(rows.map(row => [row.id, row]))
  const depths = new Map<string, number>()

  const depthOf = (id: string): number => {
    const cached = depths.get(id)
    if (cached !== undefined) return cached
    const row = byId.get(id)
    if (!row || !row.parent_id) {
      depths.set(id, 0)
      return 0
    }
    const depth = depthOf(row.parent_id) + 1
    depths.set(id, depth)
    return depth
  }

  rows.forEach(row => {
    depthOf(row.id)
  })

  return depths
}

const listGoalRows = async (userId: number): Promise<GoalRow[]> => {
  const db = await getDatabase()
  return db.getAllAsync<GoalRow>(
    `SELECT * FROM goals
     WHERE user_id = ? AND deleted_at IS NULL
     ORDER BY created_at ASC`,
    [userId],
  )
}

const findGoalRow = async (id: string, userId: number): Promise<(GoalRow & { depth: number }) | null> => {
  const rows = await listGoalRows(userId)
  const row = rows.find(item => item.id === id)
  if (!row) return null
  const depths = computeDepths(rows)
  return { ...row, depth: depths.get(row.id) ?? 0 }
}

export const goalsRepository = {
  getAll: async (): Promise<Goal[]> => {
    const userId = await requireUserId()
    const rows = await listGoalRows(userId)
    const depths = computeDepths(rows)
    return rows
      .map(row => mapGoal(row, depths.get(row.id) ?? 0))
      .sort((a, b) => (a.depth - b.depth) || a.createdAt.localeCompare(b.createdAt))
  },

  create: async (payload: CreateGoalPayload): Promise<Goal> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const nodeType = payload.nodeType
    const parentId = payload.parentId ?? null
    const taskType = assertTaskType(nodeType, payload.taskType)

    if (nodeType === 'goal') {
      if (parentId) throw new ApiError('Goals cannot have a parent', 400)
    } else {
      if (!parentId) throw new ApiError(`${nodeType} requires a parent`, 400)
      const parent = await findGoalRow(parentId, userId)
      if (!parent) throw new ApiError('Parent goal not found', 404)
      const expectedParent = requiredParentNodeType[nodeType]
      if (parent.node_type !== expectedParent) {
        throw new ApiError(`${nodeType} must be nested under a ${expectedParent}`, 400)
      }
    }

    const id = createId()
    const createdAt = nowIso()
    await db.runAsync(
      `INSERT INTO goals (
         id, user_id, title, description, category, deadline, parent_id, node_type, task_type, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        payload.title,
        payload.description ?? '',
        payload.category ?? 'personal',
        payload.deadline ?? null,
        parentId,
        nodeType,
        taskType,
        createdAt,
        createdAt,
      ],
    )

    const row = await findGoalRow(id, userId)
    if (!row) throw new ApiError('Goal creation failed', 500)
    return mapGoal(row, row.depth)
  },

  createTree: async (payload: CreateGoalTreePayload): Promise<Goal[]> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const createdAt = nowIso()
    const rootId = createId()
    const createdIds = [rootId]

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO goals (
           id, user_id, title, description, category, deadline, parent_id, node_type, task_type, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, NULL, 'goal', NULL, ?, ?)`,
        [
          rootId,
          userId,
          payload.title,
          payload.description ?? '',
          payload.category,
          payload.deadline ?? null,
          createdAt,
          createdAt,
        ],
      )

      for (const step of payload.steps ?? []) {
        const stepId = createId()
        createdIds.push(stepId)
        await db.runAsync(
          `INSERT INTO goals (
             id, user_id, title, description, category, deadline, parent_id, node_type, task_type, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, 'task', ?, ?, ?)`,
          [
            stepId,
            userId,
            step.title,
            step.description ?? '',
            payload.category,
            step.deadline ?? null,
            rootId,
            step.taskType ?? 'other',
            createdAt,
            createdAt,
          ],
        )
      }
    })

    const all = await goalsRepository.getAll()
    const idSet = new Set(createdIds)
    return all.filter(goal => idSet.has(goal.id))
  },

  update: async (id: string, payload: UpdateGoalPayload): Promise<Goal> => {
    const userId = await requireUserId()
    const existing = await findGoalRow(id, userId)
    if (!existing) throw new ApiError('Goal not found', 404)

    if (payload.taskType !== undefined) {
      assertTaskType(existing.node_type as NodeType, payload.taskType)
    }

    const db = await getDatabase()
    const updatedAt = nowIso()
    const nextTitle = payload.title ?? existing.title
    const nextDescription = payload.description ?? existing.description
    const nextCategory = payload.category ?? existing.category
    const nextProgress = payload.progress !== undefined
      ? Math.round(payload.progress)
      : existing.progress
    const nextDeadline = payload.deadline !== undefined ? payload.deadline : existing.deadline
    const nextTaskType = payload.taskType !== undefined ? payload.taskType : existing.task_type
    const nextCompleted = payload.isCompleted !== undefined
      ? (payload.isCompleted ? 1 : 0)
      : existing.is_completed
    const nextCompletedAt = payload.isCompleted === undefined
      ? existing.completed_at
      : (payload.isCompleted ? updatedAt : null)

    await db.runAsync(
      `UPDATE goals SET
         title = ?, description = ?, category = ?, progress = ?, deadline = ?,
         task_type = ?, is_completed = ?, completed_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [
        nextTitle,
        nextDescription,
        nextCategory,
        nextProgress,
        nextDeadline,
        nextTaskType,
        nextCompleted,
        nextCompletedAt,
        updatedAt,
        id,
        userId,
      ],
    )

    const row = await findGoalRow(id, userId)
    if (!row) throw new ApiError('Goal not found', 404)
    return mapGoal(row, row.depth)
  },

  delete: async (id: string): Promise<{ success: boolean; id: string }> => {
    const userId = await requireUserId()
    const rows = await listGoalRows(userId)
    const root = rows.find(row => row.id === id)
    if (!root) throw new ApiError('Goal not found', 404)

    const toDelete = new Set<string>([id])
    let changed = true
    while (changed) {
      changed = false
      for (const row of rows) {
        if (row.parent_id && toDelete.has(row.parent_id) && !toDelete.has(row.id)) {
          toDelete.add(row.id)
          changed = true
        }
      }
    }

    const db = await getDatabase()
    const deletedAt = nowIso()
    for (const goalId of toDelete) {
      await db.runAsync(
        `UPDATE goals SET deleted_at = ?, updated_at = ?
         WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
        [deletedAt, deletedAt, goalId, userId],
      )
    }

    return { success: true, id }
  },

  nextChildType: (parentType: NodeType): NodeType | null => childNodeTypeByParent[parentType],
}
