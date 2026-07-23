import { useBackendFunction } from '../useBackendFunction'

export function useCreateGoal() {
  return useBackendFunction('/backend/goals/createGoal.ts')
}
export function useDeleteGoal() {
  return useBackendFunction('/backend/goals/deleteGoal.ts')
}
export function useGetGoals() {
  return useBackendFunction('/backend/goals/getGoals.ts')
}
export function useUpdateGoal() {
  return useBackendFunction('/backend/goals/updateGoal.ts')
}
