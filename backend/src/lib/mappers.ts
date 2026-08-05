import type {
  Goal, Habit, JournalEntry, MorningCheckin, EveningReflection, Routine,
} from '@life-os/contracts'
import type {
  GoalRow, HabitRow, JournalEntryRow, DayCheckinRow, RoutineRow,
} from './types.js'

const formatTimeOfDay = (value: string | null): string | null => {
  if (!value) return null
  return value.slice(0, 5)
}

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
    nodeType:    row.node_type,
    taskType:    row.task_type,
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

export function mapRoutine(row: RoutineRow): Routine {
  return {
    id:          row.id,
    title:       row.title,
    description: row.description,
    recurrence:  row.recurrence,
    weekdays:    row.weekdays ?? [],
    timeSlot:    row.time_slot,
    timeOfDay:   formatTimeOfDay(row.time_of_day),
    isActive:    row.is_active,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
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
