import type {
  AiChatMessage,
  AiChatSession,
  AiHealthResponse,
  AiPsychologistSessionResponse,
  AiSendMessageResponse,
  SendAiMessagePayload,
} from '@life-os/contracts'
import { AppError } from '../../lib/errors.js'
import type { AiRepository, AiMessageRow, AiSessionRow } from './ai.repository.js'
import type { UserContextBuilder } from './context/userContext.js'
import {
  buildPsychologistSystemPrompt,
  buildPsychologistWelcomeMessage,
} from './prompts/psychologist.js'
import type { LlmProvider } from './providers/types.js'

const HISTORY_LIMIT = 40

const mapSession = (row: AiSessionRow): AiChatSession => ({
  id: row.id,
  kind: row.kind,
  createdAt: row.created_at,
})

const mapMessage = (row: AiMessageRow): AiChatMessage => ({
  id: row.id,
  role: row.role === 'system' ? 'assistant' : row.role,
  content: row.content,
  createdAt: row.created_at,
})

type AiServiceDeps = {
  repository: AiRepository
  userContextBuilder: UserContextBuilder
  provider: LlmProvider
  aiEnabled: boolean
}

export const createAiService = ({
  repository,
  userContextBuilder,
  provider,
  aiEnabled,
}: AiServiceDeps) => {
  const ensurePsychologistSession = async (userId: number) => {
    let session = await repository.getSessionByKind(userId, 'psychologist')
    if (!session) {
      session = await repository.createSession(userId, 'psychologist')
      if (!session) {
        throw new AppError(500, 'Failed to create AI session')
      }
    }

    const existingMessages = await repository.listMessages(session.id, userId)
    if (existingMessages.length === 0) {
      const context = await userContextBuilder.build(userId)
      const welcome = await repository.addMessage(
        session.id,
        userId,
        'assistant',
        buildPsychologistWelcomeMessage(context),
      )
      if (!welcome) {
        throw new AppError(500, 'Failed to create welcome message')
      }
    }

    return session
  }

  return {
    health: async (): Promise<AiHealthResponse> => {
      if (!aiEnabled) {
        return {
          ok: false,
          enabled: false,
          model: provider.model,
          available: false,
          error: 'AI is disabled',
        }
      }

      const result = await provider.health()
      return {
        ok: result.available,
        enabled: true,
        model: provider.model,
        available: result.available,
        ...(result.error ? { error: result.error } : {}),
      }
    },

    getPsychologistSession: async (userId: number): Promise<AiPsychologistSessionResponse> => {
      const session = await ensurePsychologistSession(userId)
      const messages = await repository.listMessages(session.id, userId)
      return {
        session: mapSession(session),
        messages: messages.map(mapMessage),
      }
    },

    sendPsychologistMessage: async (
      userId: number,
      payload: SendAiMessagePayload,
    ): Promise<AiSendMessageResponse> => {
      if (!aiEnabled) {
        throw new AppError(503, 'AI is disabled')
      }

      const session = await ensurePsychologistSession(userId)
      const userMessageRow = await repository.addMessage(
        session.id,
        userId,
        'user',
        payload.content,
      )
      if (!userMessageRow) {
        throw new AppError(500, 'Failed to save user message')
      }

      const context = await userContextBuilder.build(userId)
      const history = await repository.listMessages(session.id, userId)
      const recent = history
        .filter((message): message is AiMessageRow & { role: 'user' | 'assistant' } => (
          message.role === 'user' || message.role === 'assistant'
        ))
        .slice(-HISTORY_LIMIT)
        .map(message => ({
          role: message.role,
          content: message.content,
        }))

      const providerHealth = await provider.health()
      if (!providerHealth.available) {
        throw new AppError(503, 'AI provider unavailable', {
          error: providerHealth.error ?? 'Ollama is not reachable',
        })
      }

      const completion = await provider.chat({
        system: buildPsychologistSystemPrompt(context),
        messages: recent,
      })

      const assistantMessageRow = await repository.addMessage(
        session.id,
        userId,
        'assistant',
        completion.content,
      )
      if (!assistantMessageRow) {
        throw new AppError(500, 'Failed to save assistant message')
      }

      return {
        userMessage: mapMessage(userMessageRow),
        assistantMessage: mapMessage(assistantMessageRow),
      }
    },

    clearPsychologistSession: async (userId: number) => {
      await repository.deleteSession(userId, 'psychologist')
      return { success: true as const }
    },
  }
}

export type AiService = ReturnType<typeof createAiService>
