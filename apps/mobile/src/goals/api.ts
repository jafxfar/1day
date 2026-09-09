import {
  apiRoutes,
  type CreateGoalPayload,
  type CreateGoalTreePayload,
  type Goal,
  type UpdateGoalPayload,
} from '@life-os/contracts'
import { request } from '../api/client'

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
  update: (id: string, payload: UpdateGoalPayload) => request<Goal>(
    `${apiRoutes.goals}/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: payload,
    },
  ),
  delete: (id: string) => request<{ success: boolean; id: string }>(
    `${apiRoutes.goals}/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  ),
}
