export type LlmChatRole = 'system' | 'user' | 'assistant'

export type LlmChatMessage = {
  role: LlmChatRole
  content: string
}

export type LlmChatRequest = {
  system: string
  messages: Array<{ role: Exclude<LlmChatRole, 'system'>; content: string }>
}

export type LlmChatResult = {
  content: string
}

export type LlmHealthResult = {
  available: boolean
  error?: string
}

export type LlmProvider = {
  readonly name: string
  readonly model: string
  chat: (request: LlmChatRequest) => Promise<LlmChatResult>
  health: () => Promise<LlmHealthResult>
}
