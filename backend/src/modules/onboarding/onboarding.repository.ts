import type {
  OnboardingStatus,
  SaveOnboardingProfilePayload,
  SaveOnboardingSetupPayload,
} from '@life-os/contracts'
import type { Database } from '../../db.js'

export type OnboardingRow = {
  user_id: number
  status: OnboardingStatus
  profile_first_name: string | null
  profile_birth_date: string | null
  profile_timezone: string | null
  profile_language: string | null
  motivations: string[]
  life_areas: string[]
  communication_style: 'careful' | 'friendly' | 'mentor' | 'coach' | null
  criticism_level: number | null
  wake_time: string | null
  sleep_time: string | null
  yearly_goals: string[]
  build_habits: string[]
  quit_habits: string[]
  completed_at: string | null
  first_day_flow_completed: boolean
  first_day_flow_completed_at: string | null
}

export const createOnboardingRepository = (database: Database) => ({
  get: async (userId: number) => {
    const result = await database.query<OnboardingRow>(
      `SELECT user_id, status, profile_first_name, profile_birth_date::text, profile_timezone,
              profile_language, motivations, life_areas, communication_style,
              criticism_level, wake_time, sleep_time, yearly_goals, build_habits,
              quit_habits, completed_at::text, first_day_flow_completed, first_day_flow_completed_at::text
       FROM user_onboarding_preferences
       WHERE user_id = $1`,
      [userId],
    )
    return result.rows[0] ?? null
  },
  ensure: async (userId: number) => {
    await database.query(
      `INSERT INTO user_onboarding_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    )
  },
  saveProfile: async (userId: number, payload: SaveOnboardingProfilePayload) => {
    const result = await database.query<OnboardingRow>(
      `INSERT INTO user_onboarding_preferences (
         user_id, status, profile_first_name, profile_birth_date, profile_timezone, profile_language
       ) VALUES ($1, 'in_progress', $2, $3::date, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         status = CASE
           WHEN user_onboarding_preferences.status = 'completed' THEN user_onboarding_preferences.status
           ELSE 'in_progress'
         END,
         profile_first_name = EXCLUDED.profile_first_name,
         profile_birth_date = EXCLUDED.profile_birth_date,
         profile_timezone = EXCLUDED.profile_timezone,
         profile_language = EXCLUDED.profile_language,
         updated_at = NOW()
       RETURNING user_id, status, profile_first_name, profile_birth_date::text, profile_timezone,
                 profile_language, motivations, life_areas, communication_style,
                 criticism_level, wake_time, sleep_time, yearly_goals, build_habits,
                 quit_habits, completed_at::text, first_day_flow_completed, first_day_flow_completed_at::text`,
      [userId, payload.firstName, payload.birthDate, payload.timezone, payload.language],
    )
    return result.rows[0] ?? null
  },
  saveSetup: async (userId: number, payload: SaveOnboardingSetupPayload) => {
    const result = await database.query<OnboardingRow>(
      `INSERT INTO user_onboarding_preferences (
         user_id, status, motivations, life_areas, communication_style, criticism_level,
         wake_time, sleep_time, yearly_goals, build_habits, quit_habits
       ) VALUES ($1, 'in_progress', $2::text[], $3::text[], $4, $5, $6, $7, $8::text[], $9::text[], $10::text[])
       ON CONFLICT (user_id) DO UPDATE SET
         status = CASE
           WHEN user_onboarding_preferences.status = 'completed' THEN user_onboarding_preferences.status
           ELSE 'in_progress'
         END,
         motivations = EXCLUDED.motivations,
         life_areas = EXCLUDED.life_areas,
         communication_style = EXCLUDED.communication_style,
         criticism_level = EXCLUDED.criticism_level,
         wake_time = EXCLUDED.wake_time,
         sleep_time = EXCLUDED.sleep_time,
         yearly_goals = EXCLUDED.yearly_goals,
         build_habits = EXCLUDED.build_habits,
         quit_habits = EXCLUDED.quit_habits,
         updated_at = NOW()
       RETURNING user_id, status, profile_first_name, profile_birth_date::text, profile_timezone,
                 profile_language, motivations, life_areas, communication_style,
                 criticism_level, wake_time, sleep_time, yearly_goals, build_habits,
                 quit_habits, completed_at::text, first_day_flow_completed, first_day_flow_completed_at::text`,
      [
        userId,
        payload.motivations,
        payload.lifeAreas,
        payload.communicationStyle,
        payload.criticismLevel,
        payload.wakeTime,
        payload.sleepTime,
        payload.yearlyGoals,
        payload.buildHabits,
        payload.quitHabits,
      ],
    )
    return result.rows[0] ?? null
  },
  markComplete: async (userId: number) => {
    const result = await database.query<OnboardingRow>(
      `INSERT INTO user_onboarding_preferences (user_id, status, completed_at)
       VALUES ($1, 'completed', NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         status = 'completed',
         completed_at = NOW(),
         updated_at = NOW()
       RETURNING user_id, status, profile_first_name, profile_birth_date::text, profile_timezone,
                 profile_language, motivations, life_areas, communication_style,
                 criticism_level, wake_time, sleep_time, yearly_goals, build_habits,
                 quit_habits, completed_at::text, first_day_flow_completed, first_day_flow_completed_at::text`,
      [userId],
    )
    return result.rows[0] ?? null
  },
  markSkipped: async (userId: number) => {
    const result = await database.query<OnboardingRow>(
      `INSERT INTO user_onboarding_preferences (user_id, status)
       VALUES ($1, 'skipped')
       ON CONFLICT (user_id) DO UPDATE SET
         status = 'skipped',
         updated_at = NOW()
       RETURNING user_id, status, profile_first_name, profile_birth_date::text, profile_timezone,
                 profile_language, motivations, life_areas, communication_style,
                 criticism_level, wake_time, sleep_time, yearly_goals, build_habits,
                 quit_habits, completed_at::text, first_day_flow_completed, first_day_flow_completed_at::text`,
      [userId],
    )
    return result.rows[0] ?? null
  },
  markFirstDayComplete: async (userId: number) => {
    const result = await database.query<OnboardingRow>(
      `INSERT INTO user_onboarding_preferences (user_id, first_day_flow_completed, first_day_flow_completed_at)
       VALUES ($1, TRUE, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         first_day_flow_completed = TRUE,
         first_day_flow_completed_at = NOW(),
         updated_at = NOW()
       RETURNING user_id, status, profile_first_name, profile_birth_date::text, profile_timezone,
                 profile_language, motivations, life_areas, communication_style,
                 criticism_level, wake_time, sleep_time, yearly_goals, build_habits,
                 quit_habits, completed_at::text, first_day_flow_completed, first_day_flow_completed_at::text`,
      [userId],
    )
    return result.rows[0] ?? null
  },
})

export type OnboardingRepository = ReturnType<typeof createOnboardingRepository>
