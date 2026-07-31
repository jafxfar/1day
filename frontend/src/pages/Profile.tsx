
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../entities/auth/model/useSession'
import { useCheckins } from '../entities/checkins/model/useCheckinsContext'
import { useGetGoals } from '../entities/goals/model/useGoals'
import { useGetHabits } from '../entities/habits/model/useHabits'
import { useGetJournalEntries } from '../entities/journal/model/useJournal'
import { Layout } from '../shared/ui/Layout'
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
    {
      icon: LogOut,
      label: 'Log Out',
      onClick: async () => {
        await logout()
        navigate('/welcome')
      },
    },
  ]

  return (
    <Layout>
      <main className="app-page min-h-full bg-[#141414] px-4 pb-8 pt-4 text-[#F4F4F0] sm:px-6 sm:pt-6">
        <div className="mx-auto w-full max-w-md space-y-4">
          <header className="app-header surface-dark rounded-[32px] bg-[#1D1D1D] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D7FF35]">Your system</p>
            <div className="mt-5 flex items-center gap-4">
              <div className="lime-panel flex size-16 shrink-0 items-center justify-center rounded-[20px] bg-[#D7FF35] text-2xl font-black text-[#151515]">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-3xl font-black tracking-[-0.04em]">{userName}</h1>
                <p className="truncate text-sm text-[#92928D]">{userEmail}</p>
              </div>
            </div>
            {bestStreak >= 5 && (
              <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#92928D]">
                <Flame className="size-4 text-[#D7FF35]" /> {bestStreak} day best streak
              </p>
            )}
          </header>

          <section className="surface-paper rounded-[28px] bg-[#F4F4F0] p-5 text-[#151515]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#92928D]">At a glance</p>
                <h2 className="section-title mt-1 text-2xl font-black tracking-[-0.03em]">Your momentum</h2>
              </div>
              <TrendingUp className="size-5 text-[#92928D]" />
            </div>
            <dl className="grid grid-cols-4 divide-x divide-[#151515]/10">
              {topStats.map(({ icon: Icon, label, value }) => (
                <div key={label} className="px-2 text-center first:pl-0 last:pr-0">
                  <Icon className="mx-auto mb-2 size-4 text-[#92928D]" />
                  <dd className="text-2xl font-black tabular-nums">{value}</dd>
                  <dt className="text-[10px] font-semibold text-[#92928D]">{label}</dt>
                </div>
              ))}
            </dl>
          </section>

          <section className="surface-dark rounded-[28px] bg-[#1D1D1D] p-5">
            <h2 className="section-title mb-4 text-lg font-black">Today</h2>
            <dl className="divide-y divide-white/10">
              {[
                { label: 'Habits completed', value: `${completedToday}/${habits.length}` },
                { label: 'Average goal progress', value: `${avgGoalProg}%` },
                { label: 'Journal entries', value: entries.length },
                { label: 'Unique tags used', value: allTags.length },
                {
                  label: 'Morning check-in',
                  value: hasCompletedMorning ? (
                    <span className="flex items-center gap-1.5 text-[#D7FF35]"><CheckCircle2 className="size-4" /> Done</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[#92928D]"><Clock className="size-4" /> Pending</span>
                  ),
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <dt className="text-sm text-[#92928D]">{label}</dt>
                  <dd className="text-sm font-bold tabular-nums">{value}</dd>
                </div>
              ))}
              {morningCheckin && (
                <div className="py-3 last:pb-0">
                  <dt className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#92928D]">Today’s focus</dt>
                  <dd className="text-sm font-bold leading-6">{morningCheckin.focusText}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="surface-paper rounded-[28px] bg-[#F4F4F0] p-5 text-[#151515]">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#92928D]">Product build</p>
                <h2 className="section-title mt-1 text-xl font-black">Life OS progress</h2>
              </div>
              <span className="text-sm font-black tabular-nums">{MVP_CHECKLIST.filter(item => item.done).length}/{MVP_CHECKLIST.length}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#92928D]">
              <div
                className="h-full rounded-full bg-[#1D1D1D]"
                style={{ width: `${(MVP_CHECKLIST.filter(item => item.done).length / MVP_CHECKLIST.length) * 100}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
              {MVP_CHECKLIST.map(({ label, done }) => (
                <div key={label} className="flex min-w-0 items-center gap-2">
                  <span className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${
                    done ? 'bg-[#1D1D1D] text-[#D7FF35]' : 'border border-[#151515]/20 text-transparent'
                  }`}>
                    ✓
                  </span>
                  <span className={`truncate text-xs font-semibold ${done ? 'text-[#151515]' : 'text-[#92928D]'}`}>{label}</span>
                </div>
              ))}
            </div>
          </section>

          <nav aria-label="Profile settings" className="surface-dark overflow-hidden rounded-[28px] bg-[#1D1D1D] px-2 py-2">
            {menuItems.map(({ icon: Icon, label, onClick }, index) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={`pressable flex w-full items-center gap-3 rounded-[16px] px-3 py-3.5 text-left transition hover:bg-white/5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35] ${
                  index === menuItems.length - 1 ? 'text-[#D7FF35]' : 'text-[#F4F4F0]'
                }`}
              >
                <Icon className="size-4 shrink-0 text-[#92928D]" />
                <span className="flex-1 text-sm font-semibold">{label}</span>
                <ChevronRight className="size-4 text-[#92928D]" />
              </button>
            ))}
          </nav>
        </div>
      </main>
    </Layout>
  )
}
