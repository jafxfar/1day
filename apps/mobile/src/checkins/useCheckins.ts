import { useContext } from 'react'
import { CheckinsContext } from './checkinsContext'

export const useCheckins = () => {
  const context = useContext(CheckinsContext)

  if (!context) {
    throw new Error('useCheckins must be used within CheckinsProvider')
  }

  return context
}
