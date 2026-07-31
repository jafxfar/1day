
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../entities/auth/model/useSession'
import { useCheckins } from '../entities/checkins/model/useCheckinsContext'
import { useGetGoals } from '../entities/goals/model/useGoals'
import { useGetHabits } from '../entities/habits/model/useHabits'
import { useGetJournalEntries } from '../entities/journal/model/useJournal'
import { Layout } from '../shared/ui/Layout'
import { Badge } from '../shared/ui/badge'
import { ChevronRight, Target, CheckSquare2, BookOpen, Flame, Bot, Bell, Moon, Lock, Settings, TrendingUp, Calendar, LogOut, CheckCircle2, Clock } from 'lucide-react'

const MVP_CHECKLIST = [
  { label: 'Morning Experience', done: true },
  { label: 'Dashboard', done: true },
  { label: 'Goals (CRUD + DB)', done: true },
  { label: 'Habits + Streaks', done: true },
  { label: 'Journal', done: true },
  { label: 'Calendar', done: true },
  { label: 'Evening Reflection', done: true },
  { label: 'AI Coach', done: true },
  { label: 'Persistent DB', done: true },
  { label: 'Auth + Multi-user', done: true },
  { label: 'Analytics Charts', done: false },
  { label: 'Push Notifications', done: false },
]

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useSession()
  const { morningCheckin, hasCompletedMorning } = useCheckins()
  const userName = user?.firstName ?? 'Friend'
  const userInitial = (user?.firstName?.[0] ?? '?').toUpperCase()
  const userEmail = user?.email ?? ''

  const { data: goals = [], trigger: fetchGoals } = useGetGoals()
  const { data: habits = [], trigger: fetchHabits } = useGetHabits()
  const { data: entries = [], trigger: fetchJournal } = useGetJournalEntries()

  useEffect(() => {
    void fetchGoals()
    void fetchHabits()
    void fetchJournal()
  }, [fetchGoals, fetchHabits, fetchJournal])

  const completedToday = habits.filter(h => h.completedToday).length
  const avgGoalProg = goals.length ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length) : 0
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0)
  const allTags = [...new Set(entries.flatMap(e => e.tags))]

  const topStats = [
    { icon: Target, label: 'Goals', value: goals.length },
    { icon: CheckSquare2, label: 'Habits', value: habits.length },
    { icon: BookOpen, label: 'Journal', value: entries.length },
    { icon: Flame, label: 'Streak', value: bestStreak },
  ]

  const menuItems = [
    { icon: Bot, label: 'AI Coach', onClick: () => navigate('/ai') },
    { icon: Calendar, label: 'Calendar', onClick: () => navigate('/calendar') },
    { icon: Bell, label: 'Notifications', onClick: () => { } },
    { icon: Moon, label: 'Appearance', onClick: () => { } },
    { icon: Lock, label: 'Privacy', onClick: () => { } },
    { icon: Settings, label: 'Settings', onClick: () => { } },
    { icon: LogOut, label: 'Log Out', onClick: async () => { await logout(); navigate('/welcome') } },
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
              {bestStreak >= 5 && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /> On fire
                </Badge>
              )}
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
              { label: 'Habits completed', value: `${completedToday}/${habits.length}` },
              { label: 'Avg. goal progress', value: `${avgGoalProg}%` },
              { label: 'Journal entries', value: entries.length },
              { label: 'Unique tags used', value: allTags.length },
              {
                label: 'Morning check-in',
                value: hasCompletedMorning ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" /> Done
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Clock className="w-4 h-4" /> Pending
                  </span>
                )
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <div className="text-sm font-semibold text-foreground">{value}</div>
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
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${done ? 'bg-green-500 dark:bg-green-400 text-white' : 'border-2 border-muted text-transparent'
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
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent transition-colors text-left ${i < menuItems.length - 1 ? 'border-b border-border' : ''
                }`}
            >
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </Layout>
  )
}
