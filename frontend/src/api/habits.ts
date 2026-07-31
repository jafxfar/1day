import type { Habit, HabitType } from '../lib/types'
import { request } from './client'

export interface CreateHabitPayload {
  title: string
  type: HabitType
  icon: string
  category: string
}

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
  getAll: () => request<Habit[]>('/api/habits'),
  create: (payload: CreateHabitPayload) => request<Habit>('/api/habits', {
    method: 'POST',
    body: payload,
  }),
  toggle: ({ habitId }: HabitIdPayload) => request<ToggleHabitResponse>(
    `/api/habits/${encodeURIComponent(habitId)}/toggle`,
    { method: 'POST' },
  ),
  delete: ({ id }: DeleteHabitPayload) => request<DeleteHabitResponse>(
    `/api/habits/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  ),
}
