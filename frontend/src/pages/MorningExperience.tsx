
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { Slider } from '../shared/ui/slider'
import { useCheckins } from '../entities/checkins/model/useCheckinsContext'
import { useSaveMorningCheckin } from '../entities/checkins/model/useCheckins'
import { ChevronLeft, Moon, Sun, BatteryCharging, MessageSquare, Target, CheckCircle2, Smile, AlertTriangle, Frown, Meh, Zap, Laugh } from 'lucide-react'

const SLEEP_OPTIONS = [4, 5, 6, 7, 8, 9, 10] as const
const MOODS = [
  { value: 1, icon: Frown, label: 'Terrible', color: 'text-red-500' },
  { value: 2, icon: Frown, label: 'Bad', color: 'text-orange-400' },
  { value: 3, icon: Meh, label: 'Okay', color: 'text-amber-500' },
  { value: 4, icon: Smile, label: 'Good', color: 'text-green-400' },
  { value: 5, icon: Laugh, label: 'Amazing', color: 'text-green-500' },
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
    if (step < STEPS.length - 1) { setStep(s => s + 1); return }

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
    <div className="flex justify-center min-h-screen bg-background">
      <div className="w-full max-w-md flex flex-col min-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between px-2 pt-2 pb-0">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/welcome')}
            className="py-2 rounded-xl hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-1.5 h-1.5 text-foreground" />
          </button>
          <div className="flex gap-0.5 items-center">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-0.5 rounded-full transition-all duration-300 ${i < step ? 'w-1.5 bg-primary' : i === step ? 'w-2 bg-primary' : 'w-0.5 bg-muted'
                }`} />
            ))}
          </div>
          <div className="w-9" />
        </div>

        <p className="px-2 text-sm text-muted-foreground">{today}</p>

        {/* Content */}
        <div className="flex-1 px-2 py-2">
          <div className="space-y-1 mb-4">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <span>{current.title}</span>
              <current.icon className="w-8 h-8 text-primary shrink-0 animate-pulse" />
            </h1>
            <p className="text-muted-foreground">{current.subtitle}</p>
          </div>

          {/* Step 0 — Sleep */}
          {step === 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 mb-1">
                <Moon className="w-1.5 h-1.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Hours of sleep last night</span>
              </div>
              <div className="grid grid-cols-4 gap-[8px]">
                {SLEEP_OPTIONS.map(h => (
                  <button key={h} onClick={() => setSleep(h)}
                    className={`py-1.5 rounded-2xl text-base font-bold transition-all ${sleepHours === h
                        ? 'bg-primary text-primary-foreground shadow-app-sm scale-105'
                        : 'bg-card border border-border text-foreground hover:border-primary/40'
                      }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
              <div className="text-center text-sm text-muted-foreground mt-1.5 font-medium">
                {sleepHours >= 8 ? (
                  <span className="flex items-center justify-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Excellent rest!</span>
                ) : sleepHours >= 7 ? (
                  <span className="flex items-center justify-center gap-1.5"><Smile className="w-4 h-4 text-green-400" /> Good sleep</span>
                ) : sleepHours >= 6 ? (
                  <span className="flex items-center justify-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" /> A bit short</span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5"><Moon className="w-4 h-4 text-blue-400" /> Need more rest</span>
                )}
              </div>
            </div>
          )}

          {/* Step 1 — Energy */}
          {step === 1 && (
            <div className="space-y-2">
              <div className="text-center">
                <span className="text-7xl font-bold text-foreground">{energy[0]}</span>
                <span className="text-2xl text-muted-foreground">/10</span>
              </div>
              <Slider value={energy} onValueChange={setEnergy} min={1} max={10} step={1} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">Exhausted <Frown className="w-3.5 h-3.5 text-muted-foreground" /></span>
                <span className="flex items-center gap-1">Energized <Zap className="w-3.5 h-3.5 text-yellow-500" /></span>
              </div>
            </div>
          )}

          {/* Step 2 — Mood */}
          {step === 2 && (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-[8px]">
                {MOODS.map(({ value, icon: Icon, label, color }) => (
                  <button key={value} onClick={() => setMood(value)}
                    className={`flex flex-col items-center gap-2.5 py-3 rounded-2xl border transition-all ${mood === value
                        ? 'border-primary bg-primary/5 scale-105 shadow-app-sm'
                        : 'border-border bg-card hover:border-primary/40'
                      }`}
                  >
                    <Icon className={`w-6 h-6 ${color}`} />
                    <span className="text-[10px] text-muted-foreground leading-tight text-center">{label}</span>
                  </button>
                ))}
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  {(() => {
                    const activeMood = MOODS.find(m => m.value === mood)
                    if (!activeMood) return null
                    const ActiveIcon = activeMood.icon
                    return (
                      <>
                        <ActiveIcon className={`w-6 h-6 ${activeMood.color}`} />
                        <span className="font-bold text-foreground text-lg">{activeMood.label}</span>
                      </>
                    )
                  })()}
                </div>
                <p className="text-sm text-muted-foreground">
                  {mood >= 4 ? "That's wonderful! Let's make the most of today."
                    : mood === 3 ? "That's okay. Small steps lead to big changes."
                      : "It's alright. Be kind to yourself today."}
                </p>
              </div>
            </div>
          )}

          {/* Step 3 — Focus */}
          {step === 3 && (
            <div className="space-y-[14px]">
              <Input
                placeholder="Write your main focus for today..."
                value={focus}
                onChange={e => setFocus(e.target.value)}
                className="h-4 text-base bg-background!  rounded-xl"
              />
              <p className="text-xs text-muted-foreground font-medium">Quick picks:</p>
              <div className="space-y-[8px]">
                {FOCUS_SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => setFocus(s)}
                    className={`w-full text-left p-1 rounded-xl border text-sm transition-all ${focus === s
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
        <div className="px-2 pb-3">
          <Button
            className="w-full h-4 text-base font-semibold rounded-2xl"
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
