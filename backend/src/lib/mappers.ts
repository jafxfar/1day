
/**
 * Pure mapping functions from DB row shapes (snake_case) to API shapes (camelCase).
 * Keeping transforms in one place makes schema changes easy to propagate.
 */
import type {
  GoalRow, HabitRow, JournalEntryRow, DayCheckinRow,
  Goal, Habit, JournalEntry, MorningCheckin, EveningReflection,
} from './types'

export function mapGoal(row: GoalRow & { depth?: number }): Goal {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description,
    category:    row.category,
    progress:    row.progress,
    deadline:    row.deadline,
    isCompleted: row.is_completed,
    completedAt: row.completed_at,
    parentId:    row.parent_id,
    periodType:  row.period_type,
    depth:       row.depth ?? 0,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  }
}

export function mapHabit(
  row: HabitRow,
  completedToday: boolean,
): Habit {
  return {
    id:             row.id,
    title:          row.title,
    type:           row.type,
    icon:           row.icon,
    category:       row.category,
    currentStreak:  row.current_streak,
    longestStreak:  row.longest_streak,
    completedToday,
    isArchived:     row.is_archived,
    createdAt:      row.created_at,
  }
}

export function mapJournalEntry(row: JournalEntryRow): JournalEntry {
  return {
    id:        row.id,
    entryDate: row.entry_date,
    title:     row.title,
    content:   row.content,
    mood:      row.mood,
    energy:    row.energy,
    tags:      row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapMorningCheckin(row: DayCheckinRow): MorningCheckin {
  return {
    id:          row.id,
    checkinDate: row.checkin_date,
    sleepHours:  row.sleep_hours ?? 7,
    energy:      row.energy      ?? 5,
    mood:        row.mood        ?? 3,
    focusText:   row.focus_text  ?? '',
    createdAt:   row.created_at,
  }
}

export function mapEveningReflection(row: DayCheckinRow): EveningReflection {
  return {
    id:          row.id,
    checkinDate: row.checkin_date,
    rating:      row.rating   ?? 5,
    wins:        row.wins     ?? '',
    failures:    row.failures ?? '',
    reasons:     row.reasons  ?? '',
    tags:        row.tags     ?? [],
    createdAt:   row.created_at,
  }
}
