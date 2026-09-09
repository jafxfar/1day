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
  Bell,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock,
  Flame,
  Lock,
  LogOut,
  Moon,
  ScrollText,
  Settings,
  Target,
  TrendingUp,
} from 'lucide-react-native'
import { useSession } from '@/auth/useSession'
import { useCheckins } from '@/checkins/useCheckins'
import { goalsApi } from '@/goals/api'
import { habitsApi } from '@/habits/api'
import { journalApi } from '@/journal/api'

export default function ProfileScreen() {
  const router = useRouter()
  const { user, logout } = useSession()
  const { morningCheckin, hasCompletedMorning } = useCheckins()
  const [goals, setGoals] = useState<Goal[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [nextGoals, nextHabits, nextEntries] = await Promise.all([
        goalsApi.getAll(),
        habitsApi.getAll(),
        journalApi.getAll(),
      ])
      setGoals(nextGoals)
      setHabits(nextHabits)
      setEntries(nextEntries)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const userName = user?.firstName ?? 'Friend'
  const userInitial = (user?.firstName?.[0] ?? '?').toUpperCase()
  const completedToday = habits.filter(habit => habit.completedToday).length
  const avgGoalProg = goals.length
    ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length)
    : 0
  const bestStreak = habits.reduce((max, habit) => Math.max(max, habit.currentStreak), 0)
  const allTags = [...new Set(entries.flatMap(entry => entry.tags))]

  const topStats = [
    { icon: Target, label: 'Goals', value: goals.length },
    { icon: CheckSquare, label: 'Habits', value: habits.length },
    { icon: BookOpen, label: 'Journal', value: entries.length },
    { icon: Flame, label: 'Streak', value: bestStreak },
  ]

  const menuItems = [
    { icon: Bot, label: 'AI Coach', onPress: () => router.push('/(app)/(tabs)/chat') },
    { icon: Calendar, label: 'Calendar', onPress: () => router.push('/(app)/calendar') },
    { icon: ScrollText, label: 'Life story', onPress: () => router.push('/(app)/biography') },
    { icon: BookOpen, label: 'Journal', onPress: () => router.push('/(app)/(tabs)/journal') },
    { icon: Bell, label: 'Notifications', onPress: () => {} },
    { icon: Moon, label: 'Appearance', onPress: () => {} },
    { icon: Lock, label: 'Privacy', onPress: () => {} },
    { icon: Settings, label: 'Settings', onPress: () => {} },
    {
      icon: LogOut,
      label: 'Log Out',
      danger: true,
      onPress: async () => {
        await logout()
        router.replace('/(public)/introduction')
      },
    },
  ]

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text style={styles.eyebrow}>Your system</Text>
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.name} numberOfLines={1}>{userName}</Text>
              <Text style={styles.email} numberOfLines={1}>{user?.email ?? ''}</Text>
            </View>
          </View>
          {bestStreak >= 5 ? (
            <View style={styles.streakRow}>
              <Flame size={16} color="#D7FF35" />
              <Text style={styles.muted}>{bestStreak} day best streak</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.paperCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.paperEyebrow}>At a glance</Text>
              <Text style={styles.paperTitle}>Your momentum</Text>
            </View>
            <TrendingUp size={20} color="#92928D" />
          </View>
          {loading ? (
            <ActivityIndicator color="#151515" />
          ) : (
            <View style={styles.statsRow}>
              {topStats.map(({ icon: Icon, label, value }) => (
                <View key={label} style={styles.statCell}>
                  <Icon size={16} color="#92928D" />
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.darkCard}>
          <Text style={styles.sectionTitle}>Today</Text>
          {[
            { label: 'Habits completed', value: `${completedToday}/${habits.length}` },
            { label: 'Average goal progress', value: `${avgGoalProg}%` },
            { label: 'Journal entries', value: String(entries.length) },
            { label: 'Unique tags used', value: String(allTags.length) },
          ].map(item => (
            <View key={item.label} style={styles.todayRow}>
              <Text style={styles.muted}>{item.label}</Text>
              <Text style={styles.todayValue}>{item.value}</Text>
            </View>
          ))}
          <View style={styles.todayRow}>
            <Text style={styles.muted}>Morning check-in</Text>
            {hasCompletedMorning ? (
              <View style={styles.statusRow}>
                <CheckCircle2 size={16} color="#D7FF35" />
                <Text style={styles.statusDone}>Done</Text>
              </View>
            ) : (
              <View style={styles.statusRow}>
                <Clock size={16} color="#92928D" />
                <Text style={styles.muted}>Pending</Text>
              </View>
            )}
          </View>
          {morningCheckin ? (
            <View style={styles.focusBlock}>
              <Text style={styles.focusLabel}>Today's focus</Text>
              <Text style={styles.focusText}>{morningCheckin.focusText}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.menuCard}>
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const isLast = index === menuItems.length - 1
            return (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => void item.onPress()}
                style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
              >
                <Icon size={16} color="#92928D" />
                <Text style={[styles.menuLabel, item.danger && styles.menuDanger, isLast && styles.menuDanger]}>
                  {item.label}
                </Text>
                <ChevronRight size={16} color="#92928D" />
              </Pressable>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#141414' },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  headerCard: {
    borderRadius: 32,
    backgroundColor: '#1D1D1D',
    padding: 20,
  },
  eyebrow: {
    color: '#D7FF35',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  identityRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#D7FF35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#151515',
    fontSize: 28,
    fontWeight: '900',
  },
  name: {
    color: '#F4F4F0',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  email: {
    marginTop: 4,
    color: '#92928D',
    fontSize: 14,
  },
  streakRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muted: { color: '#92928D', fontSize: 13 },
  paperCard: {
    borderRadius: 28,
    backgroundColor: '#F4F4F0',
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paperEyebrow: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  paperTitle: {
    marginTop: 4,
    color: '#151515',
    fontSize: 22,
    fontWeight: '900',
  },
  statsRow: { flexDirection: 'row' },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    color: '#151515',
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    color: '#92928D',
    fontSize: 10,
    fontWeight: '600',
  },
  darkCard: {
    borderRadius: 28,
    backgroundColor: '#1D1D1D',
    padding: 20,
  },
  sectionTitle: {
    color: '#F4F4F0',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  todayValue: {
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDone: {
    color: '#D7FF35',
    fontSize: 14,
    fontWeight: '700',
  },
  focusBlock: { paddingTop: 12 },
  focusLabel: {
    color: '#92928D',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  focusText: {
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
  },
  menuCard: {
    borderRadius: 28,
    backgroundColor: '#1D1D1D',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 16,
  },
  menuLabel: {
    flex: 1,
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '600',
  },
  menuDanger: { color: '#D7FF35' },
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.985 }] },
})
