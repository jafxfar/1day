import { AppError } from '../../../lib/errors.js'
import type { LlmChatRequest, LlmHealthResult, LlmProvider } from './types.js'

type OllamaChatResponse = {
  message?: {
    content?: string
  }
  error?: string
}

type OllamaTagsResponse = {
  models?: Array<{ name?: string }>
}

export type OllamaProviderOptions = {
  baseUrl: string
  model: string
  timeoutMs?: number
}

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export const createOllamaProvider = (options: OllamaProviderOptions): LlmProvider => {
  const timeoutMs = options.timeoutMs ?? 120_000
  const baseUrl = options.baseUrl.replace(/\/$/, '')

  const chat = async (request: LlmChatRequest) => {
    let response: Response
    try {
      response = await fetchWithTimeout(
        `${baseUrl}/api/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: options.model,
            stream: false,
            messages: [
              { role: 'system', content: request.system },
              ...request.messages,
            ],
          }),
        },
        timeoutMs,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Ollama error'
      throw new AppError(503, 'AI provider unavailable', { provider: 'ollama', cause: message })
    }

    const payload = await response.json().catch(() => null) as OllamaChatResponse | null
    if (!response.ok) {
      throw new AppError(503, 'AI provider request failed', {
        provider: 'ollama',
        status: response.status,
        error: payload?.error ?? response.statusText,
      })
    }

    const content = payload?.message?.content?.trim()
    if (!content) {
      throw new AppError(502, 'AI provider returned an empty response')
    }

    return { content }
  }

  const health = async (): Promise<LlmHealthResult> => {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/tags`, {}, 5_000)
      if (!response.ok) {
        return { available: false, error: `Ollama responded with ${response.status}` }
      }

      const payload = await response.json().catch(() => null) as OllamaTagsResponse | null
      const models = payload?.models ?? []
      if (models.length === 0) {
        return { available: true }
      }

      const hasModel = models.some(model => {
        const name = model.name ?? ''
        return name === options.model
          || name.startsWith(`${options.model}:`)
          || options.model.startsWith(`${name}:`)
          || name.split(':')[0] === options.model.split(':')[0]
      })

      if (!hasModel) {
        return {
          available: false,
          error: `Model ${options.model} not found in Ollama`,
        }
      }

      return { available: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Ollama error'
      return { available: false, error: message }
    }
  }

  return {
    name: 'ollama',
    model: options.model,
    chat,
    health,
  }
}
