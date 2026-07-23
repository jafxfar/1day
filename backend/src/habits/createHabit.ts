
import { mapHabit } from '../lib/mappers'
import type { HabitType, HabitRow } from '../lib/types'
import { retoolDb } from '../db';

interface Params {
  title: string
  type: HabitType
  icon: string
  category: string
}

export default async function createHabit(req: { params: Params; user: User }) {
  const { title, type, icon, category } = req.params

  if (!title?.trim())              throw new Error('Habit title is required')
  if (type !== 'positive' && type !== 'negative') throw new Error('Invalid habit type')

  const { data } = await retoolDb.query<HabitRow>(
    `INSERT INTO habits (user_id, title, type, icon, category)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [req.user.id, title.trim(), type, icon ?? '🎯', category?.trim() ?? 'general'],
  )

  const row = data[0]
  if (!row) throw new Error('Habit creation failed')

  return mapHabit(row, false)
}
