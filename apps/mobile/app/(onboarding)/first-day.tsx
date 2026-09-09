import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { Goal } from '@life-os/contracts'
import { Check, Sparkles, Target } from 'lucide-react-native'
import { goalsApi } from '@/goals/api'
import { buildFocusSuggestions, pickMainGoal } from '@/lib/pickMainGoal'
import { useOnboarding } from '@/onboarding/useOnboarding'

const HABIT_SUGGESTIONS = [
  'Заправить кровать',
  'Выпить воду утром',
  'Читать 10 минут',
]

export default function FirstDayBridge() {
  const router = useRouter()
  const {
    state: onboardingState,
    isLoading: onboardingLoading,
    error: onboardingError,
    completeFirstDayFlow,
  } = useOnboarding()

  const [goals, setGoals] = useState<Goal[]>([])
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [goalsError, setGoalsError] = useState<string | null>(null)
  const [screen, setScreen] = useState(0)
  const [selectedWin, setSelectedWin] = useState<string | null>(null)
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    let isActive = true

    void goalsApi.getAll()
      .then((nextGoals) => {
        if (!isActive) return
        setGoals(nextGoals)
        setGoalsError(null)
      })
      .catch((caughtError) => {
        if (!isActive) return
        setGoalsError(caughtError instanceof Error ? caughtError.message : String(caughtError))
      })
      .finally(() => {
        if (isActive) setLoadingGoals(false)
      })

    return () => {
      isActive = false
    }
  }, [])

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
  const error = onboardingError ?? goalsError

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
    if (!canGoNext || isBusy) {
      return
    }

    if (!isLastScreen) {
      setScreen(previous => previous + 1)
      return
    }

    setCompleting(true)
    try {
      const completed = await completeFirstDayFlow()
      if (!completed) {
        return
      }
      router.replace('/(app)/morning')
    } finally {
      setCompleting(false)
    }
  }

  const handleBack = () => {
    if (screen === 0) {
      return
    }
    setScreen(previous => previous - 1)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <Sparkles size={16} color="#D7FF35" />
              <Text style={styles.brandText}>Life OS</Text>
            </View>
            <Text style={styles.progressCount}>{screen + 1}/{totalScreens}</Text>
          </View>
          <View
            style={styles.progressRow}
            accessibilityLabel={`Прогресс: экран ${screen + 1} из ${totalScreens}`}
          >
            {Array.from({ length: totalScreens }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressBar,
                  index <= screen ? styles.progressBarActive : styles.progressBarIdle,
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {currentScreen === 'welcome' && (
            <View style={styles.block}>
              <Text style={styles.title}>Добро пожаловать, {userName}.</Text>
              <Text style={styles.body}>
                Сегодня начинается история вашей Life OS.
              </Text>
              <View style={styles.letterCard}>
                <Text style={styles.letterEyebrow}>Письмо от AI</Text>
                <Text style={styles.letterBody}>
                  Привет. Спасибо, что доверили мне сопровождать вас. Я не собираюсь оценивать ваши успехи или неудачи. Моя задача — помочь вам проживать каждый день немного лучше.
                </Text>
              </View>
            </View>
          )}

          {currentScreen === 'goal' && (
            <View style={styles.block}>
              <Text style={styles.sectionEyebrow}>Главная цель на сегодня</Text>
              {recommendedGoal ? (
                <View style={styles.goalHighlight}>
                  <Text style={styles.goalTitle}>{recommendedGoal.title}</Text>
                  <Text style={styles.muted}>
                    Сегодня не нужно менять всю жизнь. AI говорит: сегодня нам нужен только один небольшой шаг.
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.subtitle}>
                    Выберите одну маленькую победу на сегодня
                  </Text>
                  <Text style={styles.muted}>
                    Сегодня не нужно менять всю жизнь. Один короткий шаг уже достаточно.
                  </Text>
                </View>
              )}

              <View
                style={styles.optionList}
                accessibilityRole="list"
                accessibilityLabel="Выбор маленького шага"
              >
                {goalStepOptions.map((option) => {
                  const active = selectedWin === option
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setSelectedWin(option)}
                      style={({ pressed }) => [
                        styles.option,
                        active && styles.optionActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.optionText, active && styles.optionTextActive]}>
                        {option}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )}

          {currentScreen === 'habit' && (
            <View style={styles.block}>
              <Text style={styles.subtitle}>Первая привычка</Text>
              <Text style={styles.muted}>
                Исследования показывают, что слишком большое количество новых привычек часто приводит к отказу от них. Начать с одной значительно проще.
              </Text>
              <View
                style={styles.optionList}
                accessibilityRole="list"
                accessibilityLabel="Выбор первой привычки"
              >
                {HABIT_SUGGESTIONS.map((suggestion) => {
                  const active = selectedHabit === suggestion
                  return (
                    <Pressable
                      key={suggestion}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setSelectedHabit(suggestion)}
                      style={({ pressed }) => [
                        styles.option,
                        active && styles.optionActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.optionText, active && styles.optionTextActive]}>
                        {suggestion}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )}

          {currentScreen === 'finale' && (
            <View style={styles.block}>
              <Text style={styles.subtitle}>День №1 вашей новой главы</Text>
              <Text style={styles.finaleBody}>
                Сегодня начинается серия — 1 день. Один небольшой шаг уже запускает систему. Life OS будет рядом каждый день.
              </Text>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Сегодня</Text>
                <View style={styles.summaryRow}>
                  <Target size={16} color="#D7FF35" />
                  <Text style={styles.summaryText}>{selectedWin ?? 'Главная цель дня'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Check size={16} color="#D7FF35" />
                  <Text style={styles.summaryText}>{selectedHabit ?? 'Первая привычка'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Sparkles size={16} color="#D7FF35" />
                  <Text style={styles.summaryText}>Поддержка AI без давления</Text>
                </View>
              </View>
            </View>
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
            disabled={isBusy || screen === 0}
            style={({ pressed }) => [
              styles.secondaryButton,
              (isBusy || screen === 0) && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Назад</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isLastScreen ? 'Начать первый день' : 'Далее'}
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
              {isLastScreen ? 'Начать первый день' : 'Далее'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}

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
    marginBottom: 24,
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  progressCount: {
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
  block: {
    gap: 16,
  },
  title: {
    color: '#F4F4F0',
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 36,
    letterSpacing: -1.2,
  },
  subtitle: {
    color: '#F4F4F0',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 30,
    letterSpacing: -1,
  },
  body: {
    color: '#F4F4F0',
    fontSize: 16,
    lineHeight: 28,
  },
  muted: {
    color: '#92928D',
    fontSize: 14,
    lineHeight: 24,
  },
  letterCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
  },
  letterEyebrow: {
    marginBottom: 12,
    color: '#D7FF35',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  letterBody: {
    color: '#C1C1BD',
    fontSize: 14,
    lineHeight: 28,
  },
  sectionEyebrow: {
    color: '#D7FF35',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  goalHighlight: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(215,255,53,0.25)',
    backgroundColor: 'rgba(215,255,53,0.1)',
    padding: 16,
    gap: 12,
  },
  goalTitle: {
    color: '#F4F4F0',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  optionList: {
    gap: 8,
  },
  option: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionActive: {
    borderColor: '#D7FF35',
    backgroundColor: 'rgba(215,255,53,0.1)',
  },
  optionText: {
    color: '#C1C1BD',
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#F4F4F0',
  },
  finaleBody: {
    color: '#C1C1BD',
    fontSize: 14,
    lineHeight: 28,
  },
  summaryCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    gap: 10,
  },
  summaryLabel: {
    marginBottom: 4,
    color: '#92928D',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    color: '#F4F4F0',
    fontSize: 14,
    flex: 1,
  },
  errorBox: {
    marginTop: 16,
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
    opacity: 0.4,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
})
