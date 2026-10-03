import type { BiographyDay } from '@life-os/contracts'
import { biographyRepository } from '../data/biographyRepository'

export const biographyApi = {
  getAll: (): Promise<BiographyDay[]> => biographyRepository.getAll(),
}
