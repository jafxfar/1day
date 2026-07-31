
import { useState, useEffect, useMemo } from 'react'
import { useGetGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '../hooks/backend/goals'
import { Layout } from '../components/Layout'
import { PageSkeleton, PageError } from '../components/PageSkeleton'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2, TrendingUp, Target, Calendar, ClipboardList, Zap } from 'lucide-react'
import type { Goal, GoalCategory, PeriodType } from '../lib/types'
import { cast } from '../lib/types'
import { cn } from '../lib/utils'

// ─── Config ──────────────────────────────────────────────────────────────────

type CatConfig = { label: string; color: string; bg: string }
type PeriodConf = { label: string; icon: React.ComponentType<any>; color: string; bg: string; childLabel: string | null; childType: PeriodType | null }

const CAT_CONFIG: Record<GoalCategory, CatConfig> = {
  health: { label: 'Health', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-950/40' },
  career: { label: 'Career', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40' },
  learning: { label: 'Learning', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/40' },
  relationships: { label: 'Relationships', color: 'text-pink-700 dark:text-pink-300', bg: 'bg-pink-50 dark:bg-pink-950/40' },
  finance: { label: 'Finance', color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-50 dark:bg-yellow-950/40' },
  personal: { label: 'Personal', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-950/40' },
}

const PERIOD_CONFIG: Record<PeriodType, PeriodConf> = {
  long_term: { label: 'Long-term', icon: Target, color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50 dark:bg-violet-950/40', childLabel: 'Monthly goal', childType: 'monthly' },
  monthly: { label: 'Monthly', icon: Calendar, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40', childLabel: 'Weekly goal', childType: 'weekly' },
  weekly: { label: 'Weekly', icon: ClipboardList, color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-950/40', childLabel: 'Daily goal', childType: 'daily' },
  daily: { label: 'Daily', icon: Zap, color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-950/40', childLabel: null, childType: null },
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
  const { data: rawGoals, loading, error, trigger: fetchGoals } = useGetGoals()
  const { trigger: createGoal, loading: creating } = useCreateGoal()
  const { trigger: updateGoal } = useUpdateGoal()
  const { trigger: deleteGoal } = useDeleteGoal()

  const [goals, setGoals] = useState<Goal[]>([])

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [parentGoal, setParentGoal] = useState<Goal | null>(null)  // null = root goal
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GoalCategory>('personal')
  const [deadline, setDeadline] = useState('')

  useEffect(() => { void fetchGoals() }, [])
  useEffect(() => { setGoals(cast.goals(rawGoals)) }, [rawGoals])

  const tree = useMemo(() => buildTree(goals), [goals])

  const rootCount = goals.filter(g => g.depth === 0).length
  const completedRoot = goals.filter(g => g.depth === 0 && g.isCompleted).length

  const openCreateDialog = (parent: Goal | null) => {
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
      setGoals(prev => [...prev, cast.goal(newGoal)!])
    }
    setDialogOpen(false)
  }

  const handleProgressUpdate = async (id: string, progress: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress } : g))
    await updateGoal({ id, progress })
  }

  const handleToggleComplete = async (goal: Goal) => {
    const next = !goal.isCompleted
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, isCompleted: next, progress: next ? 100 : g.progress } : g))
    await updateGoal({ id: goal.id, isCompleted: next, ...(next ? { progress: 100 } : {}) })
  }

  const handleDelete = async (id: string) => {
    // Also remove all descendants from local state
    const allDescendants = (goalId: string): string[] => {
      const children = goals.filter(g => g.parentId === goalId)
      return [goalId, ...children.flatMap(c => allDescendants(c.id))]
    }
    const toRemove = new Set(allDescendants(id))
    setGoals(prev => prev.filter(g => !toRemove.has(g.id)))
    await deleteGoal({ id })
  }

  if (loading && goals.length === 0) return <Layout><PageSkeleton /></Layout>
  if (error) return <Layout><PageError message={error} onRetry={() => void fetchGoals({ skipCache: true })} /></Layout>

  const dialogPeriodConf = parentGoal
    ? PERIOD_CONFIG[PERIOD_CONFIG[parentGoal.periodType].childType ?? 'daily']
    : PERIOD_CONFIG['long_term']

  return (
    <Layout>
      <div className="px-2 pt-4 pb-4 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Goals</h1>
            <p className="text-sm text-muted-foreground">{rootCount} big goals · {goals.length} total</p>
          </div>
          <Button size="sm" className="rounded-xl gap-0.5" onClick={() => openCreateDialog(null)}>
            <Plus className="w-4 h-4" />
            New Goal
          </Button>
        </div>

        {/* ── Overview card ── */}
        {goals.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Overall</p>
              <p className="text-xs text-muted-foreground">{completedRoot} of {rootCount} big goals completed</p>
            </div>
            <span className="text-xl font-bold text-foreground">
              {rootCount ? Math.round((completedRoot / rootCount) * 100) : 0}%
            </span>
          </div>
        )}

        {/* ── Goal tree ── */}
        {tree.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Target className="w-12 h-12 text-primary/60 mb-4 animate-bounce" />
            <p className="font-semibold text-foreground">No goals yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Set a big goal (e.g. "Learn Backend in 6 months"), then break it down into monthly and weekly steps.
            </p>
            <Button className="mt-6 rounded-xl" onClick={() => openCreateDialog(null)}>
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
              onAddChild={openCreateDialog}
              onProgressChange={handleProgressUpdate}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* ── Create Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl mx-4">
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
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 -mt-1">
              <span className="text-xs text-muted-foreground">Under:</span>
              <span className="text-xs font-medium text-foreground truncate">{parentGoal.title}</span>
            </div>
          )}

          <div className="space-y-3 pt-1">
            <Input
              placeholder="Goal title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="rounded-xl"
              autoFocus
            />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="rounded-xl"
            />
            <Select value={category} onValueChange={v => setCategory(v as GoalCategory)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(([val, cfg]) => (
                  <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Deadline</p>
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="rounded-xl" />
            </div>
            <Button
              className="w-full rounded-xl"
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

  return (
    <div className={cn('space-y-2', depth > 0 && 'pl-4 border-l-2 border-border ml-2')}>
      {/* Card */}
      <div className={cn(
        'bg-card border border-border rounded-2xl overflow-hidden transition-all',
        node.isCompleted && 'opacity-70',
        depth === 0 && 'shadow-retool-sm',
      )}>
        {/* Top accent line by period */}
        <div className={cn('h-0.5 w-full', {
          'bg-violet-400': node.periodType === 'long_term',
          'bg-blue-400': node.periodType === 'monthly',
          'bg-green-400': node.periodType === 'weekly',
          'bg-orange-400': node.periodType === 'daily',
        })} />

        <div className="p-4 space-y-3">
          {/* Row 1: icon + title + badges + actions */}
          <div className="flex items-start gap-2">
            {/* Expand toggle if has children */}
            {node.children.length > 0 && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="mt-0.5 p-0.5 rounded-lg hover:bg-accent text-muted-foreground shrink-0"
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
                <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', periodCfg.bg, periodCfg.color)}>
                  <periodCfg.icon className="w-3 h-3 shrink-0" /> {periodCfg.label}
                </span>
                {/* Category badge */}
                <span className={cn('inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full', catCfg.bg, catCfg.color)}>
                  {catCfg.label}
                </span>
              </div>
              <p className={cn(
                'font-semibold text-foreground mt-1 leading-snug',
                depth === 0 ? 'text-base' : 'text-sm',
                node.isCompleted && 'line-through text-muted-foreground',
              )}>
                {node.title}
              </p>
              {node.description && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{node.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onToggleComplete(node)}
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                  node.isCompleted
                    ? 'border-green-500 bg-green-500 dark:border-green-400 dark:bg-green-400'
                    : 'border-border hover:border-green-400',
                )}
                aria-label="Toggle complete"
              >
                {node.isCompleted && <span className="text-white text-[10px] font-bold">✓</span>}
              </button>
              <button
                onClick={() => onDelete(node.id)}
                className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
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
                <span className="text-muted-foreground">Progress</span>
                <div className="flex items-center gap-2">
                  {childAvgProgress !== null && (
                    <span className="text-muted-foreground">
                      Sub-goals avg: {childAvgProgress}%
                    </span>
                  )}
                  <span className="font-bold text-foreground">{node.progress}%</span>
                </div>
              </div>
              <input
                type="range" min={0} max={100} step={5}
                value={node.progress}
                onChange={e => onProgressChange(node.id, Number(e.target.value))}
                className="w-full accent-foreground h-1.5"
              />
            </div>
          )}

          {node.isCompleted && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed!</span>
            </div>
          )}

          {/* Row 3: Deadline + Add child button */}
          <div className="flex items-center justify-between">
            {node.deadline ? (
              <span className="text-xs text-muted-foreground">Due {node.deadline}</span>
            ) : (
              <span />
            )}
            {hasChild && (
              <button
                onClick={() => onAddChild(node)}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/40 rounded-lg px-2 py-1 transition-all"
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
