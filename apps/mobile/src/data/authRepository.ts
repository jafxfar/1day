import type {
  AuthSessionResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@life-os/contracts'
import { ApiError } from '../api/client'
import { getDatabase } from '../db/client'
import { hashPassword, verifyPassword } from '../lib/password'
import { createSessionToken } from '../lib/sessionToken'
import { mapAuthUser, type UserRow } from './mappers'
import { requireUserId } from './requireUser'

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const authRepository = {
  getCurrentUser: async (): Promise<AuthUser> => {
    const userId = await requireUserId()
    const db = await getDatabase()
    const row = await db.getFirstAsync<UserRow>(
      'SELECT id, email, password_hash, first_name, last_name FROM lifeos_users WHERE id = ?',
      [userId],
    )
    if (!row) throw new ApiError('Authentication required', 401)
    return mapAuthUser(row)
  },

  register: async (payload: RegisterPayload): Promise<AuthSessionResponse> => {
    const db = await getDatabase()
    const email = normalizeEmail(payload.email)
    const existing = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM lifeos_users WHERE email = ?',
      [email],
    )
    if (existing) throw new ApiError('Email already registered', 409)

    const passwordHash = await hashPassword(payload.password)
    const firstName = payload.firstName?.trim() || 'User'
    const lastName = payload.lastName?.trim() || ''

    const result = await db.runAsync(
      `INSERT INTO lifeos_users (email, password_hash, first_name, last_name)
       VALUES (?, ?, ?, ?)`,
      [email, passwordHash, firstName, lastName],
    )

    const userId = Number(result.lastInsertRowId)
    if (!userId) throw new ApiError('User registration failed', 500)

    await db.runAsync(
      'INSERT OR IGNORE INTO user_onboarding_preferences (user_id) VALUES (?)',
      [userId],
    )

    const user = mapAuthUser({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
    })

    return {
      user,
      token: createSessionToken(userId),
    }
  },

  login: async (payload: LoginPayload): Promise<AuthSessionResponse> => {
    const db = await getDatabase()
    const email = normalizeEmail(payload.email)
    const row = await db.getFirstAsync<UserRow>(
      'SELECT id, email, password_hash, first_name, last_name FROM lifeos_users WHERE email = ?',
      [email],
    )

    if (!row || !(await verifyPassword(payload.password, row.password_hash))) {
      throw new ApiError('Invalid credentials', 401)
    }

    return {
      user: mapAuthUser(row),
      token: createSessionToken(row.id),
    }
  },

  logout: async (): Promise<{ ok: boolean }> => ({ ok: true }),
}
