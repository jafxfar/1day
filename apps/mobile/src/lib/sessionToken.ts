import { createId } from './ids'

const TOKEN_PREFIX = 'local'

export const createSessionToken = (userId: number): string => (
  `${TOKEN_PREFIX}.${userId}.${createId()}`
)

export const parseSessionUserId = (token: string | null | undefined): number | null => {
  if (!token) return null
  const [prefix, userIdRaw] = token.split('.')
  if (prefix !== TOKEN_PREFIX) return null
  const userId = Number(userIdRaw)
  if (!Number.isInteger(userId) || userId <= 0) return null
  return userId
}
