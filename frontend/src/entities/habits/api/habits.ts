import {
  apiRoutes,
  type CreateHabitPayload,
  type Habit,
} from '@life-os/contracts'
import { request } from '../../../shared/api/client'

export interface HabitIdPayload {
  habitId: string
}

export interface DeleteHabitPayload {
  id: string
}

export interface ToggleHabitResponse {
  habitId: string
  completedToday: boolean
  currentStreak: number
  longestStreak: number
}

type DeleteHabitResponse = {
  success: boolean
  id: string
}

export const habitsApi = {
  getAll: () => request<Habit[]>(apiRoutes.habits),
  create: (payload: CreateHabitPayload) => request<Habit>(apiRoutes.habits, {
    method: 'POST',
    body: payload,
  }),
  toggle: ({ habitId }: HabitIdPayload) => request<ToggleHabitResponse>(
    `${apiRoutes.habits}/${encodeURIComponent(habitId)}/toggle`,
    { method: 'POST' },
  ),
  delete: ({ id }: DeleteHabitPayload) => request<DeleteHabitResponse>(
    `${apiRoutes.habits}/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  ),
}
