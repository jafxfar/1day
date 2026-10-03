import type {
  AiChatMessage,
  AiChatSession,
  AiHealthResponse,
  AiPsychologistSessionResponse,
  AiSendMessageResponse,
  SendAiMessagePayload,
} from '@life-os/contracts'
import { getDatabase } from '../db/client'
import { parseJsonArray } from '../db/schema'
import { createId, nowIso } from '../lib/ids'
import { requireUserId } from './requireUser'

type SessionRow = {
  id: string
  user_id: number
  kind: 'psychologist'
  created_at: string
}

type MessageRow = {
  id: string
  session_id: string
  user_id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

const OFFLINE_REPLY = (
  'I\'m running fully offline on your device right now, so live AI coaching is unavailable. '
  + 'Your chat history is saved locally. Keep journaling, checking in, and tracking habits — '
  + 'those work without a network.'
)

const mapSession = (row: SessionRow): AiChatSession => ({
  id: row.id,
  kind: row.kind,
  createdAt: row.created_at,
})

const mapMessage = (row: MessageRow): AiChatMessage => ({
  id: row.id,
  role: row.role === 'system' ? 'assistant' : row.role,
  content: row.content,
  createdAt: row.created_at,
})

const buildWelcome = async (userId: number): Promise<string> => {
  const db = await getDatabase()
  const onboarding = await db.getFirstAsync<{
    profile_first_name: string | null
    motivations_json: string
    life_areas_json: string
    yearly_goals_json: string
  }>(
    `SELECT profile_first_name, motivations_json, life_areas_json, yearly_goals_json
     FROM user_onboarding_preferences WHERE user_id = ?`,
    [userId],
  )

  const name = onboarding?.profile_first_name?.trim()
  const greeting = name ? `Hi ${name}` : 'Hi'
  const hasSetup = Boolean(
    onboarding
    && parseJsonArray<string>(onboarding.motivations_json).length
    && parseJsonArray<string>(onboarding.life_areas_json).length
    && parseJsonArray<string>(onboarding.yearly_goals_json).length,
  )

  if (hasSetup) {
    return `${greeting}. I'm your Life OS coach running fully offline on this device. Live AI replies are unavailable without a local model, but your chat history stays here. How are you feeling today?`
  }

  return `${greeting}. I'm your Life OS coach. This offline build keeps your data on-device; AI replies are limited until a local model is available. How are you feeling today?`
}

const ensurePsychologistSession = async (userId: number): Promise<SessionRow> => {
  const db = await getDatabase()
  let session = await db.getFirstAsync<SessionRow>(
    `SELECT id, user_id, kind, created_at
     FROM ai_chat_sessions WHERE user_id = ? AND kind = 'psychologist'`,
    [userId],
  )

  if (!session) {
    const id = createId()
    const createdAt = nowIso()
    await db.runAsync(
      `INSERT INTO ai_chat_sessions (id, user_id, kind, created_at, updated_at)
       VALUES (?, ?, 'psychologist', ?, ?)`,
      [id, userId, createdAt, createdAt],
    )
    session = {
      id,
      user_id: userId,
      kind: 'psychologist',
      created_at: createdAt,
    }
  }

  const existingMessages = await db.getAllAsync<MessageRow>(
    `SELECT id, session_id, user_id, role, content, created_at
     FROM ai_chat_messages
     WHERE session_id = ? AND user_id = ? AND role IN ('user', 'assistant')
     ORDER BY created_at ASC`,
    [session.id, userId],
  )

  if (existingMessages.length === 0) {
    const welcome = await buildWelcome(userId)
    await db.runAsync(
      `INSERT INTO ai_chat_messages (id, session_id, user_id, role, content, created_at)
       VALUES (?, ?, ?, 'assistant', ?, ?)`,
      [createId(), session.id, userId, welcome, nowIso()],
    )
  }

  return session
}

export const aiRepository = {
  health: async (): Promise<AiHealthResponse> => ({
    ok: false,
    enabled: false,
    model: 'offline-stub',
    available: false,
    error: 'AI coaching is unavailable offline. Chat history is stored on this device.',
  }),

  getPsychologistSession: async (): Promise<AiPsychologistSessionResponse> => {
    const userId = await requireUserId()
    const session = await ensurePsychologistSession(userId)
    const db = await getDatabase()
    const messages = await db.getAllAsync<MessageRow>(
      `SELECT id, session_id, user_id, role, content, created_at
       FROM ai_chat_messages
       WHERE session_id = ? AND user_id = ? AND role IN ('user', 'assistant')
       ORDER BY created_at ASC`,
      [session.id, userId],
    )

    return {
      session: mapSession(session),
      messages: messages.map(mapMessage),
    }
  },

  sendPsychologistMessage: async (payload: SendAiMessagePayload): Promise<AiSendMessageResponse> => {
    const userId = await requireUserId()
    const session = await ensurePsychologistSession(userId)
    const db = await getDatabase()
    const createdAt = nowIso()

    const userMessageId = createId()
    await db.runAsync(
      `INSERT INTO ai_chat_messages (id, session_id, user_id, role, content, created_at)
       VALUES (?, ?, ?, 'user', ?, ?)`,
      [userMessageId, session.id, userId, payload.content, createdAt],
    )

    const assistantMessageId = createId()
    const assistantCreatedAt = nowIso()
    await db.runAsync(
      `INSERT INTO ai_chat_messages (id, session_id, user_id, role, content, created_at)
       VALUES (?, ?, ?, 'assistant', ?, ?)`,
      [assistantMessageId, session.id, userId, OFFLINE_REPLY, assistantCreatedAt],
    )

    await db.runAsync(
      `UPDATE ai_chat_sessions SET updated_at = ? WHERE id = ? AND user_id = ?`,
      [assistantCreatedAt, session.id, userId],
    )

    return {
      userMessage: {
        id: userMessageId,
        role: 'user',
        content: payload.content,
        createdAt,
      },
      assistantMessage: {
        id: assistantMessageId,
        role: 'assistant',
        content: OFFLINE_REPLY,
        createdAt: assistantCreatedAt,
      },
    }
  },

  clearPsychologistSession: async (): Promise<{ success: true }> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    await db.runAsync(
      `DELETE FROM ai_chat_sessions WHERE user_id = ? AND kind = 'psychologist'`,
      [userId],
    )
    return { success: true }
  },
}
