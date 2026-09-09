import type { AiChatRole, AiSessionKind } from '@life-os/contracts'
import type { Database } from '../../db.js'

export type AiSessionRow = {
  id: string
  user_id: number
  kind: AiSessionKind
  created_at: string
}

export type AiMessageRow = {
  id: string
  session_id: string
  user_id: number
  role: AiChatRole | 'system'
  content: string
  created_at: string
}

export const createAiRepository = (database: Database) => ({
  getSessionByKind: async (userId: number, kind: AiSessionKind) => {
    const result = await database.query<AiSessionRow>(
      `SELECT id, user_id, kind, created_at::text
       FROM ai_chat_sessions
       WHERE user_id = $1 AND kind = $2`,
      [userId, kind],
    )
    return result.rows[0] ?? null
  },

  createSession: async (userId: number, kind: AiSessionKind) => {
    const result = await database.query<AiSessionRow>(
      `INSERT INTO ai_chat_sessions (user_id, kind)
       VALUES ($1, $2)
       ON CONFLICT (user_id, kind) DO UPDATE SET updated_at = NOW()
       RETURNING id, user_id, kind, created_at::text`,
      [userId, kind],
    )
    return result.rows[0] ?? null
  },

  listMessages: async (sessionId: string, userId: number) => {
    const result = await database.query<AiMessageRow>(
      `SELECT id, session_id, user_id, role, content, created_at::text
       FROM ai_chat_messages
       WHERE session_id = $1 AND user_id = $2 AND role IN ('user', 'assistant')
       ORDER BY created_at ASC`,
      [sessionId, userId],
    )
    return result.rows
  },

  addMessage: async (
    sessionId: string,
    userId: number,
    role: AiChatRole | 'system',
    content: string,
  ) => {
    const result = await database.query<AiMessageRow>(
      `INSERT INTO ai_chat_messages (session_id, user_id, role, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, session_id, user_id, role, content, created_at::text`,
      [sessionId, userId, role, content],
    )
    await database.query(
      `UPDATE ai_chat_sessions SET updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [sessionId, userId],
    )
    return result.rows[0] ?? null
  },

  deleteSession: async (userId: number, kind: AiSessionKind) => {
    const result = await database.query<{ id: string }>(
      `DELETE FROM ai_chat_sessions
       WHERE user_id = $1 AND kind = $2
       RETURNING id`,
      [userId, kind],
    )
    return result.rows[0]?.id ?? null
  },
})

export type AiRepository = ReturnType<typeof createAiRepository>
