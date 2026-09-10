import {
  apiRoutes,
  type CreateHabitPayload,
  type Habit,
} from '@life-os/contracts'
import { request } from '../api/client'

export type ToggleHabitResponse = {
  habitId: string
  completedToday: boolean
  currentStreak: number
  longestStreak: number
}

export const habitsApi = {
  getAll: () => request<Habit[]>(apiRoutes.habits),
  create: (payload: CreateHabitPayload) => request<Habit>(apiRoutes.habits, {
    method: 'POST',
    body: payload,
  }),
  toggle: (habitId: string) => request<ToggleHabitResponse>(
    `${apiRoutes.habits}/${encodeURIComponent(habitId)}/toggle`,
    { method: 'POST' },
  ),
  delete: (id: string) => request<{ success: boolean; id: string }>(
    `${apiRoutes.habits}/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  ),
}
