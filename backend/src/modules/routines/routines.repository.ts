import type { UpdateRoutinePayload } from '@life-os/contracts'
import type { Database } from '../../db.js'
import type { RoutineRow } from '../../lib/types.js'

export type CreateRoutineValues = {
  title: string
  description: string
  recurrence: string
  weekdays: number[]
  timeSlot: string
  timeOfDay: string | null
  isActive: boolean
}

export const createRoutinesRepository = (database: Database) => ({
  list: async (userId: number) => {
    const result = await database.query<RoutineRow>(
      `SELECT
         id, user_id, title, description, recurrence, weekdays, time_slot,
         CASE WHEN time_of_day IS NULL THEN NULL ELSE to_char(time_of_day, 'HH24:MI') END AS time_of_day,
         is_active, deleted_at, created_at::text, updated_at::text
       FROM routines
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [userId],
    )
    return result.rows
  },
  create: async (userId: number, values: CreateRoutineValues) => {
    const result = await database.query<RoutineRow>(
      `INSERT INTO routines (
         user_id, title, description, recurrence, weekdays, time_slot, time_of_day, is_active
       ) VALUES ($1, $2, $3, $4, $5::smallint[], $6, $7::time, $8)
       RETURNING
         id, user_id, title, description, recurrence, weekdays, time_slot,
         CASE WHEN time_of_day IS NULL THEN NULL ELSE to_char(time_of_day, 'HH24:MI') END AS time_of_day,
         is_active, deleted_at, created_at::text, updated_at::text`,
      [
        userId,
        values.title,
        values.description,
        values.recurrence,
        values.weekdays,
        values.timeSlot,
        values.timeOfDay,
        values.isActive,
      ],
    )
    return result.rows[0] ?? null
  },
  update: async (id: string, userId: number, values: UpdateRoutinePayload) => {
    const clauses = ['updated_at = NOW()']
    const parameters: unknown[] = [id, userId]

    const add = (column: string, value: unknown, cast?: string) => {
      parameters.push(value)
      clauses.push(
        cast
          ? `${column} = $${parameters.length}::${cast}`
          : `${column} = $${parameters.length}`,
      )
    }

    if (values.title !== undefined) add('title', values.title)
    if (values.description !== undefined) add('description', values.description)
    if (values.recurrence !== undefined) add('recurrence', values.recurrence)
    if (values.weekdays !== undefined) add('weekdays', values.weekdays, 'smallint[]')
    if (values.timeSlot !== undefined) add('time_slot', values.timeSlot)
    if (values.timeOfDay !== undefined) add('time_of_day', values.timeOfDay, 'time')
    if (values.isActive !== undefined) add('is_active', values.isActive)

    const result = await database.query<RoutineRow>(
      `UPDATE routines SET ${clauses.join(', ')}
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING
         id, user_id, title, description, recurrence, weekdays, time_slot,
         CASE WHEN time_of_day IS NULL THEN NULL ELSE to_char(time_of_day, 'HH24:MI') END AS time_of_day,
         is_active, deleted_at, created_at::text, updated_at::text`,
      parameters,
    )
    return result.rows[0] ?? null
  },
  softDelete: async (id: string, userId: number) => {
    const result = await database.query<{ id: string }>(
      `UPDATE routines SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id`,
      [id, userId],
    )
    return result.rows[0] ?? null
  },
})

export type RoutinesRepository = ReturnType<typeof createRoutinesRepository>
