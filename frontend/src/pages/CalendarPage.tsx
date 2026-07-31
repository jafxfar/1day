
import { useState, useEffect } from 'react'
import { useGetJournalEntries } from '../hooks/backend/journal'
import { useGetHabits } from '../hooks/backend/habits'
import { Layout } from '../components/Layout'
import { Badge } from '../components/ui/badge'
import { ChevronLeft, ChevronRight, Smile, Meh, Frown, Laugh, CheckCircle2 } from 'lucide-react'
import type { JournalEntry, Habit } from '../lib/types'
import { cast } from '../lib/types'

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
  const { data: rawEntries, trigger: fetchEntries } = useGetJournalEntries()
  const { data: rawHabits, trigger: fetchHabits } = useGetHabits()

  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [habits, setHabits] = useState<Habit[]>([])

  useEffect(() => { void fetchEntries(); void fetchHabits() }, [])
  useEffect(() => { setEntries(cast.journalEntries(rawEntries)) }, [rawEntries])
  useEffect(() => { setHabits(cast.habits(rawHabits)) }, [rawHabits])

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
      <div className="px-4 pt-10 pb-4 space-y-5">
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>

        {/* ── Month nav ── */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-2 rounded-xl hover:bg-accent transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h2 className="font-semibold text-foreground">{MONTHS[month]} {year}</h2>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-2 rounded-xl hover:bg-accent transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[11px] text-muted-foreground font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`b-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const ds = dateStr(day)
              const hasEntry = entryMap.has(ds)
              const active = selectedDay === day
              const today = isToday(day)

              return (
                <button key={day} onClick={() => setSelectedDay(day)}
                  className={`relative flex flex-col items-center justify-center h-9 rounded-xl text-sm font-medium transition-all ${active ? 'bg-primary text-primary-foreground'
                      : today ? 'ring-2 ring-primary/50 text-foreground'
                        : 'text-foreground hover:bg-accent'
                    }`}
                >
                  {day}
                  {hasEntry && !active && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Day detail ── */}
        {selectedDay && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">
              {MONTHS[month]} {selectedDay}, {year}
            </h3>

            {selectedEntry ? (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">{selectedEntry.title}</h4>
                  <div className="flex items-center gap-1.5">
                    {getMoodIcon(selectedEntry.mood)}
                    <Badge variant="secondary" className="text-xs">{selectedEntry.mood}/10</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedEntry.content}</p>
                {selectedEntry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEntry.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs rounded-full">#{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-4 text-center">
                <p className="text-sm text-muted-foreground">No journal entry for this day</p>
              </div>
            )}

            {isToday(selectedDay) && habits.length > 0 && (
              <div className="mt-2 bg-card border border-border rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-2">Today's Activity</p>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground text-sm">{completedToday} of {habits.length} habits completed</p>
                    <p className="text-xs text-muted-foreground">Keep going!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
