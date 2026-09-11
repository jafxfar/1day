import type {
  CreateRoutinePayload,
  Routine,
  UpdateRoutinePayload,
} from '@life-os/contracts'
import { routinesRepository } from '../data/routinesRepository'

export const routinesApi = {
  getAll: (): Promise<Routine[]> => routinesRepository.getAll(),
  create: (payload: CreateRoutinePayload): Promise<Routine> => routinesRepository.create(payload),
  update: (id: string, payload: UpdateRoutinePayload): Promise<Routine> => (
    routinesRepository.update(id, payload)
  ),
  delete: (id: string): Promise<{ success: boolean; id: string }> => routinesRepository.delete(id),
}
