
import { useState, useRef, useEffect } from 'react'
import { Layout } from '../shared/ui/Layout'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { Bot, Send, Sparkles } from 'lucide-react'

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const AI_RESPONSES = [
  "That's a great insight! Reflecting on your day helps you grow. What's one thing you'll do differently tomorrow?",
  "I hear you. Remember, progress isn't always linear. What small step can you take right now?",
  "You're building incredible momentum! Your consistency is your superpower. Keep going!",
  "It sounds like you need some rest. Self-care is not laziness — it's essential maintenance. Be kind to yourself.",
  "That's a powerful goal! Let's break it down. What's the very first step you can take this week?",
  "Your habit streak is building something powerful. Every day you show up compounds over time.",
  "Challenges are just opportunities in disguise. What did this experience teach you about yourself?",
  "Your mental wellbeing matters more than productivity. Focus on one thing that brings you joy today.",
  "I love the self-awareness! Knowing your triggers is the first step to growth. What's your plan?",
  "You've already done the hardest part — you showed up. Now let's make the most of today's energy.",
]

const QUICK_PROMPTS = [
  "How can I be more productive?",
  "I'm feeling overwhelmed today",
  "Help me stay consistent",
  "Review my progress",
]

const INITIAL_MESSAGES: AIMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hey! I'm your AI Coach 🧠 I'm here to help you stay focused, reflect, and grow. How are you feeling today?",
    timestamp: new Date().toISOString(),
  },
]

export default function AICoach() {
  const [messages, setMessages] = useState<AIMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const nextMessageId = useRef(2)
  const nextResponseIndex = useRef(0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return

    const userMsg: AIMessage = {
      id: String(nextMessageId.current++),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    await new Promise(r => setTimeout(r, 1000))

    const response = AI_RESPONSES[nextResponseIndex.current++ % AI_RESPONSES.length] ?? AI_RESPONSES[0]!
    const aiMsg: AIMessage = {
      id: String(nextMessageId.current++),
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, aiMsg])
    setIsTyping(false)
  }

  return (
    <Layout extraPb="pb-36">
      <main className="app-page min-h-full bg-[#141414] text-[#F4F4F0]">
        <header className="app-header sticky top-0 z-10 bg-[#141414]/95 px-4 pb-3 pt-4 backdrop-blur sm:px-6">
          <div className="surface-dark mx-auto flex w-full max-w-md items-center gap-3 rounded-[24px] bg-[#1D1D1D] p-3">
            <div className="lime-panel flex size-11 items-center justify-center rounded-[16px] bg-[#D7FF35] text-[#151515]">
              <Bot className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold">AI coach</h1>
              <p className="flex items-center gap-1.5 text-xs text-[#92928D]">
                <span className="size-1.5 rounded-full bg-[#D7FF35]" />
                Ready to think with you
              </p>
            </div>
            <Sparkles className="mr-1 size-4 text-[#D7FF35]" />
          </div>
        </header>

        <section aria-label="Conversation" className="mx-auto w-full max-w-md space-y-4 px-4 pb-5 pt-3 sm:px-6">
          {messages.map(message => (
            <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-[14px] bg-[#D7FF35] text-[#151515]">
                  <Bot className="size-4" />
                </div>
              )}
              <div className={`max-w-[82%] px-4 py-3 text-sm leading-6 ${
                message.role === 'user'
                  ? 'lime-panel rounded-[20px] rounded-br-md bg-[#D7FF35] font-medium text-[#151515]'
                  : 'surface-paper rounded-[20px] rounded-bl-md bg-[#F4F4F0] text-[#151515]'
              }`}>
                {message.content}
                <span className="sr-only">
                  Sent at {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2" role="status" aria-label="AI coach is typing">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[14px] bg-[#D7FF35] text-[#151515]">
                <Bot className="size-4" />
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
            {messages.length <= 1 && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {QUICK_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSendMessage(prompt)}
                    className="pressable shrink-0 whitespace-nowrap rounded-[14px] border border-white/10 bg-[#1D1D1D] px-3 py-2 text-xs font-semibold text-[#92928D] transition hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35]"
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
                placeholder="What’s on your mind?"
                className="h-11 border-0 bg-transparent px-3 text-sm text-[#151515] placeholder:text-[#92928D] focus-visible:ring-0"
              />
              <Button
                type="button"
                size="icon"
                aria-label="Send message"
                className="icon-button pressable size-11 shrink-0 rounded-[16px] bg-[#1D1D1D] text-[#D7FF35] hover:bg-[#292929] active:scale-95 focus-visible:ring-[#151515]/30"
                onClick={() => void handleSendMessage(input)}
                disabled={!input.trim() || isTyping}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  )
}
