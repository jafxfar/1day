import type { CreateGoalPayload, CreateGoalTreePayload } from '@life-os/contracts'
import {
  goalsApi,
  type DeleteGoalPayload,
  type UpdateGoalPayload,
} from '../api/goals'
import { useApiAction } from '../../../shared/api/useApiAction'

export const useCreateGoal = () =>
  useApiAction<CreateGoalPayload, Awaited<ReturnType<typeof goalsApi.create>>>(goalsApi.create)

export const useCreateGoalTree = () =>
  useApiAction<CreateGoalTreePayload, Awaited<ReturnType<typeof goalsApi.createTree>>>(goalsApi.createTree)

export const useDeleteGoal = () =>
  useApiAction<DeleteGoalPayload, Awaited<ReturnType<typeof goalsApi.delete>>>(goalsApi.delete)

export const useGetGoals = () =>
  useApiAction<void, Awaited<ReturnType<typeof goalsApi.getAll>>>(goalsApi.getAll)

export const useUpdateGoal = () =>
  useApiAction<UpdateGoalPayload, Awaited<ReturnType<typeof goalsApi.update>>>(goalsApi.update)
