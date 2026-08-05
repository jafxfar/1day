import type {
  CreateGoalPayload,
  CreateGoalTreePayload,
  NodeType,
  TaskType,
  UpdateGoalPayload,
} from '@life-os/contracts'
import {
  childNodeTypeByParent,
  requiredParentNodeType,
} from '@life-os/contracts'
import { AppError } from '../../lib/errors.js'
import { mapGoal } from '../../lib/mappers.js'
import type { CreateGoalValues, GoalsRepository } from './goals.repository.js'

const assertTaskType = (nodeType: NodeType, taskType: TaskType | null | undefined) => {
  if (nodeType === 'task') {
    if (!taskType) throw new AppError(400, 'Tasks require a task type')
    return taskType
  }
  if (taskType) throw new AppError(400, 'Only tasks can have a task type')
  return null
}

export const createGoalsService = (repository: GoalsRepository) => ({
  list: async (userId: number) => (await repository.list(userId)).map(mapGoal),

  create: async (userId: number, payload: CreateGoalPayload) => {
    const nodeType = payload.nodeType
    const parentId = payload.parentId ?? null
    const taskType = assertTaskType(nodeType, payload.taskType)

    if (nodeType === 'goal') {
      if (parentId) throw new AppError(400, 'Goals cannot have a parent')
    } else {
      if (!parentId) throw new AppError(400, `${nodeType} requires a parent`)
      const parent = await repository.findById(parentId, userId)
      if (!parent) throw new AppError(404, 'Parent goal not found')
      const expectedParent = requiredParentNodeType[nodeType]
      if (parent.node_type !== expectedParent) {
        throw new AppError(400, `${nodeType} must be nested under a ${expectedParent}`)
      }
    }

    const row = await repository.create(userId, {
      title: payload.title,
      description: payload.description ?? '',
      category: payload.category ?? 'personal',
      deadline: payload.deadline,
      parentId,
      nodeType,
      taskType,
    })
    if (!row) throw new AppError(500, 'Goal creation failed')

    const depth = parentId
      ? ((await repository.findById(parentId, userId))?.depth ?? 0) + 1
      : 0
    return mapGoal({ ...row, depth })
  },

  createTree: async (userId: number, payload: CreateGoalTreePayload) => {
    type PendingNode = {
      tempId: string
      parentTempId: string | null
      values: Omit<CreateGoalValues, 'parentId'>
    }

    const pending: PendingNode[] = []
    const rootTempId = 'root'
    const milestones = payload.milestones ?? []

    pending.push({
      tempId: rootTempId,
      parentTempId: null,
      values: {
        title: payload.title,
        description: payload.description ?? '',
        category: payload.category,
        deadline: payload.deadline,
        nodeType: 'goal',
        taskType: null,
      },
    })

    milestones.forEach((milestone, milestoneIndex) => {
      const milestoneTempId = `m-${milestoneIndex}`
      const projects = milestone.projects ?? []
      pending.push({
        tempId: milestoneTempId,
        parentTempId: rootTempId,
        values: {
          title: milestone.title,
          description: milestone.description ?? '',
          category: payload.category,
          deadline: milestone.deadline,
          nodeType: 'milestone',
          taskType: null,
        },
      })

      projects.forEach((project, projectIndex) => {
        const projectTempId = `p-${milestoneIndex}-${projectIndex}`
        const tasks = project.tasks ?? []
        pending.push({
          tempId: projectTempId,
          parentTempId: milestoneTempId,
          values: {
            title: project.title,
            description: project.description ?? '',
            category: payload.category,
            deadline: project.deadline,
            nodeType: 'project',
            taskType: null,
          },
        })

        tasks.forEach((task, taskIndex) => {
          pending.push({
            tempId: `t-${milestoneIndex}-${projectIndex}-${taskIndex}`,
            parentTempId: projectTempId,
            values: {
              title: task.title,
              description: task.description ?? '',
              category: payload.category,
              deadline: task.deadline,
              nodeType: 'task',
              taskType: task.taskType,
            },
          })
        })
      })
    })

    const created = await repository.createTreeTransactional(userId, pending)
    const listed = await repository.list(userId)
    const createdIds = new Set(created.map(row => row.id))
    return listed.filter(row => createdIds.has(row.id)).map(mapGoal)
  },

  update: async (id: string, userId: number, payload: UpdateGoalPayload) => {
    const existing = await repository.findById(id, userId)
    if (!existing) throw new AppError(404, 'Goal not found')

    if (payload.taskType !== undefined) {
      assertTaskType(existing.node_type, payload.taskType)
    }

    const row = await repository.update(id, userId, payload)
    if (!row) throw new AppError(404, 'Goal not found')
    return mapGoal({ ...row, depth: existing.depth })
  },

  remove: async (id: string, userId: number) => {
    if (!await repository.softDelete(id, userId)) throw new AppError(404, 'Goal not found')
    return { success: true, id }
  },

  nextChildType: (parentType: NodeType): NodeType | null => childNodeTypeByParent[parentType],
})

export type GoalsService = ReturnType<typeof createGoalsService>
