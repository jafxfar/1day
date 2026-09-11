import type { CreateHabitPayload, Habit } from '@life-os/contracts'
import {
  habitsRepository,
  type ToggleHabitResponse,
} from '../data/habitsRepository'

export type { ToggleHabitResponse }

export const habitsApi = {
  getAll: (): Promise<Habit[]> => habitsRepository.getAll(),
  create: (payload: CreateHabitPayload): Promise<Habit> => habitsRepository.create(payload),
  toggle: (habitId: string): Promise<ToggleHabitResponse> => habitsRepository.toggle(habitId),
  delete: (id: string): Promise<{ success: boolean; id: string }> => habitsRepository.delete(id),
}
