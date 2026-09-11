import type {
  EveningReflection,
  MorningCheckin,
  SaveEveningReflectionPayload,
  SaveMorningCheckinPayload,
  TodayCheckins,
} from '@life-os/contracts'
import { ApiError } from '../api/client'
import { getDatabase } from '../db/client'
import { parseJsonArray, toJsonArray } from '../db/schema'
import { createId, nowIso, todayIsoDate } from '../lib/ids'
import { mapEveningReflection, mapMorningCheckin, type CheckinRow } from './mappers'
import { requireUserId } from './requireUser'

export const checkinsRepository = {
  getToday: async (): Promise<TodayCheckins> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const today = todayIsoDate()
    const rows = await db.getAllAsync<CheckinRow>(
      `SELECT * FROM day_checkins WHERE user_id = ? AND checkin_date = ?`,
      [userId, today],
    )

    const morningRow = rows.find(row => row.checkin_type === 'morning')
    const eveningRow = rows.find(row => row.checkin_type === 'evening')

    return {
      morning: morningRow ? mapMorningCheckin(morningRow) : null,
      evening: eveningRow
        ? mapEveningReflection(eveningRow, parseJsonArray<string>(eveningRow.tags_json))
        : null,
    }
  },

  saveMorning: async (payload: SaveMorningCheckinPayload): Promise<MorningCheckin> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const checkinDate = payload.checkinDate ?? todayIsoDate()
    const now = nowIso()

    const existing = await db.getFirstAsync<CheckinRow>(
      `SELECT * FROM day_checkins
       WHERE user_id = ? AND checkin_date = ? AND checkin_type = 'morning'`,
      [userId, checkinDate],
    )

    if (existing) {
      await db.runAsync(
        `UPDATE day_checkins SET
           sleep_hours = ?, energy = ?, mood = ?, focus_text = ?, updated_at = ?
         WHERE id = ?`,
        [
          payload.sleepHours,
          payload.energy,
          payload.mood,
          payload.focusText,
          now,
          existing.id,
        ],
      )
      const row = await db.getFirstAsync<CheckinRow>('SELECT * FROM day_checkins WHERE id = ?', [existing.id])
      if (!row) throw new ApiError('Morning checkin save failed', 500)
      return mapMorningCheckin(row)
    }

    const id = createId()
    await db.runAsync(
      `INSERT INTO day_checkins (
         id, user_id, checkin_date, checkin_type, sleep_hours, energy, mood, focus_text, created_at, updated_at
       ) VALUES (?, ?, ?, 'morning', ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        checkinDate,
        payload.sleepHours,
        payload.energy,
        payload.mood,
        payload.focusText,
        now,
        now,
      ],
    )

    const row = await db.getFirstAsync<CheckinRow>('SELECT * FROM day_checkins WHERE id = ?', [id])
    if (!row) throw new ApiError('Morning checkin save failed', 500)
    return mapMorningCheckin(row)
  },

  saveEvening: async (payload: SaveEveningReflectionPayload): Promise<EveningReflection> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const checkinDate = payload.checkinDate ?? todayIsoDate()
    const now = nowIso()
    const tags = payload.tags ?? []

    const existing = await db.getFirstAsync<CheckinRow>(
      `SELECT * FROM day_checkins
       WHERE user_id = ? AND checkin_date = ? AND checkin_type = 'evening'`,
      [userId, checkinDate],
    )

    if (existing) {
      await db.runAsync(
        `UPDATE day_checkins SET
           rating = ?, wins = ?, failures = ?, reasons = ?, tags_json = ?, updated_at = ?
         WHERE id = ?`,
        [
          payload.rating,
          payload.wins,
          payload.failures,
          payload.reasons,
          toJsonArray(tags),
          now,
          existing.id,
        ],
      )
      const row = await db.getFirstAsync<CheckinRow>('SELECT * FROM day_checkins WHERE id = ?', [existing.id])
      if (!row) throw new ApiError('Evening reflection save failed', 500)
      return mapEveningReflection(row, parseJsonArray<string>(row.tags_json))
    }

    const id = createId()
    await db.runAsync(
      `INSERT INTO day_checkins (
         id, user_id, checkin_date, checkin_type, rating, wins, failures, reasons, tags_json, created_at, updated_at
       ) VALUES (?, ?, ?, 'evening', ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        checkinDate,
        payload.rating,
        payload.wins,
        payload.failures,
        payload.reasons,
        toJsonArray(tags),
        now,
        now,
      ],
    )

    const row = await db.getFirstAsync<CheckinRow>('SELECT * FROM day_checkins WHERE id = ?', [id])
    if (!row) throw new ApiError('Evening reflection save failed', 500)
    return mapEveningReflection(row, parseJsonArray<string>(row.tags_json))
  },
}
