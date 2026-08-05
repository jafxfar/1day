import {
  apiRoutes,
  type CreateRoutinePayload,
  type Routine,
  type UpdateRoutinePayload as RoutineUpdate,
} from '@life-os/contracts'
import { request } from '../../../shared/api/client'

export type UpdateRoutinePayload = RoutineUpdate & { id: string }

export interface DeleteRoutinePayload {
  id: string
}

type DeleteRoutineResponse = {
  success: boolean
  id: string
}

export const routinesApi = {
  getAll: () => request<Routine[]>(apiRoutes.routines),
  create: (payload: CreateRoutinePayload) => request<Routine>(apiRoutes.routines, {
    method: 'POST',
    body: payload,
  }),
  update: ({ id, ...payload }: UpdateRoutinePayload) => request<Routine>(
    `${apiRoutes.routines}/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: payload,
    },
  ),
  delete: ({ id }: DeleteRoutinePayload) => request<DeleteRoutineResponse>(
    `${apiRoutes.routines}/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  ),
}
