import { z } from 'zod';
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
    ai: {
        health: '/api/ai/health',
        psychologistSession: '/api/ai/psychologist/session',
        psychologistMessages: '/api/ai/psychologist/messages',
    },
};
export const goalCategories = [
    'health',
    'career',
    'learning',
    'relationships',
    'finance',
    'personal',
];
export const nodeTypes = ['goal', 'task'];
export const taskTypes = ['learning', 'research', 'practice', 'review', 'other'];
export const habitTypes = ['positive', 'negative'];
export const routineRecurrences = ['daily', 'weekly'];
export const routineTimeSlots = ['morning', 'afternoon', 'evening', 'anytime'];
export const childNodeTypeByParent = {
    goal: 'task',
    task: null,
};
export const requiredParentNodeType = {
    task: 'goal',
};
const dateSchema = z.iso.date();
const optionalDateSchema = dateSchema.optional();
const nullableDateSchema = dateSchema.nullable();
const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable();
export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1).max(128),
});
export const registerSchema = loginSchema.extend({
    password: z.string().min(8).max(128),
    firstName: z.string().trim().min(1).max(100).default('User'),
    lastName: z.string().trim().max(100).default(''),
});
export const createGoalSchema = z.object({
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(5000).default(''),
    category: z.enum(goalCategories).default('personal'),
    deadline: nullableDateSchema,
    parentId: z.string().uuid().nullable().optional(),
    nodeType: z.enum(nodeTypes),
    taskType: z.enum(taskTypes).nullable().optional(),
});
export const updateGoalSchema = z.object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(5000).optional(),
    category: z.enum(goalCategories).optional(),
    progress: z.number().min(0).max(100).optional(),
    deadline: nullableDateSchema.optional(),
    isCompleted: z.boolean().optional(),
    taskType: z.enum(taskTypes).nullable().optional(),
});
const treeStepSchema = z.object({
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(5000).default(''),
    deadline: nullableDateSchema,
    taskType: z.enum(taskTypes).default('other'),
});
export const createGoalTreeSchema = z.object({
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(5000).default(''),
    category: z.enum(goalCategories),
    deadline: nullableDateSchema,
    steps: z.array(treeStepSchema).default([]),
});
export const createHabitSchema = z.object({
    title: z.string().trim().min(1).max(255),
    type: z.enum(habitTypes),
    icon: z.string().max(100).default('🎯'),
    category: z.string().trim().max(100).default('general'),
});
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
        });
    }
});
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
        });
    }
});
export const journalQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
});
export const createJournalEntrySchema = z.object({
    title: z.string().trim().min(1).max(255),
    content: z.string().trim().min(1).max(200000),
    mood: z.number().min(1).max(10),
    energy: z.number().min(1).max(10),
    tags: z.array(z.string().trim().min(1).max(100)).default([]),
    entryDate: optionalDateSchema,
});
export const saveMorningCheckinSchema = z.object({
    sleepHours: z.number().min(1).max(12),
    energy: z.number().min(1).max(10),
    mood: z.number().min(1).max(5),
    focusText: z.string().trim().max(5000),
    checkinDate: optionalDateSchema,
});
export const saveEveningReflectionSchema = z.object({
    rating: z.number().min(1).max(10),
    wins: z.string().trim().max(10000),
    failures: z.string().trim().max(10000),
    reasons: z.string().trim().max(10000),
    tags: z.array(z.string().trim().min(1).max(100)).default([]),
    checkinDate: optionalDateSchema,
});
export const idParamsSchema = z.object({ id: z.string().uuid() });
export const habitIdParamsSchema = z.object({ habitId: z.string().uuid() });
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const nonEmptyString = z.string().trim().min(1).max(120);
export const onboardingProfileSchema = z.object({
    firstName: z.string().trim().min(1).max(100),
    birthDate: z.iso.date().nullable(),
    timezone: z.string().trim().min(1).max(100),
    language: z.string().trim().min(2).max(20),
});
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
});
export const sendAiMessageSchema = z.object({
    content: z.string().trim().min(1).max(8000),
});
