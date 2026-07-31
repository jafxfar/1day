import { useContext } from 'react'
import { SessionContext, type SessionContextValue } from './sessionContext'

export const useSession = (): SessionContextValue => {
  const session = useContext(SessionContext)

  if (!session) {
    throw new Error('useSession must be used within SessionProvider')
  }

  return session
}
