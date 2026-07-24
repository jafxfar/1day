
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useGetGoals } from '../hooks/backend/goals'
import { useGetHabits, useToggleHabit } from '../hooks/backend/habits'
import { useGetJournalEntries } from '../hooks/backend/journal'
import { Layout } from '../components/Layout'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { Bell, Bot, ChevronRight, Moon, Sun, Zap, Flame } from 'lucide-react'
import type { Goal, Habit, JournalEntry } from '../lib/types'
import { cast } from '../lib/types'

const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😄']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

interface ToggleResult { habitId: string; completedToday: boolean; currentStreak: number; longestStreak: number }

export default function Dashboard() {
  const navigate = useNavigate()
  const { userName, morningCheckin, hasCompletedMorning, isLoadingCheckins } = useApp()

  const { data: rawGoals, trigger: fetchGoals } = useGetGoals()
  const { data: rawHabits, trigger: fetchHabits } = useGetHabits()
  const { data: rawJournal, trigger: fetchJournal } = useGetJournalEntries()
  const { trigger: toggleHabitFn } = useToggleHabit()

  const [goals, setGoals] = useState<Goal[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])

  useEffect(() => {
    void fetchGoals()
    void fetchHabits()
    void fetchJournal()
  }, [])
  useEffect(() => { setGoals(cast.goals(rawGoals)) }, [rawGoals])
  useEffect(() => { setHabits(cast.habits(rawHabits)) }, [rawHabits])
  useEffect(() => { setEntries(cast.journalEntries(rawJournal)) }, [rawJournal])

  const completedHabits = habits.filter(h => h.completedToday).length
  const avgGoalProgress = goals.length
    ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length)
    : 0
  const latestEntry = entries[0] ?? null
  const topStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0)

  const handleToggle = async (id: string) => {
    setHabits(prev => prev.map(h =>
      h.id !== id ? h : { ...h, completedToday: !h.completedToday, currentStreak: !h.completedToday ? h.currentStreak + 1 : Math.max(0, h.currentStreak - 1) }
    ))
    const result = await toggleHabitFn({ habitId: id }) as ToggleResult | null
    if (result) {
      setHabits(prev => prev.map(h =>
        h.id !== id ? h : { ...h, completedToday: result.completedToday, currentStreak: result.currentStreak }
      ))
    }
  }

  return (
    <Layout>
      <div className="px-4 pt-10 pb-4 space-y-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl font-bold text-foreground mt-0.5">{getGreeting()}, {userName} 👋</h1>
          </div>
          <button className="relative p-2.5 bg-card rounded-xl border border-border hover:bg-accent transition-colors" onClick={() => navigate('/profile')}>
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>
        </div>

        {/* ── Morning CTA ── */}
        {!hasCompletedMorning && !isLoadingCheckins && (
          <button
            onClick={() => navigate('/morning')}
            className="w-full flex items-center justify-between bg-primary text-primary-foreground rounded-2xl px-4 py-3.5 hover:opacity-90 transition-opacity"
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
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Moon, label: 'Sleep', value: `${morningCheckin.sleepHours}h` },
                { icon: Zap, label: 'Energy', value: `${morningCheckin.energy}/10` },
                { icon: Sun, label: 'Mood', value: MOOD_EMOJI[morningCheckin.mood - 1] ?? '😐' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-card border border-border rounded-2xl p-3 text-center">
                  <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground leading-none">{value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Today's Focus 🎯</p>
              <p className="font-semibold text-foreground text-sm">{morningCheckin.focusText}</p>
            </div>
          </>
        )}

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => navigate('/habits')}
            className="bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/40 transition-colors">
            <p className="text-xs text-muted-foreground">Habits Today</p>
            <p className="text-3xl font-bold text-foreground mt-1">
              {completedHabits}<span className="text-base text-muted-foreground font-normal">/{habits.length}</span>
            </p>
            <Progress value={habits.length ? (completedHabits / habits.length) * 100 : 0} className="mt-2 h-1.5" />
          </button>
          <button onClick={() => navigate('/goals')}
            className="bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/40 transition-colors">
            <p className="text-xs text-muted-foreground">Goals Avg.</p>
            <p className="text-3xl font-bold text-foreground mt-1">
              {avgGoalProgress}<span className="text-base text-muted-foreground font-normal">%</span>
            </p>
            <Progress value={avgGoalProgress} className="mt-2 h-1.5" />
          </button>
        </div>

        {/* ── AI Insight ── */}
        <button onClick={() => navigate('/ai')}
          className="w-full bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/40 transition-colors">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">AI Coach</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {hasCompletedMorning && topStreak > 0
                  ? `You're on a ${topStreak}-day streak! Keep the momentum. Focus on "${morningCheckin?.focusText ?? 'your goal'}" today.`
                  : 'Start your morning check-in to get a personalized AI insight for today. 💬'}
              </p>
            </div>
          </div>
        </button>

        {/* ── Active Goals ── */}
        {goals.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">Active Goals</h2>
              <button onClick={() => navigate('/goals')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">See all →</button>
            </div>
            <div className="space-y-2">
              {goals.slice(0, 2).map(goal => (
                <div key={goal.id} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-foreground">{goal.title}</p>
                    <Badge variant="secondary" className="text-xs">{goal.progress}%</Badge>
                  </div>
                  <Progress value={goal.progress} className="h-1.5" />
                  {goal.deadline && <p className="text-xs text-muted-foreground mt-1.5">Due {goal.deadline}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Today's Habits ── */}
        {habits.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">Today's Habits</h2>
              <button onClick={() => navigate('/habits')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">See all →</button>
            </div>
            <div className="space-y-2">
              {habits.slice(0, 4).map(habit => (
                <div key={habit.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
                  <span className="text-xl">{habit.icon}</span>
                  <p className={`flex-1 text-sm font-medium ${habit.completedToday ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {habit.title}
                  </p>
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Flame className="w-3 h-3 text-orange-400 dark:text-orange-300" />
                    {habit.currentStreak}
                  </span>
                  <button
                    onClick={() => void handleToggle(habit.id)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${habit.completedToday
                        ? 'border-green-500 bg-green-500 dark:border-green-400 dark:bg-green-400'
                        : 'border-border hover:border-primary/50'
                      }`}
                  >
                    {habit.completedToday && <span className="text-white text-xs font-bold leading-none">✓</span>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Latest Journal ── */}
        {latestEntry && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">Latest Entry</h2>
              <button onClick={() => navigate('/journal')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Journal →</button>
            </div>
            <button onClick={() => navigate('/journal')}
              className="w-full bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/40 transition-colors">
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
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => navigate('/calendar')}
            className="bg-card border border-border rounded-2xl px-4 py-3 text-left hover:border-primary/40 transition-colors">
            <p className="text-lg">📅</p>
            <p className="text-sm font-medium text-foreground mt-1">Calendar</p>
            <p className="text-xs text-muted-foreground">View your timeline</p>
          </button>
          <button onClick={() => navigate('/evening')}
            className="bg-card border border-border rounded-2xl px-4 py-3 text-left hover:border-primary/40 transition-colors">
            <Moon className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground mt-1">Evening</p>
            <p className="text-xs text-muted-foreground">Close your day</p>
          </button>
        </div>
      </div>
    </Layout>
  )
}