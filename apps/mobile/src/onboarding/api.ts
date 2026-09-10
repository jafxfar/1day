import {
  apiRoutes,
  type OnboardingState,
  type SaveOnboardingProfilePayload,
  type SaveOnboardingSetupPayload,
} from '@life-os/contracts'
import { request } from '../api/client'

export const onboardingApi = {
  getState: () => request<OnboardingState>(apiRoutes.onboarding.root),
  saveProfile: (payload: SaveOnboardingProfilePayload) => request<OnboardingState>(apiRoutes.onboarding.profile, {
    method: 'PUT',
    body: payload,
  }),
  saveSetup: (payload: SaveOnboardingSetupPayload) => request<OnboardingState>(apiRoutes.onboarding.setup, {
    method: 'PUT',
    body: payload,
  }),
  complete: () => request<OnboardingState>(apiRoutes.onboarding.complete, {
    method: 'POST',
  }),
  skip: () => request<OnboardingState>(apiRoutes.onboarding.skip, {
    method: 'POST',
  }),
  completeFirstDayFlow: () => request<OnboardingState>(apiRoutes.onboarding.firstDayComplete, {
    method: 'POST',
  }),
}
