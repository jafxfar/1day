import { useBackendFunction } from '../useBackendFunction'

export function useGetBiography() {
  return useBackendFunction('/backend/biography/getBiography.ts')
}
