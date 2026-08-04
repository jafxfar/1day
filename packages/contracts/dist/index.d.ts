import { z } from 'zod';
export declare const apiRoutes: {
    readonly health: "/api/health";
    readonly readiness: "/api/readiness";
    readonly auth: {
        readonly register: "/api/auth/register";
        readonly login: "/api/auth/login";
        readonly logout: "/api/auth/logout";
        readonly me: "/api/auth/me";
    };
    readonly goals: "/api/goals";
    readonly habits: "/api/habits";
    readonly journal: "/api/journal";
    readonly checkins: {
        readonly today: "/api/checkins/today";
        readonly morning: "/api/checkins/morning";
        readonly evening: "/api/checkins/evening";
    };
    readonly biography: "/api/biography";
    readonly onboarding: {
        readonly root: "/api/onboarding";
        readonly profile: "/api/onboarding/profile";
        readonly setup: "/api/onboarding/setup";
        readonly complete: "/api/onboarding/complete";
        readonly skip: "/api/onboarding/skip";
        readonly firstDayComplete: "/api/onboarding/first-day-complete";
    };
};
export declare const goalCategories: readonly ["health", "career", "learning", "relationships", "finance", "personal"];
export declare const periodTypes: readonly ["long_term", "monthly", "weekly", "daily"];
export declare const habitTypes: readonly ["positive", "negative"];
export type GoalCategory = typeof goalCategories[number];
export type PeriodType = typeof periodTypes[number];
export type HabitType = typeof habitTypes[number];
export type CheckinType = 'morning' | 'evening';
export type OnboardingStatus = 'in_progress' | 'skipped' | 'completed';
export type CommunicationStyle = 'careful' | 'friendly' | 'mentor' | 'coach';
export interface AuthUser {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    profilePhotoUrl: string | null;
    groups: Array<{
        id: number;
        name: string;
    }>;
    metadata: Record<string, unknown>;
    sid: string;
    externalIdentifier: string | null;
    locale: string;
}
export interface Goal {
    id: string;
    title: string;
    description: string;
    category: GoalCategory;
    progress: number;
    deadline: string | null;
    isCompleted: boolean;
    completedAt: string | null;
    parentId: string | null;
    periodType: PeriodType;
    depth: number;
    createdAt: string;
    updatedAt: string;
}
export interface Habit {
    id: string;
    title: string;
    type: HabitType;
    icon: string;
    category: string;
    currentStreak: number;
    longestStreak: number;
    completedToday: boolean;
    isArchived: boolean;
    createdAt: string;
}
export interface JournalEntry {
    id: string;
    entryDate: string;
    title: string;
    content: string;
    mood: number;
    energy: number;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}
export interface MorningCheckin {
    id: string;
    checkinDate: string;
    sleepHours: number;
    energy: number;
    mood: number;
    focusText: string;
    createdAt: string;
}
export interface EveningReflection {
    id: string;
    checkinDate: string;
    rating: number;
    wins: string;
    failures: string;
    reasons: string;
    tags: string[];
    createdAt: string;
}
export interface TodayCheckins {
    morning: MorningCheckin | null;
    evening: EveningReflection | null;
}
export type DayQuality = 'great' | 'good' | 'neutral' | 'poor' | 'no_data';
export interface BiographyHabitRecord {
    title: string;
    icon: string;
    completed: boolean;
}
export interface BiographyDay {
    date: string;
    mood: number | null;
    energy: number | null;
    sleepHours: number | null;
    focusText: string | null;
    eveningRating: number | null;
    eveningTags: string[];
    wins: string | null;
    failures: string | null;
    habits: BiographyHabitRecord[];
    habitsCompleted: number;
    habitsTotal: number;
    journalTitle: string | null;
    journalContent: string | null;
    journalMood: number | null;
    journalTags: string[];
    score: number;
    quality: DayQuality;
}
export interface OnboardingProfile {
    firstName: string;
    birthDate: string | null;
    timezone: string;
    language: string;
}
export interface OnboardingSetup {
    motivations: string[];
    lifeAreas: string[];
    communicationStyle: CommunicationStyle;
    criticismLevel: number;
    wakeTime: string;
    sleepTime: string;
    yearlyGoals: string[];
    buildHabits: string[];
    quitHabits: string[];
}
export interface OnboardingState {
    status: OnboardingStatus;
    profile: OnboardingProfile | null;
    setup: OnboardingSetup | null;
    completedAt: string | null;
    firstDayFlowCompleted: boolean;
    firstDayFlowCompletedAt: string | null;
}
export declare const loginSchema: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
}, z.core.$strip>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
    firstName: z.ZodDefault<z.ZodString>;
    lastName: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const createGoalSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodDefault<z.ZodString>;
    category: z.ZodEnum<{
        health: "health";
        career: "career";
        learning: "learning";
        relationships: "relationships";
        finance: "finance";
        personal: "personal";
    }>;
    deadline: z.ZodNullable<z.ZodISODate>;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    periodType: z.ZodOptional<z.ZodEnum<{
        long_term: "long_term";
        monthly: "monthly";
        weekly: "weekly";
        daily: "daily";
    }>>;
}, z.core.$strip>;
export declare const updateGoalSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<{
        health: "health";
        career: "career";
        learning: "learning";
        relationships: "relationships";
        finance: "finance";
        personal: "personal";
    }>>;
    progress: z.ZodOptional<z.ZodNumber>;
    deadline: z.ZodOptional<z.ZodNullable<z.ZodISODate>>;
    isCompleted: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const createHabitSchema: z.ZodObject<{
    title: z.ZodString;
    type: z.ZodEnum<{
        positive: "positive";
        negative: "negative";
    }>;
    icon: z.ZodDefault<z.ZodString>;
    category: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const journalQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    offset: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const createJournalEntrySchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    mood: z.ZodNumber;
    energy: z.ZodNumber;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
    entryDate: z.ZodOptional<z.ZodISODate>;
}, z.core.$strip>;
export declare const saveMorningCheckinSchema: z.ZodObject<{
    sleepHours: z.ZodNumber;
    energy: z.ZodNumber;
    mood: z.ZodNumber;
    focusText: z.ZodString;
    checkinDate: z.ZodOptional<z.ZodISODate>;
}, z.core.$strip>;
export declare const saveEveningReflectionSchema: z.ZodObject<{
    rating: z.ZodNumber;
    wins: z.ZodString;
    failures: z.ZodString;
    reasons: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
    checkinDate: z.ZodOptional<z.ZodISODate>;
}, z.core.$strip>;
export declare const idParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const habitIdParamsSchema: z.ZodObject<{
    habitId: z.ZodString;
}, z.core.$strip>;
export declare const onboardingProfileSchema: z.ZodObject<{
    firstName: z.ZodString;
    birthDate: z.ZodNullable<z.ZodISODate>;
    timezone: z.ZodString;
    language: z.ZodString;
}, z.core.$strip>;
export declare const onboardingSetupSchema: z.ZodObject<{
    motivations: z.ZodArray<z.ZodString>;
    lifeAreas: z.ZodArray<z.ZodString>;
    communicationStyle: z.ZodEnum<{
        careful: "careful";
        friendly: "friendly";
        mentor: "mentor";
        coach: "coach";
    }>;
    criticismLevel: z.ZodNumber;
    wakeTime: z.ZodString;
    sleepTime: z.ZodString;
    yearlyGoals: z.ZodArray<z.ZodString>;
    buildHabits: z.ZodArray<z.ZodString>;
    quitHabits: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type LoginPayload = z.input<typeof loginSchema>;
export type RegisterPayload = z.input<typeof registerSchema>;
export type CreateGoalPayload = z.input<typeof createGoalSchema>;
export type UpdateGoalPayload = z.input<typeof updateGoalSchema>;
export type CreateHabitPayload = z.input<typeof createHabitSchema>;
export type JournalQuery = z.input<typeof journalQuerySchema>;
export type CreateJournalEntryPayload = z.input<typeof createJournalEntrySchema>;
export type SaveMorningCheckinPayload = z.input<typeof saveMorningCheckinSchema>;
export type SaveEveningReflectionPayload = z.input<typeof saveEveningReflectionSchema>;
export type SaveOnboardingProfilePayload = z.input<typeof onboardingProfileSchema>;
export type SaveOnboardingSetupPayload = z.input<typeof onboardingSetupSchema>;
