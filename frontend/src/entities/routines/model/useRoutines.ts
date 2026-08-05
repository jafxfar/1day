import type { CreateRoutinePayload } from '@life-os/contracts'
import {
  routinesApi,
  type DeleteRoutinePayload,
  type UpdateRoutinePayload,
} from '../api/routines'
import { useApiAction } from '../../../shared/api/useApiAction'

export const useCreateRoutine = () =>
  useApiAction<CreateRoutinePayload, Awaited<ReturnType<typeof routinesApi.create>>>(routinesApi.create)

export const useDeleteRoutine = () =>
  useApiAction<DeleteRoutinePayload, Awaited<ReturnType<typeof routinesApi.delete>>>(routinesApi.delete)

export const useGetRoutines = () =>
  useApiAction<void, Awaited<ReturnType<typeof routinesApi.getAll>>>(routinesApi.getAll)

export const useUpdateRoutine = () =>
  useApiAction<UpdateRoutinePayload, Awaited<ReturnType<typeof routinesApi.update>>>(routinesApi.update)
