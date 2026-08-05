import {
  apiRoutes,
  type CreateGoalPayload,
  type CreateGoalTreePayload,
  type Goal,
  type UpdateGoalPayload as GoalUpdate,
} from '@life-os/contracts'
import { request } from '../../../shared/api/client'

export type UpdateGoalPayload = GoalUpdate & { id: string }

export interface DeleteGoalPayload {
  id: string
}

type DeleteGoalResponse = {
  success: boolean
  id: string
}

export const goalsApi = {
  getAll: () => request<Goal[]>(apiRoutes.goals),
  create: (payload: CreateGoalPayload) => request<Goal>(apiRoutes.goals, {
    method: 'POST',
    body: payload,
  }),
  createTree: (payload: CreateGoalTreePayload) => request<Goal[]>(apiRoutes.goalsTree, {
    method: 'POST',
    body: payload,
  }),
  update: ({ id, ...payload }: UpdateGoalPayload) => request<Goal>(
    `${apiRoutes.goals}/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: payload,
    },
  ),
  delete: ({ id }: DeleteGoalPayload) => request<DeleteGoalResponse>(
    `${apiRoutes.goals}/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  ),
}
