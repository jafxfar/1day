import type {
  CreateGoalPayload,
  CreateGoalTreePayload,
  Goal,
  UpdateGoalPayload,
} from '@life-os/contracts'
import { goalsRepository } from '../data/goalsRepository'

export const goalsApi = {
  getAll: (): Promise<Goal[]> => goalsRepository.getAll(),
  create: (payload: CreateGoalPayload): Promise<Goal> => goalsRepository.create(payload),
  createTree: (payload: CreateGoalTreePayload): Promise<Goal[]> => goalsRepository.createTree(payload),
  update: (id: string, payload: UpdateGoalPayload): Promise<Goal> => goalsRepository.update(id, payload),
  delete: (id: string): Promise<{ success: boolean; id: string }> => goalsRepository.delete(id),
}
