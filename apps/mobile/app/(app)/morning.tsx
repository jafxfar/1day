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
import type { Goal } from '@life-os/contracts'
import {
  BatteryCharging,
  ChevronLeft,
  Frown,
  Laugh,
  Meh,
  Moon,
  Smile,
  Sun,
  Target,
  Zap,
} from 'lucide-react-native'
import { useCheckins } from '@/checkins/useCheckins'
import { goalsApi } from '@/goals/api'
import {
  buildFocusSuggestions,
  getGoalNodeLabel,
  pickMainGoal,
} from '@/lib/pickMainGoal'

const SLEEP_OPTIONS = [5, 6, 7, 8, 9] as const
const MOODS = [
  { value: 1, icon: Frown, label: 'Bad' },
  { value: 2, icon: Frown, label: 'Low' },
  { value: 3, icon: Meh, label: 'Okay' },
  { value: 4, icon: Smile, label: 'Good' },
  { value: 5, icon: Laugh, label: 'Great' },
] as const
const ENERGY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

export default function MorningScreen() {
  const router = useRouter()
  const {
    hasCompletedMorning,
    isLoading: isLoadingCheckins,
    saveMorning,
  } = useCheckins()

  const [goals, setGoals] = useState<Goal[]>([])
  const [sleepHours, setSleep] = useState(7)
  const [energy, setEnergy] = useState(7)
  const [mood, setMood] = useState<number | null>(null)
  const [focus, setFocus] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void goalsApi.getAll().then(setGoals).catch(() => setGoals([]))
  }, [])

  useEffect(() => {
    if (!isLoadingCheckins && hasCompletedMorning) {
      router.replace('/(app)/(tabs)')
    }
  }, [hasCompletedMorning, isLoadingCheckins, router])

  const recommendedGoal = useMemo(() => pickMainGoal(goals), [goals])
  const focusSuggestions = useMemo(
    () => buildFocusSuggestions(recommendedGoal),
    [recommendedGoal],
  )

  useEffect(() => {
    if (!focus && focusSuggestions[0]) {
      setFocus(focusSuggestions[0])
    }
  }, [focus, focusSuggestions])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const canStart = mood !== null && focus.trim().length > 0

  const handleStartDay = async () => {
    if (mood === null || saving) return

    setSaving(true)
    try {
      const focusText = focus.trim() || focusSuggestions[0] || 'Make progress today'
      await saveMorning({
        sleepHours,
        energy,
        mood,
        focusText,
      })
      router.replace('/(app)/(tabs)')
    } finally {
      setSaving(false)
    }
  }

  if (isLoadingCheckins || hasCompletedMorning) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#D7FF35" />
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
          <Text style={styles.dateText}>{today}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroIcon}>
            <Sun size={24} color="#151515" strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>How are you today?</Text>
          <Text style={styles.subtitle}>Three taps: mood, focus, start.</Text>

          <View style={styles.panel}>
            <Text style={styles.sectionLabel}>Mood</Text>
            <View style={styles.moodRow}>
              {MOODS.map(({ value, icon: Icon, label }) => {
                const active = mood === value
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityState={{ selected: active }}
                    onPress={() => setMood(value)}
                    style={({ pressed }) => [
                      styles.moodChip,
                      active && styles.moodChipActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Icon size={20} color={active ? '#D7FF35' : '#92928D'} />
                    <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>{label}</Text>
                  </Pressable>
                )
              })}
            </View>

            <View style={styles.focusHeader}>
              <Target size={16} color="#92928D" />
              <Text style={styles.sectionLabelInline}>Today's focus</Text>
            </View>

            {recommendedGoal ? (
              <Text style={styles.goalHint}>
                From your {getGoalNodeLabel(recommendedGoal.nodeType)}: {recommendedGoal.title}
              </Text>
            ) : null}

            <View style={styles.focusList}>
              {focusSuggestions.map((suggestion) => {
                const active = focus === suggestion
                return (
                  <Pressable
                    key={suggestion}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setFocus(suggestion)}
                    style={({ pressed }) => [
                      styles.focusChip,
                      active && styles.focusChipActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.focusChipText, active && styles.focusChipTextActive]}>
                      {suggestion}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            <TextInput
              value={focusSuggestions.includes(focus) ? '' : focus}
              onChangeText={setFocus}
              placeholder="Or type your own…"
              placeholderTextColor="#92928D"
              style={styles.input}
              accessibilityLabel="Custom focus"
            />

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showDetails }}
              onPress={() => setShowDetails(value => !value)}
              style={styles.detailsToggle}
            >
              <Text style={styles.detailsToggleText}>
                {showDetails ? 'Hide sleep & energy' : 'Adjust sleep & energy (optional)'}
              </Text>
            </Pressable>

            {showDetails ? (
              <View style={styles.detailsBlock}>
                <View style={styles.detailsHeader}>
                  <Moon size={14} color="#92928D" />
                  <Text style={styles.sectionLabelInline}>Sleep</Text>
                </View>
                <View style={styles.sleepRow}>
                  {SLEEP_OPTIONS.map((hours) => {
                    const active = sleepHours === hours
                    return (
                      <Pressable
                        key={hours}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => setSleep(hours)}
                        style={({ pressed }) => [
                          styles.sleepChip,
                          active && styles.sleepChipActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.sleepChipText, active && styles.sleepChipTextActive]}>
                          {hours}h
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>

                <View style={[styles.detailsHeader, styles.energyHeader]}>
                  <View style={styles.detailsHeader}>
                    <BatteryCharging size={14} color="#92928D" />
                    <Text style={styles.sectionLabelInline}>Energy</Text>
                  </View>
                  <Text style={styles.energyValue}>{energy}/10</Text>
                </View>
                <View style={styles.energyRow}>
                  {ENERGY_OPTIONS.map((level) => {
                    const active = energy === level
                    return (
                      <Pressable
                        key={level}
                        accessibilityRole="button"
                        accessibilityLabel={`Energy ${level}`}
                        accessibilityState={{ selected: active }}
                        onPress={() => setEnergy(level)}
                        style={({ pressed }) => [
                          styles.energyChip,
                          active && styles.energyChipActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.energyChipText, active && styles.energyChipTextActive]}>
                          {level}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
                <View style={styles.energyHints}>
                  <View style={styles.detailsHeader}>
                    <Frown size={12} color="#92928D" />
                    <Text style={styles.hintText}>Low</Text>
                  </View>
                  <View style={styles.detailsHeader}>
                    <Text style={styles.hintText}>High</Text>
                    <Zap size={12} color="#92928D" />
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start my day"
            onPress={() => void handleStartDay()}
            disabled={!canStart || saving}
            style={({ pressed }) => [
              styles.primaryButton,
              (!canStart || saving) && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
          >
            {saving ? <ActivityIndicator color="#151515" /> : null}
            <Text style={styles.primaryButtonText}>
              {saving ? 'Saving…' : 'Start my day'}
            </Text>
          </Pressable>
          {!mood ? (
            <Text style={styles.footerHint}>Pick a mood to continue</Text>
          ) : null}
        </View>
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
  loadingScreen: {
    flex: 1,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  card: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: '#1D1D1D',
    borderRadius: 32,
    padding: 20,
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
  dateText: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  headerSpacer: { width: 44 },
  scrollContent: { paddingVertical: 24, paddingBottom: 16 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#D7FF35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#F4F4F0',
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 36,
    letterSpacing: -1.6,
  },
  subtitle: {
    marginTop: 12,
    color: '#92928D',
    fontSize: 14,
  },
  panel: {
    marginTop: 24,
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
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  sectionLabelInline: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  moodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  moodChip: {
    flex: 1,
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  moodChipActive: {
    backgroundColor: '#1D1D1D',
  },
  moodLabel: {
    color: '#92928D',
    fontSize: 10,
    fontWeight: '700',
  },
  moodLabelActive: {
    color: '#D7FF35',
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  goalHint: {
    color: '#92928D',
    fontSize: 12,
    lineHeight: 18,
  },
  focusList: { gap: 8 },
  focusChip: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  focusChipActive: {
    backgroundColor: '#1D1D1D',
  },
  focusChipText: {
    color: '#92928D',
    fontSize: 14,
    fontWeight: '600',
  },
  focusChipTextActive: {
    color: '#D7FF35',
  },
  input: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#141414',
    color: '#F4F4F0',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  detailsToggle: { marginTop: 4 },
  detailsToggleText: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  detailsBlock: { marginTop: 8, gap: 12 },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sleepRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sleepChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepChipActive: {
    backgroundColor: '#1D1D1D',
  },
  sleepChipText: {
    color: '#92928D',
    fontSize: 14,
    fontWeight: '900',
  },
  sleepChipTextActive: {
    color: '#D7FF35',
  },
  energyHeader: {
    justifyContent: 'space-between',
  },
  energyValue: {
    color: '#F4F4F0',
    fontSize: 12,
    fontWeight: '700',
  },
  energyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  energyChip: {
    width: '18%',
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyChipActive: {
    borderColor: '#D7FF35',
    backgroundColor: 'rgba(215,255,53,0.12)',
  },
  energyChipText: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '700',
  },
  energyChipTextActive: {
    color: '#F4F4F0',
  },
  energyHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hintText: {
    color: '#92928D',
    fontSize: 10,
    fontWeight: '600',
  },
  footer: { marginTop: 12 },
  primaryButton: {
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
  footerHint: {
    marginTop: 8,
    textAlign: 'center',
    color: '#92928D',
    fontSize: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.985 }] },
})
