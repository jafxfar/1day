
import { useState, useRef, useEffect } from 'react'
import { useGetHabits } from '../hooks/backend/habits'
import { Layout } from '../components/Layout'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Send, Bot } from 'lucide-react'

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
  const { trigger: fetchHabits } = useGetHabits()

  const [messages, setMessages] = useState<AIMessage[]>(INITIAL_MESSAGES)
  const [input,    setInput]    = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { void fetchHabits() }, [])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return

    const userMsg: AIMessage = {
      id:        Date.now().toString(),
      role:      'user',
      content:   text.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    await new Promise(r => setTimeout(r, 900 + Math.random() * 600))

    const response = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)] ?? AI_RESPONSES[0]!
    const aiMsg: AIMessage = {
      id:        (Date.now() + 1).toString(),
      role:      'assistant',
      content:   response,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, aiMsg])
    setIsTyping(false)
  }

  return (
    <Layout extraPb="pb-36">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">AI Coach</p>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 inline-block" />
              Online · Always here for you
            </p>
          </div>
        </div>
      </div>

      {/* ── Context pill ── */}
      {/* <div className="px-4 pt-3">
        <div className="flex flex-wrap gap-3 bg-card border border-border rounded-xl px-3 py-2 text-xs text-muted-foreground">
          <span>👤 {userName}</span>
          <span>✅ {completedHabits}/{habits.length} habits</span>
          {morningCheckin && <span>⚡ Energy {morningCheckin.energy}/10</span>}
          {morningCheckin && <span>🎯 {morningCheckin.focusText}</span>}
        </div>
      </div> */}

      {/* ── Messages ── */}
      <div className="px-4 py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'bg-card border border-border text-foreground rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2 items-center">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Fixed input bar ── */}
      <div className="fixed bottom-[68px] left-0 right-0 z-30 flex justify-center px-4">
        <div className="w-full max-w-md">
          {messages.length <= 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {QUICK_PROMPTS.map(prompt => (
                <button key={prompt} onClick={() => void sendMessage(prompt)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all whitespace-nowrap">
                  {prompt}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 bg-card border border-border rounded-2xl p-2 shadow-retool-md">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(input) } }}
              placeholder="Ask your AI coach..."
              className="border-0 bg-transparent focus-visible:ring-0 text-sm px-2"
            />
            <Button size="sm" className="rounded-xl shrink-0 px-3"
              onClick={() => void sendMessage(input)} disabled={!input.trim() || isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
