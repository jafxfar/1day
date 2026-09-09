import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { Goal, Habit, JournalEntry } from '@life-os/contracts'
import {
  Bot,
  Flame,
  Frown,
  Laugh,
  Meh,
  Moon,
  Smile,
  Sun,
  Target,
  Zap,
} from 'lucide-react-native'
import { useSession } from '@/auth/useSession'
import { useCheckins } from '@/checkins/useCheckins'
import { goalsApi } from '@/goals/api'
import { habitsApi } from '@/habits/api'
import { journalApi } from '@/journal/api'
import { getHabitIconComponent, stripHtml } from '@/lib/uiHelpers'

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const MoodIcon = ({ mood }: { mood: number }) => {
  if (mood <= 2) return <Frown size={20} color="#F97316" />
  if (mood === 3) return <Meh size={20} color="#F59E0B" />
  if (mood === 4) return <Smile size={20} color="#4ADE80" />
  return <Laugh size={20} color="#22C55E" />
}

export default function DashboardScreen() {
  const router = useRouter()
  const { user } = useSession()
  const { morningCheckin, hasCompletedMorning, isLoading: isLoadingCheckins } = useCheckins()
  const userInitial = (user?.firstName?.[0] ?? '?').toUpperCase()

  const [goals, setGoals] = useState<Goal[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [nextGoals, nextHabits, nextEntries] = await Promise.all([
        goalsApi.getAll(),
        habitsApi.getAll(),
        journalApi.getAll(),
      ])
      setGoals(nextGoals)
      setHabits(nextHabits)
      setEntries(nextEntries)
    } catch {
      // Keep previous data on refresh failures
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoadingCheckins && !hasCompletedMorning) {
      router.replace('/(app)/morning')
    }
  }, [hasCompletedMorning, isLoadingCheckins, router])

  useEffect(() => {
    if (hasCompletedMorning) {
      void loadData()
    }
  }, [hasCompletedMorning, loadData])

  const completedHabits = habits.filter(habit => habit.completedToday).length
  const avgGoalProgress = goals.length
    ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
    : 0
  const latestEntry = entries[0] ?? null
  const nextHabit = habits.find(habit => !habit.completedToday) ?? null
  const userName = user?.firstName ?? 'Friend'

  const handleToggle = async (id: string) => {
    const previousHabits = habits
    setHabits(previousHabits.map(habit => (
      habit.id !== id
        ? habit
        : {
            ...habit,
            completedToday: !habit.completedToday,
            currentStreak: !habit.completedToday
              ? habit.currentStreak + 1
              : Math.max(0, habit.currentStreak - 1),
          }
    )))

    try {
      const result = await habitsApi.toggle(id)
      setHabits(current => current.map(habit => (
        habit.id !== id
          ? habit
          : {
              ...habit,
              completedToday: result.completedToday,
              currentStreak: result.currentStreak,
              longestStreak: result.longestStreak,
            }
      )))
    } catch {
      setHabits(previousHabits)
    }
  }

  if (isLoadingCheckins || !hasCompletedMorning) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#D7FF35" />
        <Text style={styles.loadingText}>Preparing your day…</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.title}>
              {getGreeting()}, {userName}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => router.push('/(app)/profile')}
            style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
          >
            <Text style={styles.avatarText}>{userInitial}</Text>
          </Pressable>
        </View>

        {morningCheckin ? (
          <View style={styles.section}>
            <View style={styles.glanceRow}>
              {[
                { icon: Moon, label: 'Sleep', value: `${morningCheckin.sleepHours}h` },
                { icon: Zap, label: 'Energy', value: `${morningCheckin.energy}/10` },
                { icon: Sun, label: 'Mood', valueNode: <MoodIcon mood={morningCheckin.mood} /> },
              ].map(({ icon: Icon, label, value, valueNode }) => (
                <View key={label} style={styles.glanceCard}>
                  <Icon size={16} color="#92928D" />
                  <View style={styles.glanceValue}>
                    {valueNode ?? <Text style={styles.glanceValueText}>{value}</Text>}
                  </View>
                  <Text style={styles.glanceLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.focusPanel}>
              <View style={styles.focusLabelRow}>
                <Text style={styles.focusLabel}>Today's focus</Text>
                <Target size={14} color="#D7FF35" />
              </View>
              <Text style={styles.focusText}>{morningCheckin.focusText}</Text>
            </View>

            {nextHabit ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Mark complete: ${nextHabit.title}`}
                onPress={() => void handleToggle(nextHabit.id)}
                style={({ pressed }) => [styles.doNext, pressed && styles.pressed]}
              >
                <View style={styles.doNextIcon}>
                  {(() => {
                    const Icon = getHabitIconComponent(nextHabit.icon)
                    return <Icon size={16} color="#151515" />
                  })()}
                </View>
                <View style={styles.flex}>
                  <Text style={styles.doNextEyebrow}>Do next</Text>
                  <Text style={styles.doNextTitle} numberOfLines={1}>{nextHabit.title}</Text>
                </View>
                <Text style={styles.doNextHint}>Tap to done</Text>
              </Pressable>
            ) : habits.length > 0 ? (
              <View style={styles.doNext}>
                <Text style={styles.doNextEyebrow}>Do next</Text>
                <Text style={styles.doNextTitle}>All habits done for today</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {habits.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's habits</Text>
              <Pressable onPress={() => router.push('/(app)/(tabs)/habits')}>
                <Text style={styles.sectionLink}>See all →</Text>
              </Pressable>
            </View>
            <Text style={styles.muted}>
              {completedHabits}/{habits.length} done
              {loadingData ? ' · refreshing' : ''}
            </Text>
            <View style={styles.list}>
              {habits.slice(0, 4).map((habit) => {
                const Icon = getHabitIconComponent(habit.icon)
                return (
                  <View key={habit.id} style={styles.habitRow}>
                    <View style={styles.habitIcon}>
                      <Icon size={16} color="#D7FF35" />
                    </View>
                    <Text
                      style={[
                        styles.habitTitle,
                        habit.completedToday && styles.habitTitleDone,
                      ]}
                      numberOfLines={1}
                    >
                      {habit.title}
                    </Text>
                    <View style={styles.streakRow}>
                      <Flame size={12} color="#FB923C" />
                      <Text style={styles.streakText}>{habit.currentStreak}</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${habit.completedToday ? 'Mark incomplete' : 'Mark complete'}: ${habit.title}`}
                      onPress={() => void handleToggle(habit.id)}
                      style={[
                        styles.toggle,
                        habit.completedToday && styles.toggleDone,
                      ]}
                    >
                      {habit.completedToday ? (
                        <Text style={styles.toggleMark}>✓</Text>
                      ) : null}
                    </Pressable>
                  </View>
                )
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/habits')}
            style={({ pressed }) => [styles.habitsStat, pressed && styles.pressed]}
          >
            <Text style={styles.statLabelDark}>Habits today</Text>
            <Text style={styles.statValueDark}>
              {completedHabits}
              <Text style={styles.statSuffixDark}>/{habits.length}</Text>
            </Text>
            <View style={styles.progressTrackDark}>
              <View
                style={[
                  styles.progressFillDark,
                  {
                    width: `${habits.length ? (completedHabits / habits.length) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(app)/(tabs)/goals')}
            style={({ pressed }) => [styles.goalsStat, pressed && styles.pressed]}
          >
            <Text style={styles.muted}>Goals average</Text>
            <Text style={styles.statValue}>
              {avgGoalProgress}
              <Text style={styles.statSuffix}>%</Text>
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${avgGoalProgress}%` }]} />
            </View>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open AI coach"
          onPress={() => router.push('/(app)/(tabs)/chat')}
          style={({ pressed }) => [styles.aiCard, pressed && styles.pressed]}
        >
          <View style={styles.aiIcon}>
            <Bot size={20} color="#D7FF35" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.aiEyebrow}>AI coach</Text>
            <Text style={styles.aiBody}>
              Stay with &quot;{morningCheckin?.focusText ?? 'your focus'}&quot; — small steps compound.
            </Text>
          </View>
        </Pressable>

        {goals.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active goals</Text>
              <Pressable onPress={() => router.push('/(app)/(tabs)/goals')}>
                <Text style={styles.sectionLink}>See all →</Text>
              </Pressable>
            </View>
            <View style={styles.list}>
              {goals.slice(0, 2).map((goal) => (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                    <Text style={styles.goalBadge}>{goal.progress}%</Text>
                  </View>
                  <View style={styles.progressTrackDark}>
                    <View style={[styles.progressFillLime, { width: `${goal.progress}%` }]} />
                  </View>
                  {goal.deadline ? (
                    <Text style={styles.goalDeadline}>Due {goal.deadline}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {latestEntry ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest entry</Text>
              <Pressable onPress={() => router.push('/(app)/(tabs)/journal')}>
                <Text style={styles.sectionLink}>Journal →</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => router.push('/(app)/(tabs)/journal')}
              style={({ pressed }) => [styles.journalCard, pressed && styles.pressed]}
            >
              <Text style={styles.muted}>
                {latestEntry.entryDate} · Mood {latestEntry.mood}/10
              </Text>
              <Text style={styles.journalTitle}>{latestEntry.title}</Text>
              <Text style={styles.journalBody} numberOfLines={2}>
                {stripHtml(latestEntry.content)}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close your day"
          onPress={() => router.push('/(app)/evening')}
          style={({ pressed }) => [styles.eveningCard, pressed && styles.pressed]}
        >
          <Moon size={20} color="#151515" />
          <Text style={styles.eveningTitle}>Evening</Text>
          <Text style={styles.eveningBody}>Close your day</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#141414',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#92928D',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 120,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerCopy: { flex: 1 },
  dateText: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    marginTop: 4,
    color: '#F4F4F0',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 32,
    letterSpacing: -1,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#1D1D1D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#D7FF35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#151515',
    fontSize: 18,
    fontWeight: '900',
  },
  aiCard: {
    borderRadius: 28,
    backgroundColor: '#1D1D1D',
    padding: 20,
    flexDirection: 'row',
    gap: 12,
  },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(215,255,53,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiEyebrow: {
    color: '#92928D',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  aiBody: {
    color: '#F4F4F0',
    fontSize: 14,
    lineHeight: 22,
  },
  section: { gap: 12 },
  glanceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  glanceCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#1D1D1D',
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  glanceValue: {
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glanceValueText: {
    color: '#F4F4F0',
    fontSize: 20,
    fontWeight: '800',
  },
  glanceLabel: {
    color: '#92928D',
    fontSize: 10,
  },
  focusPanel: {
    borderRadius: 24,
    backgroundColor: '#F4F4F0',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  focusLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  focusLabel: {
    color: '#92928D',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  focusText: {
    color: '#151515',
    fontSize: 16,
    fontWeight: '600',
  },
  doNext: {
    borderRadius: 24,
    backgroundColor: '#D7FF35',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doNextIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(21,21,21,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doNextEyebrow: {
    color: 'rgba(21,21,21,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  doNextTitle: {
    color: '#151515',
    fontSize: 14,
    fontWeight: '800',
  },
  doNextHint: {
    color: 'rgba(21,21,21,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#F4F4F0',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionLink: {
    color: '#92928D',
    fontSize: 12,
  },
  muted: {
    color: '#92928D',
    fontSize: 12,
  },
  list: { gap: 8 },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    backgroundColor: '#F4F4F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  habitIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(215,255,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitle: {
    flex: 1,
    color: '#151515',
    fontSize: 14,
    fontWeight: '600',
  },
  habitTitleDone: {
    textDecorationLine: 'line-through',
    color: 'rgba(21,21,21,0.45)',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakText: {
    color: '#92928D',
    fontSize: 12,
  },
  toggle: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(21,21,21,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleDone: {
    borderColor: '#D7FF35',
    backgroundColor: '#D7FF35',
  },
  toggleMark: {
    color: '#151515',
    fontSize: 12,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  habitsStat: {
    flex: 1.15,
    minHeight: 112,
    borderRadius: 28,
    backgroundColor: '#D7FF35',
    padding: 20,
    justifyContent: 'space-between',
  },
  goalsStat: {
    flex: 0.85,
    alignSelf: 'flex-end',
    borderRadius: 24,
    backgroundColor: '#1D1D1D',
    padding: 20,
  },
  statLabelDark: {
    color: '#151515',
    fontSize: 12,
    fontWeight: '600',
  },
  statValueDark: {
    color: '#151515',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  statSuffixDark: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(21,21,21,0.55)',
  },
  statValue: {
    marginTop: 12,
    color: '#F4F4F0',
    fontSize: 32,
    fontWeight: '800',
  },
  statSuffix: {
    fontSize: 16,
    fontWeight: '400',
    color: '#92928D',
  },
  progressTrackDark: {
    marginTop: 8,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(21,21,21,0.15)',
    overflow: 'hidden',
  },
  progressFillDark: {
    height: '100%',
    backgroundColor: '#151515',
  },
  progressTrack: {
    marginTop: 8,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D7FF35',
  },
  progressFillLime: {
    height: '100%',
    backgroundColor: '#D7FF35',
  },
  goalCard: {
    borderRadius: 20,
    backgroundColor: '#F4F4F0',
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  goalTitle: {
    flex: 1,
    color: '#151515',
    fontSize: 14,
    fontWeight: '600',
  },
  goalBadge: {
    color: '#151515',
    fontSize: 12,
    fontWeight: '700',
  },
  goalDeadline: {
    marginTop: 8,
    color: 'rgba(21,21,21,0.55)',
    fontSize: 12,
  },
  journalCard: {
    borderRadius: 24,
    backgroundColor: '#1D1D1D',
    padding: 20,
    gap: 6,
  },
  journalTitle: {
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '600',
  },
  journalBody: {
    color: '#92928D',
    fontSize: 12,
    lineHeight: 18,
  },
  eveningCard: {
    borderRadius: 28,
    backgroundColor: '#F4F4F0',
    padding: 20,
    gap: 8,
  },
  eveningTitle: {
    color: '#151515',
    fontSize: 14,
    fontWeight: '700',
  },
  eveningBody: {
    color: 'rgba(21,21,21,0.55)',
    fontSize: 12,
  },
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.985 }] },
})
