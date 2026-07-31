const normalizeApiUrl = (value: string | undefined): string => {
  if (!value?.trim()) {
    return window.location.origin
  }

  const normalizedValue = value.trim().replace(/\/+$/, '')

  let apiUrl: URL

  try {
    apiUrl = new URL(normalizedValue, window.location.origin)
  } catch {
    throw new Error('VITE_API_URL must be a valid URL')
  }

  if (apiUrl.protocol !== 'http:' && apiUrl.protocol !== 'https:') {
    throw new Error('VITE_API_URL must use http or https')
  }

  return apiUrl.toString().replace(/\/+$/, '')
}

export const API_BASE_URL = normalizeApiUrl(import.meta.env.VITE_API_URL)
