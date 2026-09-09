import { apiRoutes, type BiographyDay } from '@life-os/contracts'
import { request } from '../api/client'

export const biographyApi = {
  getAll: () => request<BiographyDay[]>(apiRoutes.biography),
}
