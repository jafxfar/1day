const XSRF_HEADER_NAME = 'x-rr-xsrf-token'

export type PublishedMetricPayload =
  | {
      type: 'increment'
      metric: string
      tags?: Record<string, string>
    }
  | {
      type: 'distribution'
      metric: string
      value: number
      tags?: Record<string, string>
    }

interface OAuthResourcePayload {
  resourceName: string
  redirectUri: string
}

interface OAuthResourceResponse {
  oauthAuthorizeUrl: string
  authorizationToken: string
  resourceId: string
  environment: string
  redirectUri: string
}

const getXsrfToken = (): string => {
  const cookies = Object.fromEntries(
    document.cookie.split('; ').map((cookie) => {
      const separatorIndex = cookie.indexOf('=')
      return [
        cookie.slice(0, separatorIndex),
        cookie.slice(separatorIndex + 1),
      ]
    }),
  )

  return cookies['__Host-rr-xsrf'] ?? cookies['rr-xsrf'] ?? ''
}

const runtimeRequest = async <T>(
  path: string,
  body: unknown,
  options: Pick<RequestInit, 'keepalive'> = {},
): Promise<T> => {
  const response = await fetch(path, {
    ...options,
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      [XSRF_HEADER_NAME]: getXsrfToken(),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Retool runtime request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const responseText = await response.text()
  if (!responseText) {
    return undefined as T
  }

  return JSON.parse(responseText) as T
}

export const retoolRuntimeApi = {
  requestOAuthResource: (payload: OAuthResourcePayload) =>
    runtimeRequest<OAuthResourceResponse>('/_/api/oauth/resource', payload),
  publishMetrics: (payloads: PublishedMetricPayload[]) =>
    runtimeRequest<unknown>('/_/api/metrics', { payloads }, { keepalive: true }),
}
