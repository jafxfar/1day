import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bot, BookOpen, Sparkles, Target } from 'lucide-react'
import { Button } from '../shared/ui/button'

type IntroStory = {
  title: string
  description: string
  icon: typeof BookOpen
}

const INTRO_STORIES: IntroStory[] = [
  {
    title: 'Keep the history of your life',
    description: 'Capture moments, wins, and lessons so every day becomes part of your story.',
    icon: BookOpen,
  },
  {
    title: 'Achieve goals together with AI',
    description: 'Turn your ambitions into clear daily steps with practical support from your AI coach.',
    icon: Target,
  },
  {
    title: 'Understand yourself better every day',
    description: 'Reflect consistently and notice patterns in mood, energy, and progress.',
    icon: Bot,
  },
]

export default function Introduction() {
  const navigate = useNavigate()
  const [storyIndex, setStoryIndex] = useState(0)
  const isFirstStory = storyIndex === 0
  const isLastStory = storyIndex === INTRO_STORIES.length - 1
  const activeStory = INTRO_STORIES[storyIndex]
  const ActiveStoryIcon = activeStory.icon

  const handleGoBack = () => {
    if (isFirstStory) {
      return
    }

    setStoryIndex(previousIndex => previousIndex - 1)
  }

  const handleGoNext = () => {
    if (isLastStory) {
      navigate('/auth')
      return
    }

    setStoryIndex(previousIndex => previousIndex + 1)
  }

  const handleSkip = () => {
    navigate('/auth')
  }

  const progressLabel = useMemo(
    () => `Story ${storyIndex + 1} of ${INTRO_STORIES.length}`,
    [storyIndex],
  )

  return (
    <main className="app-page flex min-h-dvh justify-center bg-[#141414] px-4 py-4 text-[#F4F4F0] sm:px-6 sm:py-6">
      <div className="surface-dark flex w-full max-w-md flex-col overflow-hidden rounded-[32px] bg-[#1D1D1D] px-5 pb-6 pt-5 sm:px-7 sm:pb-8">
        <header className="app-header flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-11 items-center justify-center rounded-[16px] bg-[#D7FF35] text-[#151515]">
              <Sparkles className="size-5" strokeWidth={2.4} />
            </div>
            <span className="text-sm font-semibold tracking-[-0.01em]">Life OS</span>
          </div>

          <button
            type="button"
            aria-label="Skip introduction"
            onClick={handleSkip}
            className="pressable rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-[#92928D] transition hover:text-[#F4F4F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35]/70"
          >
            Skip
          </button>
        </header>

        <div className="mt-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D7FF35]">
            First-time setup
          </p>
          <p className="text-xs font-semibold text-[#92928D]" aria-live="polite">
            {progressLabel}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2" role="presentation">
            {INTRO_STORIES.map((story, index) => (
              <div
                key={story.title}
                className={`h-1.5 rounded-full transition ${
                  index <= storyIndex ? 'bg-[#D7FF35]' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        <section className="flex flex-1 flex-col justify-center py-14 sm:py-20">
          <div className="mb-6 flex size-14 items-center justify-center rounded-[18px] bg-[#F4F4F0] text-[#151515]">
            <ActiveStoryIcon className="size-6" strokeWidth={2.2} />
          </div>
          <h1 className="max-w-sm text-balance text-[2.8rem] font-black leading-[0.95] tracking-[-0.05em] sm:text-6xl">
            {activeStory.title}
          </h1>
          <p className="mt-5 max-w-sm text-base leading-7 text-[#92928D]">
            {activeStory.description}
          </p>
        </section>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleGoBack}
            disabled={isFirstStory}
            className="pressable h-12 w-full rounded-[16px] text-sm font-semibold text-[#92928D] hover:bg-white/5 hover:text-white active:scale-[0.985] focus-visible:ring-[#D7FF35]/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft className="size-4.5" />
            Back
          </Button>
          <Button
            type="button"
            onClick={handleGoNext}
            className="pressable h-12 w-full rounded-[16px] bg-[#D7FF35] text-sm font-bold text-[#151515] hover:bg-[#D7FF35]/90 active:scale-[0.985] focus-visible:ring-[#D7FF35]/60"
          >
            {isLastStory ? 'Continue' : 'Next'}
            <ArrowRight className="size-4.5" />
          </Button>
        </div>
      </div>
    </main>
  )
}
