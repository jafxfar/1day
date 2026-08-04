import type { Goal, PeriodType } from '@life-os/contracts'

const periodPriority: Record<PeriodType, number> = {
  weekly: 0,
  monthly: 1,
  long_term: 2,
  daily: 3,
}

export const FALLBACK_FOCUS_SUGGESTIONS = [
  '10 минут концентрации',
  'Одна полезная привычка',
  'Короткий фокус без телефона',
] as const

const getDaysUntilDeadline = (deadline: string | null) => {
  if (!deadline) {
    return Number.POSITIVE_INFINITY
  }

  const deadlineDate = new Date(`${deadline}T00:00:00`)
  const today = new Date()
  const nowDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffMs = deadlineDate.getTime() - nowDate.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export const pickMainGoal = (goals: Goal[]): Goal | null => {
  const activeGoals = goals.filter(goal => !goal.isCompleted)
  if (activeGoals.length === 0) {
    return null
  }

  return [...activeGoals].sort((left, right) => {
    const periodDiff = periodPriority[left.periodType] - periodPriority[right.periodType]
    if (periodDiff !== 0) return periodDiff

    const leftDays = getDaysUntilDeadline(left.deadline)
    const rightDays = getDaysUntilDeadline(right.deadline)
    if (leftDays !== rightDays) return leftDays - rightDays

    if (left.progress !== right.progress) return left.progress - right.progress
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })[0] ?? null
}

export const buildFocusSuggestions = (goal: Goal | null): string[] => {
  if (!goal) {
    return [...FALLBACK_FOCUS_SUGGESTIONS]
  }

  return [
    `10 минут на «${goal.title}»`,
    'Записать следующий конкретный шаг',
    'Сделать одну связанную привычку',
  ]
}

const PERIOD_LABELS: Record<PeriodType, string> = {
  weekly: 'неделю',
  monthly: 'месяц',
  long_term: 'год',
  daily: 'день',
}

export const getGoalPeriodLabel = (periodType: PeriodType): string =>
  PERIOD_LABELS[periodType]
