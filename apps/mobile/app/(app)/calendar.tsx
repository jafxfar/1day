import { useCallback, useEffect, useMemo, useState } from 'react'
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
import type { Habit, JournalEntry } from '@life-os/contracts'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Frown,
  Laugh,
  Meh,
  Smile,
} from 'lucide-react-native'
import { habitsApi } from '@/habits/api'
import { journalApi } from '@/journal/api'
import { stripHtml } from '@/lib/uiHelpers'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const pad = (n: number) => String(n).padStart(2, '0')

const MoodIcon = ({ mood }: { mood: number }) => {
  if (mood >= 8) return <Laugh size={20} color="#22C55E" />
  if (mood >= 6) return <Smile size={20} color="#4ADE80" />
  if (mood >= 4) return <Meh size={20} color="#F59E0B" />
  return <Frown size={20} color="#FB923C" />
}

export default function CalendarScreen() {
  const router = useRouter()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [nextEntries, nextHabits] = await Promise.all([
        journalApi.getAll(),
        habitsApi.getAll(),
      ])
      setEntries(nextEntries)
      setHabits(nextHabits)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay()

  const dateStr = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`
  const isToday = (day: number) => (
    day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
  )

  const entryMap = useMemo(() => {
    const map = new Map<string, JournalEntry>()
    entries.forEach(entry => map.set(entry.entryDate, entry))
    return map
  }, [entries])

  const selectedStr = selectedDay ? dateStr(selectedDay) : null
  const selectedEntry = selectedStr ? (entryMap.get(selectedStr) ?? null) : null
  const completedToday = habits.filter(habit => habit.completedToday).length

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back">
          <ArrowLeft size={20} color="#F4F4F0" />
        </Pressable>
        <Text style={styles.topTitle}>Calendar</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Time map</Text>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.muted}>See the rhythm of your month at a glance.</Text>

        <View style={styles.monthCard}>
          <View style={styles.monthNav}>
            <Pressable
              accessibilityLabel="Previous month"
              onPress={() => setViewDate(new Date(year, month - 1, 1))}
              style={styles.navButton}
            >
              <ChevronLeft size={20} color="#F4F4F0" />
            </Pressable>
            <Text style={styles.monthTitle}>
              {MONTHS[month]} <Text style={styles.monthAccent}>{year}</Text>
            </Text>
            <Pressable
              accessibilityLabel="Next month"
              onPress={() => setViewDate(new Date(year, month + 1, 1))}
              style={styles.navButton}
            >
              <ChevronRight size={20} color="#F4F4F0" />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map(day => (
              <Text key={day} style={styles.weekLabel}>{day}</Text>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator color="#D7FF35" style={{ marginVertical: 24 }} />
          ) : (
            <View style={styles.grid}>
              {Array.from({ length: firstWeekday }).map((_, index) => (
                <View key={`blank-${index}`} style={styles.dayCell} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1
                const ds = dateStr(day)
                const hasEntry = entryMap.has(ds)
                const active = selectedDay === day
                const today = isToday(day)
                return (
                  <Pressable
                    key={ds}
                    onPress={() => setSelectedDay(day)}
                    style={[
                      styles.dayCell,
                      styles.dayButton,
                      active && styles.dayActive,
                      today && !active && styles.dayToday,
                    ]}
                  >
                    <Text style={[styles.dayNumber, active && styles.dayNumberActive]}>{day}</Text>
                    {hasEntry ? <View style={[styles.dot, active && styles.dotActive]} /> : null}
                  </Pressable>
                )
              })}
            </View>
          )}
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>
            {selectedDay ? `${MONTHS[month]} ${selectedDay}` : 'Select a day'}
          </Text>
          {selectedEntry ? (
            <View style={styles.detailBody}>
              <View style={styles.moodRow}>
                <MoodIcon mood={selectedEntry.mood} />
                <Text style={styles.detailMeta}>Mood {selectedEntry.mood}/10</Text>
              </View>
              <Text style={styles.entryTitle}>{selectedEntry.title}</Text>
              <Text style={styles.entryBody} numberOfLines={4}>
                {stripHtml(selectedEntry.content)}
              </Text>
            </View>
          ) : (
            <Text style={styles.muted}>No journal entry for this day.</Text>
          )}
          {selectedDay && isToday(selectedDay) ? (
            <View style={styles.habitsRow}>
              <CheckCircle2 size={16} color="#D7FF35" />
              <Text style={styles.detailMeta}>
                Habits today {completedToday}/{habits.length}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#141414' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#F4F4F0',
    fontWeight: '700',
  },
  spacer: { width: 44 },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  eyebrow: {
    color: '#D7FF35',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F4F4F0',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.4,
  },
  muted: {
    color: '#92928D',
    fontSize: 14,
    lineHeight: 22,
  },
  monthCard: {
    borderRadius: 28,
    backgroundColor: '#1D1D1D',
    padding: 16,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    color: '#F4F4F0',
    fontSize: 22,
    fontWeight: '900',
  },
  monthAccent: { color: '#D7FF35' },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    color: '#92928D',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayActive: {
    backgroundColor: '#D7FF35',
  },
  dayToday: {
    borderWidth: 1,
    borderColor: '#D7FF35',
  },
  dayNumber: {
    color: '#F4F4F0',
    fontWeight: '700',
  },
  dayNumberActive: {
    color: '#151515',
  },
  dot: {
    marginTop: 4,
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D7FF35',
  },
  dotActive: {
    backgroundColor: '#151515',
  },
  detailCard: {
    borderRadius: 28,
    backgroundColor: '#1D1D1D',
    padding: 20,
    gap: 12,
  },
  detailTitle: {
    color: '#F4F4F0',
    fontSize: 18,
    fontWeight: '800',
  },
  detailBody: { gap: 8 },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailMeta: {
    color: '#92928D',
    fontSize: 13,
    fontWeight: '600',
  },
  entryTitle: {
    color: '#F4F4F0',
    fontSize: 16,
    fontWeight: '700',
  },
  entryBody: {
    color: '#92928D',
    fontSize: 14,
    lineHeight: 22,
  },
  habitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
})
