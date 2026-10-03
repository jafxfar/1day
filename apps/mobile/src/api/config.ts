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

export const getDefaultApiBaseUrl = (): string => {
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

const HEALTH_TIMEOUT_MS = 5_000

let overrideUrl: string | null = null

export const getApiBaseUrl = (): string => overrideUrl ?? getDefaultApiBaseUrl()

export const setApiBaseUrlOverride = (url: string | null) => {
  overrideUrl = url
}

export const normalizeApiBaseUrl = (input: string): string => {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('Enter the server address')
  }

  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`

  // React Native's URL does not implement protocol/host/pathname getters, so parse manually
  const match = withScheme.match(/^([a-z][a-z\d+.-]*):\/\/([^/?#\s]+)([^?#\s]*)$/i)
  if (!match) {
    throw new Error('Invalid server address')
  }

  const [, scheme, host, rawPath] = match
  const protocol = scheme.toLowerCase()
  if (protocol !== 'http' && protocol !== 'https') {
    throw new Error('Server address must start with http:// or https://')
  }

  if (!/^(\[[\da-f:.]+\]|[a-z\d.-]+)(:\d{1,5})?$/i.test(host)) {
    throw new Error('Invalid server address')
  }

  const path = rawPath.replace(/\/+$/, '').replace(/\/api$/i, '')
  return `${protocol}://${host.toLowerCase()}${path}`
}

export const checkApiHealth = async (baseUrl: string): Promise<void> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${baseUrl}/api/health`, { signal: controller.signal })
  } catch {
    throw new Error(`Server is not reachable: ${baseUrl}`)
  } finally {
    clearTimeout(timer)
  }

  const payload = await response.json().catch(() => null) as { ok?: unknown } | null
  if (!response.ok || payload?.ok !== true) {
    throw new Error(`This address does not look like a Life OS server: ${baseUrl}`)
  }
}

export { apiRoutes } from '@life-os/contracts'
