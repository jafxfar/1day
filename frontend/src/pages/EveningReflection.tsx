
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSaveEveningReflection } from '../hooks/backend/checkins'
import { useGetHabits } from '../hooks/backend/habits'
import { useApp } from '../context/AppContext'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { ChevronLeft, Moon, Sparkles } from 'lucide-react'
import { cast } from '../lib/types'
import { useEffect } from 'react'

const EVENING_TAGS = [
  'productive','tired','grateful','challenged','inspired',
  'social','learning','peaceful','stressed','happy',
  'creative','focused','restless','joyful',
]

const AI_SUMMARIES = [
  "You've had a meaningful day. Every challenge you faced made you stronger. Rest well and come back refreshed.",
  "Today showed your resilience. The small wins you had are building something bigger. Be proud of your effort.",
  "A day of growth and reflection. Your commitment to self-improvement is admirable. Keep that momentum.",
  "Today's effort will compound over time. Trust the process, celebrate small wins, and sleep knowing you showed up.",
  "You navigated today with intention. Every step — big or small — is progress. Tomorrow is a fresh canvas.",
]

const STEPS = [
  { title: "Today's wins 🏆",   subtitle: "What did you accomplish today?" },
  { title: "Room to grow 🌱",   subtitle: "What didn't go as planned?" },
  { title: "Understanding 🔍",  subtitle: "Why did that happen?" },
  { title: "Day rating ⭐",     subtitle: "How would you rate your day?" },
  { title: "Tag your day 🏷️",  subtitle: "Pick words that describe today" },
]

export default function EveningReflection() {
  const navigate = useNavigate()
  const { refetchCheckins } = useApp()
  const { trigger: saveReflection, loading: saving } = useSaveEveningReflection()
  const { data: rawHabits, trigger: fetchHabits } = useGetHabits()

  const [step,         setStep]         = useState(0)
  const [success,      setSuccess]      = useState('')
  const [failure,      setFailure]      = useState('')
  const [reasons,      setReasons]      = useState('')
  const [rating,       setRating]       = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [completed,    setCompleted]    = useState(false)

  useEffect(() => { void fetchHabits() }, [])

  const habits          = cast.habits(rawHabits)
  const completedHabits = habits.filter(h => h.completedToday).length
  const aiSummary       = AI_SUMMARIES[Math.floor(Math.random() * AI_SUMMARIES.length)] ?? AI_SUMMARIES[0]!

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const handleNext = async () => {
    if (step < STEPS.length - 1) { setStep(s => s + 1); return }

    await saveReflection({
      rating,
      wins:     success.trim(),
      failures: failure.trim(),
      reasons:  reasons.trim(),
      tags:     selectedTags,
    })
    refetchCheckins()
    setCompleted(true)
  }

  // ── Completed screen ──────────────────────────────────────────────────────
  if (completed) {
    return (
      <div className="flex justify-center min-h-screen bg-background">
        <div className="w-full max-w-md flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Day closed ✨</h1>
          <p className="text-muted-foreground mb-8">Great reflection. Rest well tonight.</p>
          <div className="w-full bg-card border border-border rounded-2xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">AI Coach Summary</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{aiSummary}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full mb-8">
            {[
              { label: 'Day Rating',  value: `${rating}/10` },
              { label: 'Habits Done', value: `${completedHabits}/${habits.length}` },
              { label: 'Tags',        value: selectedTags.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center mb-8">
              {selectedTags.map(tag => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full bg-card border border-border text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <Button className="w-full max-w-xs rounded-2xl h-12" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // ── Wizard ────────────────────────────────────────────────────────────────
  const current = STEPS[step]!

  return (
    <div className="flex justify-center min-h-screen bg-background">
      <div className="w-full max-w-md flex flex-col min-h-screen">
        <div className="flex items-center justify-between px-4 pt-10 pb-2">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/dashboard')}
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
          <Moon className="w-5 h-5 text-muted-foreground mr-1" />
        </div>

        <div className="flex-1 px-6 py-6">
          <div className="space-y-1 mb-10">
            <h1 className="text-3xl font-bold text-foreground">{current.title}</h1>
            <p className="text-muted-foreground">{current.subtitle}</p>
          </div>

          {step === 0 && (
            <Textarea
              placeholder="I finished the project, worked out, learned something new..."
              value={success} onChange={e => setSuccess(e.target.value)}
              className="rounded-2xl min-h-[160px] text-base"
            />
          )}
          {step === 1 && (
            <Textarea
              placeholder="I didn't finish reading, got distracted by social media..."
              value={failure} onChange={e => setFailure(e.target.value)}
              className="rounded-2xl min-h-[160px] text-base"
            />
          )}
          {step === 2 && (
            <Textarea
              placeholder="I was tired and didn't plan my time well..."
              value={reasons} onChange={e => setReasons(e.target.value)}
              className="rounded-2xl min-h-[160px] text-base"
            />
          )}
          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-8xl font-bold text-foreground leading-none">{rating || '?'}</p>
                <p className="text-muted-foreground text-lg">/10</p>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: 10 }).map((_, i) => {
                  const val = i + 1
                  return (
                    <button key={val} onClick={() => setRating(val)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                        rating === val ? 'bg-primary text-primary-foreground scale-105'
                          : val <= rating ? 'bg-primary/20 text-foreground'
                          : 'bg-card border border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {val}
                    </button>
                  )
                })}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {rating >= 8 ? '🌟 Excellent day!' : rating >= 6 ? '👍 Good day' : rating >= 4 ? '😐 Neutral day' : rating > 0 ? '💪 Tough day — keep going' : 'Tap a number to rate'}
              </p>
            </div>
          )}
          {step === 4 && (
            <div className="flex flex-wrap gap-2">
              {EVENING_TAGS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    selectedTags.includes(tag)
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pb-10">
          <Button
            className="w-full h-12 text-base font-semibold rounded-2xl"
            onClick={() => void handleNext()}
            disabled={(step === 3 && rating === 0) || saving}
          >
            {saving ? 'Saving…' : step === STEPS.length - 1 ? 'Close my day 🌙' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}
