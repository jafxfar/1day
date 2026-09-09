import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { Habit } from '@life-os/contracts'
import {
  ChevronLeft,
  Frown,
  Meh,
  Moon,
  Smile,
  Sparkles,
} from 'lucide-react-native'
import { useCheckins } from '@/checkins/useCheckins'
import { habitsApi } from '@/habits/api'

type EveningPhase = 'entry' | 'thinking' | 'summary'

const EVENING_TAGS = [
  'productive', 'tired', 'grateful', 'challenged', 'inspired',
  'social', 'learning', 'peaceful', 'stressed', 'happy',
]

const PRAISE_SUMMARIES = [
  'You carried today with real intention. That kind of showing up compounds — rest knowing you earned it.',
  'A strong close. The wins you noticed today are the quiet proof that your effort is landing.',
  'You finished the loop with clarity. Sleep well — tomorrow starts from a solid place.',
]

const SUPPORT_SUMMARIES = [
  'A mixed day still counts. You paused, named it, and closed the loop — that honesty is progress.',
  'Not every day sings. You still showed up and reflected — that steadiness builds something lasting.',
  'You held the middle ground with care. Rest tonight; small course-corrections start tomorrow.',
]

const ENCOURAGE_SUMMARIES = [
  'Hard days deserve gentleness, not judgment. You closed the loop — that alone is courage.',
  'Today was heavy, and you still made space to notice it. Rest. Tomorrow is a clean page.',
  'Showing up on a tough day matters more than a perfect score. Be kind to yourself tonight.',
]

const pickSummary = (rating: number, salt: number): string => {
  const pool =
    rating >= 7 ? PRAISE_SUMMARIES
      : rating >= 4 ? SUPPORT_SUMMARIES
        : ENCOURAGE_SUMMARIES
  return pool[salt % pool.length] ?? pool[0]!
}

const getRatingFeedback = (rating: number) => {
  if (rating >= 8) return { icon: Sparkles, label: 'A strong day', tone: '#D7FF35' }
  if (rating >= 6) return { icon: Smile, label: 'A good day', tone: '#F4F4F0' }
  if (rating >= 4) return { icon: Meh, label: 'A mixed day', tone: '#92928D' }
  if (rating > 0) return { icon: Frown, label: 'A hard day — still worth noting', tone: '#92928D' }
  return { icon: null, label: 'Choose the number that feels honest', tone: '#92928D' }
}

export default function EveningScreen() {
  const router = useRouter()
  const {
    eveningReflection,
    hasCompletedEvening,
    saveEvening,
  } = useCheckins()

  const [habits, setHabits] = useState<Habit[]>([])
  const [rating, setRating] = useState(0)
  const [note, setNote] = useState('')
  const [showDeep, setShowDeep] = useState(false)
  const [success, setSuccess] = useState('')
  const [failure, setFailure] = useState('')
  const [reasons, setReasons] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [phase, setPhase] = useState<EveningPhase>(() =>
    hasCompletedEvening ? 'summary' : 'entry',
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void habitsApi.getAll().then(setHabits).catch(() => setHabits([]))
  }, [])

  useEffect(() => {
    if (hasCompletedEvening && phase === 'entry') {
      setPhase('summary')
    }
  }, [hasCompletedEvening, phase])

  useEffect(() => {
    if (phase !== 'thinking') return
    const timer = setTimeout(() => setPhase('summary'), 750)
    return () => clearTimeout(timer)
  }, [phase])

  const completedHabits = habits.filter(habit => habit.completedToday).length
  const displayRating = rating > 0 ? rating : (eveningReflection?.rating ?? 0)
  const ratingFeedback = getRatingFeedback(rating)
  const FeedbackIcon = ratingFeedback.icon

  const aiSummary = useMemo(
    () => pickSummary(
      displayRating || 5,
      displayRating + selectedTags.length + completedHabits,
    ),
    [completedHabits, displayRating, selectedTags.length],
  )

  const summaryToneLabel =
    displayRating >= 7 ? 'Praise'
      : displayRating >= 4 ? 'Support'
        : 'Encouragement'

  const handleCloseDay = async () => {
    if (rating === 0 || saving) return
    setSaving(true)
    try {
      const wins = success.trim() || note.trim()
      await saveEvening({
        rating,
        wins,
        failures: failure.trim(),
        reasons: reasons.trim(),
        tags: selectedTags,
      })
      setPhase('thinking')
    } finally {
      setSaving(false)
    }
  }

  const handleDone = () => {
    router.replace('/(app)/(tabs)')
  }

  if (phase === 'thinking') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.card, styles.centered]}>
          <ActivityIndicator size="large" color="#D7FF35" />
          <Text style={styles.thinkingEyebrow}>Reading your day</Text>
          <Text style={styles.thinkingTitle}>Closing the loop…</Text>
          <Text style={styles.muted}>A short note for how today went.</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (phase === 'summary') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to dashboard"
              onPress={handleDone}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <ChevronLeft size={20} color="#F4F4F0" />
            </Pressable>
            <Text style={styles.headerLabel}>AI Summary</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
            <View style={styles.heroIcon}>
              <Sparkles size={24} color="#151515" strokeWidth={2.2} />
            </View>
            <Text style={styles.thinkingEyebrow}>Day closed · {summaryToneLabel}</Text>
            <Text style={styles.title}>Your day, in one note</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryBody}>{aiSummary}</Text>
            </View>
            <View style={styles.summaryMeta}>
              <Text style={styles.metaText}>Rating {displayRating}/10</Text>
              <Text style={styles.metaText}>Habits {completedHabits}/{habits.length}</Text>
            </View>
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done"
            onPress={handleDone}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <ChevronLeft size={20} color="#F4F4F0" />
          </Pressable>
          <Text style={styles.headerLabel}>Evening</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroIcon}>
            <Moon size={24} color="#151515" strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>Close your day</Text>
          <Text style={styles.muted}>One rating. Optional note. Done.</Text>

          <View style={styles.panel}>
            <Text style={styles.sectionLabel}>How was today?</Text>
            <View style={styles.ratingRow}>
              {Array.from({ length: 10 }, (_, index) => {
                const value = index + 1
                const active = rating === value
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityLabel={`Rating ${value}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => setRating(value)}
                    style={[styles.ratingChip, active && styles.ratingChipActive]}
                  >
                    <Text style={[styles.ratingText, active && styles.ratingTextActive]}>
                      {value}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            <View style={styles.feedbackRow}>
              {FeedbackIcon ? <FeedbackIcon size={16} color={ratingFeedback.tone} /> : null}
              <Text style={[styles.feedbackText, { color: ratingFeedback.tone }]}>
                {ratingFeedback.label}
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Note (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What stayed with you?"
              placeholderTextColor="#92928D"
              multiline
              style={[styles.input, styles.textarea]}
              accessibilityLabel="Evening note"
            />

            <Pressable onPress={() => setShowDeep(value => !value)}>
              <Text style={styles.detailsToggle}>
                {showDeep ? 'Hide more reflection' : 'More reflection (optional)'}
              </Text>
            </Pressable>

            {showDeep ? (
              <View style={styles.deepBlock}>
                <TextInput
                  value={success}
                  onChangeText={setSuccess}
                  placeholder="Wins"
                  placeholderTextColor="#92928D"
                  multiline
                  style={[styles.input, styles.textarea]}
                />
                <TextInput
                  value={failure}
                  onChangeText={setFailure}
                  placeholder="Room to grow"
                  placeholderTextColor="#92928D"
                  multiline
                  style={[styles.input, styles.textarea]}
                />
                <TextInput
                  value={reasons}
                  onChangeText={setReasons}
                  placeholder="Why it felt that way"
                  placeholderTextColor="#92928D"
                  multiline
                  style={[styles.input, styles.textarea]}
                />
                <View style={styles.tagGrid}>
                  {EVENING_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag)
                    return (
                      <Pressable
                        key={tag}
                        onPress={() => setSelectedTags(previous => (
                          previous.includes(tag)
                            ? previous.filter(item => item !== tag)
                            : [...previous, tag]
                        ))}
                        style={[styles.tagChip, active && styles.tagChipActive]}
                      >
                        <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close my day"
          onPress={() => void handleCloseDay()}
          disabled={rating === 0 || saving}
          style={({ pressed }) => [
            styles.primaryButton,
            (rating === 0 || saving) && styles.buttonDisabled,
            pressed && styles.pressed,
          ]}
        >
          {saving ? <ActivityIndicator color="#151515" /> : null}
          <Text style={styles.primaryButtonText}>
            {saving ? 'Saving…' : 'Close my day'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  card: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: '#1D1D1D',
    borderRadius: 32,
    padding: 20,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  headerSpacer: { width: 44 },
  flex: { flex: 1 },
  scrollContent: { paddingVertical: 24, gap: 12 },
  summaryContent: { paddingVertical: 24, gap: 12 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#D7FF35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#F4F4F0',
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 36,
    letterSpacing: -1.4,
  },
  muted: {
    color: '#92928D',
    fontSize: 14,
    lineHeight: 22,
  },
  thinkingEyebrow: {
    color: '#D7FF35',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  thinkingTitle: {
    color: '#F4F4F0',
    fontSize: 28,
    fontWeight: '900',
  },
  panel: {
    marginTop: 12,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#292929',
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ratingChip: {
    width: '18%',
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingChipActive: {
    backgroundColor: '#1D1D1D',
  },
  ratingText: {
    color: '#92928D',
    fontWeight: '800',
  },
  ratingTextActive: {
    color: '#D7FF35',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderRadius: 16,
    backgroundColor: '#141414',
    color: '#F4F4F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  textarea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  detailsToggle: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  deepBlock: { gap: 10 },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagChipActive: {
    borderColor: '#D7FF35',
    backgroundColor: 'rgba(215,255,53,0.12)',
  },
  tagText: {
    color: '#C1C1BD',
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#F4F4F0',
  },
  summaryCard: {
    borderRadius: 24,
    backgroundColor: '#292929',
    padding: 20,
  },
  summaryBody: {
    color: '#F4F4F0',
    fontSize: 16,
    lineHeight: 26,
  },
  summaryMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    color: '#92928D',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 12,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#D7FF35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#151515',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.985 }] },
})
