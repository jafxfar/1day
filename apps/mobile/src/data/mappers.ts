import type {
  AuthUser,
  EveningReflection,
  Goal,
  GoalCategory,
  Habit,
  HabitType,
  JournalEntry,
  MorningCheckin,
  NodeType,
  Routine,
  RoutineRecurrence,
  RoutineTimeSlot,
  TaskType,
} from '@life-os/contracts'

export type UserRow = {
  id: number
  email: string
  password_hash: string
  first_name: string
  last_name: string
}

export type GoalRow = {
  id: string
  user_id: number
  title: string
  description: string
  category: string
  progress: number
  deadline: string | null
  is_completed: number
  completed_at: string | null
  parent_id: string | null
  node_type: string
  task_type: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type HabitRow = {
  id: string
  user_id: number
  title: string
  type: string
  icon: string
  category: string
  current_streak: number
  longest_streak: number
  is_archived: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type RoutineRow = {
  id: string
  user_id: number
  title: string
  description: string
  recurrence: string
  weekdays_json: string
  time_slot: string
  time_of_day: string | null
  is_active: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type JournalRow = {
  id: string
  user_id: number
  entry_date: string
  title: string
  content: string
  mood: number
  energy: number
  tags_json: string
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type CheckinRow = {
  id: string
  user_id: number
  checkin_date: string
  checkin_type: string
  sleep_hours: number | null
  energy: number | null
  mood: number | null
  focus_text: string | null
  rating: number | null
  wins: string | null
  failures: string | null
  reasons: string | null
  tags_json: string
  created_at: string
  updated_at: string
}

export const mapAuthUser = (row: Pick<UserRow, 'id' | 'email' | 'first_name' | 'last_name'>): AuthUser => ({
  id: row.id,
  email: row.email,
  firstName: row.first_name,
  lastName: row.last_name,
  fullName: `${row.first_name} ${row.last_name}`.trim(),
  profilePhotoUrl: null,
  groups: [],
  metadata: {},
  sid: String(row.id),
  externalIdentifier: null,
  locale: 'en',
})

export const mapGoal = (row: GoalRow, depth = 0): Goal => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category as GoalCategory,
  progress: row.progress,
  deadline: row.deadline,
  isCompleted: Boolean(row.is_completed),
  completedAt: row.completed_at,
  parentId: row.parent_id,
  nodeType: row.node_type as NodeType,
  taskType: (row.task_type as TaskType | null) ?? null,
  depth,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const mapHabit = (row: HabitRow, completedToday: boolean): Habit => ({
  id: row.id,
  title: row.title,
  type: row.type as HabitType,
  icon: row.icon,
  category: row.category,
  currentStreak: row.current_streak,
  longestStreak: row.longest_streak,
  completedToday,
  isArchived: Boolean(row.is_archived),
  createdAt: row.created_at,
})

export const mapRoutine = (row: RoutineRow, weekdays: number[]): Routine => ({
  id: row.id,
  title: row.title,
  description: row.description,
  recurrence: row.recurrence as RoutineRecurrence,
  weekdays,
  timeSlot: row.time_slot as RoutineTimeSlot,
  timeOfDay: row.time_of_day ? row.time_of_day.slice(0, 5) : null,
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const mapJournalEntry = (row: JournalRow, tags: string[]): JournalEntry => ({
  id: row.id,
  entryDate: row.entry_date,
  title: row.title,
  content: row.content,
  mood: row.mood,
  energy: row.energy,
  tags,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const mapMorningCheckin = (row: CheckinRow): MorningCheckin => ({
  id: row.id,
  checkinDate: row.checkin_date,
  sleepHours: row.sleep_hours ?? 7,
  energy: row.energy ?? 5,
  mood: row.mood ?? 3,
  focusText: row.focus_text ?? '',
  createdAt: row.created_at,
})

export const mapEveningReflection = (row: CheckinRow, tags: string[]): EveningReflection => ({
  id: row.id,
  checkinDate: row.checkin_date,
  rating: row.rating ?? 5,
  wins: row.wins ?? '',
  failures: row.failures ?? '',
  reasons: row.reasons ?? '',
  tags,
  createdAt: row.created_at,
})
