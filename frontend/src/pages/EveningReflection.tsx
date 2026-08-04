import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSaveEveningReflection } from '../entities/checkins/model/useCheckins'
import { useGetHabits } from '../entities/habits/model/useHabits'
import { useCheckins } from '../entities/checkins/model/useCheckinsContext'
import { Button } from '../shared/ui/button'
import { Textarea } from '../shared/ui/textarea'
import {
  ChevronLeft,
  Moon,
  Sparkles,
  Smile,
  Meh,
  Frown,
  ChevronDown,
  ChevronUp,
  Tag,
  Loader2,
} from 'lucide-react'

type EveningPhase = 'entry' | 'thinking' | 'summary'

const EVENING_TAGS = [
  'productive', 'tired', 'grateful', 'challenged', 'inspired',
  'social', 'learning', 'peaceful', 'stressed', 'happy',
]

const PRAISE_SUMMARIES = [
  'You carried today with real intention. That kind of showing up compounds — rest knowing you earned it.',
  'A strong close. The wins you noticed today are the quiet proof that your effort is landing.',
  'You finished the loop with clarity. Sleep well — tomorrow starts from a solid place.',
]

const SUPPORT_SUMMARIES = [
  'A mixed day still counts. You paused, named it, and closed the loop — that honesty is progress.',
  'Not every day sings. You still showed up and reflected — that steadiness builds something lasting.',
  'You held the middle ground with care. Rest tonight; small course-corrections start tomorrow.',
]

const ENCOURAGE_SUMMARIES = [
  'Hard days deserve gentleness, not judgment. You closed the loop — that alone is courage.',
  'Today was heavy, and you still made space to notice it. Rest. Tomorrow is a clean page.',
  'Showing up on a tough day matters more than a perfect score. Be kind to yourself tonight.',
]

const pickSummary = (rating: number, salt: number): string => {
  const pool =
    rating >= 7 ? PRAISE_SUMMARIES
      : rating >= 4 ? SUPPORT_SUMMARIES
        : ENCOURAGE_SUMMARIES
  return pool[salt % pool.length] ?? pool[0]!
}

const getRatingFeedback = (rating: number) => {
  if (rating >= 8) {
    return { icon: Sparkles, label: 'A strong day', tone: 'text-[#D7FF35]' }
  }
  if (rating >= 6) {
    return { icon: Smile, label: 'A good day', tone: 'text-[#F4F4F0]' }
  }
  if (rating >= 4) {
    return { icon: Meh, label: 'A mixed day', tone: 'text-[#92928D]' }
  }
  if (rating > 0) {
    return { icon: Frown, label: 'A hard day — still worth noting', tone: 'text-[#92928D]' }
  }
  return { icon: null, label: 'Choose the number that feels honest', tone: 'text-[#92928D]' }
}

export default function EveningReflection() {
  const navigate = useNavigate()
  const { eveningReflection, hasCompletedEvening, refetch: refetchCheckins } = useCheckins()
  const { trigger: saveReflection, loading: saving } = useSaveEveningReflection()
  const { data: habits = [], trigger: fetchHabits } = useGetHabits()

  const [rating, setRating] = useState(0)
  const [note, setNote] = useState('')
  const [showDeep, setShowDeep] = useState(false)
  const [success, setSuccess] = useState('')
  const [failure, setFailure] = useState('')
  const [reasons, setReasons] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [phase, setPhase] = useState<EveningPhase>(() =>
    hasCompletedEvening ? 'summary' : 'entry',
  )

  useEffect(() => {
    void fetchHabits()
  }, [fetchHabits])

  useEffect(() => {
    if (hasCompletedEvening && phase === 'entry') {
      setPhase('summary')
    }
  }, [hasCompletedEvening, phase])

  const completedHabits = habits.filter(h => h.completedToday).length
  const displayRating = rating > 0 ? rating : (eveningReflection?.rating ?? 0)
  const ratingFeedback = getRatingFeedback(rating)

  const aiSummary = useMemo(
    () => pickSummary(
      displayRating || 5,
      displayRating + selectedTags.length + completedHabits,
    ),
    [completedHabits, displayRating, selectedTags.length],
  )

  const summaryToneLabel =
    displayRating >= 7 ? 'Praise'
      : displayRating >= 4 ? 'Support'
        : 'Encouragement'

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    )
  }

  const handleToggleDeep = () => {
    setShowDeep(value => !value)
  }

  const handleCloseDay = async () => {
    if (rating === 0) return

    const wins = success.trim() || note.trim()
    await saveReflection({
      rating,
      wins,
      failures: failure.trim(),
      reasons: reasons.trim(),
      tags: selectedTags,
    })
    refetchCheckins()
    setPhase('thinking')
  }

  useEffect(() => {
    if (phase !== 'thinking') return

    const timer = window.setTimeout(() => {
      setPhase('summary')
    }, 750)

    return () => window.clearTimeout(timer)
  }, [phase])

  const handleDone = () => {
    navigate('/dashboard')
  }

  if (phase === 'thinking') {
    return (
      <main className="app-page min-h-dvh bg-[#141414] px-4 py-4 text-[#F4F4F0] sm:px-6 sm:py-6">
        <div className="surface-dark mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col items-center justify-center rounded-[32px] bg-[#1D1D1D] p-5 text-center sm:min-h-[calc(100dvh-3rem)] sm:p-7">
          <Loader2 className="size-8 animate-spin text-[#D7FF35]" aria-hidden="true" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#D7FF35]">
            Reading your day
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">
            Closing the loop…
          </h1>
          <p className="mt-3 max-w-xs text-sm text-[#92928D]">
            A short note for how today went.
          </p>
        </div>
      </main>
    )
  }

  if (phase === 'summary') {
    return (
      <main className="app-page min-h-dvh bg-[#141414] px-4 py-4 text-[#F4F4F0] sm:px-6 sm:py-6">
        <div className="surface-dark mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-[32px] bg-[#1D1D1D] p-5 sm:min-h-[calc(100dvh-3rem)] sm:p-7">
          <header className="app-header flex items-center justify-between">
            <button
              type="button"
              aria-label="Back to dashboard"
              onClick={handleDone}
              className="icon-button pressable flex size-11 items-center justify-center rounded-[16px] border border-white/10 transition hover:bg-white/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35]"
            >
              <ChevronLeft className="size-5" />
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#92928D]">
              AI Summary
            </p>
            <span className="w-11" aria-hidden="true" />
          </header>

          <section className="flex flex-1 flex-col justify-center gap-6 py-6">
            <div>
              <div className="mb-4 flex size-12 items-center justify-center rounded-[16px] bg-[#D7FF35] text-[#151515]">
                <Sparkles className="size-6" strokeWidth={2.2} />
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#D7FF35]">
                Day closed · {summaryToneLabel}
              </p>
              <h1 className="text-balance text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl">
                Your day, in one note
              </h1>
              <p className="mt-3 text-sm text-[#92928D]">
                Rest well — you showed up and closed the loop.
              </p>
            </div>

            <section
              className="rounded-[28px] border border-white/10 bg-[#292929] p-5 text-[#F4F4F0]"
              aria-label="AI day summary"
            >
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="size-4 text-[#D7FF35]" />
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#92928D]">
                  Coach note
                </h2>
              </div>
              <p className="text-base leading-7">{aiSummary}</p>
            </section>

            <dl className="grid grid-cols-2 divide-x divide-white/10 rounded-[24px] border border-white/10 py-4">
              <div className="text-center">
                <dd className="text-xl font-black tabular-nums">{displayRating || '—'}/10</dd>
                <dt className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#92928D]">
                  Rating
                </dt>
              </div>
              <div className="text-center">
                <dd className="text-xl font-black tabular-nums">
                  {completedHabits}/{habits.length}
                </dd>
                <dt className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#92928D]">
                  Habits
                </dt>
              </div>
            </dl>
          </section>

          <footer>
            <Button
              className="pressable h-14 w-full rounded-[18px] bg-[#D7FF35] text-base font-bold text-[#151515] hover:bg-[#D7FF35]/90 active:scale-[0.985] focus-visible:ring-[#D7FF35]/60"
              onClick={handleDone}
            >
              Done
            </Button>
          </footer>
        </div>
      </main>
    )
  }

  const FeedbackIcon = ratingFeedback.icon

  return (
    <main className="app-page min-h-dvh bg-[#141414] px-4 py-4 text-[#F4F4F0] sm:px-6 sm:py-6">
      <div className="surface-dark mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-[32px] bg-[#1D1D1D] p-5 sm:min-h-[calc(100dvh-3rem)] sm:p-7">
        <header className="app-header flex items-center justify-between">
          <button
            type="button"
            aria-label="Back to dashboard"
            onClick={() => navigate('/dashboard')}
            className="icon-button pressable flex size-11 items-center justify-center rounded-[16px] border border-white/10 transition hover:bg-white/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35]"
          >
            <ChevronLeft className="size-5" />
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#92928D]">Evening</p>
          <span className="w-11" aria-hidden="true" />
        </header>

        <section className="flex flex-1 flex-col gap-5 overflow-y-auto py-5">
          <div>
            <div className="mb-4 flex size-12 items-center justify-center rounded-[16px] bg-[#D7FF35] text-[#151515]">
              <Moon className="size-6" strokeWidth={2.2} />
            </div>
            <h1 className="text-balance text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl">
              Close your day
            </h1>
            <p className="mt-3 text-sm text-[#92928D]">
              Rate the day, optional note, done.
            </p>
          </div>

          {/* Rating — dark surface block */}
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#92928D]">
              How was today?
            </p>
            <div className="mb-5 flex items-end justify-center gap-1">
              <span className="text-7xl font-black leading-none tracking-[-0.07em] tabular-nums transition-all">
                {rating || '—'}
              </span>
              <span className="mb-2 text-xl font-bold text-[#92928D]">/10</span>
            </div>
            <div className="grid grid-cols-5 gap-2" role="group" aria-label="Day rating out of 10">
              {Array.from({ length: 10 }).map((_, i) => {
                const value = i + 1
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Rate day ${value} out of 10`}
                    aria-pressed={rating === value}
                    onClick={() => setRating(value)}
                    className={`pressable min-h-11 rounded-[14px] text-sm font-black transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35] ${
                      rating === value
                        ? 'bg-[#D7FF35] text-[#151515]'
                        : 'bg-white/10 text-[#92928D] hover:bg-white/15 hover:text-[#F4F4F0]'
                    }`}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
            <div className={`mt-4 flex min-h-6 items-center justify-center gap-2 text-sm font-semibold ${ratingFeedback.tone}`}>
              {FeedbackIcon ? <FeedbackIcon className="size-4 shrink-0" /> : null}
              <span>{ratingFeedback.label}</span>
            </div>
          </div>

          {/* Note — elevated dark section */}
          <div className="rounded-[28px] border border-white/10 bg-[#292929] p-4 text-[#F4F4F0] sm:p-5">
            <label
              htmlFor="evening-note"
              className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#92928D]"
            >
              What mattered today?
            </label>
            <p className="mb-3 text-xs text-[#92928D]">Optional — one honest line is enough.</p>
            <Textarea
              id="evening-note"
              aria-label="Evening note"
              placeholder="A win, a feeling, or something you want to remember…"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="min-h-32 rounded-[18px] p-4 text-base leading-7"
            />

            {/* Deep reflection — lighter weight */}
            <div className="mt-4 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={handleToggleDeep}
                className="pressable flex w-full items-center justify-between rounded-[12px] py-2 text-left text-xs font-semibold text-[#92928D] transition hover:text-[#F4F4F0]"
                aria-expanded={showDeep}
                aria-controls="deep-reflection-panel"
              >
                <span>More reflection</span>
                {showDeep ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </button>

              {showDeep && (
                <div
                  id="deep-reflection-panel"
                  className="mt-3 space-y-4 animate-in fade-in duration-200"
                >
                  <div>
                    <label
                      htmlFor="wins"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#92928D]"
                    >
                      Wins
                    </label>
                    <Textarea
                      id="wins"
                      value={success}
                      onChange={e => setSuccess(e.target.value)}
                      placeholder="What moved forward?"
                      className="min-h-20 rounded-[16px] p-3 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="failures"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#92928D]"
                    >
                      Room to grow
                    </label>
                    <Textarea
                      id="failures"
                      value={failure}
                      onChange={e => setFailure(e.target.value)}
                      placeholder="What did not go to plan?"
                      className="min-h-20 rounded-[16px] p-3 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reasons"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#92928D]"
                    >
                      Why
                    </label>
                    <Textarea
                      id="reasons"
                      value={reasons}
                      onChange={e => setReasons(e.target.value)}
                      placeholder="What got in the way?"
                      className="min-h-20 rounded-[16px] p-3 text-sm"
                    />
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#92928D]">
                      <Tag className="size-3.5" /> Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {EVENING_TAGS.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          aria-pressed={selectedTags.includes(tag)}
                          onClick={() => handleToggleTag(tag)}
                          className={`pressable rounded-[14px] px-3 py-2 text-xs font-semibold transition active:scale-95 ${
                            selectedTags.includes(tag)
                              ? 'bg-[#D7FF35] text-[#151515]'
                              : 'bg-white/6 text-[#92928D] hover:bg-white/10 hover:text-[#F4F4F0]'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="pt-2">
          <Button
            className="pressable h-14 w-full rounded-[18px] bg-[#D7FF35] text-base font-bold text-[#151515] hover:bg-[#D7FF35]/90 active:scale-[0.985] focus-visible:ring-[#D7FF35]/60"
            onClick={() => void handleCloseDay()}
            disabled={rating === 0 || saving}
          >
            {saving ? (
              'Saving…'
            ) : (
              <span className="flex items-center gap-2">
                Close my day
                <Moon className="size-4" />
              </span>
            )}
          </Button>
          {rating === 0 && (
            <p className="mt-2 text-center text-xs text-[#92928D]">Pick a rating to continue</p>
          )}
        </footer>
      </div>
    </main>
  )
}
