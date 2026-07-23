
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useGetGoals } from '../hooks/backend/goals'
import { useGetHabits } from '../hooks/backend/habits'
import { useGetJournalEntries } from '../hooks/backend/journal'
import { Layout } from '../components/Layout'
import { Badge } from '../components/ui/badge'
import { ChevronRight, Target, CheckSquare2, BookOpen, Flame, Bot, Bell, Moon, Lock, Settings, TrendingUp, Calendar, LogOut } from 'lucide-react'
import type { Goal, Habit, JournalEntry } from '../lib/types'
import { cast } from '../lib/types'

const MVP_CHECKLIST = [
  { label: 'Morning Experience',  done: true },
  { label: 'Dashboard',           done: true },
  { label: 'Goals (CRUD + DB)',   done: true },
  { label: 'Habits + Streaks',    done: true },
  { label: 'Journal',             done: true },
  { label: 'Calendar',            done: true },
  { label: 'Evening Reflection',  done: true },
  { label: 'AI Coach',            done: true },
  { label: 'Persistent DB',       done: true },
  { label: 'Auth + Multi-user',   done: true },
  { label: 'Analytics Charts',    done: false },
  { label: 'Push Notifications',  done: false },
]

export default function Profile() {
  const navigate = useNavigate()
  const { userName, userInitial, userEmail, morningCheckin, hasCompletedMorning, logout } = useApp()

  const { data: rawGoals,   trigger: fetchGoals   } = useGetGoals()
  const { data: rawHabits,  trigger: fetchHabits  } = useGetHabits()
  const { data: rawJournal, trigger: fetchJournal } = useGetJournalEntries()

  const [goals,   setGoals]   = useState<Goal[]>([])
  const [habits,  setHabits]  = useState<Habit[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])

  useEffect(() => { void fetchGoals(); void fetchHabits(); void fetchJournal() }, [])
  useEffect(() => { setGoals(cast.goals(rawGoals))              }, [rawGoals])
  useEffect(() => { setHabits(cast.habits(rawHabits))           }, [rawHabits])
  useEffect(() => { setEntries(cast.journalEntries(rawJournal)) }, [rawJournal])

  const completedToday = habits.filter(h => h.completedToday).length
  const avgGoalProg    = goals.length ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length) : 0
  const bestStreak     = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0)
  const allTags        = [...new Set(entries.flatMap(e => e.tags))]

  const topStats = [
    { icon: Target,       label: 'Goals',   value: goals.length },
    { icon: CheckSquare2, label: 'Habits',  value: habits.length },
    { icon: BookOpen,     label: 'Journal', value: entries.length },
    { icon: Flame,        label: 'Streak',  value: bestStreak },
  ]

  const menuItems = [
    { icon: Bot,      label: 'AI Coach',      onClick: () => navigate('/ai') },
    { icon: Calendar, label: 'Calendar',      onClick: () => navigate('/calendar') },
    { icon: Bell,     label: 'Notifications', onClick: () => {} },
    { icon: Moon,     label: 'Appearance',    onClick: () => {} },
    { icon: Lock,     label: 'Privacy',       onClick: () => {} },
    { icon: Settings, label: 'Settings',      onClick: () => {} },
    { icon: LogOut,   label: 'Log Out',       onClick: async () => { await logout(); navigate('/welcome') } },
  ]

  return (
    <Layout>
      <div className="px-4 pt-10 pb-4 space-y-5">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>

        {/* ── Avatar card ── */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shrink-0">
            {userInitial}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{userName}</h2>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
            <div className="flex gap-1.5 mt-1.5">
              <Badge variant="secondary" className="text-xs">Life OS</Badge>
              {bestStreak >= 5 && <Badge variant="secondary" className="text-xs">🔥 On fire</Badge>}
            </div>
          </div>
        </div>

        {/* ── Top stats ── */}
        <div className="grid grid-cols-4 gap-2">
          {topStats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-3 text-center">
              <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Today's summary ── */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="font-semibold text-foreground">Today's Summary</p>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Habits completed',   value: `${completedToday}/${habits.length}` },
              { label: 'Avg. goal progress', value: `${avgGoalProg}%` },
              { label: 'Journal entries',    value: entries.length },
              { label: 'Unique tags used',   value: allTags.length },
              { label: 'Morning check-in',   value: hasCompletedMorning ? '✅ Done' : '⏳ Pending' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold text-foreground">{value}</span>
              </div>
            ))}
            {morningCheckin && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Today's focus</span>
                <span className="text-sm font-semibold text-foreground max-w-[60%] text-right truncate">{morningCheckin.focusText}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── MVP Checklist ── */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-foreground">MVP Progress</p>
            <span className="text-xs text-muted-foreground">
              {MVP_CHECKLIST.filter(i => i.done).length}/{MVP_CHECKLIST.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {MVP_CHECKLIST.map(({ label, done }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  done ? 'bg-green-500 dark:bg-green-400 text-white' : 'border-2 border-muted text-transparent'
                }`}>
                  {done ? '✓' : ''}
                </div>
                <span className={`text-sm ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                {!done && <Badge variant="secondary" className="text-[10px] ml-auto">V2</Badge>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Menu ── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {menuItems.map(({ icon: Icon, label, onClick }, i) => (
            <button key={label} onClick={onClick}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent transition-colors text-left ${
                i < menuItems.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground pb-2">Life OS · Powered by Retool DB · Built with ❤️</p>
      </div>
    </Layout>
  )
}
