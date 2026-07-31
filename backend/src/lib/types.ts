
import type {
  CheckinType,
  GoalCategory,
  HabitType,
  PeriodType,
} from '@life-os/contracts'

export type { CheckinType, GoalCategory, HabitType, PeriodType }

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
