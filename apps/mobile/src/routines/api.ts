import {
  apiRoutes,
  type CreateRoutinePayload,
  type Routine,
  type UpdateRoutinePayload,
} from '@life-os/contracts'
import { request } from '../api/client'

export const routinesApi = {
  getAll: () => request<Routine[]>(apiRoutes.routines),
  create: (payload: CreateRoutinePayload) => request<Routine>(apiRoutes.routines, {
    method: 'POST',
    body: payload,
  }),
  update: (id: string, payload: UpdateRoutinePayload) => request<Routine>(
    `${apiRoutes.routines}/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: payload,
    },
  ),
  delete: (id: string) => request<{ success: boolean; id: string }>(
    `${apiRoutes.routines}/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  ),
}
