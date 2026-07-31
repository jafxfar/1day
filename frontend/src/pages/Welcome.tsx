import { useNavigate } from 'react-router-dom'
import { Button } from '../shared/ui/button'
import { ArrowUpRight, Bot, BookOpen, CheckSquare2, Sparkles, Target } from 'lucide-react'

const FEATURES = [
  { icon: Target, label: 'Goals', desc: 'Move the work that matters' },
  { icon: CheckSquare2, label: 'Habits', desc: 'Make consistency visible' },
  { icon: BookOpen, label: 'Journal', desc: 'Keep the signal from each day' },
  { icon: Bot, label: 'AI coach', desc: 'Think clearly with useful prompts' },
]

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <main id="main-content" className="app-page flex min-h-dvh justify-center bg-[#141414] px-4 py-4 text-[#F4F4F0] sm:px-6 sm:py-6">
      <div className="surface-dark flex w-full max-w-md flex-col overflow-hidden rounded-[32px] bg-[#1D1D1D] px-5 pb-6 pt-5 sm:px-7 sm:pb-8">
        <header className="app-header flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-11 items-center justify-center rounded-[16px] bg-[#D7FF35] text-[#151515]">
              <Sparkles className="size-5" strokeWidth={2.4} />
            </div>
            <span className="text-sm font-semibold tracking-[-0.01em]">Life OS</span>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-[#92928D]">
            Daily system
          </span>
        </header>

        <section className="flex flex-1 flex-col justify-center py-14 sm:py-20">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#D7FF35]">
            Make today count
          </p>
          <h1 className="max-w-sm text-balance text-[3.5rem] font-black leading-[0.92] tracking-[-0.065em] sm:text-7xl">
            A clearer way to run your life.
          </h1>
          <p className="mt-6 max-w-xs text-base leading-7 text-[#92928D]">
            Plan the day, keep your habits honest, and close the loop before you sleep.
          </p>
        </section>

        <section className="surface-paper rounded-[28px] bg-[#F4F4F0] p-3 text-[#151515]">
          <h2 className="section-title px-2 pb-3 pt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#92928D]">
            Your daily toolkit
          </h2>
          <div className="divide-y divide-[#151515]/10">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
                className="flex items-center gap-3 px-2 py-3.5"
            >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-[#1D1D1D] text-[#D7FF35]">
                  <Icon className="size-4.5" strokeWidth={2.2} />
              </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{label}</p>
                  <p className="truncate text-xs text-[#92928D]">{desc}</p>
              </div>
            </div>
          ))}
          </div>
        </section>

        <div className="mt-4 space-y-2">
          <Button
            className="pressable h-14 w-full rounded-[18px] bg-[#D7FF35] text-base font-bold text-[#151515] hover:bg-[#D7FF35]/90 active:scale-[0.985] focus-visible:ring-[#D7FF35]/60"
            onClick={() => navigate('/morning')}
          >
            Start your day
            <ArrowUpRight className="size-5" />
          </Button>
          <Button
            variant="ghost"
            className="pressable h-12 w-full rounded-[16px] text-sm font-semibold text-[#92928D] hover:bg-white/5 hover:text-white active:scale-[0.985] focus-visible:ring-[#D7FF35]/60"
            onClick={() => navigate('/dashboard')}
          >
            Go to dashboard
          </Button>
        </div>
      </div>
    </main>
  )
}