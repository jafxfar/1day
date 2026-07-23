import { useBackendFunction } from '../useBackendFunction'

export function useCreateHabit() {
  return useBackendFunction('/backend/habits/createHabit.ts')
}
export function useDeleteHabit() {
  return useBackendFunction('/backend/habits/deleteHabit.ts')
}
export function useGetHabits() {
  return useBackendFunction('/backend/habits/getHabits.ts')
}
export function useToggleHabit() {
  return useBackendFunction('/backend/habits/toggleHabit.ts')
}
