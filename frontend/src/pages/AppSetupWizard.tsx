import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CommunicationStyle, SaveOnboardingSetupPayload } from '@life-os/contracts'
import { Check, Loader2, Sparkles } from 'lucide-react'
import { Layout } from '../shared/ui/Layout'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { Slider } from '../shared/ui/slider'
import { Textarea } from '../shared/ui/textarea'
import {
  useCompleteOnboarding,
  useGetOnboardingState,
  useSaveOnboardingSetup,
  useSkipOnboarding,
} from '../entities/onboarding/model/useOnboarding'

const MOTIVATIONS = [
  'Повысить продуктивность',
  'Следить за привычками',
  'Вести дневник',
  'Запоминать важные события',
  'Достигать целей',
  'Улучшить психологическое состояние',
  'Стать организованнее',
  'Другое',
]

const LIFE_AREAS = [
  'Здоровье',
  'Работа',
  'Учеба',
  'Финансы',
  'Семья',
  'Отношения',
  'Хобби',
  'Психологическое состояние',
]

const STYLE_ITEMS: Array<{ id: CommunicationStyle; title: string; description: string }> = [
  { id: 'careful', title: 'Заботливый', description: 'AI поддерживает, успокаивает и избегает давления' },
  { id: 'friendly', title: 'Дружелюбный', description: 'Баланс поддержки и мотивации' },
  { id: 'mentor', title: 'Наставник', description: 'Честная обратная связь и требовательность' },
  { id: 'coach', title: 'Тренер', description: 'Высокая дисциплина, прямые напоминания и фокус на результате' },
]

const TOTAL_STEPS = 8

const emptyGoalRows = ['', '', '', '', '']
const emptyBuildHabits = ['', '', '', '', '']
const emptyQuitHabits = ['', '', '', '', '']

const getCriticismDescription = (level: number) => {
  if (level <= 1) return '1 — Предпочитаю мягкую поддержку'
  if (level >= 5) return '5 — Не бойтесь говорить прямо, если это поможет мне стать лучше'
  return `${level} — Можно давать честную обратную связь`
}

const toggleValue = (items: string[], value: string) => (
  items.includes(value)
    ? items.filter(item => item !== value)
    : [...items, value]
)

const normalizeLines = (items: string[]) => (
  items.map(item => item.trim()).filter(Boolean)
)

export default function AppSetupWizard() {
  const navigate = useNavigate()
  const { data: onboardingState, loading: loadingState, trigger: fetchState } = useGetOnboardingState()
  const { loading: savingSetup, error, trigger: saveSetup } = useSaveOnboardingSetup()
  const { loading: completing, trigger: complete } = useCompleteOnboarding()
  const { loading: skipping, trigger: skip } = useSkipOnboarding()
  const [step, setStep] = useState(1)
  const [motivations, setMotivations] = useState<string[] | null>(null)
  const [lifeAreas, setLifeAreas] = useState<string[] | null>(null)
  const [communicationStyle, setCommunicationStyle] = useState<CommunicationStyle | null>(null)
  const [criticismLevel, setCriticismLevel] = useState<number | null>(null)
  const [wakeTime, setWakeTime] = useState<string | null>(null)
  const [sleepTime, setSleepTime] = useState<string | null>(null)
  const [yearlyGoals, setYearlyGoals] = useState<string[] | null>(null)
  const [buildHabits, setBuildHabits] = useState<string[] | null>(null)
  const [quitHabits, setQuitHabits] = useState<string[] | null>(null)

  useEffect(() => {
    void fetchState()
  }, [fetchState])

  const setupSource = onboardingState?.setup
  const motivationsValue = motivations ?? setupSource?.motivations ?? []
  const lifeAreasValue = lifeAreas ?? setupSource?.lifeAreas ?? []
  const communicationStyleValue = communicationStyle ?? setupSource?.communicationStyle ?? 'friendly'
  const criticismLevelValue = criticismLevel ?? setupSource?.criticismLevel ?? 3
  const wakeTimeValue = wakeTime ?? setupSource?.wakeTime ?? '07:00'
  const sleepTimeValue = sleepTime ?? setupSource?.sleepTime ?? '23:00'
  const yearlyGoalsValue = yearlyGoals ?? [...(setupSource?.yearlyGoals ?? []), ...emptyGoalRows].slice(0, 5)
  const buildHabitsValue = buildHabits ?? [...(setupSource?.buildHabits ?? []), ...emptyBuildHabits].slice(0, 5)
  const quitHabitsValue = quitHabits ?? [...(setupSource?.quitHabits ?? []), ...emptyQuitHabits].slice(0, 5)

  const payload = useMemo<SaveOnboardingSetupPayload>(() => ({
    motivations: motivationsValue,
    lifeAreas: lifeAreasValue,
    communicationStyle: communicationStyleValue,
    criticismLevel: criticismLevelValue,
    wakeTime: wakeTimeValue,
    sleepTime: sleepTimeValue,
    yearlyGoals: normalizeLines(yearlyGoalsValue),
    buildHabits: normalizeLines(buildHabitsValue),
    quitHabits: normalizeLines(quitHabitsValue),
  }), [
    buildHabitsValue,
    communicationStyleValue,
    criticismLevelValue,
    lifeAreasValue,
    motivationsValue,
    quitHabitsValue,
    sleepTimeValue,
    wakeTimeValue,
    yearlyGoalsValue,
  ])

  const canGoNext = useMemo(() => {
    if (step === 1) return motivationsValue.length > 0
    if (step === 2) return lifeAreasValue.length > 0
    if (step === 6) return payload.yearlyGoals.length > 0
    if (step === 8) return true
    return true
  }, [lifeAreasValue.length, motivationsValue.length, payload.yearlyGoals.length, step])

  const persistCurrentSetup = async () => {
    const result = await saveSetup(payload)
    return Boolean(result)
  }

  const handleNext = async () => {
    if (!canGoNext) {
      return
    }

    if (step < 8) {
      const ok = await persistCurrentSetup()
      if (!ok) {
        return
      }
      setStep(current => current + 1)
      return
    }

    const ok = await persistCurrentSetup()
    if (!ok) {
      return
    }

    const completed = await complete()
    if (!completed) {
      return
    }

    navigate('/onboarding/first-day', { replace: true })
  }

  const handleBack = () => {
    if (step <= 1) {
      navigate('/onboarding/profile')
      return
    }

    setStep(current => current - 1)
  }

  const handleSkip = async () => {
    const skipped = await skip()
    if (!skipped) {
      return
    }

    navigate('/dashboard', { replace: true })
  }

  const updateListItem = (
    list: string[],
    setList: (value: string[]) => void,
    index: number,
    value: string,
  ) => {
    const next = [...list]
    next[index] = value
    setList(next)
  }

  const isBusy = loadingState || savingSetup || completing || skipping

  return (
    <Layout hideNav={true}>
      <main className="app-page min-h-dvh bg-[#141414] px-4 py-4 text-[#F4F4F0] sm:px-6 sm:py-6">
        <div className="surface-dark mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-[32px] bg-[#1D1D1D] p-5 sm:min-h-[calc(100dvh-3rem)] sm:p-7">
          <header className="app-header flex-col items-stretch justify-start gap-0">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#D7FF35]" />
                <span className="text-sm font-semibold">Life OS setup</span>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                disabled={isBusy}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-[#92928D] hover:text-white disabled:opacity-50"
              >
                Пропустить
              </button>
            </div>
            <div className="mt-1 grid w-full grid-cols-8 gap-2" aria-label={`Прогресс настройки: шаг ${step} из ${TOTAL_STEPS}`}>
              {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                <div key={index} className={`h-1.5 rounded-full ${index < step ? 'bg-[#D7FF35]' : 'bg-white/20'}`} />
              ))}
            </div>
          </header>

          <section className="mt-6 flex-1 overflow-y-auto pr-1">
            {step === 1 && (
              <StepShell
                title="Для чего вы устанавливаете Life OS?"
                description="Можно выбрать несколько вариантов"
              >
                <ChipGrid
                  items={MOTIVATIONS}
                  selected={motivationsValue}
                  onToggle={(value) => setMotivations(previous => toggleValue(previous ?? motivationsValue, value))}
                />
              </StepShell>
            )}

            {step === 2 && (
              <StepShell
                title="Какие сферы жизни сейчас для вас наиболее важны?"
                description="Выберите направления, где хотите заметить изменения"
              >
                <ChipGrid
                  items={LIFE_AREAS}
                  selected={lifeAreasValue}
                  onToggle={(value) => setLifeAreas(previous => toggleValue(previous ?? lifeAreasValue, value))}
                />
              </StepShell>
            )}

            {step === 3 && (
              <StepShell
                title="Какой стиль общения вы предпочитаете?"
                description="Вы сможете изменить стиль в любой момент"
              >
                <div className="space-y-2.5">
                  {STYLE_ITEMS.map((styleItem) => {
                    const active = communicationStyleValue === styleItem.id
                    return (
                      <button
                        key={styleItem.id}
                        type="button"
                        onClick={() => setCommunicationStyle(styleItem.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          active
                            ? 'border-[#D7FF35] bg-[#D7FF35]/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/8'
                        }`}
                      >
                        <p className="text-sm font-bold">{styleItem.title}</p>
                        <p className="mt-1 text-xs text-[#92928D]">{styleItem.description}</p>
                      </button>
                    )
                  })}
                </div>
              </StepShell>
            )}

            {step === 4 && (
              <StepShell
                title="Как вы относитесь к критике?"
                description="Чем выше значение, тем более прямой будет обратная связь"
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[criticismLevelValue]}
                    onValueChange={(values) => setCriticismLevel(values[0] ?? 3)}
                  />
                  <p className="mt-4 text-sm font-semibold text-[#F4F4F0]">
                    {getCriticismDescription(criticismLevelValue)}
                  </p>
                </div>
              </StepShell>
            )}

            {step === 5 && (
              <StepShell
                title="Во сколько обычно начинается и заканчивается ваш день?"
                description="Мы будем учитывать эти рамки в ваших напоминаниях"
              >
                <div className="space-y-4">
                  <label className="space-y-1.5">
                    <span className="text-xs font-bold text-[#92928D]">Время пробуждения</span>
                    <Input
                      type="time"
                      value={wakeTimeValue}
                      onChange={(event) => setWakeTime(event.target.value)}
                      className="bg-[#141414] text-[#F4F4F0]"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-bold text-[#92928D]">Время отхода ко сну</span>
                    <Input
                      type="time"
                      value={sleepTimeValue}
                      onChange={(event) => setSleepTime(event.target.value)}
                      className="bg-[#141414] text-[#F4F4F0]"
                    />
                  </label>
                </div>
              </StepShell>
            )}

            {step === 6 && (
              <StepShell
                title="Какие цели вы хотите достичь в ближайшие 12 месяцев?"
                description="Добавьте от 1 до 5 целей. Подробную декомпозицию предложим позже с AI"
              >
                <div className="space-y-2">
                  {yearlyGoalsValue.map((goal, index) => (
                    <Textarea
                      key={index}
                      value={goal}
                      onChange={(event) => updateListItem(yearlyGoalsValue, setYearlyGoals, index, event.target.value)}
                      placeholder={`Цель ${index + 1}`}
                      className="min-h-20 bg-[#141414] text-[#F4F4F0]"
                    />
                  ))}
                </div>
              </StepShell>
            )}

            {step === 7 && (
              <StepShell
                title="Какие привычки вы хотите сформировать и оставить в прошлом?"
                description="Это поможет персонализировать аналитику и рекомендации"
              >
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#92928D]">
                      Хочу сформировать
                    </p>
                    {buildHabitsValue.map((habit, index) => (
                      <Input
                        key={`build-${index}`}
                        value={habit}
                        onChange={(event) => updateListItem(buildHabitsValue, setBuildHabits, index, event.target.value)}
                        placeholder={`Новая привычка ${index + 1}`}
                        className="bg-[#141414] text-[#F4F4F0]"
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#92928D]">
                      Хочу оставить в прошлом
                    </p>
                    {quitHabitsValue.map((habit, index) => (
                      <Input
                        key={`quit-${index}`}
                        value={habit}
                        onChange={(event) => updateListItem(quitHabitsValue, setQuitHabits, index, event.target.value)}
                        placeholder={`Старая привычка ${index + 1}`}
                        className="bg-[#141414] text-[#F4F4F0]"
                      />
                    ))}
                  </div>
                </div>
              </StepShell>
            )}

            {step === 8 && (
              <StepShell
                title="Всё готово"
                description="Теперь Life OS будет сопровождать вас каждый день и помогать двигаться к вашим целям"
              >
                <div className="rounded-2xl border border-[#D7FF35]/50 bg-[#D7FF35]/10 p-4 text-sm text-[#F4F4F0]">
                  <p className="flex items-center gap-2 font-semibold">
                    <Check className="size-4 text-[#D7FF35]" />
                    Ваш профиль и настройки сохранены
                  </p>
                </div>
              </StepShell>
            )}

            {error && (
              <div role="alert" className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </section>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={isBusy}
              className="h-12 rounded-2xl text-[#92928D] hover:bg-white/5 hover:text-white"
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
              {step === 8 ? 'Начать первый день' : 'Далее'}
            </Button>
          </div>
        </div>
      </main>
    </Layout>
  )
}

function StepShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div>
      <h1 className="text-balance text-3xl font-black leading-[0.95] tracking-[-0.04em]">
        {title}
      </h1>
      <p className="mt-3 text-sm text-[#92928D]">{description}</p>
      <div className="mt-5">{children}</div>
    </div>
  )
}

function ChipGrid({
  items,
  selected,
  onToggle,
}: {
  items: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = selected.includes(item)
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
              active
                ? 'border-[#D7FF35] bg-[#D7FF35]/10 text-[#F4F4F0]'
                : 'border-white/10 bg-white/5 text-[#C1C1BD] hover:bg-white/10'
            }`}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}
