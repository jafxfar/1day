import type {
  CommunicationStyle,
  OnboardingState,
  OnboardingStatus,
  SaveOnboardingProfilePayload,
  SaveOnboardingSetupPayload,
} from '@life-os/contracts'
import { ApiError } from '../api/client'
import { getDatabase } from '../db/client'
import { parseJsonArray, toJsonArray } from '../db/schema'
import { createId, nowIso } from '../lib/ids'
import { requireUserId } from './requireUser'

type OnboardingRow = {
  user_id: number
  status: OnboardingStatus
  profile_first_name: string | null
  profile_birth_date: string | null
  profile_timezone: string | null
  profile_language: string | null
  motivations_json: string
  life_areas_json: string
  communication_style: CommunicationStyle | null
  criticism_level: number | null
  wake_time: string | null
  sleep_time: string | null
  yearly_goals_json: string
  build_habits_json: string
  quit_habits_json: string
  completed_at: string | null
  first_day_flow_completed: number
  first_day_flow_completed_at: string | null
}

const normalizeTitle = (title: string) => title.trim().toLowerCase()

const mapState = (row: OnboardingRow): OnboardingState => {
  const motivations = parseJsonArray<string>(row.motivations_json)
  const lifeAreas = parseJsonArray<string>(row.life_areas_json)
  const yearlyGoals = parseJsonArray<string>(row.yearly_goals_json)
  const buildHabits = parseJsonArray<string>(row.build_habits_json)
  const quitHabits = parseJsonArray<string>(row.quit_habits_json)

  const hasProfile = Boolean(
    row.profile_first_name
    && row.profile_timezone
    && row.profile_language,
  )
  const hasSetup = Boolean(
    motivations.length
    && lifeAreas.length
    && row.communication_style
    && row.criticism_level !== null
    && row.wake_time
    && row.sleep_time
    && yearlyGoals.length,
  )

  return {
    status: row.status,
    profile: hasProfile
      ? {
        firstName: row.profile_first_name ?? '',
        birthDate: row.profile_birth_date,
        timezone: row.profile_timezone ?? '',
        language: row.profile_language ?? '',
      }
      : null,
    setup: hasSetup
      ? {
        motivations,
        lifeAreas,
        communicationStyle: row.communication_style as CommunicationStyle,
        criticismLevel: row.criticism_level ?? 3,
        wakeTime: row.wake_time ?? '07:00',
        sleepTime: row.sleep_time ?? '23:00',
        yearlyGoals,
        buildHabits,
        quitHabits,
      }
      : null,
    completedAt: row.completed_at,
    firstDayFlowCompleted: Boolean(row.first_day_flow_completed),
    firstDayFlowCompletedAt: row.first_day_flow_completed_at,
  }
}

const getRow = async (userId: number): Promise<OnboardingRow | null> => {
  const db = await getDatabase()
  return db.getFirstAsync<OnboardingRow>(
    'SELECT * FROM user_onboarding_preferences WHERE user_id = ?',
    [userId],
  )
}

const ensureRow = async (userId: number): Promise<OnboardingRow> => {
  const db = await getDatabase()
  await db.runAsync(
    'INSERT OR IGNORE INTO user_onboarding_preferences (user_id) VALUES (?)',
    [userId],
  )
  const row = await getRow(userId)
  if (!row) throw new ApiError('Failed to load onboarding state', 500)
  return row
}

const assertReadyForCompletion = (row: OnboardingRow) => {
  const motivations = parseJsonArray<string>(row.motivations_json)
  const lifeAreas = parseJsonArray<string>(row.life_areas_json)
  const yearlyGoals = parseJsonArray<string>(row.yearly_goals_json)
  const fieldErrors: Record<string, string[]> = {}

  if (!row.profile_first_name) fieldErrors.firstName = ['Required']
  if (!row.profile_timezone) fieldErrors.timezone = ['Required']
  if (!row.profile_language) fieldErrors.language = ['Required']
  if (motivations.length < 1) fieldErrors.motivations = ['Select at least one option']
  if (lifeAreas.length < 1) fieldErrors.lifeAreas = ['Select at least one option']
  if (yearlyGoals.length < 1) fieldErrors.yearlyGoals = ['Add at least one goal']

  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiError('Validation failed', 400)
  }
}

const importSetupEntities = async (userId: number, row: OnboardingRow) => {
  const db = await getDatabase()
  const now = nowIso()
  const yearlyGoals = parseJsonArray<string>(row.yearly_goals_json)
  const buildHabits = parseJsonArray<string>(row.build_habits_json)
  const quitHabits = parseJsonArray<string>(row.quit_habits_json)

  const existingGoals = await db.getAllAsync<{ title: string }>(
    `SELECT title FROM goals WHERE user_id = ? AND deleted_at IS NULL`,
    [userId],
  )
  const existingGoalTitles = new Set(existingGoals.map(goal => normalizeTitle(goal.title)))

  for (const title of yearlyGoals) {
    const trimmed = title.trim()
    if (!trimmed || existingGoalTitles.has(normalizeTitle(trimmed))) continue
    await db.runAsync(
      `INSERT INTO goals (
         id, user_id, title, description, category, deadline, parent_id, node_type, task_type, created_at, updated_at
       ) VALUES (?, ?, ?, '', 'personal', NULL, NULL, 'goal', NULL, ?, ?)`,
      [createId(), userId, trimmed, now, now],
    )
    existingGoalTitles.add(normalizeTitle(trimmed))
  }

  const existingHabits = await db.getAllAsync<{ title: string }>(
    `SELECT title FROM habits WHERE user_id = ? AND deleted_at IS NULL`,
    [userId],
  )
  const existingHabitTitles = new Set(existingHabits.map(habit => normalizeTitle(habit.title)))

  const createHabitIfMissing = async (
    title: string,
    type: 'positive' | 'negative',
    icon: string,
  ) => {
    const trimmed = title.trim()
    if (!trimmed || existingHabitTitles.has(normalizeTitle(trimmed))) return
    await db.runAsync(
      `INSERT INTO habits (id, user_id, title, type, icon, category, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'general', ?, ?)`,
      [createId(), userId, trimmed, type, icon, now, now],
    )
    existingHabitTitles.add(normalizeTitle(trimmed))
  }

  for (const title of buildHabits) {
    await createHabitIfMissing(title, 'positive', '🎯')
  }
  for (const title of quitHabits) {
    await createHabitIfMissing(title, 'negative', '🚫')
  }
}

export const onboardingRepository = {
  getState: async (): Promise<OnboardingState> => {
    const userId = await requireUserId()
    const row = await ensureRow(userId)
    return mapState(row)
  },

  saveProfile: async (payload: SaveOnboardingProfilePayload): Promise<OnboardingState> => {
    const userId = await requireUserId()
    await ensureRow(userId)
    const db = await getDatabase()
    const existing = await getRow(userId)
    const nextStatus = existing?.status === 'completed' ? 'completed' : 'in_progress'

    await db.runAsync(
      `UPDATE user_onboarding_preferences SET
         status = ?, profile_first_name = ?, profile_birth_date = ?,
         profile_timezone = ?, profile_language = ?, updated_at = ?
       WHERE user_id = ?`,
      [
        nextStatus,
        payload.firstName,
        payload.birthDate,
        payload.timezone,
        payload.language,
        nowIso(),
        userId,
      ],
    )

    const row = await getRow(userId)
    if (!row) throw new ApiError('Failed to save profile setup', 500)
    return mapState(row)
  },

  saveSetup: async (payload: SaveOnboardingSetupPayload): Promise<OnboardingState> => {
    const userId = await requireUserId()
    await ensureRow(userId)
    const db = await getDatabase()
    const existing = await getRow(userId)
    const nextStatus = existing?.status === 'completed' ? 'completed' : 'in_progress'

    await db.runAsync(
      `UPDATE user_onboarding_preferences SET
         status = ?, motivations_json = ?, life_areas_json = ?, communication_style = ?,
         criticism_level = ?, wake_time = ?, sleep_time = ?, yearly_goals_json = ?,
         build_habits_json = ?, quit_habits_json = ?, updated_at = ?
       WHERE user_id = ?`,
      [
        nextStatus,
        toJsonArray(payload.motivations),
        toJsonArray(payload.lifeAreas),
        payload.communicationStyle,
        payload.criticismLevel,
        payload.wakeTime,
        payload.sleepTime,
        toJsonArray(payload.yearlyGoals),
        toJsonArray(payload.buildHabits),
        toJsonArray(payload.quitHabits),
        nowIso(),
        userId,
      ],
    )

    const row = await getRow(userId)
    if (!row) throw new ApiError('Failed to save setup answers', 500)
    return mapState(row)
  },

  complete: async (): Promise<OnboardingState> => {
    const userId = await requireUserId()
    const current = await ensureRow(userId)
    assertReadyForCompletion(current)
    await importSetupEntities(userId, current)

    const db = await getDatabase()
    const completedAt = nowIso()
    await db.runAsync(
      `UPDATE user_onboarding_preferences SET
         status = 'completed', completed_at = ?, updated_at = ?
       WHERE user_id = ?`,
      [completedAt, completedAt, userId],
    )

    const row = await getRow(userId)
    if (!row) throw new ApiError('Failed to complete onboarding', 500)
    return mapState(row)
  },

  skip: async (): Promise<OnboardingState> => {
    const userId = await requireUserId()
    await ensureRow(userId)
    const db = await getDatabase()
    await db.runAsync(
      `UPDATE user_onboarding_preferences SET
         status = 'skipped', updated_at = ?
       WHERE user_id = ?`,
      [nowIso(), userId],
    )
    const row = await getRow(userId)
    if (!row) throw new ApiError('Failed to skip onboarding', 500)
    return mapState(row)
  },

  completeFirstDayFlow: async (): Promise<OnboardingState> => {
    const userId = await requireUserId()
    const current = await ensureRow(userId)
    await importSetupEntities(userId, current)

    const db = await getDatabase()
    const completedAt = nowIso()
    await db.runAsync(
      `UPDATE user_onboarding_preferences SET
         first_day_flow_completed = 1,
         first_day_flow_completed_at = ?,
         updated_at = ?
       WHERE user_id = ?`,
      [completedAt, completedAt, userId],
    )

    const row = await getRow(userId)
    if (!row) throw new ApiError('Failed to complete first day flow', 500)
    return mapState(row)
  },
}
