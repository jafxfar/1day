
import { useState, useEffect } from 'react'
import { useGetHabits, useCreateHabit, useToggleHabit, useDeleteHabit } from '../hooks/backend/habits'
import { Layout } from '../components/Layout'
import { PageSkeleton, PageError } from '../components/PageSkeleton'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Plus, Flame, CheckCircle2, X } from 'lucide-react'
import type { Habit, HabitType } from '../lib/types'
import { cast } from '../lib/types'
import { getHabitIcon } from '../lib/icons'

const HABIT_ICONS = [
  'Brain', 'Dumbbell', 'BookOpen', 'ShowerHead', 'Droplets', 'Activity', 'Apple', 'Moon',
  'PenTool', 'Target', 'Heart', 'Smile', 'Music', 'Leaf', 'Sun', 'ClipboardList'
]

interface ToggleResult {
  habitId: string
  completedToday: boolean
  currentStreak: number
  longestStreak: number
}

export default function Habits() {
  const { data: rawHabits, loading, error, trigger: fetchHabits } = useGetHabits()
  const { trigger: createHabit, loading: creating } = useCreateHabit()
  const { trigger: toggleHabitFn } = useToggleHabit()
  const { trigger: deleteHabit } = useDeleteHabit()

  const [habits, setHabits] = useState<Habit[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('Target')
  const [type, setType] = useState<HabitType>('positive')

  useEffect(() => { void fetchHabits() }, [])
  useEffect(() => { setHabits(cast.habits(rawHabits)) }, [rawHabits])

  const completedCount = habits.filter(h => h.completedToday).length
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0)
  const totalStreakDays = habits.reduce((sum, h) => sum + h.longestStreak, 0)

  /** Optimistic toggle: update UI immediately, reconcile with server result */
  const handleToggle = async (id: string) => {
    setHabits(prev =>
      prev.map(h =>
        h.id !== id ? h : {
          ...h,
          completedToday: !h.completedToday,
          currentStreak: !h.completedToday ? h.currentStreak + 1 : Math.max(0, h.currentStreak - 1),
        }
      )
    )

    const result = await toggleHabitFn({ habitId: id }) as ToggleResult | null
    if (result) {
      setHabits(prev =>
        prev.map(h =>
          h.id !== id ? h : {
            ...h,
            completedToday: result.completedToday,
            currentStreak: result.currentStreak,
            longestStreak: result.longestStreak,
          }
        )
      )
    }
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    const newHabit = await createHabit({ title: title.trim(), type, icon: selectedIcon, category: 'general' })
    if (newHabit) setHabits(prev => [...prev, cast.habits([newHabit])[0]!])
    setTitle(''); setSelectedIcon('Target'); setType('positive')
    setShowCreate(false)
  }

  const handleDelete = async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id))
    await deleteHabit({ id })
  }

  const positiveHabits = habits.filter(h => h.type === 'positive')
  const negativeHabits = habits.filter(h => h.type === 'negative')

  if (loading && habits.length === 0) return <Layout><PageSkeleton /></Layout>
  if (error) return <Layout><PageError message={error} onRetry={() => void fetchHabits({ skipCache: true })} /></Layout>

  return (
    <Layout>
      <div className="px-4 pt-10 pb-4 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Habits</h1>
            <p className="text-sm text-muted-foreground">{completedCount}/{habits.length} done today</p>
          </div>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />New
          </Button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{completedCount}/{habits.length}</p>
            <p className="text-[10px] text-muted-foreground">Today</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{bestStreak}</p>
            <p className="text-[10px] text-muted-foreground">Best Streak</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <Flame className="w-4 h-4 text-yellow-500 dark:text-yellow-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{totalStreakDays}</p>
            <p className="text-[10px] text-muted-foreground">Total Days</p>
          </div>
        </div>

        {/* ── Build ── */}
        {positiveHabits.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Build ✅</p>
            <div className="space-y-2">
              {positiveHabits.map(h => (
                <HabitCard key={h.id} habit={h} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {/* ── Break ── */}
        {negativeHabits.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Break 🚫</p>
            <div className="space-y-2">
              {negativeHabits.map(h => (
                <HabitCard key={h.id} habit={h} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {habits.length === 0 && !loading && (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">No habits yet</p>
            <p className="text-sm text-muted-foreground mt-1">Build your daily routines</p>
          </div>
        )}
      </div>

      {/* ── Create Dialog ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm rounded-2xl mx-4">
          <DialogHeader><DialogTitle>New Habit</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <Input placeholder="Habit name" value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl" />
            <div>
              <p className="text-xs text-muted-foreground mb-2">Choose icon</p>
              <div className="grid grid-cols-8 gap-1.5">
                {HABIT_ICONS.map(icon => {
                  const IconComp = getHabitIcon(icon)
                  return (
                    <button key={icon} onClick={() => setSelectedIcon(icon)}
                      className={`aspect-square flex items-center justify-center rounded-xl transition-all ${selectedIcon === icon ? 'bg-primary/10 ring-2 ring-primary/40 scale-110' : 'bg-muted hover:bg-accent'
                        }`}
                    >
                      <IconComp className={`w-5 h-5 ${selectedIcon === icon ? 'text-primary' : 'text-muted-foreground'}`} />
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-2">
              {(['positive', 'negative'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${type === t
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground'
                    }`}
                >
                  {t === 'positive' ? '✅ Build' : '🚫 Break'}
                </button>
              ))}
            </div>
            <Button className="w-full rounded-xl" onClick={() => void handleCreate()} disabled={!title.trim() || creating}>
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
  const IconComp = getHabitIcon(habit.icon)
  return (
    <div className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all ${habit.completedToday
        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
        : 'bg-card border-border'
      }`}>
      <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <IconComp className="w-4 h-4 text-primary" />
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${habit.completedToday ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {habit.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Flame className="w-3 h-3 text-orange-400 dark:text-orange-300" />
          <span className="text-xs text-muted-foreground">{habit.currentStreak} day streak</span>
        </div>
      </div>
      <button
        onClick={() => onDelete(habit.id)}
        className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        aria-label="Delete habit"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onToggle(habit.id)}
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${habit.completedToday
            ? 'border-green-500 bg-green-500 dark:border-green-400 dark:bg-green-400'
            : 'border-border hover:border-primary/60'
          }`}
      >
        {habit.completedToday && <span className="text-white text-sm font-bold leading-none">✓</span>}
      </button>
    </div>
  )
}
