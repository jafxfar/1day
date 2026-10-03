import { createContext } from 'react'

export type ApiConfigContextValue = {
  apiBaseUrl: string
  defaultApiBaseUrl: string
  isCustom: boolean
  saveApiBaseUrl: (input: string) => Promise<void>
  resetApiBaseUrl: () => Promise<void>
}

export const ApiConfigContext = createContext<ApiConfigContextValue | null>(null)
