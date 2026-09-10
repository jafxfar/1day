import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import type {
  Goal,
  GoalCategory,
  NodeType,
  Routine,
  RoutineRecurrence,
  RoutineTimeSlot,
} from '@life-os/contracts'
import { childNodeTypeByParent } from '@life-os/contracts'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Plus,
  Repeat,
  Target,
  Trash2,
} from 'lucide-react-native'
import { goalsApi } from '@/goals/api'
import { routinesApi } from '@/routines/api'

type GoalTreeNode = Goal & { children: GoalTreeNode[] }
type TabId = 'goals' | 'routines'

const CATEGORIES: Array<{ value: GoalCategory; label: string }> = [
  { value: 'personal', label: 'Personal' },
  { value: 'career', label: 'Career' },
  { value: 'learning', label: 'Learning' },
  { value: 'health', label: 'Health' },
  { value: 'finance', label: 'Finance' },
  { value: 'relationships', label: 'Relationships' },
]

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const buildTree = (goals: Goal[]): GoalTreeNode[] => {
  const map = new Map<string, GoalTreeNode>()
  for (const goal of goals) map.set(goal.id, { ...goal, children: [] })

  const roots: GoalTreeNode[] = []
  for (const goal of goals) {
    const node = map.get(goal.id)!
    if (goal.parentId) {
      map.get(goal.parentId)?.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

export default function GoalsScreen() {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('goals')
  const [goals, setGoals] = useState<Goal[]>([])
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const [dialogOpen, setDialogOpen] = useState(false)
  const [parentGoal, setParentGoal] = useState<Goal | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<GoalCategory>('personal')
  const [creating, setCreating] = useState(false)

  const [routineOpen, setRoutineOpen] = useState(false)
  const [routineTitle, setRoutineTitle] = useState('')
  const [routineRecurrence, setRoutineRecurrence] = useState<RoutineRecurrence>('daily')
  const [routineWeekdays, setRoutineWeekdays] = useState<number[]>([])
  const [routineTimeSlot, setRoutineTimeSlot] = useState<RoutineTimeSlot>('morning')
  const [creatingRoutine, setCreatingRoutine] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextGoals, nextRoutines] = await Promise.all([
        goalsApi.getAll(),
        routinesApi.getAll(),
      ])
      setGoals(nextGoals)
      setRoutines(nextRoutines)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const tree = useMemo(() => buildTree(goals), [goals])
  const rootCount = goals.filter(goal => goal.nodeType === 'goal').length
  const completedRoot = goals.filter(goal => goal.nodeType === 'goal' && goal.isCompleted).length
  const childNodeType = parentGoal
    ? childNodeTypeByParent[parentGoal.nodeType]
    : 'goal' as NodeType

  const handleToggleComplete = async (goal: Goal) => {
    const previous = goals
    setGoals(current => current.map(item => (
      item.id === goal.id
        ? { ...item, isCompleted: !item.isCompleted, progress: !item.isCompleted ? 100 : item.progress }
        : item
    )))
    try {
      const updated = await goalsApi.update(goal.id, { isCompleted: !goal.isCompleted })
      setGoals(current => current.map(item => (item.id === goal.id ? updated : item)))
    } catch {
      setGoals(previous)
    }
  }

  const handleDelete = async (id: string) => {
    const previous = goals
    setGoals(current => current.filter(item => item.id !== id && item.parentId !== id))
    try {
      await goalsApi.delete(id)
      await load()
    } catch {
      setGoals(previous)
    }
  }

  const handleCreate = async () => {
    if (!title.trim() || !childNodeType || creating) return
    setCreating(true)
    try {
      const created = await goalsApi.create({
        title: title.trim(),
        description: '',
        category: parentGoal?.category ?? category,
        deadline: null,
        parentId: parentGoal?.id ?? null,
        nodeType: childNodeType,
        taskType: childNodeType === 'task' ? 'other' : null,
      })
      setGoals(current => [...current, created])
      setDialogOpen(false)
      setTitle('')
      setParentGoal(null)
    } finally {
      setCreating(false)
    }
  }

  const handleCreateRoutine = async () => {
    if (!routineTitle.trim() || creatingRoutine) return
    if (routineRecurrence === 'weekly' && routineWeekdays.length === 0) return
    setCreatingRoutine(true)
    try {
      const created = await routinesApi.create({
        title: routineTitle.trim(),
        description: '',
        recurrence: routineRecurrence,
        weekdays: routineRecurrence === 'weekly' ? routineWeekdays : [],
        timeSlot: routineTimeSlot,
        timeOfDay: null,
        isActive: true,
      })
      setRoutines(current => [...current, created])
      setRoutineOpen(false)
      setRoutineTitle('')
      setRoutineWeekdays([])
    } finally {
      setCreatingRoutine(false)
    }
  }

  const handleDeleteRoutine = async (id: string) => {
    const previous = routines
    setRoutines(current => current.filter(item => item.id !== id))
    try {
      await routinesApi.delete(id)
    } catch {
      setRoutines(previous)
    }
  }

  const renderNode = (node: GoalTreeNode, depth = 0) => {
    const isExpanded = expanded[node.id] ?? depth < 1
    const hasChildren = node.children.length > 0

    return (
      <View key={node.id} style={{ marginLeft: depth * 12 }}>
        <View style={styles.goalRow}>
          {hasChildren ? (
            <Pressable
              onPress={() => setExpanded(current => ({ ...current, [node.id]: !isExpanded }))}
              style={styles.iconHit}
            >
              {isExpanded
                ? <ChevronDown size={16} color="#92928D" />
                : <ChevronRight size={16} color="#92928D" />}
            </Pressable>
          ) : (
            <View style={styles.iconHit} />
          )}
          <Pressable
            onPress={() => void handleToggleComplete(node)}
            style={[styles.check, node.isCompleted && styles.checkDone]}
          >
            {node.isCompleted ? <CheckCircle2 size={16} color="#151515" /> : null}
          </Pressable>
          <View style={styles.flex}>
            <Text style={[styles.goalTitle, node.isCompleted && styles.goalTitleDone]} numberOfLines={2}>
              {node.title}
            </Text>
            <Text style={styles.goalMeta}>
              {node.nodeType === 'goal' ? 'Goal' : 'Step'} · {node.progress}%
            </Text>
          </View>
          {node.nodeType === 'goal' ? (
            <Pressable
              onPress={() => {
                setParentGoal(node)
                setTitle('')
                setCategory(node.category)
                setDialogOpen(true)
              }}
              style={styles.iconHit}
              accessibilityLabel={`Add step to ${node.title}`}
            >
              <Plus size={16} color="#D7FF35" />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => void handleDelete(node.id)}
            style={styles.iconHit}
            accessibilityLabel={`Delete ${node.title}`}
          >
            <Trash2 size={16} color="#92928D" />
          </Pressable>
        </View>
        {isExpanded ? node.children.map(child => renderNode(child, depth + 1)) : null}
      </View>
    )
  }

  if (loading && goals.length === 0) {
    return (
      <SafeAreaView style={styles.loading} edges={['top']}>
        <ActivityIndicator size="large" color="#D7FF35" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>Direction</Text>
            <Text style={styles.title}>Goals</Text>
            <Text style={styles.muted}>{completedRoot}/{rootCount} goals complete</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/goal-builder')}
            style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}
          >
            <Plus size={16} color="#151515" />
            <Text style={styles.newButtonText}>New</Text>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {([
            { id: 'goals' as const, label: 'Goals', icon: Target },
            { id: 'routines' as const, label: 'Routines', icon: Repeat },
          ]).map(item => {
            const active = tab === item.id
            const Icon = item.icon
            return (
              <Pressable
                key={item.id}
                onPress={() => setTab(item.id)}
                style={[styles.tabChip, active && styles.tabChipActive]}
              >
                <Icon size={14} color={active ? '#151515' : '#92928D'} />
                <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>{item.label}</Text>
              </Pressable>
            )
          })}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void load()}>
              <Text style={styles.retry}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {tab === 'goals' ? (
          <View style={styles.section}>
            {tree.length === 0 ? (
              <View style={styles.empty}>
                <Target size={40} color="#92928D" />
                <Text style={styles.emptyTitle}>No goals yet</Text>
                <Pressable onPress={() => router.push('/(app)/goal-builder')} style={styles.newButton}>
                  <Text style={styles.newButtonText}>Create first goal</Text>
                </Pressable>
              </View>
            ) : tree.map(node => renderNode(node))}
            <Pressable
              onPress={() => {
                setParentGoal(null)
                setTitle('')
                setCategory('personal')
                setDialogOpen(true)
              }}
              style={styles.secondaryButton}
            >
              <Plus size={16} color="#D7FF35" />
              <Text style={styles.secondaryButtonText}>Quick add goal</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.section}>
            {routines.map(routine => (
              <View key={routine.id} style={styles.routineCard}>
                <View style={styles.flex}>
                  <Text style={styles.goalTitle}>{routine.title}</Text>
                  <Text style={styles.goalMeta}>
                    {routine.recurrence}
                    {routine.recurrence === 'weekly'
                      ? ` · ${routine.weekdays.map(day => WEEKDAY_LABELS[day]).join(', ')}`
                      : ''}
                    {' · '}
                    {routine.timeSlot}
                  </Text>
                </View>
                <Pressable onPress={() => void handleDeleteRoutine(routine.id)}>
                  <Trash2 size={16} color="#92928D" />
                </Pressable>
              </View>
            ))}
            <Pressable onPress={() => setRoutineOpen(true)} style={styles.secondaryButton}>
              <Plus size={16} color="#D7FF35" />
              <Text style={styles.secondaryButtonText}>Add routine</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal visible={dialogOpen} transparent animationType="slide" onRequestClose={() => setDialogOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDialogOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={event => event.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {parentGoal ? `Add step to ${parentGoal.title}` : 'Quick add goal'}
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor="#92928D"
              style={styles.input}
            />
            {!parentGoal ? (
              <View style={styles.categoryRow}>
                {CATEGORIES.map(item => (
                  <Pressable
                    key={item.value}
                    onPress={() => setCategory(item.value)}
                    style={[styles.categoryChip, category === item.value && styles.categoryChipActive]}
                  >
                    <Text style={[styles.categoryText, category === item.value && styles.categoryTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Pressable
              onPress={() => void handleCreate()}
              disabled={!title.trim() || creating}
              style={[styles.primaryButton, (!title.trim() || creating) && styles.buttonDisabled]}
            >
              {creating ? <ActivityIndicator color="#151515" /> : null}
              <Text style={styles.primaryButtonText}>Save</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={routineOpen} transparent animationType="slide" onRequestClose={() => setRoutineOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRoutineOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={event => event.stopPropagation()}>
            <Text style={styles.modalTitle}>New routine</Text>
            <TextInput
              value={routineTitle}
              onChangeText={setRoutineTitle}
              placeholder="Title"
              placeholderTextColor="#92928D"
              style={styles.input}
            />
            <View style={styles.categoryRow}>
              {(['daily', 'weekly'] as RoutineRecurrence[]).map(value => (
                <Pressable
                  key={value}
                  onPress={() => setRoutineRecurrence(value)}
                  style={[styles.categoryChip, routineRecurrence === value && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryText, routineRecurrence === value && styles.categoryTextActive]}>
                    {value}
                  </Text>
                </Pressable>
              ))}
            </View>
            {routineRecurrence === 'weekly' ? (
              <View style={styles.categoryRow}>
                {WEEKDAY_LABELS.map((label, index) => {
                  const active = routineWeekdays.includes(index)
                  return (
                    <Pressable
                      key={label}
                      onPress={() => setRoutineWeekdays(current => (
                        active ? current.filter(day => day !== index) : [...current, index]
                      ))}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                    >
                      <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{label}</Text>
                    </Pressable>
                  )
                })}
              </View>
            ) : null}
            <View style={styles.categoryRow}>
              {(['morning', 'afternoon', 'evening', 'anytime'] as RoutineTimeSlot[]).map(value => (
                <Pressable
                  key={value}
                  onPress={() => setRoutineTimeSlot(value)}
                  style={[styles.categoryChip, routineTimeSlot === value && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryText, routineTimeSlot === value && styles.categoryTextActive]}>
                    {value}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => void handleCreateRoutine()}
              disabled={!routineTitle.trim() || creatingRoutine}
              style={[styles.primaryButton, (!routineTitle.trim() || creatingRoutine) && styles.buttonDisabled]}
            >
              {creatingRoutine ? <ActivityIndicator color="#151515" /> : null}
              <Text style={styles.primaryButtonText}>Save routine</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#141414' },
  loading: {
    flex: 1,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  eyebrow: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    color: '#F4F4F0',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.4,
  },
  muted: {
    marginTop: 8,
    color: '#92928D',
    fontSize: 14,
  },
  newButton: {
    height: 44,
    borderRadius: 16,
    backgroundColor: '#D7FF35',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  newButtonText: {
    color: '#151515',
    fontWeight: '700',
  },
  tabs: { flexDirection: 'row', gap: 8 },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tabChipActive: {
    backgroundColor: '#D7FF35',
    borderColor: '#D7FF35',
  },
  tabChipText: {
    color: '#92928D',
    fontWeight: '600',
    fontSize: 13,
  },
  tabChipTextActive: { color: '#151515' },
  section: { gap: 8 },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    backgroundColor: '#1D1D1D',
    padding: 12,
    marginBottom: 8,
  },
  iconHit: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: '#D7FF35',
    borderColor: '#D7FF35',
  },
  goalTitle: {
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '700',
  },
  goalTitleDone: {
    textDecorationLine: 'line-through',
    color: '#92928D',
  },
  goalMeta: {
    marginTop: 2,
    color: '#92928D',
    fontSize: 12,
  },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    backgroundColor: '#1D1D1D',
    padding: 16,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    color: '#F4F4F0',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 8,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(215,255,53,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#D7FF35',
    fontWeight: '700',
  },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12,
    gap: 8,
  },
  errorText: { color: '#FECACA' },
  retry: { color: '#D7FF35', fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#1D1D1D',
    padding: 20,
    gap: 12,
    paddingBottom: 32,
  },
  modalTitle: {
    color: '#F4F4F0',
    fontSize: 20,
    fontWeight: '800',
  },
  input: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#141414',
    color: '#F4F4F0',
    paddingHorizontal: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipActive: {
    borderColor: '#D7FF35',
    backgroundColor: 'rgba(215,255,53,0.12)',
  },
  categoryText: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: { color: '#F4F4F0' },
  primaryButton: {
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
    fontWeight: '700',
  },
  buttonDisabled: { opacity: 0.5 },
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.985 }] },
})
