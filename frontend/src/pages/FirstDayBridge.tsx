import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Loader2, Sparkles, Target } from 'lucide-react'
import { Button } from '../shared/ui/button'
import { useGetGoals } from '../entities/goals/model/useGoals'
import {
  useCompleteFirstDayFlow,
  useGetOnboardingState,
} from '../entities/onboarding/model/useOnboarding'
import {
  buildFocusSuggestions,
  pickMainGoal,
} from '../shared/lib/pickMainGoal'

const HABIT_SUGGESTIONS = [
  'Заправить кровать',
  'Выпить воду утром',
  'Читать 10 минут',
]

export default function FirstDayBridge() {
  const navigate = useNavigate()
  const { data: goals = [], loading: loadingGoals, trigger: fetchGoals } = useGetGoals()
  const { data: onboardingState, loading: onboardingLoading } = useGetOnboardingState()
  const { loading: completing, error, trigger: completeFirstDay } = useCompleteFirstDayFlow()
  const [screen, setScreen] = useState(0)
  const [selectedWin, setSelectedWin] = useState<string | null>(null)
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null)

  useEffect(() => {
    void fetchGoals()
  }, [fetchGoals])

  const recommendedGoal = useMemo(() => pickMainGoal(goals), [goals])
  const hasBuildHabits = (onboardingState?.setup?.buildHabits.length ?? 0) > 0
  const showHabitScreen = !hasBuildHabits

  const goalStepOptions = useMemo(
    () => buildFocusSuggestions(recommendedGoal),
    [recommendedGoal],
  )

  const screens = useMemo(() => {
    const list = ['welcome', 'goal'] as const
    if (showHabitScreen) {
      return [...list, 'habit', 'finale'] as const
    }
    return [...list, 'finale'] as const
  }, [showHabitScreen])

  const totalScreens = screens.length
  const currentScreen = screens[screen] ?? 'welcome'
  const isBusy = loadingGoals || onboardingLoading || completing
  const isLastScreen = screen === totalScreens - 1
  const userName = onboardingState?.profile?.firstName || 'друг'

  const canGoNext = useMemo(() => {
    if (currentScreen === 'goal') {
      return Boolean(selectedWin)
    }
    if (currentScreen === 'habit') {
      return Boolean(selectedHabit)
    }
    return true
  }, [currentScreen, selectedHabit, selectedWin])

  const handleNext = async () => {
    if (!canGoNext) {
      return
    }

    if (!isLastScreen) {
      setScreen(previous => previous + 1)
      return
    }

    const completed = await completeFirstDay()
    if (!completed) {
      return
    }

    navigate('/morning', { replace: true })
  }

  const handleBack = () => {
    if (screen === 0) {
      return
    }

    setScreen(previous => previous - 1)
  }

  return (
    <main className="app-page min-h-dvh bg-[#141414] px-4 py-4 text-[#F4F4F0] sm:px-6 sm:py-6">
      <div className="surface-dark mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-4xl bg-[#1D1D1D] p-5 sm:min-h-[calc(100dvh-3rem)] sm:p-7">
        <header className="mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#D7FF35]" />
              <span className="text-sm font-semibold">Life OS</span>
            </div>
            <span className="text-xs font-semibold text-[#92928D]">{screen + 1}/{totalScreens}</span>
          </div>
          <div className="grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${totalScreens}, minmax(0, 1fr))` }} aria-label={`Прогресс: экран ${screen + 1} из ${totalScreens}`}>
            {Array.from({ length: totalScreens }).map((_, index) => (
              <div key={index} className={`h-1.5 rounded-full ${index <= screen ? 'bg-[#D7FF35]' : 'bg-white/20'}`} />
            ))}
          </div>
        </header>

        <section className="flex-1">
          {currentScreen === 'welcome' && (
            <div className="space-y-5">
              <div>
                <h1 className="text-4xl font-black leading-[0.95] tracking-[-0.04em]">
                  Добро пожаловать, {userName}.
                </h1>
                <p className="mt-4 text-base leading-7 text-[#F4F4F0]">
                  Сегодня начинается история вашей Life OS.
                </p>
              </div>
              <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#D7FF35]">
                  Письмо от AI
                </p>
                <p className="text-sm leading-7 text-[#C1C1BD]">
                  Привет. Спасибо, что доверили мне сопровождать вас. Я не собираюсь оценивать ваши успехи или неудачи. Моя задача — помочь вам проживать каждый день немного лучше.
                </p>
              </article>
            </div>
          )}

          {currentScreen === 'goal' && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D7FF35]">
                Главная цель на сегодня
              </p>
              {recommendedGoal ? (
                <div className="rounded-3xl border border-[#D7FF35]/25 bg-[#D7FF35]/10 p-4">
                  <p className="text-lg font-black leading-tight">{recommendedGoal.title}</p>
                  <p className="mt-3 text-sm leading-6 text-[#92928D]">
                    Сегодня не нужно менять всю жизнь. AI говорит: сегодня нам нужен только один небольшой шаг.
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="text-3xl font-black leading-[0.98] tracking-[-0.035em]">
                    Выберите одну маленькую победу на сегодня
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#92928D]">
                    Сегодня не нужно менять всю жизнь. Один короткий шаг уже достаточно.
                  </p>
                </div>
              )}

              <div className="space-y-2" role="listbox" aria-label="Выбор маленького шага">
                {goalStepOptions.map((option) => {
                  const active = selectedWin === option
                  return (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => setSelectedWin(option)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        active
                          ? 'border-[#D7FF35] bg-[#D7FF35]/10 text-[#F4F4F0]'
                          : 'border-white/10 bg-white/5 text-[#C1C1BD] hover:bg-white/10'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {currentScreen === 'habit' && (
            <div className="space-y-4">
              <h2 className="text-3xl font-black leading-[0.98] tracking-[-0.035em]">
                Первая привычка
              </h2>
              <p className="text-sm leading-6 text-[#92928D]">
                Исследования показывают, что слишком большое количество новых привычек часто приводит к отказу от них. Начать с одной значительно проще.
              </p>
              <div className="space-y-2" role="listbox" aria-label="Выбор первой привычки">
                {HABIT_SUGGESTIONS.map((suggestion) => {
                  const active = selectedHabit === suggestion
                  return (
                    <button
                      key={suggestion}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => setSelectedHabit(suggestion)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        active
                          ? 'border-[#D7FF35] bg-[#D7FF35]/10 text-[#F4F4F0]'
                          : 'border-white/10 bg-white/5 text-[#C1C1BD] hover:bg-white/10'
                      }`}
                    >
                      {suggestion}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {currentScreen === 'finale' && (
            <div className="space-y-4">
              <h2 className="text-3xl font-black leading-[0.98] tracking-[-0.035em]">
                День №1 вашей новой главы
              </h2>
              <p className="text-sm leading-7 text-[#C1C1BD]">
                Сегодня начинается серия — 1 день. Один небольшой шаг уже запускает систему. Life OS будет рядом каждый день.
              </p>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#92928D]">Сегодня</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Target className="size-4 text-[#D7FF35]" />{selectedWin ?? 'Главная цель дня'}</div>
                  <div className="flex items-center gap-2"><Check className="size-4 text-[#D7FF35]" />{selectedHabit ?? 'Первая привычка'}</div>
                  <div className="flex items-center gap-2"><Sparkles className="size-4 text-[#D7FF35]" />Поддержка AI без давления</div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </section>

        <footer className="mt-6 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={isBusy || screen === 0}
            className="h-12 rounded-2xl text-[#92928D] hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            Назад
          </Button>
          <Button
            type="button"
            onClick={() => void handleNext()}
            disabled={isBusy || !canGoNext}
            className="h-12 rounded-2xl bg-[#D7FF35] text-sm font-bold text-[#151515] hover:bg-[#D7FF35]/90"
          >
            {isBusy && <Loader2 className="size-4 animate-spin" />}
            {isLastScreen ? 'Начать первый день' : 'Далее'}
          </Button>
        </footer>
      </div>
    </main>
  )
}
