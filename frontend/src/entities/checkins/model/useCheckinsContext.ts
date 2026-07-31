import { useContext } from 'react'
import {
  CheckinsContext,
  type CheckinsContextValue,
} from './checkinsContext'

export const useCheckins = (): CheckinsContextValue => {
  const checkins = useContext(CheckinsContext)

  if (!checkins) {
    throw new Error('useCheckins must be used within CheckinsProvider')
  }

  return checkins
}
