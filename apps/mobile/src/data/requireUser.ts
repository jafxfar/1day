import { ApiError } from '../api/client'
import { tokenStore } from '../auth/tokenStore'
import { parseSessionUserId } from '../lib/sessionToken'

export const requireUserId = async (): Promise<number> => {
  const token = await tokenStore.get()
  const userId = parseSessionUserId(token)
  if (!userId) {
    throw new ApiError('Authentication required', 401)
  }
  return userId
}
