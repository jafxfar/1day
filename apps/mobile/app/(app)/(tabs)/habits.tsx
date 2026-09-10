import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { Habit, HabitType } from '@life-os/contracts'
import {
  CheckCircle2,
  Flame,
  Plus,
  X,
} from 'lucide-react-native'
import { habitsApi } from '@/habits/api'
import { getHabitIconComponent } from '@/lib/uiHelpers'

const HABIT_ICONS = [
  'Brain', 'Dumbbell', 'BookOpen', 'Droplets', 'Activity', 'Apple', 'Moon',
  'PenTool', 'Target', 'Heart', 'Smile', 'Music', 'Leaf', 'Sun', 'ClipboardList',
]

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('Target')
  const [type, setType] = useState<HabitType>('positive')
  const [creating, setCreating] = useState(false)

  const fetchHabits = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setHabits(await habitsApi.getAll())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchHabits()
  }, [fetchHabits])

  const completedCount = habits.filter(habit => habit.completedToday).length
  const bestStreak = habits.reduce((max, habit) => Math.max(max, habit.currentStreak), 0)
  const totalStreakDays = habits.reduce((sum, habit) => sum + habit.longestStreak, 0)
  const positiveHabits = habits.filter(habit => habit.type === 'positive')
  const negativeHabits = habits.filter(habit => habit.type === 'negative')

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

  const handleCreate = async () => {
    if (!title.trim() || creating) return
    setCreating(true)
    try {
      const created = await habitsApi.create({
        title: title.trim(),
        type,
        icon: selectedIcon,
        category: 'general',
      })
      setHabits(previous => [...previous, created])
      setTitle('')
      setSelectedIcon('Target')
      setType('positive')
      setShowCreate(false)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    const previousHabits = habits
    setHabits(previousHabits.filter(habit => habit.id !== id))
    try {
      await habitsApi.delete(id)
    } catch {
      setHabits(previousHabits)
    }
  }

  if (loading && habits.length === 0) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top']}>
        <ActivityIndicator size="large" color="#D7FF35" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Daily rhythm</Text>
            <Text style={styles.title}>Habits</Text>
            <Text style={styles.muted}>{completedCount}/{habits.length} done today</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New habit"
            onPress={() => setShowCreate(true)}
            style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}
          >
            <Plus size={16} color="#151515" />
            <Text style={styles.newButtonText}>New</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void fetchHabits()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.mainStat}>
            <CheckCircle2 size={20} color="#151515" />
            <Text style={styles.mainStatValue}>{completedCount}/{habits.length}</Text>
            <Text style={styles.mainStatLabel}>Done today</Text>
          </View>
          <View style={styles.sideStats}>
            <View style={styles.sideStatPaper}>
              <Flame size={16} color="#D7FF35" />
              <Text style={styles.sideStatValueDark}>{bestStreak}</Text>
              <Text style={styles.sideStatLabelDark}>Best streak</Text>
            </View>
            <View style={styles.sideStatDark}>
              <Text style={styles.sideStatValue}>{totalStreakDays}</Text>
              <Text style={styles.sideStatLabel}>Total days</Text>
            </View>
          </View>
        </View>

        {positiveHabits.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Build</Text>
            {positiveHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </View>
        ) : null}

        {negativeHabits.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Break</Text>
            {negativeHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </View>
        ) : null}

        {habits.length === 0 && !loading ? (
          <View style={styles.empty}>
            <CheckCircle2 size={48} color="#92928D" />
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.muted}>Create your first habit to start a streak.</Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCreate(false)}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>New habit</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Habit title"
              placeholderTextColor="#92928D"
              style={styles.input}
              accessibilityLabel="Habit title"
            />

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {([
                { id: 'positive' as const, label: 'Build' },
                { id: 'negative' as const, label: 'Break' },
              ]).map(option => (
                <Pressable
                  key={option.id}
                  onPress={() => setType(option.id)}
                  style={[styles.typeChip, type === option.id && styles.typeChipActive]}
                >
                  <Text style={[styles.typeChipText, type === option.id && styles.typeChipTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Icon</Text>
            <View style={styles.iconGrid}>
              {HABIT_ICONS.map((iconName) => {
                const Icon = getHabitIconComponent(iconName)
                const active = selectedIcon === iconName
                return (
                  <Pressable
                    key={iconName}
                    onPress={() => setSelectedIcon(iconName)}
                    style={[styles.iconChip, active && styles.iconChipActive]}
                    accessibilityLabel={iconName}
                  >
                    <Icon size={18} color={active ? '#151515' : '#F4F4F0'} />
                  </Pressable>
                )
              })}
            </View>

            <Pressable
              onPress={() => void handleCreate()}
              disabled={!title.trim() || creating}
              style={({ pressed }) => [
                styles.primaryButton,
                (!title.trim() || creating) && styles.buttonDisabled,
                pressed && styles.pressed,
              ]}
            >
              {creating ? <ActivityIndicator color="#151515" /> : null}
              <Text style={styles.primaryButtonText}>Create habit</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const HabitCard = ({
  habit,
  onToggle,
  onDelete,
}: {
  habit: Habit
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) => {
  const Icon = getHabitIconComponent(habit.icon)

  return (
    <View style={styles.habitCard}>
      <View style={styles.habitIcon}>
        <Icon size={16} color="#D7FF35" />
      </View>
      <View style={styles.flex}>
        <Text
          style={[styles.habitTitle, habit.completedToday && styles.habitTitleDone]}
          numberOfLines={1}
        >
          {habit.title}
        </Text>
        <View style={styles.streakRow}>
          <Flame size={12} color="#FB923C" />
          <Text style={styles.streakText}>{habit.currentStreak} day streak</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${habit.title}`}
        onPress={() => onDelete(habit.id)}
        style={styles.deleteButton}
      >
        <X size={16} color="#92928D" />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${habit.completedToday ? 'Mark incomplete' : 'Mark complete'}: ${habit.title}`}
        onPress={() => onToggle(habit.id)}
        style={[styles.toggle, habit.completedToday && styles.toggleDone]}
      >
        {habit.completedToday ? <Text style={styles.toggleMark}>✓</Text> : null}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#141414' },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'flex-end',
    gap: 16,
  },
  eyebrow: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  title: {
    color: '#F4F4F0',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.4,
  },
  muted: {
    marginTop: 8,
    color: '#92928D',
    fontSize: 14,
  },
  newButton: {
    height: 44,
    borderRadius: 16,
    backgroundColor: '#D7FF35',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  newButtonText: {
    color: '#151515',
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12,
    gap: 8,
  },
  errorText: { color: '#FECACA', fontSize: 14 },
  retryText: { color: '#D7FF35', fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8 },
  mainStat: {
    flex: 1.15,
    minHeight: 160,
    borderRadius: 28,
    backgroundColor: '#D7FF35',
    padding: 20,
    justifyContent: 'space-between',
  },
  mainStatValue: {
    color: '#151515',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.4,
  },
  mainStatLabel: {
    color: '#151515',
    fontSize: 12,
    fontWeight: '600',
  },
  sideStats: { flex: 0.85, gap: 8 },
  sideStatPaper: {
    borderRadius: 24,
    backgroundColor: '#F4F4F0',
    padding: 16,
    gap: 8,
  },
  sideStatDark: {
    borderRadius: 20,
    backgroundColor: '#1D1D1D',
    padding: 16,
    gap: 4,
  },
  sideStatValueDark: {
    color: '#151515',
    fontSize: 24,
    fontWeight: '800',
  },
  sideStatLabelDark: {
    color: 'rgba(21,21,21,0.55)',
    fontSize: 10,
  },
  sideStatValue: {
    color: '#F4F4F0',
    fontSize: 24,
    fontWeight: '800',
  },
  sideStatLabel: {
    color: '#92928D',
    fontSize: 10,
  },
  section: { gap: 12 },
  sectionTitle: {
    color: '#F4F4F0',
    fontSize: 18,
    fontWeight: '700',
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    backgroundColor: '#F4F4F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    color: '#151515',
    fontSize: 14,
    fontWeight: '600',
  },
  habitTitleDone: {
    textDecorationLine: 'line-through',
    color: 'rgba(21,21,21,0.45)',
  },
  streakRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    color: '#92928D',
    fontSize: 12,
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    color: '#F4F4F0',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#1D1D1D',
    padding: 20,
    gap: 12,
    paddingBottom: 32,
  },
  modalTitle: {
    color: '#F4F4F0',
    fontSize: 22,
    fontWeight: '800',
  },
  input: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#141414',
    color: '#F4F4F0',
    paddingHorizontal: 16,
  },
  fieldLabel: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '700',
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipActive: {
    borderColor: '#D7FF35',
    backgroundColor: 'rgba(215,255,53,0.12)',
  },
  typeChipText: { color: '#92928D', fontWeight: '600' },
  typeChipTextActive: { color: '#F4F4F0' },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipActive: {
    backgroundColor: '#D7FF35',
  },
  primaryButton: {
    marginTop: 8,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#D7FF35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#151515',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: { opacity: 0.5 },
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.985 }] },
})
