import { API_BASE_URL } from './config'

type QueryValue = string | number | boolean | null | undefined

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  query?: Record<string, QueryValue>
}

type ErrorPayload = {
  error?: string
  message?: string
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const buildUrl = (path: string, query?: Record<string, QueryValue>): string => {
  const url = new URL(path, `${API_BASE_URL}/`)

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  })

  return url.toString()
}

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    const text = await response.text()
    return (text || undefined) as T
  }

  return response.json() as Promise<T>
}

export const request = async <T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const { body, headers, query, ...requestOptions } = options
  const hasBody = body !== undefined
  const response = await fetch(buildUrl(path, query), {
    ...requestOptions,
    credentials: 'include',
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorPayload = await parseResponse<ErrorPayload | string>(response).catch(() => null)
    const message = typeof errorPayload === 'string'
      ? errorPayload
      : errorPayload?.error ?? errorPayload?.message ?? response.statusText

    throw new ApiError(message || 'API request failed', response.status)
  }

  return parseResponse<T>(response)
}
