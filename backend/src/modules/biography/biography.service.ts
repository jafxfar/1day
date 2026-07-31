import type { BiographyDay, DayQuality } from '@life-os/contracts'
import type { BiographyRepository } from './biography.repository.js'

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

export const createBiographyService = (repository: BiographyRepository) => ({
  get: async (userId: number) => {
    const records = await repository.getYear(userId)
    const days = new Map<string, BiographyDay>()
    const ensureDay = (date: string) => {
      const existing = days.get(date)
      if (existing) return existing
      const day = createDay(date)
      days.set(date, day)
      return day
    }

    for (const row of records.mornings) {
      Object.assign(ensureDay(row.checkin_date), {
        mood: row.mood,
        energy: row.energy,
        sleepHours: row.sleep_hours,
        focusText: row.focus_text,
      })
    }
    for (const row of records.evenings) {
      Object.assign(ensureDay(row.checkin_date), {
        eveningRating: row.rating,
        eveningTags: row.tags ?? [],
        wins: row.wins,
        failures: row.failures,
      })
    }
    for (const row of records.habits) {
      const day = ensureDay(row.log_date)
      day.habits.push({ title: row.title, icon: row.icon, completed: row.completed })
      day.habitsTotal += 1
      if (row.completed) day.habitsCompleted += 1
    }
    for (const row of records.journals) {
      Object.assign(ensureDay(row.entry_date), {
        journalTitle: row.title,
        journalContent: row.content,
        journalMood: row.mood,
        journalTags: row.tags ?? [],
      })
    }
    for (const day of days.values()) Object.assign(day, computeQuality(day))
    return [...days.values()].sort((left, right) => right.date.localeCompare(left.date))
  },
})

export type BiographyService = ReturnType<typeof createBiographyService>
