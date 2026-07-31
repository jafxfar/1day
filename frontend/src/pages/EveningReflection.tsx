
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSaveEveningReflection } from '../entities/checkins/model/useCheckins'
import { useGetHabits } from '../entities/habits/model/useHabits'
import { useCheckins } from '../entities/checkins/model/useCheckinsContext'
import { Button } from '../shared/ui/button'
import { Textarea } from '../shared/ui/textarea'
import { ChevronLeft, Moon, Sparkles, Trophy, Sprout, Search, Star, Tag, Smile, Meh, Frown } from 'lucide-react'

const EVENING_TAGS = [
  'productive', 'tired', 'grateful', 'challenged', 'inspired',
  'social', 'learning', 'peaceful', 'stressed', 'happy',
  'creative', 'focused', 'restless', 'joyful',
]

const AI_SUMMARIES = [
  "You've had a meaningful day. Every challenge you faced made you stronger. Rest well and come back refreshed.",
  "Today showed your resilience. The small wins you had are building something bigger. Be proud of your effort.",
  "A day of growth and reflection. Your commitment to self-improvement is admirable. Keep that momentum.",
  "Today's effort will compound over time. Trust the process, celebrate small wins, and sleep knowing you showed up.",
  "You navigated today with intention. Every step — big or small — is progress. Tomorrow is a fresh canvas.",
]

const STEPS = [
  { title: "Today's wins", icon: Trophy, subtitle: "What did you accomplish today?" },
  { title: "Room to grow", icon: Sprout, subtitle: "What didn't go as planned?" },
  { title: "Understanding", icon: Search, subtitle: "Why did that happen?" },
  { title: "Day rating", icon: Star, subtitle: "How would you rate your day?" },
  { title: "Tag your day", icon: Tag, subtitle: "Pick words that describe today" },
]

export default function EveningReflection() {
  const navigate = useNavigate()
  const { refetch: refetchCheckins } = useCheckins()
  const { trigger: saveReflection, loading: saving } = useSaveEveningReflection()
  const { data: habits = [], trigger: fetchHabits } = useGetHabits()

  const [step, setStep] = useState(0)
  const [success, setSuccess] = useState('')
  const [failure, setFailure] = useState('')
  const [reasons, setReasons] = useState('')
  const [rating, setRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [completed, setCompleted] = useState(false)

  useEffect(() => { void fetchHabits() }, [fetchHabits])
  const completedHabits = habits.filter(h => h.completedToday).length
  const aiSummary = AI_SUMMARIES[(rating + selectedTags.length) % AI_SUMMARIES.length] ?? AI_SUMMARIES[0]!

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
      return
    }

    await saveReflection({
      rating,
      wins: success.trim(),
      failures: failure.trim(),
      reasons: reasons.trim(),
      tags: selectedTags,
    })
    refetchCheckins()
    setCompleted(true)
  }

  if (completed) {
    return (
      <main className="app-page min-h-dvh bg-[#141414] px-4 py-4 text-[#F4F4F0] sm:px-6 sm:py-6">
        <div className="surface-dark mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col justify-center rounded-[32px] bg-[#1D1D1D] p-5 text-center sm:min-h-[calc(100dvh-3rem)] sm:p-7">
          <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-[18px] bg-[#D7FF35] text-[#151515]">
            <Sparkles className="size-6" />
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#D7FF35]">Reflection saved</p>
          <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.055em]">Day closed.</h1>
          <p className="mt-4 text-[#92928D]">You showed up, looked back, and made the day useful.</p>

          <section className="surface-paper mt-8 rounded-[28px] bg-[#F4F4F0] p-5 text-left text-[#151515]">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-4" />
              <h2 className="section-title text-xs font-bold uppercase tracking-[0.14em] text-[#92928D]">Coach note</h2>
            </div>
            <p className="text-sm leading-6">{aiSummary}</p>
          </section>

          <dl className="mt-4 grid grid-cols-3 divide-x divide-white/10 rounded-[24px] border border-white/10 py-4">
            {[
              { label: 'Rating', value: `${rating}/10` },
              { label: 'Habits', value: `${completedHabits}/${habits.length}` },
              { label: 'Tags', value: selectedTags.length },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <dd className="text-xl font-black tabular-nums">{value}</dd>
                <dt className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#92928D]">{label}</dt>
              </div>
            ))}
          </dl>

          {selectedTags.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {selectedTags.map(tag => (
                <span key={tag} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#92928D]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <Button
            className="pressable mt-8 h-14 w-full rounded-[18px] bg-[#D7FF35] text-base font-bold text-[#151515] hover:bg-[#D7FF35]/90 active:scale-[0.985] focus-visible:ring-[#D7FF35]/60"
            onClick={() => navigate('/dashboard')}
          >
            Back to dashboard
          </Button>
        </div>
      </main>
    )
  }

  const current = STEPS[step]!

  return (
    <main className="app-page min-h-dvh bg-[#141414] px-4 py-4 text-[#F4F4F0] sm:px-6 sm:py-6">
      <div className="surface-dark mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-[32px] bg-[#1D1D1D] p-5 sm:min-h-[calc(100dvh-3rem)] sm:p-7">
        <header className="app-header flex items-center justify-between">
          <button
            type="button"
            aria-label={step > 0 ? 'Go to previous question' : 'Back to dashboard'}
            onClick={() => (step > 0 ? setStep(s => s - 1) : navigate('/dashboard'))}
            className="icon-button pressable flex size-11 items-center justify-center rounded-[16px] border border-white/10 transition hover:bg-white/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35]"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? 'w-5 bg-[#D7FF35]' : 'w-2 bg-white/15'}`} />
            ))}
          </div>
          <span className="text-xs font-bold tabular-nums text-[#92928D]">{step + 1}/{STEPS.length}</span>
        </header>

        <section className="flex flex-1 flex-col py-8">
          <div className="mb-8">
            <div className="mb-4 flex size-12 items-center justify-center rounded-[16px] bg-[#D7FF35] text-[#151515]">
              <current.icon className="size-6" strokeWidth={2.2} />
            </div>
            <h1 className="text-balance text-5xl font-black leading-[0.95] tracking-[-0.055em]">{current.title}</h1>
            <p className="mt-3 text-base text-[#92928D]">{current.subtitle}</p>
          </div>

          <div className="surface-paper rounded-[28px] bg-[#F4F4F0] p-4 text-[#151515] sm:p-5">
            {step === 0 && (
              <Textarea
                aria-label="Today's wins"
                placeholder="What moved forward today?"
                value={success}
                onChange={e => setSuccess(e.target.value)}
                className="min-h-52 rounded-[18px] border-[#151515]/15 bg-[#F4F4F0] p-4 text-base leading-7 text-[#151515] placeholder:text-[#92928D] focus-visible:border-[#151515] focus-visible:ring-[#151515]/20"
              />
            )}
            {step === 1 && (
              <Textarea
                aria-label="Room to grow"
                placeholder="What did not go to plan?"
                value={failure}
                onChange={e => setFailure(e.target.value)}
                className="min-h-52 rounded-[18px] border-[#151515]/15 bg-[#F4F4F0] p-4 text-base leading-7 text-[#151515] placeholder:text-[#92928D] focus-visible:border-[#151515] focus-visible:ring-[#151515]/20"
              />
            )}
            {step === 2 && (
              <Textarea
                aria-label="Why it happened"
                placeholder="What got in the way?"
                value={reasons}
                onChange={e => setReasons(e.target.value)}
                className="min-h-52 rounded-[18px] border-[#151515]/15 bg-[#F4F4F0] p-4 text-base leading-7 text-[#151515] placeholder:text-[#92928D] focus-visible:border-[#151515] focus-visible:ring-[#151515]/20"
              />
            )}
            {step === 3 && (
              <div>
                <div className="mb-7 flex items-end justify-center">
                  <span className="text-8xl font-black leading-none tracking-[-0.07em] tabular-nums">{rating || '—'}</span>
                  <span className="mb-2 text-xl font-bold text-[#92928D]">/10</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const value = i + 1
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-label={`Rate day ${value} out of 10`}
                        aria-pressed={rating === value}
                        onClick={() => setRating(value)}
                        className={`pressable min-h-11 rounded-[14px] text-sm font-black transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151515] ${
                          rating === value ? 'bg-[#1D1D1D] text-[#D7FF35]' : 'bg-[#F4F4F0] text-[#92928D] hover:text-[#151515]'
                        }`}
                      >
                        {value}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-5 text-sm font-semibold text-[#92928D]">
                  {rating >= 8 ? (
                    <span className="flex items-center gap-2"><Sparkles className="size-4" /> A strong day</span>
                  ) : rating >= 6 ? (
                    <span className="flex items-center gap-2"><Smile className="size-4" /> A good day</span>
                  ) : rating >= 4 ? (
                    <span className="flex items-center gap-2"><Meh className="size-4" /> A mixed day</span>
                  ) : rating > 0 ? (
                    <span className="flex items-center gap-2"><Frown className="size-4" /> A hard day still worth noting</span>
                  ) : (
                    <span>Choose the number that feels honest</span>
                  )}
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="flex flex-wrap gap-2">
                {EVENING_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={selectedTags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                    className={`pressable rounded-[14px] px-3.5 py-2.5 text-sm font-semibold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151515] ${
                      selectedTags.includes(tag) ? 'bg-[#1D1D1D] text-[#D7FF35]' : 'bg-[#F4F4F0] text-[#92928D] hover:text-[#151515]'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer>
          <Button
            className="pressable h-14 w-full rounded-[18px] bg-[#D7FF35] text-base font-bold text-[#151515] hover:bg-[#D7FF35]/90 active:scale-[0.985] focus-visible:ring-[#D7FF35]/60"
            onClick={() => void handleNext()}
            disabled={(step === 3 && rating === 0) || saving}
          >
            {saving ? 'Saving…' : step === STEPS.length - 1 ? (
              <span className="flex items-center gap-2">Close my day <Moon className="size-4" /></span>
            ) : 'Continue'}
          </Button>
        </footer>
      </div>
    </main>
  )
}
