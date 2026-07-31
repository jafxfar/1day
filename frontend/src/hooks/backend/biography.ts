import { biographyApi } from '../../api/biography'
import { useApiAction } from '../useApiAction'

export const useGetBiography = () =>
  useApiAction<void, Awaited<ReturnType<typeof biographyApi.getAll>>>(biographyApi.getAll)
