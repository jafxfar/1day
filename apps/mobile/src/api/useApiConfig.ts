import { useContext } from 'react'
import { ApiConfigContext } from './apiConfigContext'

export const useApiConfig = () => {
  const value = useContext(ApiConfigContext)
  if (!value) {
    throw new Error('useApiConfig must be used within ApiConfigProvider')
  }
  return value
}
