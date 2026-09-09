import {
  apiRoutes,
  type AiHealthResponse,
  type AiPsychologistSessionResponse,
  type AiSendMessageResponse,
  type SendAiMessagePayload,
} from '@life-os/contracts'
import { request } from '../../../shared/api/client'

export const aiApi = {
  health: () => request<AiHealthResponse>(apiRoutes.ai.health),
  getPsychologistSession: () => request<AiPsychologistSessionResponse>(
    apiRoutes.ai.psychologistSession,
  ),
  sendPsychologistMessage: (payload: SendAiMessagePayload) => request<AiSendMessageResponse>(
    apiRoutes.ai.psychologistMessages,
    {
      method: 'POST',
      body: payload,
    },
  ),
  clearPsychologistSession: () => request<{ success: true }>(
    apiRoutes.ai.psychologistSession,
    { method: 'DELETE' },
  ),
}
