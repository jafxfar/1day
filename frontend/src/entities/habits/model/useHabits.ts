import type { CreateHabitPayload } from '@life-os/contracts'
import {
  habitsApi,
  type DeleteHabitPayload,
  type HabitIdPayload,
} from '../api/habits'
import { useApiAction } from '../../../shared/api/useApiAction'

export const useCreateHabit = () =>
  useApiAction<CreateHabitPayload, Awaited<ReturnType<typeof habitsApi.create>>>(habitsApi.create)

export const useDeleteHabit = () =>
  useApiAction<DeleteHabitPayload, Awaited<ReturnType<typeof habitsApi.delete>>>(habitsApi.delete)

export const useGetHabits = () =>
  useApiAction<void, Awaited<ReturnType<typeof habitsApi.getAll>>>(habitsApi.getAll)

export const useToggleHabit = () =>
  useApiAction<HabitIdPayload, Awaited<ReturnType<typeof habitsApi.toggle>>>(habitsApi.toggle)
