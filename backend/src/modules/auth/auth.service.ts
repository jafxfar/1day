import type { AuthUser, LoginPayload, RegisterPayload } from '@life-os/contracts'
import { AppError } from '../../lib/errors.js'
import { hashPassword, verifyPassword } from '../../lib/auth.js'
import type { AuthRepository, UserRow } from './auth.repository.js'

const mapUser = (row: UserRow): AuthUser => ({
  id: row.id,
  email: row.email,
  firstName: row.first_name,
  lastName: row.last_name,
  fullName: `${row.first_name} ${row.last_name}`.trim(),
  profilePhotoUrl: null,
  groups: [],
  metadata: {},
  sid: String(row.id),
  externalIdentifier: null,
  locale: 'en',
})

export const createAuthService = (repository: AuthRepository) => ({
  register: async (payload: RegisterPayload) => {
    if (await repository.findByEmail(payload.email)) {
      throw new AppError(409, 'Email already registered')
    }

    const passwordHash = await hashPassword(payload.password)
    const row = await repository.create(
      payload.email,
      passwordHash,
      payload.firstName ?? 'User',
      payload.lastName ?? '',
    )

    if (!row) throw new AppError(500, 'User registration failed')
    return mapUser(row)
  },
  login: async (payload: LoginPayload) => {
    const row = await repository.findByEmail(payload.email)
    if (!row || !await verifyPassword(payload.password, row.password_hash)) {
      throw new AppError(401, 'Invalid credentials')
    }
    return mapUser(row)
  },
})

export type AuthService = ReturnType<typeof createAuthService>
