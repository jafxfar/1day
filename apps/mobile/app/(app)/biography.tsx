import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
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
import type { BiographyDay, DayQuality } from '@life-os/contracts'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Frown,
  Inbox,
  Laugh,
  Meh,
  Moon,
  Smile,
  Sprout,
  Sun,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react-native'
import { ApiError } from '@/api/client'
import { biographyApi } from '@/biography/api'
import { getHabitIconComponent, stripHtml } from '@/lib/uiHelpers'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const pad = (n: number) => String(n).padStart(2, '0')

const QUALITY_COLORS: Record<DayQuality, { label: string; bg: string; text: string }> = {
  great: { label: 'Great', bg: '#D7FF35', text: '#151515' },
  good: { label: 'Good', bg: '#8eaa4d', text: '#151515' },
  neutral: { label: 'Neutral', bg: '#5f6657', text: '#F4F4F0' },
  poor: { label: 'Poor', bg: '#343831', text: '#F4F4F0' },
  no_data: { label: 'No data', bg: 'transparent', text: '#92928D' },
}

const MoodIcon = ({ mood, size = 16 }: { mood: number | null; size?: number }) => {
  if (mood === null) return null
  if (mood >= 5) return <Laugh size={size} color="#22C55E" />
  if (mood >= 4) return <Smile size={size} color="#4ADE80" />
  if (mood >= 3) return <Meh size={size} color="#F59E0B" />
  return <Frown size={size} color="#FB923C" />
}

export default function BiographyScreen() {
  const router = useRouter()
  const [allDays, setAllDays] = useState<BiographyDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const days = await biographyApi.getAll()
      setAllDays(days)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Failed to load biography')
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
  const rawFirstDay = new Date(year, month, 1).getDay()
  const firstWeekday = (rawFirstDay + 6) % 7

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  const dateStr = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`

  const dayMap = useMemo(() => {
    const map = new Map<string, BiographyDay>()
    for (const day of allDays) map.set(day.date, day)
    return map
  }, [allDays])

  const monthDays = useMemo(
    () => allDays.filter(day => day.date.startsWith(`${year}-${pad(month + 1)}`)),
    [allDays, year, month],
  )

  const qualityCounts = useMemo(() => (
    monthDays.reduce<Record<DayQuality, number>>((acc, day) => {
      acc[day.quality] = (acc[day.quality] ?? 0) + 1
      return acc
    }, { great: 0, good: 0, neutral: 0, poor: 0, no_data: 0 })
  ), [monthDays])

  const avgMood = useMemo(() => {
    const withMood = monthDays.filter(day => day.mood !== null)
    if (withMood.length === 0) return null
    return Math.round(withMood.reduce((sum, day) => sum + (day.mood ?? 0), 0) / withMood.length * 10) / 10
  }, [monthDays])

  const avgHabitRate = useMemo(() => {
    const withHabits = monthDays.filter(day => day.habitsTotal > 0)
    if (withHabits.length === 0) return null
    return Math.round(
      withHabits.reduce((sum, day) => sum + (day.habitsCompleted / day.habitsTotal), 0) / withHabits.length * 100,
    )
  }, [monthDays])

  const selectedDay = selectedDate ? (dayMap.get(selectedDate) ?? null) : null

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ArrowLeft size={20} color="#F4F4F0" />
        </Pressable>
        <Text style={styles.topTitle}>Biography</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Life in review</Text>
        <Text style={styles.title}>Biography</Text>
        <Text style={styles.muted}>The shape of your days, recorded over time.</Text>

        <View style={styles.monthCard}>
          <View style={styles.monthNav}>
            <Pressable
              accessibilityLabel="Previous month"
              onPress={() => setViewDate(new Date(year, month - 1, 1))}
              style={styles.navButton}
            >
              <ChevronLeft size={20} color="#F4F4F0" />
            </Pressable>
            <View style={styles.monthCenter}>
              <Text style={styles.monthTitle}>
                {MONTHS[month]} <Text style={styles.monthAccent}>{year}</Text>
              </Text>
              {monthDays.length > 0 ? (
                <Text style={styles.monthMeta}>{monthDays.length} days recorded</Text>
              ) : null}
            </View>
            <Pressable
              accessibilityLabel="Next month"
              onPress={() => setViewDate(new Date(year, month + 1, 1))}
              style={styles.navButton}
            >
              <ChevronRight size={20} color="#F4F4F0" />
            </Pressable>
          </View>

          <View style={styles.legend}>
            {(['great', 'good', 'neutral', 'poor'] as DayQuality[]).map(quality => (
              <View key={quality} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: QUALITY_COLORS[quality].bg }]} />
                <Text style={styles.legendText}>{QUALITY_COLORS[quality].label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map(day => (
              <Text key={day} style={styles.weekLabel}>{day}</Text>
            ))}
          </View>

          {loading && allDays.length === 0 ? (
            <ActivityIndicator color="#D7FF35" style={{ marginVertical: 24 }} />
          ) : error && allDays.length === 0 ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => void load()} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.grid}>
              {Array.from({ length: firstWeekday }).map((_, index) => (
                <View key={`blank-${index}`} style={styles.dayCell} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1
                const ds = dateStr(day)
                const summary = dayMap.get(ds)
                const quality = summary?.quality ?? 'no_data'
                const colors = QUALITY_COLORS[quality]
                const hasData = quality !== 'no_data'
                const isToday = ds === todayStr
                const isSelected = ds === selectedDate

                return (
                  <Pressable
                    key={ds}
                    accessibilityRole="button"
                    accessibilityLabel={`${MONTHS[month]} ${day}, ${year}${hasData ? `, ${colors.label}` : ', no data'}`}
                    onPress={() => setSelectedDate(prev => (prev === ds ? null : ds))}
                    style={[
                      styles.dayCell,
                      styles.dayButton,
                      hasData && { backgroundColor: colors.bg },
                      isToday && styles.dayToday,
                      isSelected && styles.daySelected,
                    ]}
                  >
                    <Text style={[styles.dayNumber, { color: hasData ? colors.text : '#92928D' }]}>
                      {day}
                    </Text>
                    {summary?.mood != null ? (
                      <View style={styles.moodBadge}>
                        <MoodIcon mood={summary.mood} size={10} />
                      </View>
                    ) : null}
                  </Pressable>
                )
              })}
            </View>
          )}
        </View>

        {monthDays.length > 0 ? (
          <View style={styles.statsStrip}>
            {[
              { label: 'Great', value: qualityCounts.great },
              { label: 'Good', value: qualityCounts.good },
              { label: 'Neutral', value: qualityCounts.neutral },
              { label: 'Poor', value: qualityCounts.poor },
            ].map((item, index) => (
              <View
                key={item.label}
                style={[styles.statCell, index > 0 && styles.statBorder]}
              >
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {monthDays.length > 0 ? (
          <View style={styles.avgRow}>
            {avgMood !== null ? (
              <View style={styles.avgCell}>
                <MoodIcon mood={avgMood} size={22} />
                <Text style={styles.avgMeta}>Mood {avgMood}/5</Text>
              </View>
            ) : null}
            {avgHabitRate !== null ? (
              <View style={[styles.avgCell, styles.avgBorder]}>
                <Text style={styles.avgValue}>{avgHabitRate}%</Text>
                <Text style={styles.avgMeta}>Habit rate</Text>
              </View>
            ) : null}
            <View style={[styles.avgCell, styles.avgBorder]}>
              <Text style={styles.avgValue}>
                {monthDays.filter(day => day.journalTitle !== null).length}
              </Text>
              <Text style={styles.avgMeta}>Journal</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Inbox size={36} color="#D7FF35" />
            <Text style={styles.emptyTitle}>No days recorded</Text>
            <Text style={styles.muted}>
              Start your morning check-in to begin recording your biography.
            </Text>
          </View>
        )}

        {selectedDay ? <DayDetail day={selectedDay} /> : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const DayDetail = ({ day }: { day: BiographyDay }) => {
  const colors = QUALITY_COLORS[day.quality]
  const dateObj = new Date(`${day.date}T00:00:00`)
  const label = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <View style={styles.detailCard}>
      <View style={[styles.detailBar, { backgroundColor: day.quality !== 'no_data' ? colors.bg : 'rgba(255,255,255,0.1)' }]} />
      <View style={styles.detailBody}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{label}</Text>
          {day.quality !== 'no_data' ? (
            <View style={[styles.qualityBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.qualityText, { color: colors.text }]}>{colors.label}</Text>
            </View>
          ) : null}
        </View>

        {(day.mood !== null || day.energy !== null || day.sleepHours !== null) ? (
          <DetailSection icon={<Sun size={14} color="#FACC15" />} title="Morning">
            <View style={styles.metricRow}>
              {day.mood !== null ? (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Mood</Text>
                  <View style={styles.metricValueRow}>
                    <MoodIcon mood={day.mood} size={14} />
                    <Text style={styles.metricValue}>{day.mood}/5</Text>
                  </View>
                </View>
              ) : null}
              {day.energy !== null ? (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Energy</Text>
                  <View style={styles.metricValueRow}>
                    <Zap size={14} color="#FACC15" />
                    <Text style={styles.metricValue}>{day.energy}/10</Text>
                  </View>
                </View>
              ) : null}
              {day.sleepHours !== null ? (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Sleep</Text>
                  <View style={styles.metricValueRow}>
                    <Moon size={14} color="#60A5FA" />
                    <Text style={styles.metricValue}>{day.sleepHours}h</Text>
                  </View>
                </View>
              ) : null}
            </View>
            {day.focusText ? (
              <View style={styles.focusBox}>
                <Text style={styles.focusLabel}>Focus</Text>
                <Text style={styles.focusText}>{day.focusText}</Text>
              </View>
            ) : null}
          </DetailSection>
        ) : null}

        {day.habits.length > 0 ? (
          <DetailSection
            icon={<CheckCircle2 size={14} color="#22C55E" />}
            title={`Habits — ${day.habitsCompleted}/${day.habitsTotal}`}
          >
            {day.habits.map((habit, index) => {
              const Icon = getHabitIconComponent(habit.icon)
              return (
                <View key={`${habit.title}-${index}`} style={styles.habitRow}>
                  <View style={styles.habitIcon}>
                    <Icon size={14} color="#151515" />
                  </View>
                  <Text style={[styles.habitTitle, !habit.completed && styles.habitMissed]}>
                    {habit.title}
                  </Text>
                  {habit.completed
                    ? <CheckCircle2 size={16} color="#22C55E" />
                    : <XCircle size={16} color="#F87171" />}
                </View>
              )
            })}
          </DetailSection>
        ) : null}

        {(day.eveningRating !== null || day.wins || day.failures || day.eveningTags.length > 0) ? (
          <DetailSection icon={<Moon size={14} color="#60A5FA" />} title="Evening">
            {day.eveningRating !== null ? (
              <Text style={styles.detailMeta}>Day rating {day.eveningRating}/10</Text>
            ) : null}
            {day.wins ? (
              <View style={styles.eveningBlock}>
                <View style={styles.eveningLabelRow}>
                  <Text style={styles.focusLabel}>Wins</Text>
                  <Trophy size={12} color="#FACC15" />
                </View>
                <Text style={styles.focusText}>{day.wins}</Text>
              </View>
            ) : null}
            {day.failures ? (
              <View style={styles.eveningBlock}>
                <View style={styles.eveningLabelRow}>
                  <Text style={styles.focusLabel}>To improve</Text>
                  <Sprout size={12} color="#22C55E" />
                </View>
                <Text style={styles.focusText}>{day.failures}</Text>
              </View>
            ) : null}
            {day.eveningTags.length > 0 ? (
              <View style={styles.tagRow}>
                {day.eveningTags.map(tag => (
                  <Text key={tag} style={styles.tag}>#{tag}</Text>
                ))}
              </View>
            ) : null}
          </DetailSection>
        ) : null}

        {day.journalTitle ? (
          <DetailSection icon={<BookOpen size={14} color="#D7FF35" />} title="Journal">
            <View style={styles.journalCard}>
              <Text style={styles.journalTitle}>{day.journalTitle}</Text>
              {day.journalMood !== null ? (
                <View style={styles.metricValueRow}>
                  <Text style={styles.journalMeta}>Mood</Text>
                  <MoodIcon mood={day.journalMood >= 5 ? 5 : Math.ceil(day.journalMood / 2)} size={14} />
                  <Text style={styles.journalMeta}>({day.journalMood}/10)</Text>
                </View>
              ) : null}
              {day.journalContent ? (
                <Text style={styles.journalBody} numberOfLines={4}>
                  {stripHtml(day.journalContent)}
                </Text>
              ) : null}
              {day.journalTags.length > 0 ? (
                <View style={styles.tagRow}>
                  {day.journalTags.map(tag => (
                    <Text key={tag} style={styles.journalTag}>#{tag}</Text>
                  ))}
                </View>
              ) : null}
            </View>
          </DetailSection>
        ) : null}

        {day.quality === 'no_data' ? (
          <Text style={styles.emptyDay}>No data recorded for this day</Text>
        ) : null}
      </View>
    </View>
  )
}

const DetailSection = ({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
)

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
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCenter: { alignItems: 'center' },
  monthTitle: {
    color: '#F4F4F0',
    fontSize: 22,
    fontWeight: '900',
  },
  monthAccent: { color: '#D7FF35' },
  monthMeta: {
    marginTop: 4,
    color: '#92928D',
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    color: '#92928D',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
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
    padding: 3,
  },
  dayButton: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dayToday: {
    borderWidth: 2,
    borderColor: '#F4F4F0',
  },
  daySelected: {
    borderWidth: 2,
    borderColor: '#D7FF35',
  },
  dayNumber: {
    fontWeight: '700',
    fontSize: 13,
  },
  moodBadge: {
    position: 'absolute',
    bottom: 4,
  },
  statsStrip: {
    flexDirection: 'row',
    borderRadius: 24,
    backgroundColor: '#D7FF35',
    overflow: 'hidden',
  },
  statCell: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(21,21,21,0.15)',
  },
  statValue: {
    color: '#151515',
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 4,
    color: 'rgba(21,21,21,0.75)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  avgRow: {
    flexDirection: 'row',
    borderRadius: 24,
    backgroundColor: '#1D1D1D',
    overflow: 'hidden',
  },
  avgCell: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  avgBorder: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  avgValue: {
    color: '#F4F4F0',
    fontSize: 22,
    fontWeight: '900',
  },
  avgMeta: {
    color: '#92928D',
    fontSize: 12,
  },
  emptyCard: {
    borderRadius: 28,
    backgroundColor: '#1D1D1D',
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: '#F4F4F0',
    fontSize: 20,
    fontWeight: '900',
  },
  detailCard: {
    borderRadius: 28,
    backgroundColor: '#1D1D1D',
    overflow: 'hidden',
  },
  detailBar: { height: 6 },
  detailBody: {
    padding: 20,
    gap: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 16,
  },
  detailTitle: {
    flex: 1,
    color: '#F4F4F0',
    fontSize: 22,
    fontWeight: '900',
  },
  qualityBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  qualityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#92928D',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metric: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    color: '#92928D',
    fontSize: 10,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    color: '#F4F4F0',
    fontSize: 13,
    fontWeight: '600',
  },
  focusBox: {
    borderLeftWidth: 2,
    borderLeftColor: '#D7FF35',
    paddingLeft: 12,
    marginTop: 4,
  },
  focusLabel: {
    color: '#92928D',
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  focusText: {
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '500',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  habitIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#D7FF35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitle: {
    flex: 1,
    color: '#F4F4F0',
    fontWeight: '600',
  },
  habitMissed: {
    color: '#92928D',
    textDecorationLine: 'line-through',
  },
  detailMeta: {
    color: '#F4F4F0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  eveningBlock: { marginBottom: 10 },
  eveningLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    color: '#92928D',
    fontSize: 11,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  journalCard: {
    borderRadius: 16,
    backgroundColor: '#F4F4F0',
    padding: 16,
    gap: 8,
  },
  journalTitle: {
    color: '#151515',
    fontSize: 14,
    fontWeight: '700',
  },
  journalMeta: {
    color: 'rgba(21,21,21,0.65)',
    fontSize: 12,
  },
  journalBody: {
    color: 'rgba(21,21,21,0.7)',
    fontSize: 14,
    lineHeight: 20,
  },
  journalTag: {
    color: 'rgba(21,21,21,0.65)',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyDay: {
    textAlign: 'center',
    color: '#92928D',
    fontSize: 14,
  },
  errorBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  errorText: { color: '#FECACA' },
  retryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7FF35',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    color: '#D7FF35',
    fontWeight: '700',
  },
  pressed: { transform: [{ scale: 0.985 }] },
})
