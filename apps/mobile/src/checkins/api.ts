import type {
  EveningReflection,
  MorningCheckin,
  SaveEveningReflectionPayload,
  SaveMorningCheckinPayload,
  TodayCheckins,
} from '@life-os/contracts'
import { checkinsRepository } from '../data/checkinsRepository'

export const checkinsApi = {
  getToday: (): Promise<TodayCheckins> => checkinsRepository.getToday(),
  saveMorning: (payload: SaveMorningCheckinPayload): Promise<MorningCheckin> => (
    checkinsRepository.saveMorning(payload)
  ),
  saveEvening: (payload: SaveEveningReflectionPayload): Promise<EveningReflection> => (
    checkinsRepository.saveEvening(payload)
  ),
}
