
import type { BiographyDay, DayQuality } from '@life-os/contracts'
import { useState, useEffect, useMemo } from 'react'
import { useGetBiography } from '../entities/biography/model/useBiography'
import { Layout } from '../shared/ui/Layout'
import { PageSkeleton, PageError } from '../shared/ui/PageSkeleton'
import { ChevronLeft, ChevronRight, Moon, Sun, BookOpen, CheckCircle2, XCircle, Trophy, Sprout, Inbox, Smile, Meh, Frown, Laugh, Zap } from 'lucide-react'
import { cn } from '../shared/lib/utils'
import { getHabitIcon } from '../shared/lib/icons'

// ─── Config ───────────────────────────────────────────────────────────────────

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const pad = (n: number) => String(n).padStart(2, '0')

const QUALITY_CONFIG: Record<DayQuality, { label: string, dot: string, cell: string, text: string }> = {
  great: { label: 'Great', dot: 'bg-[#D7FF35]', cell: 'bg-[#D7FF35]', text: 'text-[#151515]' },
  good: { label: 'Good', dot: 'bg-[#8eaa4d]', cell: 'bg-[#8eaa4d]', text: 'text-[#151515]' },
  neutral: { label: 'Neutral', dot: 'bg-[#5f6657]', cell: 'bg-[#5f6657]', text: 'text-white' },
  poor: { label: 'Poor', dot: 'bg-[#343831]', cell: 'bg-[#343831]', text: 'text-white' },
  no_data: { label: 'No data', dot: 'bg-white/15', cell: '', text: 'text-muted-foreground' },
}

const getMoodIcon = (mood: number | null) => {
  if (mood === null) return null
  if (mood >= 5) return <Laugh className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
  if (mood >= 4) return <Smile className="w-2.5 h-2.5 text-green-500" />
  if (mood >= 3) return <Meh className="w-2.5 h-2.5 text-amber-500" />
  if (mood >= 2) return <Frown className="w-2.5 h-2.5 text-orange-400" />
  return <Frown className="w-2.5 h-2.5 text-red-500" />
}

const getMoodIconMedium = (mood: number | null) => {
  if (mood === null) return null
  if (mood >= 5) return <Laugh className="w-4 h-4 text-green-600 dark:text-green-400" />
  if (mood >= 4) return <Smile className="w-4 h-4 text-green-500" />
  if (mood >= 3) return <Meh className="w-4 h-4 text-amber-500" />
  if (mood >= 2) return <Frown className="w-4 h-4 text-orange-400" />
  return <Frown className="w-4 h-4 text-red-500" />
}

const getMoodIconLarge = (mood: number | null) => {
  if (mood === null) return null
  if (mood >= 5) return <Laugh className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto" />
  if (mood >= 4) return <Smile className="w-6 h-6 text-green-500 mx-auto" />
  if (mood >= 3) return <Meh className="w-6 h-6 text-amber-500 mx-auto" />
  if (mood >= 2) return <Frown className="w-6 h-6 text-orange-400 mx-auto" />
  return <Frown className="w-6 h-6 text-red-500 mx-auto" />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Biography() {
  const { data: allDays = [], loading, error, trigger: fetchBiography } = useGetBiography()

  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => { void fetchBiography() }, [fetchBiography])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  // Build date → DaySummary lookup
  const dayMap = useMemo(() => {
    const m = new Map<string, BiographyDay>()
    for (const d of allDays) m.set(d.date, d)
    return m
  }, [allDays])

  // Days in current month view
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Monday-first weekday of 1st: 0=Mon…6=Sun
  const rawFirstDay = new Date(year, month, 1).getDay()  // 0=Sun
  const firstWeekday = (rawFirstDay + 6) % 7              // convert to Mon=0

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  const dateStr = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`

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
      <main className="app-page">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-8 pt-8 sm:px-6 sm:pt-12">

        {/* ── Header ── */}
        <header className="app-header">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#D7FF35]">Life in review</p>
          <h1 className="text-4xl font-black leading-none tracking-[-0.055em] text-foreground sm:text-5xl">Biography</h1>
          <p className="mt-3 text-sm text-muted-foreground">The shape of your days, recorded over time.</p>
        </header>

        {/* ── Month navigator ── */}
        <section className="surface-dark rounded-[28px] p-4 sm:p-7" aria-labelledby="biography-month">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="icon-button pressable hover:bg-white/10"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" aria-hidden="true" />
            </button>
            <div className="text-center">
              <h2 id="biography-month" className="text-2xl font-black tracking-[-0.04em] text-foreground sm:text-3xl">{MONTHS[month]} <span className="text-[#D7FF35]">{year}</span></h2>
              {monthDays.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">{monthDays.length} days recorded</p>
              )}
            </div>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="icon-button pressable hover:bg-white/10"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5 text-foreground" aria-hidden="true" />
            </button>
          </div>

          {/* Legend */}
          <div className="mb-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2" aria-label="Day quality legend">
            {(['great', 'good', 'neutral', 'poor'] as DayQuality[]).map(q => (
              <div key={q} className="flex items-center gap-1.5">
                <div className={cn('w-3 h-3 rounded-sm', QUALITY_CONFIG[q].dot)} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{QUALITY_CONFIG[q].label}</span>
              </div>
            ))}
          </div>

          {/* Weekday labels — Monday first */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Blank cells before first day */}
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`b-${i}`} />)}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const ds = dateStr(day)
              const summary = dayMap.get(ds)
              const quality = summary?.quality ?? 'no_data'
              const qCfg = QUALITY_CONFIG[quality]
              const isToday = ds === todayStr
              const isSelected = ds === selectedDate
              const hasData = quality !== 'no_data'

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(prev => prev === ds ? null : ds)}
                  aria-label={`${MONTHS[month]} ${day}, ${year}${hasData ? `, ${qCfg.label}` : ', no data'}`}
                  aria-pressed={isSelected}
                  className={cn(
                    'pressable relative flex aspect-square flex-col items-center justify-center rounded-xl text-xs font-bold tabular-nums transition-all sm:rounded-2xl sm:text-sm',
                    hasData ? cn(qCfg.cell, qCfg.text) : 'text-muted-foreground hover:bg-white/10',
                    isToday && 'outline-2 outline-offset-2 outline-white',
                    isSelected && 'z-10 outline-2 outline-offset-2 outline-[#D7FF35]',
                  )}
                >
                  {day}
                  {/* Mood icon */}
                  {summary?.mood !== null && summary?.mood !== undefined && (
                    <span className="absolute bottom-1">
                      {getMoodIcon(summary.mood)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Monthly stats ── */}
        {monthDays.length > 0 && (
          <section className="grid grid-cols-4 overflow-hidden rounded-3xl bg-[#D7FF35] text-[#151515]" aria-label="Monthly day quality">
            {[
              { label: 'Great', value: qualityCounts.great },
              { label: 'Good', value: qualityCounts.good },
              { label: 'Neutral', value: qualityCounts.neutral },
              { label: 'Poor', value: qualityCounts.poor },
            ].map(({ label, value }, index) => (
              <div key={label} className={cn('p-4 text-center sm:p-5', index > 0 && 'border-l border-[#151515]/15')}>
                <p className="text-2xl font-black tabular-nums sm:text-3xl">{value}</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#151515]/75">{label}</p>
              </div>
            ))}
          </section>
        )}

        {/* ── Average metrics ── */}
        {monthDays.length > 0 && (
          <section className="surface-dark grid grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-3xl" aria-label="Monthly averages">
            {avgMood !== null && (
              <div className="p-4 text-center sm:p-5">
                <div className="flex min-h-6 justify-center">{getMoodIconLarge(avgMood)}</div>
                <p className="mt-1.5 text-xs text-muted-foreground">Mood {avgMood}/5</p>
              </div>
            )}
            {avgHabitRate !== null && (
              <div className="p-4 text-center sm:p-5">
                <p className="text-2xl font-black tabular-nums text-foreground">{avgHabitRate}%</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Habit rate</p>
              </div>
            )}
            <div className="p-4 text-center sm:p-5">
              <p className="text-2xl font-black tabular-nums text-foreground">
                {monthDays.filter(d => d.journalTitle !== null).length}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Journal entries</p>
            </div>
          </section>
        )}

        {/* ── Empty month ── */}
        {monthDays.length === 0 && (
          <section className="surface-dark flex min-h-56 flex-col items-center justify-center rounded-[28px] p-7 text-center">
            <Inbox className="mb-4 h-10 w-10 text-[#D7FF35]" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-xl font-black tracking-tight text-foreground">No days recorded</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Start your morning check-in to begin recording your biography.
            </p>
          </section>
        )}

        {/* ── Day detail ── */}
        {selectedDay && <DayDetail day={selectedDay} />}
      </div>
      </main>
    </Layout>
  )
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────

function DayDetail({ day }: { day: BiographyDay }) {
  const qCfg = QUALITY_CONFIG[day.quality]
  const dateObj = new Date(day.date + 'T00:00:00')
  const label = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <article className="surface-dark overflow-hidden rounded-[28px]" aria-labelledby={`day-${day.date}`}>
      {/* Colored top bar */}
      <div className={cn('h-1.5', day.quality !== 'no_data' ? qCfg.dot : 'bg-white/10')} />

      <div className="space-y-6 p-5 sm:p-7">
        {/* Date + quality */}
        <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <h3 id={`day-${day.date}`} className="max-w-md text-2xl font-black leading-tight tracking-[-0.04em] text-foreground sm:text-3xl">{label}</h3>
          {day.quality !== 'no_data' && (
            <span className={cn('rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]', qCfg.cell, qCfg.text)}>
              {qCfg.label}
            </span>
          )}
        </header>

        {/* Morning check-in */}
        {(day.mood !== null || day.energy !== null || day.sleepHours !== null) && (
          <Section icon={<Sun className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />} title="Morning">
            <div className="grid grid-cols-3 gap-2">
              {day.mood !== null && (
                <Metric label="Mood" value={
                  <span className="flex items-center justify-center gap-1 text-sm font-semibold">
                    {getMoodIconMedium(day.mood)} {day.mood}/5
                  </span>
                } />
              )}
              {day.energy !== null && (
                <Metric label="Energy" value={
                  <span className="flex items-center justify-center gap-1 text-sm font-semibold text-yellow-500">
                    <Zap className="w-4 h-4" /> {day.energy}/10
                  </span>
                } />
              )}
              {day.sleepHours !== null && (
                <Metric label="Sleep" value={
                  <span className="flex items-center justify-center gap-1 text-sm font-semibold text-blue-400">
                    <Moon className="w-4 h-4" /> {day.sleepHours}h
                  </span>
                } />
              )}
            </div>
            {day.focusText && (
              <div className="mt-3 border-l-2 border-[#D7FF35] py-1 pl-4">
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
              {day.habits.map((h, i) => {
                return (
                  <div key={i} className={cn(
                    'flex items-center gap-2.5 border-b border-white/10 px-1 py-3 text-sm',
                    h.completed
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                  )}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D7FF35]">
                      {getHabitIcon(h.icon, 'w-4 h-4 text-[#151515]')}
                    </span>
                    <span className={cn('flex-1 font-medium', h.completed ? 'text-foreground' : 'text-muted-foreground line-through')}>
                      {h.title}
                    </span>
                    {h.completed
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400 shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-400 dark:text-red-500 shrink-0" />
                    }
                  </div>
                )
              })}
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
              <div className="mb-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 flex items-center gap-1">
                  Wins <Trophy className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                </p>
                <p className="text-sm text-foreground leading-snug">{day.wins}</p>
              </div>
            )}
            {day.failures && (
              <div className="mb-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 flex items-center gap-1">
                  To improve <Sprout className="w-3.5 h-3.5 text-green-500" />
                </p>
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
          <Section icon={<BookOpen className="h-4 w-4 text-[#D7FF35]" />} title="Journal">
            <div className="surface-paper rounded-2xl p-4 text-[#151515]">
            <p className="text-sm font-bold">{day.journalTitle}</p>
            {day.journalMood !== null && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <span>Mood:</span>
                {getMoodIconMedium(day.journalMood)}
                <span>({day.journalMood}/10)</span>
              </div>
            )}
            {day.journalContent && (
              <p className="mt-2 text-sm leading-relaxed text-[#151515]/70 line-clamp-4">
                {day.journalContent}
              </p>
            )}
            {day.journalTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {day.journalTags.map(tag => (
                  <span key={tag} className="text-[11px] font-semibold text-[#151515]/65">#{tag}</span>
                ))}
              </div>
            )}
            </div>
          </Section>
        )}

        {/* No data */}
        {day.quality === 'no_data' && (
          <p className="text-center text-sm text-muted-foreground py-2">No data recorded for this day</p>
        )}
      </div>
    </article>
  )
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) {
  return (
    <section className="relative border-l border-white/15 pl-5 sm:pl-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#1D1D1D]">{icon}</span>
        <h4 className="section-title text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h4>
      </div>
      {children}
    </section>
  )
}

function Metric({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/5 p-2 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <div className="text-sm font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  )
}
