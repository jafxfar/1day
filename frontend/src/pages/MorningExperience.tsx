import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { Slider } from '../shared/ui/slider'
import { useCheckins } from '../entities/checkins/model/useCheckinsContext'
import { useSaveMorningCheckin } from '../entities/checkins/model/useCheckins'
import { useGetGoals } from '../entities/goals/model/useGoals'
import {
  buildFocusSuggestions,
  getGoalNodeLabel,
  pickMainGoal,
} from '../shared/lib/pickMainGoal'
import {
  BatteryCharging,
  ChevronLeft,
  Frown,
  Laugh,
  Meh,
  Moon,
  Smile,
  Sun,
  Target,
  Zap,
} from 'lucide-react'

const SLEEP_OPTIONS = [5, 6, 7, 8, 9] as const
const MOODS = [
  { value: 1, icon: Frown, label: 'Bad' },
  { value: 2, icon: Frown, label: 'Low' },
  { value: 3, icon: Meh, label: 'Okay' },
  { value: 4, icon: Smile, label: 'Good' },
  { value: 5, icon: Laugh, label: 'Great' },
]

export default function MorningExperience() {
  const navigate = useNavigate()
  const { hasCompletedMorning, isLoading: isLoadingCheckins, refetch: refetchCheckins } = useCheckins()
  const { trigger: saveCheckin, loading: saving } = useSaveMorningCheckin()
  const { data: goals = [], trigger: fetchGoals } = useGetGoals()

  const [sleepHours, setSleep] = useState(7)
  const [energy, setEnergy] = useState([7])
  const [mood, setMood] = useState<number | null>(null)
  const [focus, setFocus] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    void fetchGoals()
  }, [fetchGoals])

  useEffect(() => {
    if (!isLoadingCheckins && hasCompletedMorning) {
      navigate('/dashboard', { replace: true })
    }
  }, [hasCompletedMorning, isLoadingCheckins, navigate])

  const recommendedGoal = useMemo(() => pickMainGoal(goals), [goals])
  const focusSuggestions = useMemo(
    () => buildFocusSuggestions(recommendedGoal),
    [recommendedGoal],
  )

  useEffect(() => {
    if (!focus && focusSuggestions[0]) {
      setFocus(focusSuggestions[0])
    }
  }, [focus, focusSuggestions])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const canStart = mood !== null && focus.trim().length > 0

  const handlePickFocus = (value: string) => {
    setFocus(value)
  }

  const handleStartDay = async () => {
    if (mood === null) return

    const focusText = focus.trim() || focusSuggestions[0] || 'Make progress today'

    await saveCheckin({
      sleepHours,
      energy: energy[0] ?? 7,
      mood,
      focusText,
    })

    refetchCheckins()
    navigate('/dashboard', { replace: true })
  }

  const handleToggleDetails = () => {
    setShowDetails(value => !value)
  }

  return (
    <main className="app-page min-h-dvh bg-[#141414] px-4 py-4 text-[#F4F4F0] sm:px-6 sm:py-6">
      <div className="surface-dark mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-[32px] bg-[#1D1D1D] p-5 sm:min-h-[calc(100dvh-3rem)] sm:p-7">
        <header className="app-header flex items-center justify-between">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="icon-button pressable flex size-11 items-center justify-center rounded-[16px] border border-white/10 transition hover:bg-white/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35]"
          >
            <ChevronLeft className="size-5" />
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#92928D]">{today}</p>
          <span className="w-11" aria-hidden="true" />
        </header>

        <section className="flex flex-1 flex-col gap-6 py-6">
          <div>
            <div className="mb-4 flex size-12 items-center justify-center rounded-[16px] bg-[#D7FF35] text-[#151515]">
              <Sun className="size-6" strokeWidth={2.2} />
            </div>
            <h1 className="text-balance text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl">
              How are you today?
            </h1>
            <p className="mt-3 text-sm text-[#92928D]">
              Three taps: mood, focus, start.
            </p>
          </div>

          <div className="space-y-5 rounded-[28px] border border-white/10 bg-[#292929] p-4 text-[#F4F4F0] sm:p-5">
            {/* Touch 1: mood */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#92928D]">
                Mood
              </p>
              <div className="grid grid-cols-5 gap-2" role="group" aria-label="Today's mood">
                {MOODS.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={label}
                    aria-pressed={mood === value}
                    onClick={() => setMood(value)}
                    className={`pressable flex min-h-18 flex-col items-center justify-center gap-1.5 rounded-[16px] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35] ${
                      mood === value ? 'bg-[#1D1D1D] text-[#D7FF35]' : 'bg-white/6 text-[#92928D] hover:bg-white/10 hover:text-[#F4F4F0]'
                    }`}
                  >
                    <Icon className="size-5" />
                    <span className="text-[10px] font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Touch 2: focus quick pick */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Target className="size-4 text-[#92928D]" />
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#92928D]">
                  Today's focus
                </p>
              </div>

              {recommendedGoal && (
                <p className="mb-3 text-xs leading-5 text-[#92928D]">
                  From your {getGoalNodeLabel(recommendedGoal.nodeType)}: {recommendedGoal.title}
                </p>
              )}

              <div className="space-y-2" role="listbox" aria-label="Focus suggestions">
                {focusSuggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    role="option"
                    aria-selected={focus === suggestion}
                    aria-pressed={focus === suggestion}
                    onClick={() => handlePickFocus(suggestion)}
                    className={`pressable w-full rounded-[16px] px-4 py-3 text-left text-sm font-semibold transition active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35] ${
                      focus === suggestion ? 'bg-[#1D1D1D] text-[#D7FF35]' : 'bg-white/6 text-[#92928D] hover:bg-white/10 hover:text-[#F4F4F0]'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <Input
                id="daily-focus"
                aria-label="Custom focus"
                placeholder="Or type your own…"
                value={focusSuggestions.includes(focus) ? '' : focus}
                onChange={e => setFocus(e.target.value)}
                className="mt-3 h-12 rounded-[16px] text-sm"
              />
            </div>

            {/* Optional sleep/energy — not required for 3-touch path */}
            <div>
              <button
                type="button"
                onClick={handleToggleDetails}
                className="pressable text-xs font-semibold text-[#92928D] underline-offset-2 hover:text-[#F4F4F0] hover:underline"
                aria-expanded={showDetails}
              >
                {showDetails ? 'Hide sleep & energy' : 'Adjust sleep & energy (optional)'}
              </button>

              {showDetails && (
                <div className="mt-4 space-y-5">
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#92928D]">
                      <Moon className="size-3.5" /> Sleep
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {SLEEP_OPTIONS.map(h => (
                        <button
                          key={h}
                          type="button"
                          aria-pressed={sleepHours === h}
                          onClick={() => setSleep(h)}
                          className={`pressable min-h-11 rounded-[14px] text-sm font-black transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35] ${
                            sleepHours === h
                              ? 'bg-[#1D1D1D] text-[#D7FF35]'
                              : 'bg-white/6 text-[#92928D] hover:bg-white/10 hover:text-[#F4F4F0]'
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-[#92928D]">
                      <span className="flex items-center gap-2">
                        <BatteryCharging className="size-3.5" /> Energy
                      </span>
                      <span className="tabular-nums text-[#F4F4F0]">{energy[0]}/10</span>
                    </p>
                    <Slider
                      value={energy}
                      onValueChange={setEnergy}
                      min={1}
                      max={10}
                      step={1}
                      aria-label="Energy level"
                    />
                    <div className="mt-2 flex justify-between text-[10px] font-semibold text-[#92928D]">
                      <span className="flex items-center gap-1"><Frown className="size-3" /> Low</span>
                      <span className="flex items-center gap-1">High <Zap className="size-3" /></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <footer>
          <Button
            className="pressable h-14 w-full rounded-[18px] bg-[#D7FF35] text-base font-bold text-[#151515] hover:bg-[#D7FF35]/90 active:scale-[0.985] focus-visible:ring-[#D7FF35]/60"
            onClick={() => void handleStartDay()}
            disabled={!canStart || saving}
          >
            {saving ? 'Saving…' : 'Start my day'}
          </Button>
          {!mood && (
            <p className="mt-2 text-center text-xs text-[#92928D]">Pick a mood to continue</p>
          )}
          {mood && !focus.trim() && focusSuggestions.length === 0 && (
            <p className="mt-2 text-center text-xs text-[#92928D]">Add a focus for today</p>
          )}
        </footer>
      </div>
    </main>
  )
}
