import type {
  CreateRoutinePayload,
  Routine,
  UpdateRoutinePayload,
} from '@life-os/contracts'
import { ApiError } from '../api/client'
import { getDatabase } from '../db/client'
import { parseJsonArray, toJsonArray } from '../db/schema'
import { createId, nowIso } from '../lib/ids'
import { mapRoutine, type RoutineRow } from './mappers'
import { requireUserId } from './requireUser'

export const routinesRepository = {
  getAll: async (): Promise<Routine[]> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const rows = await db.getAllAsync<RoutineRow>(
      `SELECT * FROM routines
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [userId],
    )
    return rows.map(row => mapRoutine(row, parseJsonArray<number>(row.weekdays_json)))
  },

  create: async (payload: CreateRoutinePayload): Promise<Routine> => {
    const userId = await requireUserId()
    const recurrence = payload.recurrence
    const weekdays = recurrence === 'daily' ? [] : (payload.weekdays ?? [])
    if (recurrence === 'weekly' && weekdays.length === 0) {
      throw new ApiError('Pick at least one weekday for weekly routines', 400)
    }

    const db = await getDatabase()
    const id = createId()
    const createdAt = nowIso()

    await db.runAsync(
      `INSERT INTO routines (
         id, user_id, title, description, recurrence, weekdays_json, time_slot, time_of_day, is_active, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        payload.title,
        payload.description ?? '',
        recurrence,
        toJsonArray(weekdays),
        payload.timeSlot ?? 'anytime',
        payload.timeOfDay ?? null,
        (payload.isActive ?? true) ? 1 : 0,
        createdAt,
        createdAt,
      ],
    )

    const row = await db.getFirstAsync<RoutineRow>('SELECT * FROM routines WHERE id = ?', [id])
    if (!row) throw new ApiError('Routine creation failed', 500)
    return mapRoutine(row, parseJsonArray<number>(row.weekdays_json))
  },

  update: async (id: string, payload: UpdateRoutinePayload): Promise<Routine> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const existing = await db.getFirstAsync<RoutineRow>(
      `SELECT * FROM routines WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [id, userId],
    )
    if (!existing) throw new ApiError('Routine not found', 404)

    if (payload.recurrence === 'weekly') {
      const weekdays = payload.weekdays
      if (weekdays !== undefined && weekdays.length === 0) {
        throw new ApiError('Pick at least one weekday for weekly routines', 400)
      }
    }

    let nextWeekdays = payload.weekdays
    if (payload.recurrence === 'daily' && payload.weekdays === undefined) {
      nextWeekdays = []
    }

    const updatedAt = nowIso()
    const weekdaysJson = nextWeekdays !== undefined
      ? toJsonArray(nextWeekdays)
      : existing.weekdays_json

    await db.runAsync(
      `UPDATE routines SET
         title = ?, description = ?, recurrence = ?, weekdays_json = ?,
         time_slot = ?, time_of_day = ?, is_active = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [
        payload.title ?? existing.title,
        payload.description ?? existing.description,
        payload.recurrence ?? existing.recurrence,
        weekdaysJson,
        payload.timeSlot ?? existing.time_slot,
        payload.timeOfDay !== undefined ? payload.timeOfDay : existing.time_of_day,
        payload.isActive !== undefined ? (payload.isActive ? 1 : 0) : existing.is_active,
        updatedAt,
        id,
        userId,
      ],
    )

    const row = await db.getFirstAsync<RoutineRow>('SELECT * FROM routines WHERE id = ?', [id])
    if (!row) throw new ApiError('Routine not found', 404)
    return mapRoutine(row, parseJsonArray<number>(row.weekdays_json))
  },

  delete: async (id: string): Promise<{ success: boolean; id: string }> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const result = await db.runAsync(
      `UPDATE routines SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [nowIso(), nowIso(), id, userId],
    )
    if (result.changes === 0) throw new ApiError('Routine not found', 404)
    return { success: true, id }
  },
}
