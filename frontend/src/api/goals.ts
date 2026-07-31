import type { Goal, GoalCategory, PeriodType } from '../lib/types'
import { request } from './client'

export interface CreateGoalPayload {
  title: string
  description: string
  category: GoalCategory
  deadline: string | null
  parentId?: string | null
  periodType?: PeriodType
}

export interface UpdateGoalPayload {
  id: string
  title?: string
  description?: string
  category?: GoalCategory
  progress?: number
  deadline?: string | null
  isCompleted?: boolean
}

export interface DeleteGoalPayload {
  id: string
}

type DeleteGoalResponse = {
  success: boolean
  id: string
}

export const goalsApi = {
  getAll: () => request<Goal[]>('/api/goals'),
  create: (payload: CreateGoalPayload) => request<Goal>('/api/goals', {
    method: 'POST',
    body: payload,
  }),
  update: ({ id, ...payload }: UpdateGoalPayload) => request<Goal>(
    `/api/goals/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: payload,
    },
  ),
  delete: ({ id }: DeleteGoalPayload) => request<DeleteGoalResponse>(
    `/api/goals/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  ),
}
