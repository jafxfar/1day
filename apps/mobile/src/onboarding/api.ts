import type {
  OnboardingState,
  SaveOnboardingProfilePayload,
  SaveOnboardingSetupPayload,
} from '@life-os/contracts'
import { onboardingRepository } from '../data/onboardingRepository'

export const onboardingApi = {
  getState: (): Promise<OnboardingState> => onboardingRepository.getState(),
  saveProfile: (payload: SaveOnboardingProfilePayload): Promise<OnboardingState> => (
    onboardingRepository.saveProfile(payload)
  ),
  saveSetup: (payload: SaveOnboardingSetupPayload): Promise<OnboardingState> => (
    onboardingRepository.saveSetup(payload)
  ),
  complete: (): Promise<OnboardingState> => onboardingRepository.complete(),
  skip: (): Promise<OnboardingState> => onboardingRepository.skip(),
  completeFirstDayFlow: (): Promise<OnboardingState> => onboardingRepository.completeFirstDayFlow(),
}
