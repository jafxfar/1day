import { apiRoutes, type BiographyDay } from '@life-os/contracts'
import { request } from '../../../shared/api/client'

export const biographyApi = {
  getAll: () => request<BiographyDay[]>(apiRoutes.biography),
}
