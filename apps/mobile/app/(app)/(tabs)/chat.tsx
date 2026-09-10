import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { AiChatMessage, AiHealthResponse } from '@life-os/contracts'
import { Bot, Send, Sparkles } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ApiError } from '@/api/client'
import { aiApi } from '@/ai/api'

const QUICK_PROMPTS = [
  'How can I be more productive?',
  "I'm feeling overwhelmed today",
  'Help me stay consistent',
  'Review my progress',
]

export default function ChatScreen() {
  const insets = useSafeAreaInsets()
  const listRef = useRef<FlatList<AiChatMessage>>(null)
  const [messages, setMessages] = useState<AiChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<AiHealthResponse | null>(null)

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
        setError(loadError instanceof ApiError ? loadError.message : 'Failed to load AI coach')
      } finally {
        if (!cancelled) setIsLoadingSession(false)
      }
    }

    void loadSession()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (messages.length === 0) return
    listRef.current?.scrollToEnd({ animated: true })
  }, [messages, isTyping])

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
        return [...withoutOptimistic, response.userMessage, response.assistantMessage]
      })
      setHealth(prev => (prev ? { ...prev, ok: true, available: true, error: undefined } : prev))
    } catch (sendError) {
      setMessages(prev => prev.filter(message => message.id !== optimisticId))
      const message = sendError instanceof ApiError ? sendError.message : 'Failed to send message'
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Bot size={20} color="#151515" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.headerTitle}>AI coach</Text>
            <View style={styles.statusRow}>
              <View style={[
                styles.statusDot,
                health && !health.available ? styles.statusDotOffline : styles.statusDotOnline,
              ]}
              />
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>
          <Sparkles size={16} color="#D7FF35" />
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 160 + insets.bottom }]}
        ListHeaderComponent={(
          <>
            {error ? (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            {isLoadingSession && messages.length === 0 ? (
              <Text style={styles.muted}>Loading your psychologist session…</Text>
            ) : null}
          </>
        )}
        renderItem={({ item }) => (
          <View style={[
            styles.messageRow,
            item.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant,
          ]}
          >
            {item.role === 'assistant' ? (
              <View style={styles.assistantAvatar}>
                <Bot size={16} color="#151515" />
              </View>
            ) : null}
            <View style={[
              styles.bubble,
              item.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
            >
              <Text style={item.role === 'user' ? styles.userBubbleText : styles.assistantBubbleText}>
                {item.content}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={isTyping ? (
          <View style={styles.messageRowAssistant}>
            <View style={styles.assistantAvatar}>
              <Bot size={16} color="#151515" />
            </View>
            <View style={[styles.bubble, styles.assistantBubble]}>
              <ActivityIndicator color="#92928D" />
            </View>
          </View>
        ) : null}
      />

      <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, 12) + 84 }]}>
        {messages.length <= 1 && !isLoadingSession ? (
          <View style={styles.promptsRow}>
            {QUICK_PROMPTS.map(prompt => (
              <Pressable
                key={prompt}
                onPress={() => void handleSendMessage(prompt)}
                disabled={isTyping}
                style={({ pressed }) => [styles.promptChip, pressed && styles.pressed]}
              >
                <Text style={styles.promptText}>{prompt}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#92928D"
            editable={!isLoadingSession && !isTyping}
            style={styles.input}
            accessibilityLabel="Message your AI coach"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={() => void handleSendMessage(input)}
            disabled={!input.trim() || isTyping || isLoadingSession}
            style={({ pressed }) => [
              styles.sendButton,
              (!input.trim() || isTyping || isLoadingSession) && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Send size={16} color="#D7FF35" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#141414' },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerCard: {
    borderRadius: 24,
    backgroundColor: '#1D1D1D',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#D7FF35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '700',
  },
  statusRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  statusDotOnline: { backgroundColor: '#D7FF35' },
  statusDotOffline: { backgroundColor: '#F97316' },
  statusText: {
    color: '#92928D',
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.4)',
    backgroundColor: 'rgba(249,115,22,0.1)',
    padding: 12,
    marginBottom: 8,
  },
  errorText: { color: '#F4F4F0', fontSize: 14 },
  muted: { color: '#92928D', fontSize: 14, marginBottom: 8 },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAssistant: { justifyContent: 'flex-start' },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 14,
    backgroundColor: '#D7FF35',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: '#D7FF35',
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: '#F4F4F0',
    borderBottomLeftRadius: 6,
  },
  userBubbleText: {
    color: '#151515',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  assistantBubbleText: {
    color: '#151515',
    fontSize: 14,
    lineHeight: 22,
  },
  composerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,20,20,0.96)',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  promptsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  promptChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#1D1D1D',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  promptText: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '600',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 22,
    backgroundColor: '#F4F4F0',
    padding: 8,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    color: '#151515',
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#1D1D1D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.45 },
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.985 }] },
})
