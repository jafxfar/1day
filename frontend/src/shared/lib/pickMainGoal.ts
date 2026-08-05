import type { Goal, NodeType } from '@life-os/contracts'

const nodePriority: Record<NodeType, number> = {
  goal: 0,
  milestone: 1,
  project: 2,
  task: 3,
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
  const activeRoots = goals.filter(goal => !goal.isCompleted && goal.nodeType === 'goal')
  if (activeRoots.length > 0) {
    return [...activeRoots].sort((left, right) => {
      const leftDays = getDaysUntilDeadline(left.deadline)
      const rightDays = getDaysUntilDeadline(right.deadline)
      if (leftDays !== rightDays) return leftDays - rightDays
      if (left.progress !== right.progress) return left.progress - right.progress
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })[0] ?? null
  }

  const activeNodes = goals.filter(goal => !goal.isCompleted)
  if (activeNodes.length === 0) return null

  return [...activeNodes].sort((left, right) => {
    const typeDiff = nodePriority[left.nodeType] - nodePriority[right.nodeType]
    if (typeDiff !== 0) return typeDiff
    return getDaysUntilDeadline(left.deadline) - getDaysUntilDeadline(right.deadline)
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

const NODE_LABELS: Record<NodeType, string> = {
  goal: 'цель',
  milestone: 'milestone',
  project: 'проект',
  task: 'задачу',
}

export const getGoalNodeLabel = (nodeType: NodeType): string => NODE_LABELS[nodeType]
