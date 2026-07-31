import { biographyApi } from '../api/biography'
import { useApiAction } from '../../../shared/api/useApiAction'

export const useGetBiography = () =>
  useApiAction<void, Awaited<ReturnType<typeof biographyApi.getAll>>>(biographyApi.getAll)
