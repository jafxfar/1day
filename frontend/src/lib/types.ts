
/**
 * Frontend domain types — mirror the API shapes returned by backend functions.
 * Keep in sync with /backend/lib/types.ts API interfaces.
 */

export type GoalCategory =
  | 'health'
  | 'career'
  | 'learning'
  | 'relationships'
  | 'finance'
  | 'personal'

export type PeriodType = 'long_term' | 'monthly' | 'weekly' | 'daily'

export type HabitType = 'positive' | 'negative'

export interface Goal {
  id: string
  title: string
  description: string
  category: GoalCategory
  progress: number
  deadline: string | null
  isCompleted: boolean
  completedAt: string | null
  parentId: string | null
  periodType: PeriodType
  depth: number
  createdAt: string
  updatedAt: string
}

export interface Habit {
  id: string
  title: string
  type: HabitType
  icon: string
  category: string
  currentStreak: number
  longestStreak: number
  completedToday: boolean
  isArchived: boolean
  createdAt: string
}

export interface JournalEntry {
  id: string
  entryDate: string
  title: string
  content: string
  mood: number
  energy: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface MorningCheckin {
  id: string
  checkinDate: string
  sleepHours: number
  energy: number
  mood: number
  focusText: string
  createdAt: string
}

export interface EveningReflection {
  id: string
  checkinDate: string
  rating: number
  wins: string
  failures: string
  reasons: string
  tags: string[]
  createdAt: string
}

export interface TodayCheckins {
  morning: MorningCheckin | null
  evening: EveningReflection | null
}

/** Type-safe cast helpers — the hook data is typed as unknown at runtime */
export const cast = {
  goals:          (d: unknown): Goal[]         => Array.isArray(d) ? d as Goal[]         : [],
  habits:         (d: unknown): Habit[]        => Array.isArray(d) ? d as Habit[]        : [],
  journalEntries: (d: unknown): JournalEntry[] => Array.isArray(d) ? d as JournalEntry[] : [],
  todayCheckins:  (d: unknown): TodayCheckins  =>
    d != null && typeof d === 'object'
      ? (d as TodayCheckins)
      : { morning: null, evening: null },
  goal:    (d: unknown): Goal | null => d != null ? (d as Goal) : null,
  habit:   (d: unknown): Habit   | null => d != null ? (d as Habit)   : null,
  checkin: (d: unknown): MorningCheckin | null => d != null ? (d as MorningCheckin) : null,
}
