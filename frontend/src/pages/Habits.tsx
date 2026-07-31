
import type { Habit, HabitType } from '@life-os/contracts'
import { useEffect, useState } from 'react'
import { useCreateHabit, useDeleteHabit, useGetHabits, useToggleHabit } from '../entities/habits/model/useHabits'
import { Layout } from '../shared/ui/Layout'
import { PageSkeleton, PageError } from '../shared/ui/PageSkeleton'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../shared/ui/dialog'
import { Plus, Flame, CheckCircle2, X } from 'lucide-react'
import { getHabitIcon } from '../shared/lib/icons'

const HABIT_ICONS = [
  'Brain', 'Dumbbell', 'BookOpen', 'ShowerHead', 'Droplets', 'Activity', 'Apple', 'Moon',
  'PenTool', 'Target', 'Heart', 'Smile', 'Music', 'Leaf', 'Sun', 'ClipboardList'
]

export default function Habits() {
  const { data: habits = [], setData: setHabits, loading, error, trigger: fetchHabits } = useGetHabits()
  const { trigger: createHabit, loading: creating } = useCreateHabit()
  const { trigger: toggleHabitFn } = useToggleHabit()
  const { trigger: deleteHabit } = useDeleteHabit()

  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('Target')
  const [type, setType] = useState<HabitType>('positive')

  useEffect(() => { void fetchHabits() }, [fetchHabits])

  const completedCount = habits.filter(h => h.completedToday).length
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0)
  const totalStreakDays = habits.reduce((sum, h) => sum + h.longestStreak, 0)

  /** Optimistic toggle: update UI immediately, reconcile with server result */
  const handleToggle = async (id: string) => {
    const previousHabits = habits
    setHabits(previousHabits.map(h =>
        h.id !== id ? h : {
          ...h,
          completedToday: !h.completedToday,
          currentStreak: !h.completedToday ? h.currentStreak + 1 : Math.max(0, h.currentStreak - 1),
        }
      ))

    const result = await toggleHabitFn({ habitId: id })
    if (result) {
      setHabits(currentHabits =>
        (currentHabits ?? []).map(h =>
          h.id !== id ? h : {
            ...h,
            completedToday: result.completedToday,
            currentStreak: result.currentStreak,
            longestStreak: result.longestStreak,
          }
        )
      )
      return
    }

    setHabits(previousHabits)
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    const newHabit = await createHabit({ title: title.trim(), type, icon: selectedIcon, category: 'general' })
    if (newHabit) setHabits(prev => [...(prev ?? []), newHabit])
    setTitle('')
    setSelectedIcon('Target')
    setType('positive')
    setShowCreate(false)
  }

  const handleDelete = async (id: string) => {
    const previousHabits = habits
    setHabits(previousHabits.filter(h => h.id !== id))

    if (!await deleteHabit({ id })) {
      setHabits(previousHabits)
    }
  }

  const positiveHabits = habits.filter(h => h.type === 'positive')
  const negativeHabits = habits.filter(h => h.type === 'negative')

  if (loading && habits.length === 0) return <Layout><PageSkeleton /></Layout>
  if (error) return <Layout><PageError message={error} onRetry={() => void fetchHabits({ skipCache: true })} /></Layout>

  return (
    <Layout>
      <main className="app-page space-y-7 px-4 pb-6 pt-8">

        {/* ── Header ── */}
        <header className="app-header flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground">Daily rhythm</p>
            <h1 className="text-4xl font-bold leading-none tracking-[-0.05em] text-foreground">Habits</h1>
            <p className="mt-2 text-sm text-muted-foreground">{completedCount}/{habits.length} done today</p>
          </div>
          <Button size="sm" className="pressable h-11 rounded-2xl px-4" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />New
          </Button>
        </header>

        {/* ── Stats ── */}
        <section className="grid grid-cols-[1.15fr_0.85fr] gap-2" aria-label="Habit statistics">
          <div className="lime-panel row-span-2 min-h-40 rounded-[28px] bg-primary p-5 text-primary-foreground">
            <CheckCircle2 className="h-5 w-5" />
            <p className="mt-10 text-4xl font-bold tracking-[-0.06em]">{completedCount}/{habits.length}</p>
            <p className="mt-1 text-xs font-semibold">Done today</p>
          </div>
          <div className="surface-paper rounded-[24px] bg-foreground p-4 text-background">
            <Flame className="h-4 w-4 text-primary" />
            <p className="mt-3 text-2xl font-bold tracking-tight">{bestStreak}</p>
            <p className="text-[10px] text-background/55">Best streak</p>
          </div>
          <div className="surface-dark rounded-[20px] bg-card p-4">
            <p className="text-2xl font-bold tracking-tight text-foreground">{totalStreakDays}</p>
            <p className="text-[10px] text-muted-foreground">Total days</p>
          </div>
        </section>

        {/* ── Build ── */}
        {positiveHabits.length > 0 && (
          <section>
            <h2 className="section-title mb-3 text-lg font-semibold tracking-tight text-foreground">Build</h2>
            <div className="space-y-2">
              {positiveHabits.map(h => (
                <HabitCard key={h.id} habit={h} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </div>
          </section>
        )}

        {/* ── Break ── */}
        {negativeHabits.length > 0 && (
          <section>
            <h2 className="section-title mb-3 text-lg font-semibold tracking-tight text-foreground">Break</h2>
            <div className="space-y-2">
              {negativeHabits.map(h => (
                <HabitCard key={h.id} habit={h} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </div>
          </section>
        )}

        {habits.length === 0 && !loading && (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">No habits yet</p>
            <p className="text-sm text-muted-foreground mt-1">Build your daily routines</p>
          </div>
        )}
      </main>

      {/* ── Create Dialog ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="mx-4 max-w-sm rounded-[28px]">
          <DialogHeader><DialogTitle>New habit</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <Input placeholder="Habit name" value={title} onChange={e => setTitle(e.target.value)} className="rounded-2xl" />
            <div>
              <p className="text-xs text-muted-foreground mb-2">Choose icon</p>
              <div className="grid grid-cols-8 gap-1.5">
                {HABIT_ICONS.map(icon => {
                  return (
                    <button key={icon} onClick={() => setSelectedIcon(icon)}
                      className={`pressable flex aspect-square items-center justify-center rounded-[14px] transition-all ${selectedIcon === icon ? 'bg-primary text-primary-foreground ring-2 ring-primary/40' : 'bg-muted hover:bg-accent'
                        }`}
                      aria-label={`Choose ${icon} icon`}
                      aria-pressed={selectedIcon === icon}
                    >
                      {getHabitIcon(icon, `w-5 h-5 ${selectedIcon === icon ? 'text-primary' : 'text-muted-foreground'}`)}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-2">
              {(['positive', 'negative'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`pressable flex-1 rounded-2xl border py-2.5 text-sm font-medium transition-all ${type === t
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground'
                    }`}
                  aria-pressed={type === t}
                >
                  {t === 'positive' ? '✅ Build' : '🚫 Break'}
                </button>
              ))}
            </div>
            <Button className="pressable w-full rounded-2xl" onClick={() => void handleCreate()} disabled={!title.trim() || creating}>
              {creating ? 'Adding…' : 'Add Habit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

// ─── Habit Card ───────────────────────────────────────────────────────────────
function HabitCard({
  habit,
  onToggle,
  onDelete,
}: {
  habit: Habit
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <article className={`surface-paper flex items-center gap-3 rounded-[18px] bg-foreground px-4 py-3.5 text-background transition-all ${habit.completedToday
        ? 'opacity-60'
        : ''
      }`}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[14px] bg-primary">
        {getHabitIcon(habit.icon, 'w-4 h-4 text-primary-foreground')}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${habit.completedToday ? 'line-through text-background/45' : 'text-background'}`}>
          {habit.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Flame className="h-3 w-3 text-primary" />
          <span className="text-xs text-background/55">{habit.currentStreak} day streak</span>
        </div>
      </div>
      <button
        onClick={() => onDelete(habit.id)}
        className="pressable rounded-lg p-1 text-background/45 transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label="Delete habit"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onToggle(habit.id)}
        className={`pressable flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all ${habit.completedToday
            ? 'border-primary bg-primary'
            : 'border-background/20 hover:border-primary'
          }`}
        aria-label={`${habit.completedToday ? 'Mark incomplete' : 'Mark complete'}: ${habit.title}`}
      >
        {habit.completedToday && <span className="text-white text-sm font-bold leading-none">✓</span>}
      </button>
    </article>
  )
}
