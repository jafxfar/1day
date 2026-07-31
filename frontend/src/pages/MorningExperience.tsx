
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { Slider } from '../shared/ui/slider'
import { useCheckins } from '../entities/checkins/model/useCheckinsContext'
import { useSaveMorningCheckin } from '../entities/checkins/model/useCheckins'
import { AlertTriangle, BatteryCharging, CheckCircle2, ChevronLeft, Frown, Laugh, Meh, MessageSquare, Moon, Smile, Sun, Target, Zap } from 'lucide-react'

const SLEEP_OPTIONS = [4, 5, 6, 7, 8, 9, 10] as const
const MOODS = [
  { value: 1, icon: Frown, label: 'Terrible' },
  { value: 2, icon: Frown, label: 'Bad' },
  { value: 3, icon: Meh, label: 'Okay' },
  { value: 4, icon: Smile, label: 'Good' },
  { value: 5, icon: Laugh, label: 'Amazing' },
]
const FOCUS_SUGGESTIONS = [
  'Deep work on my main project',
  'Clear inbox & communications',
  'Exercise & healthy eating',
  'Connect with loved ones',
  'Learn something new',
]
const STEPS = [
  { title: 'Good morning!', icon: Sun, subtitle: 'How did you sleep last night?' },
  { title: 'Energy check', icon: BatteryCharging, subtitle: 'Rate your current energy level' },
  { title: "Today's mood", icon: MessageSquare, subtitle: 'How are you feeling right now?' },
  { title: "Today's focus", icon: Target, subtitle: 'What is your one big priority?' },
]

export default function MorningExperience() {
  const navigate = useNavigate()
  const { refetch: refetchCheckins } = useCheckins()
  const { trigger: saveCheckin, loading: saving } = useSaveMorningCheckin()

  const [step, setStep] = useState(0)
  const [sleepHours, setSleep] = useState(7)
  const [energy, setEnergy] = useState([7])
  const [mood, setMood] = useState(3)
  const [focus, setFocus] = useState('')

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
      return
    }

    await saveCheckin({
      sleepHours,
      energy: energy[0] ?? 7,
      mood,
      focusText: focus.trim() || 'Make progress today',
    })

    refetchCheckins()
    navigate('/dashboard')
  }

  const current = STEPS[step]!

  return (
    <main className="app-page min-h-dvh bg-[#141414] px-4 py-4 text-[#F4F4F0] sm:px-6 sm:py-6">
      <div className="surface-dark mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-[32px] bg-[#1D1D1D] p-5 sm:min-h-[calc(100dvh-3rem)] sm:p-7">
        <header className="app-header flex items-center justify-between">
          <button
            type="button"
            aria-label={step > 0 ? 'Go to previous question' : 'Back to welcome'}
            onClick={() => (step > 0 ? setStep(s => s - 1) : navigate('/welcome'))}
            className="icon-button pressable flex size-11 items-center justify-center rounded-[16px] border border-white/10 transition hover:bg-white/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35]"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= step ? 'w-7 bg-[#D7FF35]' : 'w-2 bg-white/15'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold tabular-nums text-[#92928D]">
            {step + 1}/{STEPS.length}
          </span>
        </header>

        <section className="flex flex-1 flex-col py-8">
          <p className="mb-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#92928D]">{today}</p>
          <div className="mb-8">
            <div className="mb-4 flex size-12 items-center justify-center rounded-[16px] bg-[#D7FF35] text-[#151515]">
              <current.icon className="size-6" strokeWidth={2.2} />
            </div>
            <h1 className="text-balance text-5xl font-black leading-[0.95] tracking-[-0.055em]">{current.title}</h1>
            <p className="mt-3 text-base text-[#92928D]">{current.subtitle}</p>
          </div>

          <div className="surface-paper rounded-[28px] bg-[#F4F4F0] p-4 text-[#151515] sm:p-5">
            {step === 0 && (
              <div>
                <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#92928D]">
                  <Moon className="size-4" />
                  Hours slept
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {SLEEP_OPTIONS.map(h => (
                    <button
                      key={h}
                      type="button"
                      aria-pressed={sleepHours === h}
                      onClick={() => setSleep(h)}
                      className={`pressable min-h-12 rounded-[16px] text-base font-black transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151515] ${
                        sleepHours === h
                          ? 'bg-[#1D1D1D] text-[#D7FF35]'
                          : 'bg-[#F4F4F0] text-[#92928D] hover:text-[#151515]'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
                <div className="mt-5 text-sm font-semibold text-[#92928D]">
                  {sleepHours >= 8 ? (
                    <span className="flex items-center gap-2"><CheckCircle2 className="size-4" /> Excellent rest</span>
                  ) : sleepHours >= 7 ? (
                    <span className="flex items-center gap-2"><Smile className="size-4" /> Solid sleep</span>
                  ) : sleepHours >= 6 ? (
                    <span className="flex items-center gap-2"><AlertTriangle className="size-4" /> A little short</span>
                  ) : (
                    <span className="flex items-center gap-2"><Moon className="size-4" /> Protect your energy today</span>
                  )}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="py-2">
                <div className="mb-8 flex items-end justify-center">
                  <span className="text-8xl font-black leading-none tracking-[-0.07em] tabular-nums">{energy[0]}</span>
                  <span className="mb-2 text-xl font-bold text-[#92928D]">/10</span>
                </div>
                <Slider value={energy} onValueChange={setEnergy} min={1} max={10} step={1} aria-label="Energy level" />
                <div className="mt-4 flex justify-between text-xs font-semibold text-[#92928D]">
                  <span className="flex items-center gap-1.5"><Frown className="size-4" /> Exhausted</span>
                  <span className="flex items-center gap-1.5">Energized <Zap className="size-4" /></span>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="grid grid-cols-5 gap-2">
                  {MOODS.map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={label}
                      aria-pressed={mood === value}
                      onClick={() => setMood(value)}
                      className={`pressable flex min-h-20 flex-col items-center justify-center gap-2 rounded-[16px] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151515] ${
                        mood === value ? 'bg-[#1D1D1D] text-[#D7FF35]' : 'bg-[#F4F4F0] text-[#92928D] hover:text-[#151515]'
                      }`}
                    >
                      <Icon className="size-6" />
                      <span className="text-[10px] font-bold">{label}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-5 text-sm leading-6 text-[#92928D]">
                  {mood >= 4
                    ? 'Use that momentum on the work that matters.'
                    : mood === 3
                      ? 'Small, deliberate steps are enough today.'
                      : 'Lower the bar, protect your energy, and be kind to yourself.'}
                </p>
              </div>
            )}

            {step === 3 && (
              <div>
                <label htmlFor="daily-focus" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#92928D]">
                  One clear outcome
                </label>
                <Input
                  id="daily-focus"
                  placeholder="What needs your best attention?"
                  value={focus}
                  onChange={e => setFocus(e.target.value)}
                  className="h-14 rounded-[16px] border-[#151515]/15 bg-[#F4F4F0] px-4 text-base text-[#151515] placeholder:text-[#92928D] focus-visible:border-[#151515] focus-visible:ring-[#151515]/20"
                />
                <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-[0.12em] text-[#92928D]">Quick picks</p>
                <div className="space-y-2">
                  {FOCUS_SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={focus === s}
                      onClick={() => setFocus(s)}
                      className={`pressable w-full rounded-[16px] px-4 py-3 text-left text-sm font-semibold transition active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151515] ${
                        focus === s ? 'bg-[#1D1D1D] text-[#D7FF35]' : 'bg-[#F4F4F0] text-[#92928D] hover:text-[#151515]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <footer>
          <Button
            className="pressable h-14 w-full rounded-[18px] bg-[#D7FF35] text-base font-bold text-[#151515] hover:bg-[#D7FF35]/90 active:scale-[0.985] focus-visible:ring-[#D7FF35]/60"
            onClick={() => void handleNext()}
            disabled={saving}
          >
            {saving ? 'Saving…' : step === STEPS.length - 1 ? 'Start my day' : 'Continue'}
          </Button>
        </footer>
      </div>
    </main>
  )
}
