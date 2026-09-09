import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'authToken'

const toTokenString = (token: unknown): string => {
  if (typeof token === 'string' && token.length > 0) {
    return token
  }

  throw new Error('Auth token must be a non-empty string')
}

const webStore = {
  get: async () => {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  },
  set: async (token: unknown) => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(TOKEN_KEY, toTokenString(token))
  },
  clear: async () => {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(TOKEN_KEY)
  },
}

const nativeStore = {
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  set: async (token: unknown) => {
    await SecureStore.setItemAsync(TOKEN_KEY, toTokenString(token))
  },
  clear: () => SecureStore.deleteItemAsync(TOKEN_KEY),
}

export const tokenStore = Platform.OS === 'web' ? webStore : nativeStore
