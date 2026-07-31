
import type { Goal, GoalCategory, PeriodType } from '@life-os/contracts'
import { useEffect, useMemo, useState } from 'react'
import { useCreateGoal, useDeleteGoal, useGetGoals, useUpdateGoal } from '../entities/goals/model/useGoals'
import { cn } from '../shared/lib/utils'
import { Button } from '../shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../shared/ui/dialog'
import { Input } from '../shared/ui/input'
import { Layout } from '../shared/ui/Layout'
import { PageError, PageSkeleton } from '../shared/ui/PageSkeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shared/ui/select'
import { Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2, TrendingUp, Target, Calendar, ClipboardList, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ─── Config ──────────────────────────────────────────────────────────────────

type CatConfig = { label: string; color: string; bg: string }
type PeriodConf = { label: string; icon: LucideIcon; color: string; bg: string; childLabel: string | null; childType: PeriodType | null }

const CAT_CONFIG: Record<GoalCategory, CatConfig> = {
  health: { label: 'Health', color: 'text-foreground', bg: 'bg-muted' },
  career: { label: 'Career', color: 'text-foreground', bg: 'bg-muted' },
  learning: { label: 'Learning', color: 'text-foreground', bg: 'bg-muted' },
  relationships: { label: 'Relationships', color: 'text-foreground', bg: 'bg-muted' },
  finance: { label: 'Finance', color: 'text-foreground', bg: 'bg-muted' },
  personal: { label: 'Personal', color: 'text-foreground', bg: 'bg-muted' },
}

const PERIOD_CONFIG: Record<PeriodType, PeriodConf> = {
  long_term: { label: 'Long-term', icon: Target, color: 'text-primary', bg: 'bg-primary/10', childLabel: 'Monthly goal', childType: 'monthly' },
  monthly: { label: 'Monthly', icon: Calendar, color: 'text-primary', bg: 'bg-primary/10', childLabel: 'Weekly goal', childType: 'weekly' },
  weekly: { label: 'Weekly', icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10', childLabel: 'Daily goal', childType: 'daily' },
  daily: { label: 'Daily', icon: Zap, color: 'text-primary', bg: 'bg-primary/10', childLabel: null, childType: null },
}

const CATEGORIES = Object.entries(CAT_CONFIG) as [GoalCategory, CatConfig][]

// ─── Tree types ───────────────────────────────────────────────────────────────

interface GoalTreeNode extends Goal {
  children: GoalTreeNode[]
}

function buildTree(goals: Goal[]): GoalTreeNode[] {
  const map = new Map<string, GoalTreeNode>()
  for (const g of goals) map.set(g.id, { ...g, children: [] })

  const roots: GoalTreeNode[] = []
  for (const g of goals) {
    const node = map.get(g.id)!
    if (g.parentId) {
      map.get(g.parentId)?.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Goals() {
  const { data: goals = [], setData: setGoals, loading, error, trigger: fetchGoals } = useGetGoals()
  const { trigger: createGoal, loading: creating } = useCreateGoal()
  const { trigger: updateGoal } = useUpdateGoal()
  const { trigger: deleteGoal } = useDeleteGoal()

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [parentGoal, setParentGoal] = useState<Goal | null>(null)  // null = root goal
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GoalCategory>('personal')
  const [deadline, setDeadline] = useState('')

  useEffect(() => { void fetchGoals() }, [fetchGoals])

  const tree = useMemo(() => buildTree(goals), [goals])

  const rootCount = goals.filter(g => g.depth === 0).length
  const completedRoot = goals.filter(g => g.depth === 0 && g.isCompleted).length

  const handleOpenCreateDialog = (parent: Goal | null) => {
    setParentGoal(parent)
    setTitle('')
    setDescription('')
    setCategory(parent?.category ?? 'personal')
    setDeadline('')
    setDialogOpen(true)
  }

  const handleCreate = async () => {
    if (!title.trim()) return

    const childType = parentGoal ? (PERIOD_CONFIG[parentGoal.periodType].childType ?? 'daily') : 'long_term'

    const newGoal = await createGoal({
      title: title.trim(),
      description: description.trim(),
      category,
      deadline: deadline || null,
      parentId: parentGoal?.id ?? null,
      periodType: childType,
    })

    if (newGoal) {
      setGoals(prev => [...(prev ?? []), newGoal])
    }
    setDialogOpen(false)
  }

  const handleProgressUpdate = async (id: string, progress: number) => {
    const previousGoals = goals
    setGoals(previousGoals.map(g => g.id === id ? { ...g, progress } : g))

    if (!await updateGoal({ id, progress })) {
      setGoals(previousGoals)
    }
  }

  const handleToggleComplete = async (goal: Goal) => {
    const next = !goal.isCompleted
    const previousGoals = goals
    setGoals(previousGoals.map(g => g.id === goal.id ? { ...g, isCompleted: next, progress: next ? 100 : g.progress } : g))

    if (!await updateGoal({ id: goal.id, isCompleted: next, ...(next ? { progress: 100 } : {}) })) {
      setGoals(previousGoals)
    }
  }

  const handleDelete = async (id: string) => {
    // Also remove all descendants from local state
    const allDescendants = (goalId: string): string[] => {
      const children = goals.filter(g => g.parentId === goalId)
      return [goalId, ...children.flatMap(c => allDescendants(c.id))]
    }
    const toRemove = new Set(allDescendants(id))
    const previousGoals = goals
    setGoals(previousGoals.filter(g => !toRemove.has(g.id)))

    if (!await deleteGoal({ id })) {
      setGoals(previousGoals)
    }
  }

  if (loading && goals.length === 0) return <Layout><PageSkeleton /></Layout>
  if (error) return <Layout><PageError message={error} onRetry={() => void fetchGoals({ skipCache: true })} /></Layout>

  const dialogPeriodConf = parentGoal
    ? PERIOD_CONFIG[PERIOD_CONFIG[parentGoal.periodType].childType ?? 'daily']
    : PERIOD_CONFIG['long_term']

  return (
    <Layout>
      <main className="app-page space-y-7 px-4 pb-6 pt-8">

        {/* ── Header ── */}
        <header className="app-header flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground">Long view</p>
            <h1 className="text-4xl font-bold leading-none tracking-[-0.05em] text-foreground">Goals</h1>
            <p className="mt-2 text-sm text-muted-foreground">{rootCount} big goals · {goals.length} total</p>
          </div>
          <Button size="sm" className="pressable h-11 rounded-2xl px-4" onClick={() => handleOpenCreateDialog(null)}>
            <Plus className="w-4 h-4" />
            New goal
          </Button>
        </header>

        {/* ── Overview card ── */}
        {goals.length > 0 && (
          <section className="grid grid-cols-[1.2fr_0.8fr] gap-2" aria-label="Goal progress">
            <div className="lime-panel rounded-[28px] bg-primary p-5 text-primary-foreground">
              <TrendingUp className="h-5 w-5" />
              <p className="mt-8 text-sm font-semibold">Overall progress</p>
              <p className="mt-1 text-xs opacity-70">{completedRoot} of {rootCount} big goals completed</p>
            </div>
            <div className="surface-paper flex min-h-36 items-end rounded-[24px] bg-foreground p-5 text-background">
              <span className="text-4xl font-bold tracking-[-0.06em]">
                {rootCount ? Math.round((completedRoot / rootCount) * 100) : 0}%
              </span>
            </div>
          </section>
        )}

        {/* ── Goal tree ── */}
        {tree.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Target className="mb-4 h-12 w-12 text-primary/60" />
            <p className="font-semibold text-foreground">No goals yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Set a big goal (e.g. "Learn Backend in 6 months"), then break it down into monthly and weekly steps.
            </p>
            <Button className="pressable mt-6 rounded-2xl" onClick={() => handleOpenCreateDialog(null)}>
              Create your first goal
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
      </main>

      {/* ── Create Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="mx-4 max-w-sm rounded-[28px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <dialogPeriodConf.icon className="w-5 h-5 text-primary shrink-0" />
              <span>
                {parentGoal
                  ? `Add ${dialogPeriodConf.label} goal`
                  : 'New Long-term Goal'}
              </span>
            </DialogTitle>
          </DialogHeader>

          {parentGoal && (
            <div className="-mt-1 flex items-center gap-2 rounded-2xl bg-muted/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">Under:</span>
              <span className="text-xs font-medium text-foreground truncate">{parentGoal.title}</span>
            </div>
          )}

          <div className="space-y-3 pt-1">
            <Input
              placeholder="Goal title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="rounded-2xl"
              autoFocus
            />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="rounded-2xl"
            />
            <Select value={category} onValueChange={v => setCategory(v as GoalCategory)}>
              <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(([val, cfg]) => (
                  <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Deadline</p>
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="rounded-2xl" />
            </div>
            <Button
              className="pressable w-full rounded-2xl"
              onClick={() => void handleCreate()}
              disabled={!title.trim() || creating}
            >
              {creating ? 'Creating…' : `Create ${dialogPeriodConf.label} Goal`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

// ─── Recursive Goal Card ──────────────────────────────────────────────────────

interface GoalCardProps {
  node: GoalTreeNode
  depth: number
  onAddChild: (parent: Goal) => void
  onProgressChange: (id: string, progress: number) => void
  onToggleComplete: (goal: Goal) => void
  onDelete: (id: string) => void
}

function GoalCard({ node, depth, onAddChild, onProgressChange, onToggleComplete, onDelete }: GoalCardProps) {
  const [expanded, setExpanded] = useState(true)

  const catCfg = CAT_CONFIG[node.category]!
  const periodCfg = PERIOD_CONFIG[node.periodType]!
  const hasChild = periodCfg.childType !== null

  const childAvgProgress = node.children.length
    ? Math.round(node.children.reduce((a, c) => a + c.progress, 0) / node.children.length)
    : null

  const handleToggleExpanded = () => setExpanded(value => !value)

  return (
    <div className={cn('space-y-2', depth > 0 && 'ml-3 border-l border-primary/30 pl-3')}>
      {/* Card */}
      <div className={cn(
        'surface-paper overflow-hidden rounded-[24px] bg-foreground text-background transition-all',
        node.isCompleted && 'opacity-70',
        depth > 0 && 'rounded-[18px]',
      )}>
        <div className="p-4 space-y-3">
          {/* Row 1: icon + title + badges + actions */}
          <div className="flex items-start gap-2">
            {/* Expand toggle if has children */}
            {node.children.length > 0 && (
              <button
                onClick={handleToggleExpanded}
                className="pressable mt-0.5 shrink-0 rounded-lg p-0.5 text-background/55 hover:bg-background/10"
                aria-label={`${expanded ? 'Collapse' : 'Expand'} ${node.title}`}
              >
                {expanded
                  ? <ChevronDown className="w-4 h-4" />
                  : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            {node.children.length === 0 && <span className="w-5 shrink-0" />}

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1.5 flex-wrap">
                {/* Period badge */}
                <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  <periodCfg.icon className="w-3 h-3 shrink-0" /> {periodCfg.label}
                </span>
                {/* Category badge */}
                <span className="inline-flex items-center rounded-md bg-background/10 px-2 py-0.5 text-[10px] font-medium text-background/65">
                  {catCfg.label}
                </span>
              </div>
              <p className={cn(
                'mt-2 font-semibold leading-snug text-background',
                depth === 0 ? 'text-base' : 'text-sm',
                node.isCompleted && 'line-through text-background/45',
              )}>
                {node.title}
              </p>
              {node.description && (
                <p className="mt-1 text-xs leading-snug text-background/55">{node.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onToggleComplete(node)}
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                  node.isCompleted
                    ? 'border-primary bg-primary'
                    : 'border-background/20 hover:border-primary',
                )}
                aria-label="Toggle complete"
              >
                {node.isCompleted && <span className="text-white text-[10px] font-bold">✓</span>}
              </button>
              <button
                onClick={() => onDelete(node.id)}
                className="pressable rounded-lg p-1 text-background/45 transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete goal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Row 2: Progress */}
          {!node.isCompleted && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-background/55">Progress</span>
                <div className="flex items-center gap-2">
                  {childAvgProgress !== null && (
                    <span className="text-background/55">
                      Sub-goals avg: {childAvgProgress}%
                    </span>
                  )}
                  <span className="font-bold text-background">{node.progress}%</span>
                </div>
              </div>
              <input
                type="range" min={0} max={100} step={5}
                value={node.progress}
                onChange={e => onProgressChange(node.id, Number(e.target.value))}
                className="h-1.5 w-full accent-primary"
              />
            </div>
          )}

          {node.isCompleted && (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
            </div>
          )}

          {/* Row 3: Deadline + Add child button */}
          <div className="flex items-center justify-between">
            {node.deadline ? (
              <span className="text-xs text-background/55">Due {node.deadline}</span>
            ) : (
              <span />
            )}
            {hasChild && (
              <button
                onClick={() => onAddChild(node)}
                className="pressable flex items-center gap-1 rounded-xl border border-dashed border-background/20 px-2 py-1 text-xs font-medium text-background/60 transition-all hover:border-primary hover:text-primary"
              >
                <Plus className="w-3 h-3" />
                Add {periodCfg.childLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Children (recursive) */}
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
