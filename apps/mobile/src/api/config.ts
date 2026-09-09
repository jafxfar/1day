import Constants from 'expo-constants'
import { Platform } from 'react-native'

const DEFAULT_API_PORT = '3000'

const stripTrailingSlash = (value: string) => value.replace(/\/$/, '')

const normalizeExplicitUrl = (value: string | undefined) => {
  const trimmed = value?.trim()
  if (!trimmed) {
    return null
  }
  return stripTrailingSlash(trimmed)
}

const hostFromExpoDebugger = (): string | null => {
  const hostUri = (
    Constants.expoConfig?.hostUri
    || Constants.experienceUrl
    || (Constants as { linkingUri?: string }).linkingUri
    || ''
  )

  // Examples: "192.168.1.10:8081", "exp://192.168.1.10:8081", "http://localhost:8081"
  const match = hostUri.match(/(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?/)
  if (match?.[1]) {
    return match[1]
  }

  if (/localhost|127\.0\.0\.1/i.test(hostUri)) {
    return 'localhost'
  }

  return null
}

const resolveApiBaseUrl = (): string => {
  const fromEnv = normalizeExplicitUrl(process.env.EXPO_PUBLIC_API_URL)
  if (fromEnv) {
    return fromEnv
  }

  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined
  const fromExtra = normalizeExplicitUrl(extra?.apiUrl)
  if (fromExtra) {
    return fromExtra
  }

  const expoHost = hostFromExpoDebugger()
  if (expoHost && expoHost !== 'localhost' && expoHost !== '127.0.0.1') {
    return `http://${expoHost}:${DEFAULT_API_PORT}`
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_API_PORT}`
  }

  return `http://localhost:${DEFAULT_API_PORT}`
}

export const API_BASE_URL = resolveApiBaseUrl()

export { apiRoutes } from '@life-os/contracts'
