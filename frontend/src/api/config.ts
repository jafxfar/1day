const normalizeApiUrl = (value: string): string => {
  const normalizedValue = value.trim().replace(/\/+$/, '')

  if (!normalizedValue) {
    throw new Error('VITE_API_URL is required')
  }

  let apiUrl: URL

  try {
    apiUrl = new URL(normalizedValue)
  } catch {
    throw new Error('VITE_API_URL must be an absolute URL')
  }

  if (apiUrl.protocol !== 'http:' && apiUrl.protocol !== 'https:') {
    throw new Error('VITE_API_URL must use http or https')
  }

  return normalizedValue
}

export const API_BASE_URL = normalizeApiUrl(import.meta.env.VITE_API_URL)
