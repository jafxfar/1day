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
    habits: '/api/habits',
    journal: '/api/journal',
    checkins: {
        today: '/api/checkins/today',
        morning: '/api/checkins/morning',
        evening: '/api/checkins/evening',
    },
    biography: '/api/biography',
};
export const goalCategories = [
    'health',
    'career',
    'learning',
    'relationships',
    'finance',
    'personal',
];
export const periodTypes = ['long_term', 'monthly', 'weekly', 'daily'];
export const habitTypes = ['positive', 'negative'];
const dateSchema = z.iso.date();
const optionalDateSchema = dateSchema.optional();
const nullableDateSchema = dateSchema.nullable();
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
    category: z.enum(goalCategories),
    deadline: nullableDateSchema,
    parentId: z.string().uuid().nullable().optional(),
    periodType: z.enum(periodTypes).optional(),
});
export const updateGoalSchema = z.object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(5000).optional(),
    category: z.enum(goalCategories).optional(),
    progress: z.number().min(0).max(100).optional(),
    deadline: nullableDateSchema.optional(),
    isCompleted: z.boolean().optional(),
});
export const createHabitSchema = z.object({
    title: z.string().trim().min(1).max(255),
    type: z.enum(habitTypes),
    icon: z.string().max(100).default('🎯'),
    category: z.string().trim().max(100).default('general'),
});
export const journalQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
});
export const createJournalEntrySchema = z.object({
    title: z.string().trim().min(1).max(255),
    content: z.string().trim().min(1).max(50000),
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
