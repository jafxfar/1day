import type {
  CommunicationStyle,
  OnboardingState,
  SaveOnboardingProfilePayload,
  SaveOnboardingSetupPayload,
} from '@life-os/contracts'
import { AppError } from '../../lib/errors.js'
import type { GoalsRepository } from '../goals/goals.repository.js'
import type { HabitsRepository } from '../habits/habits.repository.js'
import type { OnboardingRepository, OnboardingRow } from './onboarding.repository.js'

const normalizeTitle = (title: string) => title.trim().toLowerCase()

const mapState = (row: OnboardingRow): OnboardingState => {
  const hasProfile = Boolean(
    row.profile_first_name
    && row.profile_timezone
    && row.profile_language,
  )
  const hasSetup = Boolean(
    row.motivations.length
    && row.life_areas.length
    && row.communication_style
    && row.criticism_level !== null
    && row.wake_time
    && row.sleep_time
    && row.yearly_goals.length,
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
        motivations: row.motivations,
        lifeAreas: row.life_areas,
        communicationStyle: row.communication_style as CommunicationStyle,
        criticismLevel: row.criticism_level ?? 3,
        wakeTime: row.wake_time ?? '07:00',
        sleepTime: row.sleep_time ?? '23:00',
        yearlyGoals: row.yearly_goals,
        buildHabits: row.build_habits,
        quitHabits: row.quit_habits,
      }
      : null,
    completedAt: row.completed_at,
    firstDayFlowCompleted: row.first_day_flow_completed,
    firstDayFlowCompletedAt: row.first_day_flow_completed_at,
  }
}

const assertOnboardingReadyForCompletion = (row: OnboardingRow) => {
  const fieldErrors: Record<string, string[]> = {}

  if (!row.profile_first_name) fieldErrors.firstName = ['Required']
  if (!row.profile_timezone) fieldErrors.timezone = ['Required']
  if (!row.profile_language) fieldErrors.language = ['Required']
  if (row.motivations.length < 1) fieldErrors.motivations = ['Select at least one option']
  if (row.life_areas.length < 1) fieldErrors.lifeAreas = ['Select at least one option']
  if (row.yearly_goals.length < 1) fieldErrors.yearlyGoals = ['Add at least one goal']

  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError(400, 'Validation failed', {
      formErrors: [],
      fieldErrors,
    })
  }
}

type OnboardingServiceDeps = {
  repository: OnboardingRepository
  goalsRepository: GoalsRepository
  habitsRepository: HabitsRepository
}

const importSetupEntities = async (
  userId: number,
  row: OnboardingRow,
  goalsRepository: GoalsRepository,
  habitsRepository: HabitsRepository,
) => {
  const existingGoals = await goalsRepository.list(userId)
  const existingGoalTitles = new Set(
    existingGoals.map(goal => normalizeTitle(goal.title)),
  )

  for (const title of row.yearly_goals) {
    const trimmed = title.trim()
    if (!trimmed) {
      continue
    }

    if (existingGoalTitles.has(normalizeTitle(trimmed))) {
      continue
    }

    await goalsRepository.create(userId, {
      title: trimmed,
      description: '',
      category: 'personal',
      deadline: null,
      parentId: null,
      periodType: 'long_term',
    })
    existingGoalTitles.add(normalizeTitle(trimmed))
  }

  const { habits: existingHabits } = await habitsRepository.list(userId)
  const existingHabitTitles = new Set(
    existingHabits.map(habit => normalizeTitle(habit.title)),
  )

  const createHabitIfMissing = async (
    title: string,
    type: 'positive' | 'negative',
    icon: string,
  ) => {
    const trimmed = title.trim()
    if (!trimmed) {
      return
    }

    if (existingHabitTitles.has(normalizeTitle(trimmed))) {
      return
    }

    await habitsRepository.create(userId, trimmed, type, icon, 'general')
    existingHabitTitles.add(normalizeTitle(trimmed))
  }

  for (const title of row.build_habits) {
    await createHabitIfMissing(title, 'positive', '🎯')
  }

  for (const title of row.quit_habits) {
    await createHabitIfMissing(title, 'negative', '🚫')
  }
}

export const createOnboardingService = ({
  repository,
  goalsRepository,
  habitsRepository,
}: OnboardingServiceDeps) => ({
  get: async (userId: number): Promise<OnboardingState> => {
    await repository.ensure(userId)
    const row = await repository.get(userId)
    if (!row) throw new AppError(500, 'Failed to load onboarding state')
    return mapState(row)
  },
  saveProfile: async (userId: number, payload: SaveOnboardingProfilePayload): Promise<OnboardingState> => {
    const row = await repository.saveProfile(userId, payload)
    if (!row) throw new AppError(500, 'Failed to save profile setup')
    return mapState(row)
  },
  saveSetup: async (userId: number, payload: SaveOnboardingSetupPayload): Promise<OnboardingState> => {
    const row = await repository.saveSetup(userId, payload)
    if (!row) throw new AppError(500, 'Failed to save setup answers')
    return mapState(row)
  },
  complete: async (userId: number): Promise<OnboardingState> => {
    const current = await repository.get(userId)
    if (!current) throw new AppError(500, 'Failed to load onboarding state')
    assertOnboardingReadyForCompletion(current)

    await importSetupEntities(userId, current, goalsRepository, habitsRepository)

    const row = await repository.markComplete(userId)
    if (!row) throw new AppError(500, 'Failed to complete onboarding')
    return mapState(row)
  },
  skip: async (userId: number): Promise<OnboardingState> => {
    const row = await repository.markSkipped(userId)
    if (!row) throw new AppError(500, 'Failed to skip onboarding')
    return mapState(row)
  },
  completeFirstDayFlow: async (userId: number): Promise<OnboardingState> => {
    const current = await repository.get(userId)
    if (current) {
      await importSetupEntities(userId, current, goalsRepository, habitsRepository)
    }

    const row = await repository.markFirstDayComplete(userId)
    if (!row) throw new AppError(500, 'Failed to complete first day flow')
    return mapState(row)
  },
})

export type OnboardingService = ReturnType<typeof createOnboardingService>
