import { useEffect, useRef, useState } from 'react'
import type { AiChatMessage, AiHealthResponse } from '@life-os/contracts'
import { ApiError } from '../shared/api/client'
import { Layout } from '../shared/ui/Layout'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { Bot, Send, Sparkles } from 'lucide-react'
import { aiApi } from '../entities/ai/api/ai'

const QUICK_PROMPTS = [
  'How can I be more productive?',
  "I'm feeling overwhelmed today",
  'Help me stay consistent',
  'Review my progress',
]

export default function AICoach() {
  const [messages, setMessages] = useState<AiChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<AiHealthResponse | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    let cancelled = false

    const loadSession = async () => {
      setIsLoadingSession(true)
      setError(null)

      try {
        const [sessionResponse, healthResponse] = await Promise.all([
          aiApi.getPsychologistSession(),
          aiApi.health().catch(() => null),
        ])
        if (cancelled) return

        setMessages(sessionResponse.messages)
        setHealth(healthResponse)
        if (healthResponse && !healthResponse.available) {
          setError(healthResponse.error ?? 'AI is unavailable locally')
        }
      } catch (loadError) {
        if (cancelled) return
        const message = loadError instanceof ApiError
          ? loadError.message
          : 'Failed to load AI coach'
        setError(message)
      } finally {
        if (!cancelled) {
          setIsLoadingSession(false)
        }
      }
    }

    void loadSession()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSendMessage = async (text: string) => {
    const content = text.trim()
    if (!content || isTyping || isLoadingSession) return

    setInput('')
    setError(null)
    setIsTyping(true)

    const optimisticId = `local-${Date.now()}`
    setMessages(prev => [
      ...prev,
      {
        id: optimisticId,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      },
    ])

    try {
      const response = await aiApi.sendPsychologistMessage({ content })
      setMessages(prev => {
        const withoutOptimistic = prev.filter(message => message.id !== optimisticId)
        return [
          ...withoutOptimistic,
          response.userMessage,
          response.assistantMessage,
        ]
      })
      setHealth(prev => prev
        ? { ...prev, ok: true, available: true, error: undefined }
        : prev)
    } catch (sendError) {
      setMessages(prev => prev.filter(message => message.id !== optimisticId))
      const message = sendError instanceof ApiError
        ? sendError.message
        : 'Failed to send message'
      setError(message === 'AI provider unavailable'
        ? 'AI is unavailable locally. Make sure Ollama is running.'
        : message)
    } finally {
      setIsTyping(false)
    }
  }

  const statusLabel = (() => {
    if (isLoadingSession) return 'Loading conversation'
    if (isTyping) return 'Thinking with you'
    if (health && !health.available) return 'AI offline'
    return 'Ready to think with you'
  })()

  const statusDotClass = health && !health.available
    ? 'bg-[#F97316]'
    : 'bg-[#D7FF35]'

  return (
    <Layout extraPb="pb-36">
      <main className="app-page min-h-full bg-[#141414] text-[#F4F4F0]">
        <header className="app-header sticky top-0 z-10 bg-[#141414]/95 px-4 pb-3 pt-4 backdrop-blur sm:px-6">
          <div className="surface-dark mx-auto flex w-full max-w-md items-center gap-3 rounded-[24px] bg-[#1D1D1D] p-3">
            <div className="lime-panel flex size-11 items-center justify-center rounded-[16px] bg-[#D7FF35] text-[#151515]">
              <Bot className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold">AI coach</h1>
              <p className="flex items-center gap-1.5 text-xs text-[#92928D]">
                <span className={`size-1.5 rounded-full ${statusDotClass}`} aria-hidden="true" />
                {statusLabel}
              </p>
            </div>
            <Sparkles className="mr-1 size-4 text-[#D7FF35]" aria-hidden="true" />
          </div>
        </header>

        <section aria-label="Conversation" className="mx-auto w-full max-w-md space-y-4 px-4 pb-5 pt-3 sm:px-6">
          {error && (
            <div
              role="alert"
              className="rounded-[16px] border border-[#F97316]/40 bg-[#F97316]/10 px-4 py-3 text-sm text-[#F4F4F0]"
            >
              {error}
            </div>
          )}

          {isLoadingSession && messages.length === 0 && (
            <p className="text-sm text-[#92928D]">Loading your psychologist session…</p>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-[14px] bg-[#D7FF35] text-[#151515]">
                  <Bot className="size-4" aria-hidden="true" />
                </div>
              )}
              <div className={`max-w-[82%] px-4 py-3 text-sm leading-6 ${
                message.role === 'user'
                  ? 'lime-panel rounded-[20px] rounded-br-md bg-[#D7FF35] font-medium text-[#151515]'
                  : 'surface-paper rounded-[20px] rounded-bl-md bg-[#F4F4F0] text-[#151515]'
              }`}
              >
                {message.content}
                <span className="sr-only">
                  Sent at {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2" role="status" aria-label="AI coach is typing">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[14px] bg-[#D7FF35] text-[#151515]">
                <Bot className="size-4" aria-hidden="true" />
              </div>
              <div className="surface-paper rounded-[20px] rounded-bl-md bg-[#F4F4F0] px-4 py-3.5">
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map(index => (
                    <span
                      key={index}
                      className="size-1.5 animate-bounce rounded-full bg-[#92928D]"
                      style={{ animationDelay: `${index * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </section>

        <div className="fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 bg-[#141414]/95 px-4 pb-3 pt-2 backdrop-blur sm:px-6">
          <div className="mx-auto w-full max-w-md">
            {messages.length <= 1 && !isLoadingSession && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {QUICK_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSendMessage(prompt)}
                    disabled={isTyping}
                    className="pressable shrink-0 whitespace-nowrap rounded-[14px] border border-white/10 bg-[#1D1D1D] px-3 py-2 text-xs font-semibold text-[#92928D] transition hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35] disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            <div className="surface-paper flex items-center gap-2 rounded-[22px] bg-[#F4F4F0] p-2 text-[#151515]">
              <Input
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void handleSendMessage(input)
                  }
                }}
                aria-label="Message your AI coach"
                placeholder="What's on your mind?"
                disabled={isLoadingSession || isTyping}
                className="h-11 border-0 bg-transparent px-3 text-sm text-[#151515] placeholder:text-[#92928D] focus-visible:ring-0"
              />
              <Button
                type="button"
                size="icon"
                aria-label="Send message"
                className="icon-button pressable size-11 shrink-0 rounded-[16px] bg-[#1D1D1D] text-[#D7FF35] hover:bg-[#292929] active:scale-95 focus-visible:ring-[#151515]/30"
                onClick={() => void handleSendMessage(input)}
                disabled={!input.trim() || isTyping || isLoadingSession}
              >
                <Send className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  )
}
