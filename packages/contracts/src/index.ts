import { z } from 'zod'

export const apiRoutes = {
  health: '/api/health',
  readiness: '/api/readiness',
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
  },
  goals: '/api/goals',
  goalsTree: '/api/goals/tree',
  habits: '/api/habits',
  routines: '/api/routines',
  journal: '/api/journal',
  checkins: {
    today: '/api/checkins/today',
    morning: '/api/checkins/morning',
    evening: '/api/checkins/evening',
  },
  biography: '/api/biography',
  onboarding: {
    root: '/api/onboarding',
    profile: '/api/onboarding/profile',
    setup: '/api/onboarding/setup',
    complete: '/api/onboarding/complete',
    skip: '/api/onboarding/skip',
    firstDayComplete: '/api/onboarding/first-day-complete',
  },
} as const

export const goalCategories = [
  'health',
  'career',
  'learning',
  'relationships',
  'finance',
  'personal',
] as const

export const nodeTypes = ['goal', 'milestone', 'project', 'task'] as const
export const taskTypes = ['learning', 'research', 'practice', 'review', 'other'] as const
export const habitTypes = ['positive', 'negative'] as const
export const routineRecurrences = ['daily', 'weekly'] as const
export const routineTimeSlots = ['morning', 'afternoon', 'evening', 'anytime'] as const

export type GoalCategory = typeof goalCategories[number]
export type NodeType = typeof nodeTypes[number]
export type TaskType = typeof taskTypes[number]
export type HabitType = typeof habitTypes[number]
export type RoutineRecurrence = typeof routineRecurrences[number]
export type RoutineTimeSlot = typeof routineTimeSlots[number]
export type CheckinType = 'morning' | 'evening'
export type OnboardingStatus = 'in_progress' | 'skipped' | 'completed'
export type CommunicationStyle = 'careful' | 'friendly' | 'mentor' | 'coach'

export const childNodeTypeByParent: Record<NodeType, NodeType | null> = {
  goal: 'milestone',
  milestone: 'project',
  project: 'task',
  task: null,
}

export const requiredParentNodeType: Record<Exclude<NodeType, 'goal'>, NodeType> = {
  milestone: 'goal',
  project: 'milestone',
  task: 'project',
}

export interface AuthUser {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
  profilePhotoUrl: string | null
  groups: Array<{ id: number; name: string }>
  metadata: Record<string, unknown>
  sid: string
  externalIdentifier: string | null
  locale: string
}

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
  nodeType: NodeType
  taskType: TaskType | null
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

export interface Routine {
  id: string
  title: string
  description: string
  recurrence: RoutineRecurrence
  weekdays: number[]
  timeSlot: RoutineTimeSlot
  timeOfDay: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
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

export type DayQuality = 'great' | 'good' | 'neutral' | 'poor' | 'no_data'

export interface BiographyHabitRecord {
  title: string
  icon: string
  completed: boolean
}

export interface BiographyDay {
  date: string
  mood: number | null
  energy: number | null
  sleepHours: number | null
  focusText: string | null
  eveningRating: number | null
  eveningTags: string[]
  wins: string | null
  failures: string | null
  habits: BiographyHabitRecord[]
  habitsCompleted: number
  habitsTotal: number
  journalTitle: string | null
  journalContent: string | null
  journalMood: number | null
  journalTags: string[]
  score: number
  quality: DayQuality
}

export interface OnboardingProfile {
  firstName: string
  birthDate: string | null
  timezone: string
  language: string
}

export interface OnboardingSetup {
  motivations: string[]
  lifeAreas: string[]
  communicationStyle: CommunicationStyle
  criticismLevel: number
  wakeTime: string
  sleepTime: string
  yearlyGoals: string[]
  buildHabits: string[]
  quitHabits: string[]
}

export interface OnboardingState {
  status: OnboardingStatus
  profile: OnboardingProfile | null
  setup: OnboardingSetup | null
  completedAt: string | null
  firstDayFlowCompleted: boolean
  firstDayFlowCompletedAt: string | null
}

const dateSchema = z.iso.date()
const optionalDateSchema = dateSchema.optional()
const nullableDateSchema = dateSchema.nullable()
const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable()

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
})

export const registerSchema = loginSchema.extend({
  password: z.string().min(8).max(128),
  firstName: z.string().trim().min(1).max(100).default('User'),
  lastName: z.string().trim().max(100).default(''),
})

export const createGoalSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).default(''),
  category: z.enum(goalCategories).default('personal'),
  deadline: nullableDateSchema,
  parentId: z.string().uuid().nullable().optional(),
  nodeType: z.enum(nodeTypes),
  taskType: z.enum(taskTypes).nullable().optional(),
})

export const updateGoalSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(5000).optional(),
  category: z.enum(goalCategories).optional(),
  progress: z.number().min(0).max(100).optional(),
  deadline: nullableDateSchema.optional(),
  isCompleted: z.boolean().optional(),
  taskType: z.enum(taskTypes).nullable().optional(),
})

const treeTaskSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).default(''),
  deadline: nullableDateSchema,
  taskType: z.enum(taskTypes),
})

const treeProjectSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).default(''),
  deadline: nullableDateSchema,
  tasks: z.array(treeTaskSchema).default([]),
})

const treeMilestoneSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).default(''),
  deadline: nullableDateSchema,
  projects: z.array(treeProjectSchema).default([]),
})

export const createGoalTreeSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).default(''),
  category: z.enum(goalCategories),
  deadline: nullableDateSchema,
  milestones: z.array(treeMilestoneSchema).default([]),
})

export const createHabitSchema = z.object({
  title: z.string().trim().min(1).max(255),
  type: z.enum(habitTypes),
  icon: z.string().max(100).default('🎯'),
  category: z.string().trim().max(100).default('general'),
})

export const createRoutineSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).default(''),
  recurrence: z.enum(routineRecurrences),
  weekdays: z.array(z.number().int().min(0).max(6)).default([]),
  timeSlot: z.enum(routineTimeSlots).default('anytime'),
  timeOfDay: timeOfDaySchema.default(null),
  isActive: z.boolean().default(true),
}).superRefine((value, context) => {
  if (value.recurrence === 'weekly' && value.weekdays.length === 0) {
    context.addIssue({
      code: 'custom',
      path: ['weekdays'],
      message: 'Pick at least one weekday for weekly routines',
    })
  }
})

export const updateRoutineSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(5000).optional(),
  recurrence: z.enum(routineRecurrences).optional(),
  weekdays: z.array(z.number().int().min(0).max(6)).optional(),
  timeSlot: z.enum(routineTimeSlots).optional(),
  timeOfDay: timeOfDaySchema.optional(),
  isActive: z.boolean().optional(),
}).superRefine((value, context) => {
  if (value.recurrence === 'weekly' && value.weekdays !== undefined && value.weekdays.length === 0) {
    context.addIssue({
      code: 'custom',
      path: ['weekdays'],
      message: 'Pick at least one weekday for weekly routines',
    })
  }
})

export const journalQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export const createJournalEntrySchema = z.object({
  title: z.string().trim().min(1).max(255),
  content: z.string().trim().min(1).max(200000),
  mood: z.number().min(1).max(10),
  energy: z.number().min(1).max(10),
  tags: z.array(z.string().trim().min(1).max(100)).default([]),
  entryDate: optionalDateSchema,
})

export const saveMorningCheckinSchema = z.object({
  sleepHours: z.number().min(1).max(12),
  energy: z.number().min(1).max(10),
  mood: z.number().min(1).max(5),
  focusText: z.string().trim().max(5000),
  checkinDate: optionalDateSchema,
})

export const saveEveningReflectionSchema = z.object({
  rating: z.number().min(1).max(10),
  wins: z.string().trim().max(10000),
  failures: z.string().trim().max(10000),
  reasons: z.string().trim().max(10000),
  tags: z.array(z.string().trim().min(1).max(100)).default([]),
  checkinDate: optionalDateSchema,
})

export const idParamsSchema = z.object({ id: z.string().uuid() })
export const habitIdParamsSchema = z.object({ habitId: z.string().uuid() })

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
const nonEmptyString = z.string().trim().min(1).max(120)

export const onboardingProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  birthDate: z.iso.date().nullable(),
  timezone: z.string().trim().min(1).max(100),
  language: z.string().trim().min(2).max(20),
})

export const onboardingSetupSchema = z.object({
  motivations: z.array(nonEmptyString).max(8),
  lifeAreas: z.array(nonEmptyString).max(8),
  communicationStyle: z.enum(['careful', 'friendly', 'mentor', 'coach']),
  criticismLevel: z.number().int().min(1).max(5),
  wakeTime: z.string().regex(timeRegex),
  sleepTime: z.string().regex(timeRegex),
  yearlyGoals: z.array(nonEmptyString).max(5),
  buildHabits: z.array(nonEmptyString).max(10),
  quitHabits: z.array(nonEmptyString).max(10),
})

export type LoginPayload = z.input<typeof loginSchema>
export type RegisterPayload = z.input<typeof registerSchema>
export type CreateGoalPayload = z.input<typeof createGoalSchema>
export type UpdateGoalPayload = z.input<typeof updateGoalSchema>
export type CreateGoalTreePayload = z.input<typeof createGoalTreeSchema>
export type CreateHabitPayload = z.input<typeof createHabitSchema>
export type CreateRoutinePayload = z.input<typeof createRoutineSchema>
export type UpdateRoutinePayload = z.input<typeof updateRoutineSchema>
export type JournalQuery = z.input<typeof journalQuerySchema>
export type CreateJournalEntryPayload = z.input<typeof createJournalEntrySchema>
export type SaveMorningCheckinPayload = z.input<typeof saveMorningCheckinSchema>
export type SaveEveningReflectionPayload = z.input<typeof saveEveningReflectionSchema>
export type SaveOnboardingProfilePayload = z.input<typeof onboardingProfileSchema>
export type SaveOnboardingSetupPayload = z.input<typeof onboardingSetupSchema>
