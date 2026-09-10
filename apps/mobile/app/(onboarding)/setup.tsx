import { useMemo, useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CommunicationStyle, SaveOnboardingSetupPayload } from '@life-os/contracts'
import { Check, Sparkles } from 'lucide-react-native'
import { useOnboarding } from '@/onboarding/useOnboarding'

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
  const router = useRouter()
  const {
    state,
    isLoading,
    error,
    saveSetup,
    complete,
    skip,
  } = useOnboarding()

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
  const [mutating, setMutating] = useState(false)

  const setupSource = state?.setup
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
    return true
  }, [lifeAreasValue.length, motivationsValue.length, payload.yearlyGoals.length, step])

  const isBusy = isLoading || mutating

  const persistCurrentSetup = async () => {
    const result = await saveSetup(payload)
    return Boolean(result)
  }

  const handleNext = async () => {
    if (!canGoNext || isBusy) {
      return
    }

    setMutating(true)
    try {
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

      router.replace('/(onboarding)/first-day')
    } finally {
      setMutating(false)
    }
  }

  const handleBack = () => {
    if (step <= 1) {
      router.replace('/(onboarding)/profile')
      return
    }
    setStep(current => current - 1)
  }

  const handleSkip = async () => {
    if (isBusy) {
      return
    }

    setMutating(true)
    try {
      const skipped = await skip()
      if (!skipped) {
        return
      }
      router.replace('/(app)/morning')
    } finally {
      setMutating(false)
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.brandRow}>
                <Sparkles size={16} color="#D7FF35" />
                <Text style={styles.brandText}>Life OS setup</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Пропустить онбординг"
                onPress={() => void handleSkip()}
                disabled={isBusy}
                style={({ pressed }) => [
                  styles.skipButton,
                  isBusy && styles.buttonDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.skipText}>Пропустить</Text>
              </Pressable>
            </View>

            <View
              style={styles.progressRow}
              accessibilityLabel={`Прогресс настройки: шаг ${step} из ${TOTAL_STEPS}`}
            >
              {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressBar,
                    index < step ? styles.progressBarActive : styles.progressBarIdle,
                  ]}
                />
              ))}
            </View>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
                <View style={styles.styleList}>
                  {STYLE_ITEMS.map((styleItem) => {
                    const active = communicationStyleValue === styleItem.id
                    return (
                      <Pressable
                        key={styleItem.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => setCommunicationStyle(styleItem.id)}
                        style={({ pressed }) => [
                          styles.styleCard,
                          active && styles.styleCardActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.styleTitle}>{styleItem.title}</Text>
                        <Text style={styles.styleDescription}>{styleItem.description}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </StepShell>
            )}

            {step === 4 && (
              <StepShell
                title="Как вы относитесь к критике?"
                description="Чем выше значение, тем более прямой будет обратная связь"
              >
                <View style={styles.criticismBox}>
                  <View style={styles.criticismRow}>
                    {[1, 2, 3, 4, 5].map((level) => {
                      const active = criticismLevelValue === level
                      return (
                        <Pressable
                          key={level}
                          accessibilityRole="button"
                          accessibilityLabel={`Уровень критики ${level}`}
                          accessibilityState={{ selected: active }}
                          onPress={() => setCriticismLevel(level)}
                          style={({ pressed }) => [
                            styles.criticismChip,
                            active && styles.criticismChipActive,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={[styles.criticismChipText, active && styles.criticismChipTextActive]}>
                            {level}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                  <Text style={styles.criticismDescription}>
                    {getCriticismDescription(criticismLevelValue)}
                  </Text>
                </View>
              </StepShell>
            )}

            {step === 5 && (
              <StepShell
                title="Во сколько обычно начинается и заканчивается ваш день?"
                description="Мы будем учитывать эти рамки в ваших напоминаниях"
              >
                <View style={styles.fieldList}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Время пробуждения</Text>
                    <TextInput
                      value={wakeTimeValue}
                      onChangeText={setWakeTime}
                      placeholder="07:00"
                      placeholderTextColor="#92928D"
                      style={styles.input}
                      accessibilityLabel="Время пробуждения"
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Время отхода ко сну</Text>
                    <TextInput
                      value={sleepTimeValue}
                      onChangeText={setSleepTime}
                      placeholder="23:00"
                      placeholderTextColor="#92928D"
                      style={styles.input}
                      accessibilityLabel="Время отхода ко сну"
                    />
                  </View>
                </View>
              </StepShell>
            )}

            {step === 6 && (
              <StepShell
                title="Какие цели вы хотите достичь в ближайшие 12 месяцев?"
                description="Добавьте от 1 до 5 целей. Подробную декомпозицию предложим позже с AI"
              >
                <View style={styles.fieldList}>
                  {yearlyGoalsValue.map((goal, index) => (
                    <TextInput
                      key={index}
                      value={goal}
                      onChangeText={(value) => updateListItem(yearlyGoalsValue, setYearlyGoals, index, value)}
                      placeholder={`Цель ${index + 1}`}
                      placeholderTextColor="#92928D"
                      multiline
                      style={[styles.input, styles.textarea]}
                      accessibilityLabel={`Цель ${index + 1}`}
                    />
                  ))}
                </View>
              </StepShell>
            )}

            {step === 7 && (
              <StepShell
                title="Какие привычки вы хотите сформировать и оставить в прошлом?"
                description="Это поможет персонализировать аналитику и рекомендации"
              >
                <View style={styles.fieldList}>
                  <Text style={styles.sectionLabel}>Хочу сформировать</Text>
                  {buildHabitsValue.map((habit, index) => (
                    <TextInput
                      key={`build-${index}`}
                      value={habit}
                      onChangeText={(value) => updateListItem(buildHabitsValue, setBuildHabits, index, value)}
                      placeholder={`Новая привычка ${index + 1}`}
                      placeholderTextColor="#92928D"
                      style={styles.input}
                      accessibilityLabel={`Новая привычка ${index + 1}`}
                    />
                  ))}

                  <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
                    Хочу оставить в прошлом
                  </Text>
                  {quitHabitsValue.map((habit, index) => (
                    <TextInput
                      key={`quit-${index}`}
                      value={habit}
                      onChangeText={(value) => updateListItem(quitHabitsValue, setQuitHabits, index, value)}
                      placeholder={`Старая привычка ${index + 1}`}
                      placeholderTextColor="#92928D"
                      style={styles.input}
                      accessibilityLabel={`Старая привычка ${index + 1}`}
                    />
                  ))}
                </View>
              </StepShell>
            )}

            {step === 8 && (
              <StepShell
                title="Всё готово"
                description="Теперь Life OS будет сопровождать вас каждый день и помогать двигаться к вашим целям"
              >
                <View style={styles.readyBox}>
                  <View style={styles.readyRow}>
                    <Check size={16} color="#D7FF35" />
                    <Text style={styles.readyText}>Ваш профиль и настройки сохранены</Text>
                  </View>
                </View>
              </StepShell>
            )}

            {error ? (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Назад"
              onPress={handleBack}
              disabled={isBusy}
              style={({ pressed }) => [
                styles.secondaryButton,
                isBusy && styles.buttonDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Назад</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={step === 8 ? 'Начать первый день' : 'Далее'}
              onPress={() => void handleNext()}
              disabled={isBusy || !canGoNext}
              style={({ pressed }) => [
                styles.primaryButton,
                (isBusy || !canGoNext) && styles.buttonDisabled,
                pressed && styles.pressed,
              ]}
            >
              {isBusy ? <ActivityIndicator color="#151515" /> : null}
              <Text style={styles.primaryButtonText}>
                {step === 8 ? 'Начать первый день' : 'Далее'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const StepShell = ({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) => (
  <View>
    <Text style={styles.stepTitle}>{title}</Text>
    <Text style={styles.stepDescription}>{description}</Text>
    <View style={styles.stepBody}>{children}</View>
  </View>
)

const ChipGrid = ({
  items,
  selected,
  onToggle,
}: {
  items: string[]
  selected: string[]
  onToggle: (value: string) => void
}) => (
  <View style={styles.chipGrid}>
    {items.map((item) => {
      const active = selected.includes(item)
      return (
        <Pressable
          key={item}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          onPress={() => onToggle(item)}
          style={({ pressed }) => [
            styles.chip,
            active && styles.chipActive,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
        </Pressable>
      )
    })}
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  flex: {
    flex: 1,
  },
  card: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: '#1D1D1D',
    borderRadius: 32,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  skipText: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
  },
  progressBarActive: {
    backgroundColor: '#D7FF35',
  },
  progressBarIdle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  stepTitle: {
    color: '#F4F4F0',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 30,
    letterSpacing: -1,
  },
  stepDescription: {
    marginTop: 12,
    color: '#92928D',
    fontSize: 14,
    lineHeight: 22,
  },
  stepBody: {
    marginTop: 20,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipActive: {
    borderColor: '#D7FF35',
    backgroundColor: 'rgba(215,255,53,0.1)',
  },
  chipText: {
    color: '#C1C1BD',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#F4F4F0',
  },
  styleList: {
    gap: 10,
  },
  styleCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
  },
  styleCardActive: {
    borderColor: '#D7FF35',
    backgroundColor: 'rgba(215,255,53,0.1)',
  },
  styleTitle: {
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '700',
  },
  styleDescription: {
    marginTop: 4,
    color: '#92928D',
    fontSize: 12,
    lineHeight: 18,
  },
  criticismBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
  },
  criticismRow: {
    flexDirection: 'row',
    gap: 8,
  },
  criticismChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  criticismChipActive: {
    borderColor: '#D7FF35',
    backgroundColor: 'rgba(215,255,53,0.15)',
  },
  criticismChipText: {
    color: '#C1C1BD',
    fontSize: 16,
    fontWeight: '700',
  },
  criticismChipTextActive: {
    color: '#F4F4F0',
  },
  criticismDescription: {
    marginTop: 16,
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '600',
  },
  fieldList: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionLabel: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  sectionLabelSpaced: {
    marginTop: 12,
  },
  input: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#141414',
    color: '#F4F4F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  readyBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(215,255,53,0.5)',
    backgroundColor: 'rgba(215,255,53,0.1)',
    padding: 16,
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readyText: {
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12,
  },
  errorText: {
    color: '#FECACA',
    fontSize: 14,
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#92928D',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#D7FF35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#151515',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
})
