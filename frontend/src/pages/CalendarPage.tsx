
import { useState, useEffect } from 'react'
import type { JournalEntry } from '@life-os/contracts'
import { useGetJournalEntries } from '../entities/journal/model/useJournal'
import { useGetHabits } from '../entities/habits/model/useHabits'
import { Layout } from '../shared/ui/Layout'
import { Badge } from '../shared/ui/badge'
import { ChevronLeft, ChevronRight, Smile, Meh, Frown, Laugh, CheckCircle2 } from 'lucide-react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const pad = (n: number) => String(n).padStart(2, '0')

const getMoodIcon = (mood: number) => {
  if (mood >= 8) return <Laugh className="w-5 h-5 text-green-500 inline" />
  if (mood >= 6) return <Smile className="w-5 h-5 text-green-400 inline" />
  if (mood >= 4) return <Meh className="w-5 h-5 text-amber-500 inline" />
  return <Frown className="w-5 h-5 text-orange-400 inline" />
}

export default function CalendarPage() {
  const { data: entries = [], trigger: fetchEntries } = useGetJournalEntries()
  const { data: habits = [], trigger: fetchHabits } = useGetHabits()

  useEffect(() => {
    void fetchEntries()
    void fetchHabits()
  }, [fetchEntries, fetchHabits])

  const now = new Date()
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay()

  const isToday = (day: number) =>
    day === now.getDate() && month === now.getMonth() && year === now.getFullYear()

  const dateStr = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`

  const entryMap = new Map<string, JournalEntry>()
  entries.forEach(e => entryMap.set(e.entryDate, e))

  const selectedStr = selectedDay ? dateStr(selectedDay) : null
  const selectedEntry = selectedStr ? (entryMap.get(selectedStr) ?? null) : null
  const completedToday = habits.filter(h => h.completedToday).length

  return (
    <Layout>
      <main className="app-page">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-8 pt-8 sm:px-6 sm:pt-12">
        <header className="app-header">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#D7FF35]">Time map</p>
          <h1 className="text-4xl font-black leading-none tracking-[-0.055em] text-foreground sm:text-5xl">Calendar</h1>
          <p className="mt-3 text-sm text-muted-foreground">See the rhythm of your month at a glance.</p>
        </header>

        {/* ── Month nav ── */}
        <section className="surface-dark rounded-[28px] p-4 sm:p-7" aria-labelledby="calendar-month">
          <div className="mb-7 flex items-center justify-between">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="icon-button pressable hover:bg-white/10"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" aria-hidden="true" />
            </button>
            <h2 id="calendar-month" className="text-center text-2xl font-black tracking-[-0.04em] text-foreground sm:text-3xl">
              {MONTHS[month]} <span className="text-[#D7FF35]">{year}</span>
            </h2>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="icon-button pressable hover:bg-white/10"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5 text-foreground" aria-hidden="true" />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="py-2 text-center text-[9px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[10px]">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`b-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const ds = dateStr(day)
              const hasEntry = entryMap.has(ds)
              const active = selectedDay === day
              const today = isToday(day)

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  aria-label={`${MONTHS[month]} ${day}, ${year}${hasEntry ? ', has journal entry' : ''}`}
                  aria-pressed={active}
                  className={`pressable relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-bold tabular-nums transition-all sm:rounded-2xl ${active ? 'bg-[#D7FF35] text-[#151515]'
                      : today ? 'outline-2 outline-offset-2 outline-white text-foreground'
                        : 'text-foreground hover:bg-white/10'
                    }`}
                >
                  {day}
                  {hasEntry && !active && (
                    <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#D7FF35]" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Day detail ── */}
        {selectedDay && (
          <section aria-labelledby="selected-calendar-day">
            <header className="mb-4 flex items-end gap-3">
              <span className="text-6xl font-black leading-none tracking-[-0.075em] tabular-nums text-[#D7FF35] sm:text-7xl">{String(selectedDay).padStart(2, '0')}</span>
              <h3 id="selected-calendar-day" className="pb-1 text-sm font-bold uppercase leading-tight tracking-[0.16em] text-muted-foreground">
                {MONTHS[month]}<br />{year}
              </h3>
            </header>

            {selectedEntry ? (
              <article className="surface-paper rounded-[28px] p-5 text-[#151515] sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="max-w-2xl text-2xl font-black leading-tight tracking-[-0.035em] sm:text-3xl">{selectedEntry.title}</h4>
                  <div className="flex shrink-0 items-center gap-2" aria-label={`Mood ${selectedEntry.mood} out of 10`}>
                    {getMoodIcon(selectedEntry.mood)}
                    <span className="text-xs font-black tabular-nums">{selectedEntry.mood}/10</span>
                  </div>
                </div>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-[#151515]/70">{selectedEntry.content}</p>
                {selectedEntry.tags.length > 0 && (
                  <footer className="mt-5 flex flex-wrap gap-x-3 gap-y-1 border-t border-[#151515]/10 pt-4">
                    {selectedEntry.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="border-0 bg-transparent p-0 text-xs font-semibold text-[#151515]/65 shadow-none">#{tag}</Badge>
                    ))}
                  </footer>
                )}
              </article>
            ) : (
              <div className="surface-dark rounded-3xl border-l-4 border-[#D7FF35] p-5 sm:p-6">
                <p className="text-sm font-medium text-muted-foreground">No journal entry was recorded for this day.</p>
              </div>
            )}

            {isToday(selectedDay) && habits.length > 0 && (
              <aside className="lime-panel mt-4 rounded-3xl p-5 text-[#151515] sm:p-6" aria-label="Today's habit progress">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#151515]/75">Today’s activity</p>
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#151515]">
                    <CheckCircle2 className="h-5 w-5 text-[#D7FF35]" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-lg font-black tracking-[-0.02em]">{completedToday} of {habits.length} habits completed</p>
                    <p className="mt-0.5 text-xs text-[#151515]/70">Your daily rhythm is still in motion.</p>
                  </div>
                </div>
              </aside>
            )}
          </section>
        )}
      </div>
      </main>
    </Layout>
  )
}
