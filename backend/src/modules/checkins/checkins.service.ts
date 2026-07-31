import type {
  SaveEveningReflectionPayload,
  SaveMorningCheckinPayload,
  TodayCheckins,
} from '@life-os/contracts'
import { AppError } from '../../lib/errors.js'
import { mapEveningReflection, mapMorningCheckin } from '../../lib/mappers.js'
import type { CheckinsRepository } from './checkins.repository.js'

export const createCheckinsService = (repository: CheckinsRepository) => ({
  today: async (userId: number): Promise<TodayCheckins> => {
    const rows = await repository.today(userId)
    const morningRow = rows.find(row => row.checkin_type === 'morning')
    const eveningRow = rows.find(row => row.checkin_type === 'evening')
    return {
      morning: morningRow ? mapMorningCheckin(morningRow) : null,
      evening: eveningRow ? mapEveningReflection(eveningRow) : null,
    }
  },
  saveMorning: async (userId: number, payload: SaveMorningCheckinPayload) => {
    const row = await repository.saveMorning(userId, payload)
    if (!row) throw new AppError(500, 'Morning checkin save failed')
    return mapMorningCheckin(row)
  },
  saveEvening: async (userId: number, payload: SaveEveningReflectionPayload) => {
    const row = await repository.saveEvening(userId, payload)
    if (!row) throw new AppError(500, 'Evening reflection save failed')
    return mapEveningReflection(row)
  },
})

export type CheckinsService = ReturnType<typeof createCheckinsService>
