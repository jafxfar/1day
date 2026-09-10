import type {
  Goal,
  GoalCategory,
  NodeType,
  Routine,
  RoutineRecurrence,
  RoutineTimeSlot,
} from '@life-os/contracts'
import { childNodeTypeByParent } from '@life-os/contracts'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useCreateGoal,
  useDeleteGoal,
  useGetGoals,
  useUpdateGoal,
} from '../entities/goals/model/useGoals'
import {
  useCreateRoutine,
  useDeleteRoutine,
  useGetRoutines,
  useUpdateRoutine,
} from '../entities/routines/model/useRoutines'
import { cn } from '../shared/lib/utils'
import { Button } from '../shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../shared/ui/dialog'
import { Input } from '../shared/ui/input'
import { Layout } from '../shared/ui/Layout'
import { PageError, PageSkeleton } from '../shared/ui/PageSkeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shared/ui/select'
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Target,
  ListChecks,
  Repeat,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type CatConfig = { label: string }
type NodeConf = {
  label: string
  icon: LucideIcon
  childLabel: string | null
  childType: NodeType | null
}

const CAT_CONFIG: Record<GoalCategory, CatConfig> = {
  health: { label: 'Health' },
  career: { label: 'Career' },
  learning: { label: 'Learning' },
  relationships: { label: 'Relationships' },
  finance: { label: 'Finance' },
  personal: { label: 'Personal' },
}

const NODE_CONFIG: Record<NodeType, NodeConf> = {
  goal: { label: 'Goal', icon: Target, childLabel: 'Step', childType: 'task' },
  task: { label: 'Step', icon: ListChecks, childLabel: null, childType: null },
}

const CATEGORIES = Object.entries(CAT_CONFIG) as [GoalCategory, CatConfig][]
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

interface GoalTreeNode extends Goal {
  children: GoalTreeNode[]
}

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

type TabId = 'goals' | 'routines'

export default function Goals() {
  const { data: goals = [], setData: setGoals, loading, error, trigger: fetchGoals } = useGetGoals()
  const { trigger: createGoal, loading: creating } = useCreateGoal()
  const { trigger: updateGoal } = useUpdateGoal()
  const { trigger: deleteGoal } = useDeleteGoal()

  const {
    data: routines = [],
    setData: setRoutines,
    loading: loadingRoutines,
    error: routinesError,
    trigger: fetchRoutines,
  } = useGetRoutines()
  const { trigger: createRoutine, loading: creatingRoutine } = useCreateRoutine()
  const { trigger: updateRoutine } = useUpdateRoutine()
  const { trigger: deleteRoutine } = useDeleteRoutine()

  const [tab, setTab] = useState<TabId>('goals')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [parentGoal, setParentGoal] = useState<Goal | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GoalCategory>('personal')
  const [deadline, setDeadline] = useState('')
  const [taskType, setTaskType] = useState<TaskType>('learning')

  const [routineDialogOpen, setRoutineDialogOpen] = useState(false)
  const [routineTitle, setRoutineTitle] = useState('')
  const [routineDescription, setRoutineDescription] = useState('')
  const [routineRecurrence, setRoutineRecurrence] = useState<RoutineRecurrence>('daily')
  const [routineWeekdays, setRoutineWeekdays] = useState<number[]>([])
  const [routineTimeSlot, setRoutineTimeSlot] = useState<RoutineTimeSlot>('morning')
  const [routineTimeOfDay, setRoutineTimeOfDay] = useState('')

  useEffect(() => {
    void fetchGoals()
    void fetchRoutines()
  }, [fetchGoals, fetchRoutines])

  const tree = useMemo(() => buildTree(goals), [goals])
  const rootCount = goals.filter(goal => goal.nodeType === 'goal').length
  const completedRoot = goals.filter(goal => goal.nodeType === 'goal' && goal.isCompleted).length

  const childNodeType = parentGoal
    ? childNodeTypeByParent[parentGoal.nodeType]
    : 'goal'

  const handleOpenCreateDialog = (parent: Goal | null) => {
    setParentGoal(parent)
    setTitle('')
    setDescription('')
    setCategory(parent?.category ?? 'personal')
    setDeadline('')
    setTaskType('learning')
    setDialogOpen(true)
  }

  const handleCreate = async () => {
    if (!title.trim() || !childNodeType) return

    const newGoal = await createGoal({
      title: title.trim(),
      description: description.trim(),
      category,
      deadline: deadline || null,
      parentId: parentGoal?.id ?? null,
      nodeType: childNodeType,
      taskType: childNodeType === 'task' ? 'other' : null,
    })

    if (newGoal) {
      setGoals(prev => [...(prev ?? []), newGoal])
    }
    setDialogOpen(false)
  }

  const handleProgressUpdate = async (id: string, progress: number) => {
    const previousGoals = goals
    setGoals(previousGoals.map(goal => (goal.id === id ? { ...goal, progress } : goal)))

    if (!await updateGoal({ id, progress })) {
      setGoals(previousGoals)
    }
  }

  const handleToggleComplete = async (goal: Goal) => {
    const next = !goal.isCompleted
    const previousGoals = goals
    setGoals(previousGoals.map(item => (
      item.id === goal.id
        ? { ...item, isCompleted: next, progress: next ? 100 : item.progress }
        : item
    )))

    if (!await updateGoal({ id: goal.id, isCompleted: next, ...(next ? { progress: 100 } : {}) })) {
      setGoals(previousGoals)
    }
  }

  const handleDelete = async (id: string) => {
    const allDescendants = (goalId: string): string[] => {
      const children = goals.filter(goal => goal.parentId === goalId)
      return [goalId, ...children.flatMap(child => allDescendants(child.id))]
    }
    const toRemove = new Set(allDescendants(id))
    const previousGoals = goals
    setGoals(previousGoals.filter(goal => !toRemove.has(goal.id)))

    if (!await deleteGoal({ id })) {
      setGoals(previousGoals)
    }
  }

  const handleOpenRoutineDialog = () => {
    setRoutineTitle('')
    setRoutineDescription('')
    setRoutineRecurrence('daily')
    setRoutineWeekdays([])
    setRoutineTimeSlot('morning')
    setRoutineTimeOfDay('')
    setRoutineDialogOpen(true)
  }

  const handleToggleWeekday = (day: number) => {
    setRoutineWeekdays(prev => (
      prev.includes(day) ? prev.filter(item => item !== day) : [...prev, day].sort((a, b) => a - b)
    ))
  }

  const handleCreateRoutine = async () => {
    if (!routineTitle.trim()) return
    if (routineRecurrence === 'weekly' && routineWeekdays.length === 0) return

    const created = await createRoutine({
      title: routineTitle.trim(),
      description: routineDescription.trim(),
      recurrence: routineRecurrence,
      weekdays: routineRecurrence === 'weekly' ? routineWeekdays : [],
      timeSlot: routineTimeSlot,
      timeOfDay: routineTimeOfDay || null,
      isActive: true,
    })

    if (created) {
      setRoutines(prev => [...(prev ?? []), created])
      setRoutineDialogOpen(false)
    }
  }

  const handleToggleRoutineActive = async (routine: Routine) => {
    const previous = routines
    setRoutines(previous.map(item => (
      item.id === routine.id ? { ...item, isActive: !item.isActive } : item
    )))

    if (!await updateRoutine({ id: routine.id, isActive: !routine.isActive })) {
      setRoutines(previous)
    }
  }

  const handleDeleteRoutine = async (id: string) => {
    const previous = routines
    setRoutines(previous.filter(item => item.id !== id))
    if (!await deleteRoutine({ id })) {
      setRoutines(previous)
    }
  }

  if (loading && goals.length === 0 && tab === 'goals') {
    return <Layout><PageSkeleton /></Layout>
  }
  if (error && tab === 'goals') {
    return <Layout><PageError message={error} onRetry={() => void fetchGoals({ skipCache: true })} /></Layout>
  }

  const dialogNodeConf = NODE_CONFIG[childNodeType ?? 'goal']

  return (
    <Layout>
      <main className="app-page space-y-7 px-4 pb-6 pt-8">
        <header className="app-header flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground">Long view</p>
            <h1 className="text-4xl font-bold leading-none tracking-[-0.05em] text-foreground">Goals</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {rootCount} goals · {routines.length} routines
            </p>
          </div>
          {tab === 'goals' ? (
            <Button asChild size="sm" className="pressable h-11 rounded-2xl px-4">
              <Link to="/goals/new">
                <Plus className="w-4 h-4" />
                New goal
              </Link>
            </Button>
          ) : (
            <Button size="sm" className="pressable h-11 rounded-2xl px-4" onClick={handleOpenRoutineDialog}>
              <Plus className="w-4 h-4" />
              Routine
            </Button>
          )}
        </header>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/40 p-1" role="tablist" aria-label="Goals sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'goals'}
            tabIndex={0}
            className={cn(
              'pressable rounded-xl px-3 py-2 text-sm font-semibold transition',
              tab === 'goals' ? 'bg-foreground text-background' : 'text-muted-foreground',
            )}
            onClick={() => setTab('goals')}
          >
            Goals
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'routines'}
            tabIndex={0}
            className={cn(
              'pressable rounded-xl px-3 py-2 text-sm font-semibold transition',
              tab === 'routines' ? 'bg-foreground text-background' : 'text-muted-foreground',
            )}
            onClick={() => setTab('routines')}
          >
            Routines
          </button>
        </div>

        {tab === 'goals' && (
          <>
            {goals.length > 0 && (
              <section className="grid grid-cols-[1.2fr_0.8fr] gap-2" aria-label="Goal progress">
                <div className="lime-panel rounded-[28px] bg-primary p-5 text-primary-foreground">
                  <TrendingUp className="h-5 w-5" />
                  <p className="mt-8 text-sm font-semibold">Overall progress</p>
                  <p className="mt-1 text-xs opacity-70">{completedRoot} of {rootCount} goals completed</p>
                </div>
                <div className="surface-paper flex min-h-36 items-end rounded-[24px] bg-foreground p-5 text-background">
                  <span className="text-4xl font-bold tracking-[-0.06em]">
                    {rootCount ? Math.round((completedRoot / rootCount) * 100) : 0}%
                  </span>
                </div>
              </section>
            )}

            {tree.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Target className="mb-4 h-12 w-12 text-primary/60" />
                <p className="font-semibold text-foreground">No goals yet</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Create a simple goal, then break it into steps if you need to.
                </p>
                <Button asChild className="pressable mt-6 rounded-2xl">
                  <Link to="/goals/new">Create a goal</Link>
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {tree.map(node => (
                <GoalCard
                  key={node.id}
                  node={node}
                  depth={0}
                  onAddChild={handleOpenCreateDialog}
                  onProgressChange={handleProgressUpdate}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}

        {tab === 'routines' && (
          <section className="space-y-3" aria-label="Routines">
            {loadingRoutines && routines.length === 0 && <PageSkeleton />}
            {routinesError && (
              <PageError message={routinesError} onRetry={() => void fetchRoutines({ skipCache: true })} />
            )}
            {!loadingRoutines && routines.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Repeat className="mb-4 h-12 w-12 text-primary/60" />
                <p className="font-semibold text-foreground">No routines yet</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Add daily or weekly repeating tasks with a preferred time of day.
                </p>
                <Button className="pressable mt-6 rounded-2xl" onClick={handleOpenRoutineDialog}>
                  Create routine
                </Button>
              </div>
            )}
            {routines.map(routine => (
              <article
                key={routine.id}
                className={cn(
                  'surface-paper rounded-[22px] bg-foreground p-4 text-background',
                  !routine.isActive && 'opacity-60',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        {routine.recurrence}
                      </span>
                      <span className="rounded-md bg-background/10 px-2 py-0.5 text-[10px] font-medium text-background/65">
                        {routine.timeSlot}
                      </span>
                      {routine.timeOfDay && (
                        <span className="rounded-md bg-background/10 px-2 py-0.5 text-[10px] font-medium text-background/65">
                          {routine.timeOfDay}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-semibold">{routine.title}</p>
                    {routine.description && (
                      <p className="mt-1 text-xs text-background/55">{routine.description}</p>
                    )}
                    {routine.recurrence === 'weekly' && routine.weekdays.length > 0 && (
                      <p className="mt-2 text-xs text-background/55">
                        {routine.weekdays.map(day => WEEKDAY_LABELS[day]).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="pressable rounded-lg px-2 py-1 text-xs font-medium text-background/70 hover:bg-background/10"
                      onClick={() => void handleToggleRoutineActive(routine)}
                      aria-label={routine.isActive ? 'Deactivate routine' : 'Activate routine'}
                      tabIndex={0}
                    >
                      {routine.isActive ? 'On' : 'Off'}
                    </button>
                    <button
                      type="button"
                      className="pressable rounded-lg p-1 text-background/45 hover:text-destructive"
                      onClick={() => void handleDeleteRoutine(routine.id)}
                      aria-label={`Delete ${routine.title}`}
                      tabIndex={0}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="mx-4 max-w-sm rounded-[28px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <dialogNodeConf.icon className="h-5 w-5 shrink-0 text-primary" />
              <span>
                {parentGoal ? `Add ${dialogNodeConf.label}` : 'New Goal'}
              </span>
            </DialogTitle>
          </DialogHeader>

          {parentGoal && (
            <div className="-mt-1 flex items-center gap-2 rounded-2xl bg-muted/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">Under:</span>
              <span className="truncate text-xs font-medium text-foreground">{parentGoal.title}</span>
            </div>
          )}

          <div className="space-y-3 pt-1">
            <Input
              placeholder="Title"
              value={title}
              onChange={event => setTitle(event.target.value)}
              className="rounded-2xl"
              autoFocus
            />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={event => setDescription(event.target.value)}
              className="rounded-2xl"
            />
            {!parentGoal && (
              <Select value={category} onValueChange={value => setCategory(value as GoalCategory)}>
                <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(([value, config]) => (
                    <SelectItem key={value} value={value}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Deadline</p>
              <Input
                type="date"
                value={deadline}
                onChange={event => setDeadline(event.target.value)}
                className="rounded-2xl"
              />
            </div>
            <Button
              className="pressable w-full rounded-2xl"
              onClick={() => void handleCreate()}
              disabled={!title.trim() || creating || !childNodeType}
            >
              {creating ? 'Creating…' : `Create ${dialogNodeConf.label}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={routineDialogOpen} onOpenChange={setRoutineDialogOpen}>
        <DialogContent className="mx-4 max-w-sm rounded-[28px]">
          <DialogHeader>
            <DialogTitle>New Routine</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Input
              placeholder="Routine title"
              value={routineTitle}
              onChange={event => setRoutineTitle(event.target.value)}
              className="rounded-2xl"
              autoFocus
            />
            <Input
              placeholder="Description (optional)"
              value={routineDescription}
              onChange={event => setRoutineDescription(event.target.value)}
              className="rounded-2xl"
            />
            <Select
              value={routineRecurrence}
              onValueChange={value => setRoutineRecurrence(value as RoutineRecurrence)}
            >
              <SelectTrigger className="rounded-2xl" aria-label="Recurrence"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
            {routineRecurrence === 'weekly' && (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Weekdays">
                {WEEKDAY_LABELS.map((label, index) => {
                  const active = routineWeekdays.includes(index)
                  return (
                    <button
                      key={label}
                      type="button"
                      tabIndex={0}
                      aria-pressed={active}
                      onClick={() => handleToggleWeekday(index)}
                      className={cn(
                        'pressable rounded-xl px-2.5 py-1.5 text-xs font-semibold',
                        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
            <Select
              value={routineTimeSlot}
              onValueChange={value => setRoutineTimeSlot(value as RoutineTimeSlot)}
            >
              <SelectTrigger className="rounded-2xl" aria-label="Time slot"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
                <SelectItem value="anytime">Anytime</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="time"
              value={routineTimeOfDay}
              onChange={event => setRoutineTimeOfDay(event.target.value)}
              className="rounded-2xl"
              aria-label="Exact time"
            />
            <Button
              className="pressable w-full rounded-2xl"
              onClick={() => void handleCreateRoutine()}
              disabled={
                !routineTitle.trim()
                || creatingRoutine
                || (routineRecurrence === 'weekly' && routineWeekdays.length === 0)
              }
            >
              {creatingRoutine ? 'Creating…' : 'Create Routine'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

interface GoalCardProps {
  node: GoalTreeNode
  depth: number
  onAddChild: (parent: Goal) => void
  onProgressChange: (id: string, progress: number) => void
  onToggleComplete: (goal: Goal) => void
  onDelete: (id: string) => void
}

const GoalCard = ({
  node,
  depth,
  onAddChild,
  onProgressChange,
  onToggleComplete,
  onDelete,
}: GoalCardProps) => {
  const [expanded, setExpanded] = useState(true)

  const catCfg = CAT_CONFIG[node.category]
  const nodeCfg = NODE_CONFIG[node.nodeType]
  const hasChild = nodeCfg.childType !== null

  const childAvgProgress = node.children.length
    ? Math.round(node.children.reduce((sum, child) => sum + child.progress, 0) / node.children.length)
    : null

  const handleToggleExpanded = () => setExpanded(value => !value)

  return (
    <div className={cn('space-y-2', depth > 0 && 'ml-3 border-l border-primary/30 pl-3')}>
      <div className={cn(
        'surface-paper overflow-hidden rounded-[24px] bg-foreground text-background transition-all',
        node.isCompleted && 'opacity-70',
        depth > 0 && 'rounded-[18px]',
      )}>
        <div className="space-y-3 p-4">
          <div className="flex items-start gap-2">
            {node.children.length > 0 ? (
              <button
                type="button"
                onClick={handleToggleExpanded}
                className="pressable mt-0.5 shrink-0 rounded-lg p-0.5 text-background/55 hover:bg-background/10"
                aria-label={`${expanded ? 'Collapse' : 'Expand'} ${node.title}`}
                tabIndex={0}
              >
                {expanded
                  ? <ChevronDown className="h-4 w-4" />
                  : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  <nodeCfg.icon className="h-3 w-3 shrink-0" /> {nodeCfg.label}
                </span>
                {node.nodeType === 'goal' && (
                  <span className="inline-flex items-center rounded-md bg-background/10 px-2 py-0.5 text-[10px] font-medium text-background/65">
                    {catCfg.label}
                  </span>
                )}
              </div>
              <p className={cn(
                'mt-2 font-semibold leading-snug text-background',
                depth === 0 ? 'text-base' : 'text-sm',
                node.isCompleted && 'text-background/45 line-through',
              )}>
                {node.title}
              </p>
              {node.description && (
                <p className="mt-1 text-xs leading-snug text-background/55">{node.description}</p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onToggleComplete(node)}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
                  node.isCompleted
                    ? 'border-primary bg-primary'
                    : 'border-background/20 hover:border-primary',
                )}
                aria-label="Toggle complete"
                tabIndex={0}
              >
                {node.isCompleted && <span className="text-[10px] font-bold text-white">✓</span>}
              </button>
              <button
                type="button"
                onClick={() => onDelete(node.id)}
                className="pressable rounded-lg p-1 text-background/45 transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete node"
                tabIndex={0}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {!node.isCompleted && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-background/55">Progress</span>
                <div className="flex items-center gap-2">
                  {childAvgProgress !== null && (
                    <span className="text-background/55">Children avg: {childAvgProgress}%</span>
                  )}
                  <span className="font-bold text-background">{node.progress}%</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={node.progress}
                onChange={event => onProgressChange(node.id, Number(event.target.value))}
                className="h-1.5 w-full accent-primary"
                aria-label={`${node.title} progress`}
              />
            </div>
          )}

          {node.isCompleted && (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Completed</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            {node.deadline ? (
              <span className="text-xs text-background/55">Due {node.deadline}</span>
            ) : (
              <span />
            )}
            {hasChild && (
              <button
                type="button"
                onClick={() => onAddChild(node)}
                className="pressable flex items-center gap-1 rounded-xl border border-dashed border-background/20 px-2 py-1 text-xs font-medium text-background/60 transition-all hover:border-primary hover:text-primary"
                tabIndex={0}
              >
                <Plus className="h-3 w-3" />
                Add {nodeCfg.childLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && node.children.length > 0 && (
        <div className="space-y-2">
          {node.children.map(child => (
            <GoalCard
              key={child.id}
              node={child}
              depth={depth + 1}
              onAddChild={onAddChild}
              onProgressChange={onProgressChange}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
