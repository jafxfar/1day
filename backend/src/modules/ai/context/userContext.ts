import type { CommunicationStyle, OnboardingStatus } from '@life-os/contracts'
import type { OnboardingRepository, OnboardingRow } from '../../onboarding/onboarding.repository.js'

export type AiUserProfileContext = {
  firstName: string | null
  birthDate: string | null
  timezone: string | null
  language: string | null
}

export type AiUserSetupContext = {
  motivations: string[]
  lifeAreas: string[]
  communicationStyle: CommunicationStyle | null
  criticismLevel: number | null
  wakeTime: string | null
  sleepTime: string | null
  yearlyGoals: string[]
  buildHabits: string[]
  quitHabits: string[]
}

export type AiUserContext = {
  onboardingStatus: OnboardingStatus | null
  profileComplete: boolean
  setupComplete: boolean
  profile: AiUserProfileContext
  setup: AiUserSetupContext
}

const hasProfile = (row: OnboardingRow) => Boolean(
  row.profile_first_name
  && row.profile_timezone
  && row.profile_language,
)

const hasSetup = (row: OnboardingRow) => Boolean(
  row.motivations.length
  && row.life_areas.length
  && row.communication_style
  && row.criticism_level !== null
  && row.wake_time
  && row.sleep_time
  && row.yearly_goals.length,
)

const mapContext = (row: OnboardingRow | null): AiUserContext => {
  if (!row) {
    return {
      onboardingStatus: null,
      profileComplete: false,
      setupComplete: false,
      profile: {
        firstName: null,
        birthDate: null,
        timezone: null,
        language: null,
      },
      setup: {
        motivations: [],
        lifeAreas: [],
        communicationStyle: null,
        criticismLevel: null,
        wakeTime: null,
        sleepTime: null,
        yearlyGoals: [],
        buildHabits: [],
        quitHabits: [],
      },
    }
  }

  return {
    onboardingStatus: row.status,
    profileComplete: hasProfile(row),
    setupComplete: hasSetup(row),
    profile: {
      firstName: row.profile_first_name,
      birthDate: row.profile_birth_date,
      timezone: row.profile_timezone,
      language: row.profile_language,
    },
    setup: {
      motivations: row.motivations,
      lifeAreas: row.life_areas,
      communicationStyle: row.communication_style,
      criticismLevel: row.criticism_level,
      wakeTime: row.wake_time,
      sleepTime: row.sleep_time,
      yearlyGoals: row.yearly_goals,
      buildHabits: row.build_habits,
      quitHabits: row.quit_habits,
    },
  }
}

export const createUserContextBuilder = (onboardingRepository: OnboardingRepository) => ({
  build: async (userId: number): Promise<AiUserContext> => {
    const row = await onboardingRepository.get(userId)
    return mapContext(row)
  },
})

export type UserContextBuilder = ReturnType<typeof createUserContextBuilder>
