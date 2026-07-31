
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../entities/auth/model/useSession'
import { useCheckins } from '../entities/checkins/model/useCheckinsContext'
import { useGetGoals } from '../entities/goals/model/useGoals'
import { useGetHabits, useToggleHabit } from '../entities/habits/model/useHabits'
import { useGetJournalEntries } from '../entities/journal/model/useJournal'
import { Layout } from '../shared/ui/Layout'
import { Progress } from '../shared/ui/progress'
import { Badge } from '../shared/ui/badge'
import { Bell, Bot, ChevronRight, Moon, Sun, Zap, Flame, Smile, Meh, Frown, Laugh, Target, Calendar } from 'lucide-react'
import { getHabitIcon } from '../shared/lib/icons'

const getMoodIcon = (moodVal: number) => {
  switch (moodVal) {
    case 1: return <Frown className="w-5 h-5 text-red-500 inline" />
    case 2: return <Frown className="w-5 h-5 text-orange-400 inline" />
    case 3: return <Meh className="w-5 h-5 text-amber-500 inline" />
    case 4: return <Smile className="w-5 h-5 text-green-400 inline" />
    case 5: return <Laugh className="w-5 h-5 text-green-500 inline" />
    default: return <Meh className="w-5 h-5 text-muted-foreground inline" />
  }
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useSession()
  const { morningCheckin, hasCompletedMorning, isLoading: isLoadingCheckins } = useCheckins()
  const userName = user?.firstName ?? 'Friend'

  const { data: goals = [], trigger: fetchGoals } = useGetGoals()
  const { data: habits = [], setData: setHabits, trigger: fetchHabits } = useGetHabits()
  const { data: entries = [], trigger: fetchJournal } = useGetJournalEntries()
  const { trigger: toggleHabitFn } = useToggleHabit()

  useEffect(() => {
    void fetchGoals()
    void fetchHabits()
    void fetchJournal()
  }, [fetchGoals, fetchHabits, fetchJournal])

  const completedHabits = habits.filter(h => h.completedToday).length
  const avgGoalProgress = goals.length
    ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length)
    : 0
  const latestEntry = entries[0] ?? null
  const topStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0)

  const handleToggle = async (id: string) => {
    const previousHabits = habits
    setHabits(previousHabits.map(h =>
      h.id !== id ? h : { ...h, completedToday: !h.completedToday, currentStreak: !h.completedToday ? h.currentStreak + 1 : Math.max(0, h.currentStreak - 1) }
    ))
    const result = await toggleHabitFn({ habitId: id })

    if (result) {
      setHabits(currentHabits => (currentHabits ?? []).map(h =>
        h.id !== id ? h : {
          ...h,
          completedToday: result.completedToday,
          currentStreak: result.currentStreak,
          longestStreak: result.longestStreak,
        }
      ))
      return
    }

    setHabits(previousHabits)
  }

  return (
    <Layout>
      <main className="app-page space-y-7 px-4 pb-6 pt-8">

        {/* ── Header ── */}
        <header className="app-header flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="mt-1 max-w-[16rem] text-3xl font-bold leading-[0.95] tracking-[-0.04em] text-foreground">
              {getGreeting()}, {userName}
            </h1>
          </div>
          <button
            className="icon-button pressable relative grid size-11 shrink-0 place-items-center rounded-2xl bg-card text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => navigate('/profile')}
            aria-label="Open profile and notifications"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>
        </header>

        {/* ── Morning CTA ── */}
        {!hasCompletedMorning && !isLoadingCheckins && (
          <button
            onClick={() => navigate('/morning')}
            className="lime-panel pressable flex w-full items-center justify-between rounded-[24px] bg-primary px-5 py-4 text-primary-foreground transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5" />
              <div className="text-left">
                <p className="font-semibold text-sm">Start morning check-in</p>
                <p className="text-xs opacity-80">Set your intention for today</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </button>
        )}

        {/* ── Morning Stats (after checkin) ── */}
        {hasCompletedMorning && morningCheckin && (
          <>
            <div className="grid grid-cols-[1.2fr_0.8fr] gap-2">
              {[
                { icon: Moon, label: 'Sleep', value: `${morningCheckin.sleepHours}h` },
                { icon: Zap, label: 'Energy', value: `${morningCheckin.energy}/10` },
                { icon: Sun, label: 'Mood', value: getMoodIcon(morningCheckin.mood) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="surface-dark rounded-[24px] bg-card p-4 text-left last:col-span-2">
                  <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <div className="flex min-h-[1.5rem] items-center justify-center text-2xl font-bold leading-none tracking-tight text-foreground">{value}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="surface-paper rounded-[24px] bg-foreground px-5 py-4 text-background">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                Today's focus <Target className="w-3.5 h-3.5 text-primary" />
              </p>
              <p className="text-base font-semibold leading-snug text-background">{morningCheckin.focusText}</p>
            </div>
          </>
        )}

        {/* ── Stats cards ── */}
        <section className="grid grid-cols-[1.15fr_0.85fr] gap-2" aria-label="Daily overview">
          <button onClick={() => navigate('/habits')}
            className="lime-panel pressable min-h-36 rounded-[28px] bg-primary p-5 text-left text-primary-foreground transition-transform active:scale-[0.98]">
            <p className="text-xs font-semibold">Habits today</p>
            <p className="mt-5 text-4xl font-bold tracking-[-0.05em]">
              {completedHabits}<span className="text-base text-muted-foreground font-normal">/{habits.length}</span>
            </p>
            <Progress value={habits.length ? (completedHabits / habits.length) * 100 : 0} className="mt-2 h-1.5" />
          </button>
          <button onClick={() => navigate('/goals')}
            className="surface-dark pressable self-end rounded-[24px] bg-card p-5 text-left transition-transform active:scale-[0.98]">
            <p className="text-xs text-muted-foreground">Goals average</p>
            <p className="mt-3 text-3xl font-bold tracking-[-0.04em] text-foreground">
              {avgGoalProgress}<span className="text-base text-muted-foreground font-normal">%</span>
            </p>
            <Progress value={avgGoalProgress} className="mt-2 h-1.5" />
          </button>
        </section>

        {/* ── AI Insight ── */}
        <button onClick={() => navigate('/ai')}
          className="surface-dark pressable w-full rounded-[28px] bg-card p-5 text-left transition-transform active:scale-[0.99]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">AI coach</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {hasCompletedMorning && topStreak > 0
                  ? `You're on a ${topStreak}-day streak! Keep the momentum. Focus on "${morningCheckin?.focusText ?? 'your goal'}" today.`
                  : 'Start your morning check-in to get a personalized AI insight for today.'}
              </p>
            </div>
          </div>
        </button>

        {/* ── Active Goals ── */}
        {goals.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title text-lg font-semibold tracking-tight text-foreground">Active goals</h2>
              <button onClick={() => navigate('/goals')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">See all →</button>
            </div>
            <div className="space-y-2">
              {goals.slice(0, 2).map(goal => (
                <div key={goal.id} className="surface-paper rounded-[20px] bg-foreground p-4 text-background">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-background">{goal.title}</p>
                    <Badge variant="secondary" className="text-xs">{goal.progress}%</Badge>
                  </div>
                  <Progress value={goal.progress} className="h-1.5" />
                  {goal.deadline && <p className="mt-1.5 text-xs text-background/60">Due {goal.deadline}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Today's Habits ── */}
        {habits.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title text-lg font-semibold tracking-tight text-foreground">Today's habits</h2>
              <button onClick={() => navigate('/habits')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">See all →</button>
            </div>
            <div className="space-y-2">
              {habits.slice(0, 4).map(habit => {
                return (
                  <div key={habit.id} className="surface-paper flex items-center gap-3 rounded-[18px] bg-foreground px-4 py-3 text-background">
                    <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      {getHabitIcon(habit.icon, 'w-4 h-4 text-primary')}
                    </span>
                    <p className={`flex-1 text-sm font-semibold ${habit.completedToday ? 'line-through text-background/45' : 'text-background'}`}>
                      {habit.title}
                    </p>
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Flame className="w-3 h-3 text-orange-400 dark:text-orange-300" />
                      {habit.currentStreak}
                    </span>
                    <button
                      onClick={() => void handleToggle(habit.id)}
                      className={`pressable flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${habit.completedToday
                        ? 'border-primary bg-primary'
                        : 'border-background/20 hover:border-primary'
                        }`}
                      aria-label={`${habit.completedToday ? 'Mark incomplete' : 'Mark complete'}: ${habit.title}`}
                    >
                      {habit.completedToday && <span className="text-white text-xs font-bold leading-none">✓</span>}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Latest Journal ── */}
        {latestEntry && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title text-lg font-semibold tracking-tight text-foreground">Latest entry</h2>
              <button onClick={() => navigate('/journal')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Journal →</button>
            </div>
            <button onClick={() => navigate('/journal')}
              className="surface-dark pressable w-full rounded-[24px] bg-card p-5 text-left transition-transform active:scale-[0.99]">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-muted-foreground">{latestEntry.entryDate}</p>
                <Badge variant="secondary" className="text-xs">Mood {latestEntry.mood}/10</Badge>
              </div>
              <p className="font-medium text-sm text-foreground">{latestEntry.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{latestEntry.content}</p>
            </button>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <section className="grid grid-cols-[0.9fr_1.1fr] gap-2" aria-label="Quick actions">
          <button onClick={() => navigate('/calendar')}
            className="surface-dark pressable flex h-28 flex-col justify-between rounded-[24px] bg-card px-4 py-4 text-left transition-transform active:scale-[0.98]">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground mt-1">Calendar</p>
              <p className="text-xs text-muted-foreground">View your timeline</p>
            </div>
          </button>
          <button onClick={() => navigate('/evening')}
            className="surface-paper pressable rounded-[28px] bg-foreground px-5 py-4 text-left text-background transition-transform active:scale-[0.98]">
            <Moon className="h-5 w-5 text-background/60" />
            <p className="mt-3 text-sm font-semibold text-background">Evening</p>
            <p className="text-xs text-background/60">Close your day</p>
          </button>
        </section>
      </main>
    </Layout>
  )
}