import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const API_URL_KEY = 'apiBaseUrl'

const webStore = {
  get: async () => {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(API_URL_KEY)
  },
  set: async (url: string) => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(API_URL_KEY, url)
  },
  clear: async () => {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(API_URL_KEY)
  },
}

const nativeStore = {
  get: () => SecureStore.getItemAsync(API_URL_KEY),
  set: (url: string) => SecureStore.setItemAsync(API_URL_KEY, url),
  clear: () => SecureStore.deleteItemAsync(API_URL_KEY),
}

export const apiUrlStore = Platform.OS === 'web' ? webStore : nativeStore
