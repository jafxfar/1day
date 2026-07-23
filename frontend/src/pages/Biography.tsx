
import { useState, useEffect, useMemo } from 'react'
import { useGetBiography } from '../hooks/backend/biography'
import { Layout } from '../components/Layout'
import { PageSkeleton, PageError } from '../components/PageSkeleton'
import { ChevronLeft, ChevronRight, Moon, Sun, BookOpen, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type DayQuality = 'great' | 'good' | 'neutral' | 'poor' | 'no_data'

interface HabitRecord { title: string; icon: string; completed: boolean }

interface DaySummary {
  date: string
  mood: number | null; energy: number | null; sleepHours: number | null; focusText: string | null
  eveningRating: number | null; eveningTags: string[]; wins: string | null; failures: string | null
  habits: HabitRecord[]; habitsCompleted: number; habitsTotal: number
  journalTitle: string | null; journalContent: string | null; journalMood: number | null; journalTags: string[]
  score: number; quality: DayQuality
}

// ─── Config ───────────────────────────────────────────────────────────────────

const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WEEKDAYS = ['Mo','Tu','We','Th','Fr','Sa','Su']
const pad = (n: number) => String(n).padStart(2, '0')

const QUALITY_CONFIG: Record<DayQuality, { label: string; dot: string; cell: string; text: string }> = {
  great:   { label: 'Great',   dot: 'bg-green-500',                      cell: 'bg-green-500 dark:bg-green-500',  text: 'text-white' },
  good:    { label: 'Good',    dot: 'bg-green-300 dark:bg-green-700',     cell: 'bg-green-300 dark:bg-green-700',  text: 'text-green-900 dark:text-white' },
  neutral: { label: 'Neutral', dot: 'bg-yellow-400',                     cell: 'bg-yellow-400 dark:bg-yellow-500',text: 'text-yellow-900 dark:text-white' },
  poor:    { label: 'Poor',    dot: 'bg-red-400',                        cell: 'bg-red-400 dark:bg-red-500',      text: 'text-white' },
  no_data: { label: 'No data', dot: 'bg-muted',                          cell: '',                                text: 'text-muted-foreground' },
}

const getMoodEmoji = (mood: number | null): string => {
  if (mood === null) return '—'
  if (mood >= 5) return '😄'
  if (mood >= 4) return '🙂'
  if (mood >= 3) return '😐'
  if (mood >= 2) return '😕'
  return '😞'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Biography() {
  const { data: rawData, loading, error, trigger: fetchBiography } = useGetBiography()

  const [allDays,      setAllDays]      = useState<DaySummary[]>([])
  const [viewDate,     setViewDate]     = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => { void fetchBiography() }, [])
  useEffect(() => {
    if (Array.isArray(rawData)) setAllDays(rawData as DaySummary[])
  }, [rawData])

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()

  // Build date → DaySummary lookup
  const dayMap = useMemo(() => {
    const m = new Map<string, DaySummary>()
    for (const d of allDays) m.set(d.date, d)
    return m
  }, [allDays])

  // Days in current month view
  const daysInMonth   = new Date(year, month + 1, 0).getDate()
  // Monday-first weekday of 1st: 0=Mon…6=Sun
  const rawFirstDay   = new Date(year, month, 1).getDay()  // 0=Sun
  const firstWeekday  = (rawFirstDay + 6) % 7              // convert to Mon=0

  const today    = new Date()
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  const dateStr  = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`

  // Monthly stats
  const monthDays = allDays.filter(d => d.date.startsWith(`${year}-${pad(month + 1)}`))
  const qualityCounts = monthDays.reduce<Record<DayQuality, number>>((acc, d) => {
    acc[d.quality] = (acc[d.quality] ?? 0) + 1
    return acc
  }, { great: 0, good: 0, neutral: 0, poor: 0, no_data: 0 })

  const avgMood = monthDays.filter(d => d.mood !== null).length > 0
    ? Math.round(monthDays.reduce((a, d) => a + (d.mood ?? 0), 0) / monthDays.filter(d => d.mood !== null).length * 10) / 10
    : null

  const avgHabitRate = monthDays.filter(d => d.habitsTotal > 0).length > 0
    ? Math.round(monthDays.filter(d => d.habitsTotal > 0).reduce((a, d) => a + (d.habitsCompleted / d.habitsTotal), 0)
        / monthDays.filter(d => d.habitsTotal > 0).length * 100)
    : null

  const selectedDay = selectedDate ? (dayMap.get(selectedDate) ?? null) : null

  if (loading && allDays.length === 0) return <Layout><PageSkeleton rows={5} /></Layout>
  if (error) return <Layout><PageError message={error} onRetry={() => void fetchBiography({ skipCache: true })} /></Layout>

  return (
    <Layout>
      <div className="px-4 pt-10 pb-4 space-y-4">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Biography</h1>
          <p className="text-sm text-muted-foreground">Your life, day by day</p>
        </div>

        {/* ── Month navigator ── */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-2 rounded-xl hover:bg-accent transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="text-center">
              <h2 className="font-semibold text-foreground">{MONTHS[month]} {year}</h2>
              {monthDays.length > 0 && (
                <p className="text-xs text-muted-foreground">{monthDays.length} days recorded</p>
              )}
            </div>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-2 rounded-xl hover:bg-accent transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {(['great','good','neutral','poor'] as DayQuality[]).map(q => (
              <div key={q} className="flex items-center gap-1.5">
                <div className={cn('w-3 h-3 rounded-sm', QUALITY_CONFIG[q].dot)} />
                <span className="text-[11px] text-muted-foreground">{QUALITY_CONFIG[q].label}</span>
              </div>
            ))}
          </div>

          {/* Weekday labels — Monday first */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[11px] text-muted-foreground font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank cells before first day */}
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`b-${i}`} />)}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day       = i + 1
              const ds        = dateStr(day)
              const summary   = dayMap.get(ds)
              const quality   = summary?.quality ?? 'no_data'
              const qCfg      = QUALITY_CONFIG[quality]
              const isToday   = ds === todayStr
              const isSelected = ds === selectedDate
              const hasData   = quality !== 'no_data'

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(prev => prev === ds ? null : ds)}
                  className={cn(
                    'relative flex flex-col items-center justify-center aspect-square rounded-xl text-xs font-semibold transition-all',
                    hasData ? cn(qCfg.cell, qCfg.text) : 'text-muted-foreground hover:bg-accent',
                    isToday && 'ring-2 ring-offset-1 ring-foreground ring-offset-background',
                    isSelected && 'ring-2 ring-offset-1 ring-primary ring-offset-background scale-110 z-10',
                  )}
                >
                  {day}
                  {/* Mood emoji dot */}
                  {summary?.mood !== null && summary?.mood !== undefined && (
                    <span className="absolute -bottom-0.5 text-[8px] leading-none">
                      {getMoodEmoji(summary.mood)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Monthly stats ── */}
        {monthDays.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Great',    value: qualityCounts.great,   dot: 'bg-green-500' },
              { label: 'Good',     value: qualityCounts.good,    dot: 'bg-green-300' },
              { label: 'Neutral',  value: qualityCounts.neutral, dot: 'bg-yellow-400' },
              { label: 'Poor',     value: qualityCounts.poor,    dot: 'bg-red-400' },
            ].map(({ label, value, dot }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-2.5 text-center">
                <div className={cn('w-2.5 h-2.5 rounded-sm mx-auto mb-1', dot)} />
                <p className="text-lg font-bold text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Average metrics ── */}
        {monthDays.length > 0 && (
          <div className="flex gap-2">
            {avgMood !== null && (
              <div className="flex-1 bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-foreground">{getMoodEmoji(avgMood)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Avg mood {avgMood}/5</p>
              </div>
            )}
            {avgHabitRate !== null && (
              <div className="flex-1 bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-foreground">{avgHabitRate}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">Habit rate</p>
              </div>
            )}
            <div className="flex-1 bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-foreground">
                {monthDays.filter(d => d.journalTitle !== null).length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Journal entries</p>
            </div>
          </div>
        )}

        {/* ── Empty month ── */}
        {monthDays.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-2xl mb-2">📭</p>
            <p className="font-medium text-foreground">No data for this month</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start your morning check-in to begin recording your biography.
            </p>
          </div>
        )}

        {/* ── Day detail ── */}
        {selectedDay && <DayDetail day={selectedDay} />}
      </div>
    </Layout>
  )
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────

function DayDetail({ day }: { day: DaySummary }) {
  const qCfg    = QUALITY_CONFIG[day.quality]
  const dateObj = new Date(day.date + 'T00:00:00')
  const label   = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Colored top bar */}
      <div className={cn('h-1.5', day.quality !== 'no_data' ? qCfg.dot : 'bg-border')} />

      <div className="p-4 space-y-4">
        {/* Date + quality */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground text-base">{label}</h3>
          {day.quality !== 'no_data' && (
            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', qCfg.cell, qCfg.text)}>
              {qCfg.label}
            </span>
          )}
        </div>

        {/* Morning check-in */}
        {(day.mood !== null || day.energy !== null || day.sleepHours !== null) && (
          <Section icon={<Sun className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />} title="Morning">
            <div className="grid grid-cols-3 gap-2">
              {day.mood !== null && (
                <Metric label="Mood" value={`${getMoodEmoji(day.mood)} ${day.mood}/5`} />
              )}
              {day.energy !== null && (
                <Metric label="Energy" value={`⚡ ${day.energy}/10`} />
              )}
              {day.sleepHours !== null && (
                <Metric label="Sleep" value={`😴 ${day.sleepHours}h`} />
              )}
            </div>
            {day.focusText && (
              <div className="mt-2 bg-muted/40 rounded-xl px-3 py-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Focus</p>
                <p className="text-sm text-foreground font-medium">{day.focusText}</p>
              </div>
            )}
          </Section>
        )}

        {/* Habits */}
        {day.habits.length > 0 && (
          <Section icon={<CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" />} title={`Habits — ${day.habitsCompleted}/${day.habitsTotal}`}>
            <div className="space-y-1.5">
              {day.habits.map((h, i) => (
                <div key={i} className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm',
                  h.completed
                    ? 'bg-green-50 dark:bg-green-950/20'
                    : 'bg-red-50 dark:bg-red-950/20',
                )}>
                  <span className="text-base">{h.icon}</span>
                  <span className={cn('flex-1 font-medium', h.completed ? 'text-foreground' : 'text-muted-foreground line-through')}>
                    {h.title}
                  </span>
                  {h.completed
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400 shrink-0" />
                    : <XCircle      className="w-4 h-4 text-red-400 dark:text-red-500 shrink-0" />
                  }
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Evening reflection */}
        {(day.eveningRating !== null || day.wins || day.failures || day.eveningTags.length > 0) && (
          <Section icon={<Moon className="w-4 h-4 text-blue-400 dark:text-blue-300" />} title="Evening">
            {day.eveningRating !== null && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">Day rating</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={cn(
                      'w-3.5 h-1.5 rounded-sm',
                      i < (day.eveningRating ?? 0) ? 'bg-primary' : 'bg-muted',
                    )} />
                  ))}
                </div>
                <span className="text-xs font-bold text-foreground">{day.eveningRating}/10</span>
              </div>
            )}
            {day.wins && (
              <div className="mb-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Wins 🏆</p>
                <p className="text-sm text-foreground leading-snug">{day.wins}</p>
              </div>
            )}
            {day.failures && (
              <div className="mb-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">To improve 🌱</p>
                <p className="text-sm text-foreground leading-snug">{day.failures}</p>
              </div>
            )}
            {day.eveningTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {day.eveningTags.map(tag => (
                  <span key={tag} className="text-[11px] px-2.5 py-1 bg-muted rounded-full text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Journal */}
        {day.journalTitle && (
          <Section icon={<BookOpen className="w-4 h-4 text-purple-500 dark:text-purple-400" />} title="Journal">
            <p className="font-semibold text-foreground text-sm">{day.journalTitle}</p>
            {day.journalMood !== null && (
              <p className="text-xs text-muted-foreground mt-0.5">Mood: {getMoodEmoji(day.journalMood)}</p>
            )}
            {day.journalContent && (
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-4">
                {day.journalContent}
              </p>
            )}
            {day.journalTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {day.journalTags.map(tag => (
                  <span key={tag} className="text-[11px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">#{tag}</span>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* No data */}
        {day.quality === 'no_data' && (
          <p className="text-center text-sm text-muted-foreground py-2">No data recorded for this day</p>
        )}
      </div>
    </div>
  )
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      </div>
      {children}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-2 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  )
}
