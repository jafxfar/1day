import { useBackendFunction } from '../useBackendFunction'

export function useGetTodayCheckins() {
  return useBackendFunction('/backend/checkins/getTodayCheckins.ts')
}
export function useSaveEveningReflection() {
  return useBackendFunction('/backend/checkins/saveEveningReflection.ts')
}
export function useSaveMorningCheckin() {
  return useBackendFunction('/backend/checkins/saveMorningCheckin.ts')
}
