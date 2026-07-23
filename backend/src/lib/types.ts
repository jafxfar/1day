
// ─── Shared domain types used across backend functions ─────────────────────

export type GoalCategory =
  | 'health'
  | 'career'
  | 'learning'
  | 'relationships'
  | 'finance'
  | 'personal'

/** Temporal level of a goal in the hierarchy */
export type PeriodType = 'long_term' | 'monthly' | 'weekly' | 'daily'

export type HabitType = 'positive' | 'negative'

export type CheckinType = 'morning' | 'evening'

// ─── Database row shapes (snake_case, as returned by PostgreSQL) ────────────

export interface GoalRow {
  id: string
  user_id: number
  title: string
  description: string
  category: GoalCategory
  progress: number
  deadline: string | null
  is_completed: boolean
  completed_at: string | null
  parent_id: string | null
  period_type: PeriodType
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface HabitRow {
  id: string
  user_id: number
  title: string
  type: HabitType
  icon: string
  category: string
  current_streak: number
  longest_streak: number
  is_archived: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface HabitLogRow {
  id: string
  habit_id: string
  user_id: number
  log_date: string
  completed: boolean
  completed_at: string | null
  created_at: string
}

export interface JournalEntryRow {
  id: string
  user_id: number
  entry_date: string
  title: string
  content: string
  mood: number
  energy: number
  tags: string[]
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface DayCheckinRow {
  id: string
  user_id: number
  checkin_date: string
  checkin_type: CheckinType
  sleep_hours: number | null
  energy: number | null
  mood: number | null
  focus_text: string | null
  rating: number | null
  wins: string | null
  failures: string | null
  reasons: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

// ─── API response shapes (camelCase, consumed by frontend) ─────────────────

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
  /** Depth in the tree (0 = root). Computed by getGoals via recursive CTE. */
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
