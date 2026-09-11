import type {
  AiHealthResponse,
  AiPsychologistSessionResponse,
  AiSendMessageResponse,
  SendAiMessagePayload,
} from '@life-os/contracts'
import { aiRepository } from '../data/aiRepository'

export const aiApi = {
  health: (): Promise<AiHealthResponse> => aiRepository.health(),
  getPsychologistSession: (): Promise<AiPsychologistSessionResponse> => (
    aiRepository.getPsychologistSession()
  ),
  sendPsychologistMessage: (payload: SendAiMessagePayload): Promise<AiSendMessageResponse> => (
    aiRepository.sendPsychologistMessage(payload)
  ),
  clearPsychologistSession: (): Promise<{ success: true }> => (
    aiRepository.clearPsychologistSession()
  ),
}
