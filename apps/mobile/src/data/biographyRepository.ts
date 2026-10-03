import type { BiographyDay, DayQuality } from '@life-os/contracts'
import { getDatabase } from '../db/client'
import { parseJsonArray } from '../db/schema'
import { daysAgoIsoDate, todayIsoDate } from '../lib/ids'
import { requireUserId } from './requireUser'

const createDay = (date: string): BiographyDay => ({
  date,
  mood: null,
  energy: null,
  sleepHours: null,
  focusText: null,
  eveningRating: null,
  eveningTags: [],
  wins: null,
  failures: null,
  habits: [],
  habitsCompleted: 0,
  habitsTotal: 0,
  journalTitle: null,
  journalContent: null,
  journalMood: null,
  journalTags: [],
  score: 0,
  quality: 'no_data',
})

const computeQuality = (day: BiographyDay): { score: number; quality: DayQuality } => {
  const values: number[] = []
  if (day.mood !== null) values.push((day.mood - 1) / 4)
  if (day.eveningRating !== null) values.push((day.eveningRating - 1) / 9)
  if (day.habitsTotal > 0) values.push(day.habitsCompleted / day.habitsTotal)
  if (values.length === 0) return { score: 0, quality: 'no_data' }

  const score = values.reduce((sum, value) => sum + value, 0) / values.length
  const quality: DayQuality = score >= 0.72
    ? 'great'
    : score >= 0.5
      ? 'good'
      : score >= 0.3
        ? 'neutral'
        : 'poor'
  return { score, quality }
}

export const biographyRepository = {
  getAll: async (): Promise<BiographyDay[]> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const since = daysAgoIsoDate(365)
    const today = todayIsoDate()

    const mornings = await db.getAllAsync<{
      checkin_date: string
      mood: number | null
      energy: number | null
      sleep_hours: number | null
      focus_text: string | null
    }>(
      `SELECT checkin_date, mood, energy, sleep_hours, focus_text
       FROM day_checkins
       WHERE user_id = ? AND checkin_type = 'morning'
         AND checkin_date >= ? AND checkin_date <= ?
       ORDER BY checkin_date DESC`,
      [userId, since, today],
    )

    const evenings = await db.getAllAsync<{
      checkin_date: string
      rating: number | null
      tags_json: string
      wins: string | null
      failures: string | null
    }>(
      `SELECT checkin_date, rating, tags_json, wins, failures
       FROM day_checkins
       WHERE user_id = ? AND checkin_type = 'evening'
         AND checkin_date >= ? AND checkin_date <= ?
       ORDER BY checkin_date DESC`,
      [userId, since, today],
    )

    const habits = await db.getAllAsync<{
      log_date: string
      title: string
      icon: string
      completed: number
    }>(
      `SELECT hl.log_date, h.title, h.icon, hl.completed
       FROM habit_logs hl
       JOIN habits h ON h.id = hl.habit_id AND h.deleted_at IS NULL
       WHERE hl.user_id = ? AND hl.log_date >= ? AND hl.log_date <= ?
       ORDER BY hl.log_date DESC, h.created_at ASC`,
      [userId, since, today],
    )

    const journals = await db.getAllAsync<{
      entry_date: string
      title: string
      content: string
      mood: number | null
      tags_json: string
      created_at: string
    }>(
      `SELECT entry_date, title, content, mood, tags_json, created_at
       FROM journal_entries
       WHERE user_id = ? AND deleted_at IS NULL
         AND entry_date >= ? AND entry_date <= ?
       ORDER BY entry_date DESC, created_at DESC`,
      [userId, since, today],
    )

    const days = new Map<string, BiographyDay>()
    const ensureDay = (date: string) => {
      const existing = days.get(date)
      if (existing) return existing
      const day = createDay(date)
      days.set(date, day)
      return day
    }

    for (const row of mornings) {
      Object.assign(ensureDay(row.checkin_date), {
        mood: row.mood,
        energy: row.energy,
        sleepHours: row.sleep_hours,
        focusText: row.focus_text,
      })
    }

    for (const row of evenings) {
      Object.assign(ensureDay(row.checkin_date), {
        eveningRating: row.rating,
        eveningTags: parseJsonArray<string>(row.tags_json),
        wins: row.wins,
        failures: row.failures,
      })
    }

    for (const row of habits) {
      const day = ensureDay(row.log_date)
      day.habits.push({
        title: row.title,
        icon: row.icon,
        completed: Boolean(row.completed),
      })
      day.habitsTotal += 1
      if (row.completed) day.habitsCompleted += 1
    }

    const seenJournalDates = new Set<string>()
    for (const row of journals) {
      if (seenJournalDates.has(row.entry_date)) continue
      seenJournalDates.add(row.entry_date)
      Object.assign(ensureDay(row.entry_date), {
        journalTitle: row.title,
        journalContent: row.content,
        journalMood: row.mood,
        journalTags: parseJsonArray<string>(row.tags_json),
      })
    }

    for (const day of days.values()) {
      Object.assign(day, computeQuality(day))
    }

    return [...days.values()].sort((left, right) => right.date.localeCompare(left.date))
  },
}
