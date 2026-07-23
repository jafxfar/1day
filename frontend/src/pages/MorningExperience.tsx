
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Slider } from '../components/ui/slider'
import { useApp } from '../context/AppContext'
import { useSaveMorningCheckin } from '../hooks/backend/checkins'
import { ChevronLeft, Moon } from 'lucide-react'

const SLEEP_OPTIONS = [4, 5, 6, 7, 8, 9, 10] as const
const MOODS = [
  { value: 1, emoji: '😞', label: 'Terrible' },
  { value: 2, emoji: '😕', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Amazing' },
]
const FOCUS_SUGGESTIONS = [
  'Deep work on my main project',
  'Clear inbox & communications',
  'Exercise & healthy eating',
  'Connect with loved ones',
  'Learn something new',
]
const STEPS = [
  { title: 'Good morning! ☀️',  subtitle: 'How did you sleep last night?' },
  { title: 'Energy check 🔋',    subtitle: 'Rate your current energy level' },
  { title: "Today's mood 💭",    subtitle: 'How are you feeling right now?' },
  { title: "Today's focus 🎯",   subtitle: 'What is your one big priority?' },
]

export default function MorningExperience() {
  const navigate = useNavigate()
  const { refetchCheckins } = useApp()
  const { trigger: saveCheckin, loading: saving } = useSaveMorningCheckin()

  const [step,       setStep]   = useState(0)
  const [sleepHours, setSleep]  = useState(7)
  const [energy,     setEnergy] = useState([7])
  const [mood,       setMood]   = useState(3)
  const [focus,      setFocus]  = useState('')

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const handleNext = async () => {
    if (step < STEPS.length - 1) { setStep(s => s + 1); return }

    await saveCheckin({
      sleepHours,
      energy:    energy[0] ?? 7,
      mood,
      focusText: focus.trim() || 'Make progress today',
    })

    refetchCheckins()
    navigate('/dashboard')
  }

  const current = STEPS[step]!

  return (
    <div className="flex justify-center min-h-screen bg-background">
      <div className="w-full max-w-md flex flex-col min-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-10 pb-2">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/welcome')}
            className="p-2 rounded-xl hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex gap-1.5 items-center">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                i < step ? 'w-4 bg-primary' : i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
              }`} />
            ))}
          </div>
          <div className="w-9" />
        </div>

        <p className="px-6 text-sm text-muted-foreground">{today}</p>

        {/* Content */}
        <div className="flex-1 px-6 py-6">
          <div className="space-y-1 mb-10">
            <h1 className="text-3xl font-bold text-foreground">{current.title}</h1>
            <p className="text-muted-foreground">{current.subtitle}</p>
          </div>

          {/* Step 0 — Sleep */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Moon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Hours of sleep last night</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {SLEEP_OPTIONS.map(h => (
                  <button key={h} onClick={() => setSleep(h)}
                    className={`py-4 rounded-2xl text-base font-bold transition-all ${
                      sleepHours === h
                        ? 'bg-primary text-primary-foreground shadow-retool-sm scale-105'
                        : 'bg-card border border-border text-foreground hover:border-primary/40'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4 font-medium">
                {sleepHours >= 8 ? '✅ Excellent rest!' : sleepHours >= 7 ? '👍 Good sleep' : sleepHours >= 6 ? '⚠️ A bit short' : '😴 Need more rest'}
              </p>
            </div>
          )}

          {/* Step 1 — Energy */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <span className="text-7xl font-bold text-foreground">{energy[0]}</span>
                <span className="text-2xl text-muted-foreground">/10</span>
              </div>
              <Slider value={energy} onValueChange={setEnergy} min={1} max={10} step={1} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Exhausted 😴</span>
                <span>Energized ⚡</span>
              </div>
            </div>
          )}

          {/* Step 2 — Mood */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-5 gap-2">
                {MOODS.map(({ value, emoji, label }) => (
                  <button key={value} onClick={() => setMood(value)}
                    className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border transition-all ${
                      mood === value
                        ? 'border-primary bg-primary/5 scale-105 shadow-retool-sm'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight text-center">{label}</span>
                  </button>
                ))}
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 text-center">
                <p className="font-semibold text-foreground text-lg">
                  {MOODS.find(m => m.value === mood)?.emoji} {MOODS.find(m => m.value === mood)?.label}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {mood >= 4 ? "That's wonderful! Let's make the most of today."
                    : mood === 3 ? "That's okay. Small steps lead to big changes."
                    : "It's alright. Be kind to yourself today."}
                </p>
              </div>
            </div>
          )}

          {/* Step 3 — Focus */}
          {step === 3 && (
            <div className="space-y-4">
              <Input
                placeholder="Write your main focus for today..."
                value={focus}
                onChange={e => setFocus(e.target.value)}
                className="h-12 text-base rounded-xl"
              />
              <p className="text-xs text-muted-foreground font-medium">Quick picks:</p>
              <div className="space-y-2">
                {FOCUS_SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => setFocus(s)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      focus === s
                        ? 'border-primary bg-primary/5 text-foreground font-medium'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-6 pb-10">
          <Button
            className="w-full h-12 text-base font-semibold rounded-2xl"
            onClick={() => void handleNext()}
            disabled={saving}
          >
            {saving ? 'Saving…' : step === STEPS.length - 1 ? 'Start my day 🚀' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}
