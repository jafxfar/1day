import type { RequestHandler } from 'express'
import type {
  SaveOnboardingProfilePayload,
  SaveOnboardingSetupPayload,
} from '@life-os/contracts'
import type { AuthenticatedRequest } from '../../lib/auth.js'
import type { OnboardingService } from './onboarding.service.js'

export const createOnboardingController = (service: OnboardingService) => {
  const get: RequestHandler = async (request, response) => {
    response.json(await service.get((request as AuthenticatedRequest).user.id))
  }

  const saveProfile: RequestHandler = async (request, response) => {
    response.json(await service.saveProfile(
      (request as AuthenticatedRequest).user.id,
      request.body as SaveOnboardingProfilePayload,
    ))
  }

  const saveSetup: RequestHandler = async (request, response) => {
    response.json(await service.saveSetup(
      (request as AuthenticatedRequest).user.id,
      request.body as SaveOnboardingSetupPayload,
    ))
  }

  const complete: RequestHandler = async (request, response) => {
    response.json(await service.complete((request as AuthenticatedRequest).user.id))
  }

  const skip: RequestHandler = async (request, response) => {
    response.json(await service.skip((request as AuthenticatedRequest).user.id))
  }

  const completeFirstDayFlow: RequestHandler = async (request, response) => {
    response.json(await service.completeFirstDayFlow((request as AuthenticatedRequest).user.id))
  }

  return { get, saveProfile, saveSetup, complete, skip, completeFirstDayFlow }
}
