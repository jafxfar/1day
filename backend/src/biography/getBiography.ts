
/**
 * Biography — daily life snapshot aggregated from all data sources.
 *
 * Returns one entry per day that has at least one recorded event,
 * covering the last 365 days. Each entry carries:
 *   - Morning stats (mood 1-5, energy 1-10, sleep, focus)
 *   - Evening stats (rating 1-10, tags)
 *   - Habit completion list for that day
 *   - Journal entry (first of the day)
 *   - A computed quality score + classification for calendar color-coding
 */
import { retoolDb } from '../db';

interface MorningRow {
  checkin_date: string
  mood: number | null
  energy: number | null
  sleep_hours: number | null
  focus_text: string | null
}

interface EveningRow {
  checkin_date: string
  rating: number | null
  tags: string[]
  wins: string | null
  failures: string | null
}

interface HabitLogRow {
  log_date: string
  title: string
  icon: string
  completed: boolean
}

interface JournalRow {
  entry_date: string
  title: string
  content: string
  mood: number | null
  tags: string[]
}

export type DayQuality = 'great' | 'good' | 'neutral' | 'poor' | 'no_data'

export interface HabitRecord {
  title: string
  icon: string
  completed: boolean
}

export interface DaySummary {
  date: string
  // Morning
  mood: number | null
  energy: number | null
  sleepHours: number | null
  focusText: string | null
  // Evening
  eveningRating: number | null
  eveningTags: string[]
  wins: string | null
  failures: string | null
  // Habits
  habits: HabitRecord[]
  habitsCompleted: number
  habitsTotal: number
  // Journal
  journalTitle: string | null
  journalContent: string | null
  journalMood: number | null
  journalTags: string[]
  // Computed
  score: number          // 0–1
  quality: DayQuality
}

function computeQuality(
  mood: number | null,
  eveningRating: number | null,
  habitsCompleted: number,
  habitsTotal: number,
): { score: number; quality: DayQuality } {
  let sum = 0
  let n   = 0

  if (mood !== null)         { sum += (mood - 1) / 4;              n++ }  // 1-5 → 0-1
  if (eveningRating !== null){ sum += (eveningRating - 1) / 9;     n++ }  // 1-10 → 0-1
  if (habitsTotal > 0)       { sum += habitsCompleted / habitsTotal; n++ }

  if (n === 0) return { score: 0, quality: 'no_data' }

  const score = sum / n

  const quality: DayQuality =
    score >= 0.72 ? 'great'
    : score >= 0.50 ? 'good'
    : score >= 0.30 ? 'neutral'
    : 'poor'

  return { score, quality }
}

export default async function getBiography(req: { params: Record<string, never>; user: User }) {
  const userId = req.user.id

  // Four parallel queries — all scoped to last 365 days
  const [mornings, evenings, habitLogs, journals] = await Promise.all([
    retoolDb.query<MorningRow>(
      `SELECT checkin_date::text, mood, energy, sleep_hours, focus_text
       FROM   day_checkins
       WHERE  user_id = $1 AND checkin_type = 'morning'
         AND  checkin_date >= CURRENT_DATE - INTERVAL '365 days'
       ORDER  BY checkin_date DESC`,
      [userId],
    ),
    retoolDb.query<EveningRow>(
      `SELECT checkin_date::text, rating, tags, wins, failures
       FROM   day_checkins
       WHERE  user_id = $1 AND checkin_type = 'evening'
         AND  checkin_date >= CURRENT_DATE - INTERVAL '365 days'
       ORDER  BY checkin_date DESC`,
      [userId],
    ),
    retoolDb.query<HabitLogRow>(
      `SELECT hl.log_date::text, h.title, h.icon, hl.completed
       FROM   habit_logs hl
       JOIN   habits h ON h.id = hl.habit_id AND h.deleted_at IS NULL
       WHERE  hl.user_id = $1
         AND  hl.log_date >= CURRENT_DATE - INTERVAL '365 days'
       ORDER  BY hl.log_date DESC, h.created_at ASC`,
      [userId],
    ),
    retoolDb.query<JournalRow>(
      `SELECT DISTINCT ON (entry_date)
              entry_date::text, title, content, mood, tags
       FROM   journal_entries
       WHERE  user_id = $1 AND deleted_at IS NULL
         AND  entry_date >= CURRENT_DATE - INTERVAL '365 days'
       ORDER  BY entry_date DESC, created_at DESC`,
      [userId],
    ),
  ])

  // Build day map — keyed by ISO date string
  const dayMap = new Map<string, DaySummary>()

  const ensureDay = (date: string): DaySummary => {
    if (!dayMap.has(date)) {
      dayMap.set(date, {
        date,
        mood: null, energy: null, sleepHours: null, focusText: null,
        eveningRating: null, eveningTags: [], wins: null, failures: null,
        habits: [], habitsCompleted: 0, habitsTotal: 0,
        journalTitle: null, journalContent: null, journalMood: null, journalTags: [],
        score: 0, quality: 'no_data',
      })
    }
    return dayMap.get(date)!
  }

  for (const r of mornings.data) {
    const d = ensureDay(r.checkin_date)
    d.mood       = r.mood
    d.energy     = r.energy
    d.sleepHours = r.sleep_hours
    d.focusText  = r.focus_text
  }

  for (const r of evenings.data) {
    const d = ensureDay(r.checkin_date)
    d.eveningRating = r.rating
    d.eveningTags   = r.tags ?? []
    d.wins          = r.wins
    d.failures      = r.failures
  }

  for (const r of habitLogs.data) {
    const d = ensureDay(r.log_date)
    d.habits.push({ title: r.title, icon: r.icon, completed: r.completed })
    d.habitsTotal++
    if (r.completed) d.habitsCompleted++
  }

  for (const r of journals.data) {
    const d = ensureDay(r.entry_date)
    d.journalTitle   = r.title
    d.journalContent = r.content
    d.journalMood    = r.mood
    d.journalTags    = r.tags ?? []
  }

  // Compute quality for every day
  for (const [, day] of dayMap) {
    const { score, quality } = computeQuality(
      day.mood, day.eveningRating, day.habitsCompleted, day.habitsTotal,
    )
    day.score   = score
    day.quality = quality
  }

  // Return sorted newest-first
  return Array.from(dayMap.values()).sort((a, b) => b.date.localeCompare(a.date))
}
