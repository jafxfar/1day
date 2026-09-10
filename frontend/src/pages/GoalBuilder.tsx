import { useMemo, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CreateGoalTreePayload, GoalCategory } from '@life-os/contracts'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useCreateGoalTree } from '../entities/goals/model/useGoals'
import { Layout } from '../shared/ui/Layout'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shared/ui/select'
import { Textarea } from '../shared/ui/textarea'

type LocalStep = {
  key: string
  title: string
  deadline: string
}

const CATEGORIES: Array<{ value: GoalCategory; label: string }> = [
  { value: 'career', label: 'Career' },
  { value: 'learning', label: 'Learning' },
  { value: 'health', label: 'Health' },
  { value: 'finance', label: 'Finance' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'personal', label: 'Personal' },
]

const createKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const createStep = (): LocalStep => ({
  key: createKey(),
  title: '',
  deadline: '',
})

const toNullableDate = (value: string) => (value.trim() ? value : null)

export default function GoalBuilder() {
  const navigate = useNavigate()
  const { trigger: createTree, loading, error } = useCreateGoalTree()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GoalCategory>('personal')
  const [deadline, setDeadline] = useState('')
  const [showSteps, setShowSteps] = useState(false)
  const [steps, setSteps] = useState<LocalStep[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  const filledSteps = useMemo(
    () => steps.filter(step => step.title.trim()),
    [steps],
  )
  const canSave = useMemo(() => Boolean(title.trim()), [title])
  const saveLabel = filledSteps.length > 0 ? 'Create goal and steps' : 'Create goal'

  const handleShowSteps = () => {
    setShowSteps(true)
    setSteps(prev => (prev.length === 0 ? [createStep()] : prev))
  }

  const handleAddStep = () => {
    setSteps(prev => [...prev, createStep()])
  }

  const handleRemoveStep = (stepKey: string) => {
    setSteps(prev => {
      const next = prev.filter(item => item.key !== stepKey)
      if (next.length === 0) {
        setShowSteps(false)
      }
      return next
    })
  }

  const handleUpdateStep = (stepKey: string, patch: Partial<Omit<LocalStep, 'key'>>) => {
    setSteps(prev => prev.map(item => (
      item.key === stepKey ? { ...item, ...patch } : item
    )))
  }

  const handleStepKeyDown = (event: KeyboardEvent<HTMLInputElement>, stepKey: string) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const isLast = steps[steps.length - 1]?.key === stepKey
    if (isLast) {
      handleAddStep()
    }
  }

  const handleSave = async () => {
    setValidationError(null)

    if (!title.trim()) {
      setValidationError('Enter a goal title to continue')
      return
    }

    const payload: CreateGoalTreePayload = {
      title: title.trim(),
      description: description.trim(),
      category,
      deadline: toNullableDate(deadline),
      steps: filledSteps.map(step => ({
        title: step.title.trim(),
        description: '',
        deadline: toNullableDate(step.deadline),
        taskType: 'other',
      })),
    }

    const created = await createTree(payload)
    if (created) {
      navigate('/goals')
    }
  }

  const handleKeyDownSave = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && canSave && !loading) {
      void handleSave()
    }
  }

  return (
    <Layout hideNav>
      <main className="app-page space-y-6 px-4 pb-10 pt-6" onKeyDown={handleKeyDownSave}>
        <header className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate('/goals')}
            className="pressable mt-1 rounded-xl p-2 text-muted-foreground hover:bg-muted"
            aria-label="Back to goals"
            tabIndex={0}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground">New goal</p>
            <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground">Create a goal</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with one goal. Break it into steps only if you want.
            </p>
          </div>
        </header>

        <section className="space-y-3 rounded-[24px] bg-foreground p-4 text-background" aria-label="Goal details">
          <Input
            placeholder="What do you want to achieve?"
            value={title}
            onChange={event => {
              setTitle(event.target.value)
              if (validationError) setValidationError(null)
            }}
            className="rounded-2xl border-background/15 bg-background/10 text-lg text-background placeholder:text-background/40"
            aria-label="Goal title"
            autoFocus
          />
          <Textarea
            placeholder="Optional — what does success look like?"
            value={description}
            onChange={event => setDescription(event.target.value)}
            className="min-h-16 rounded-2xl border-background/15 bg-background/10 text-background placeholder:text-background/40"
            aria-label="Goal description"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select value={category} onValueChange={value => setCategory(value as GoalCategory)}>
              <SelectTrigger className="rounded-2xl border-background/15 bg-background/10 text-background" aria-label="Goal category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(item => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={deadline}
              onChange={event => setDeadline(event.target.value)}
              className="rounded-2xl border-background/15 bg-background/10 text-background"
              aria-label="Goal deadline"
            />
          </div>
        </section>

        {!showSteps ? (
          <button
            type="button"
            onClick={handleShowSteps}
            className="pressable flex w-full items-center justify-center gap-2 rounded-[24px] border border-dashed border-border bg-card/30 px-4 py-5 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
            aria-label="Break goal into steps"
            tabIndex={0}
          >
            <Plus className="h-4 w-4" />
            Break into steps
          </button>
        ) : (
          <section className="space-y-3 rounded-[24px] border border-border bg-card/40 p-4" aria-label="Goal steps">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Steps</p>
              <p className="text-xs text-muted-foreground">Optional · press Enter to add next</p>
            </div>

            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.key}
                  className="flex items-start gap-2 rounded-2xl bg-muted/40 p-2.5"
                >
                  <span className="mt-2.5 w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Input
                      placeholder={`Step ${index + 1}`}
                      value={step.title}
                      onChange={event => handleUpdateStep(step.key, { title: event.target.value })}
                      onKeyDown={event => handleStepKeyDown(event, step.key)}
                      className="rounded-xl"
                      aria-label={`Step ${index + 1} title`}
                    />
                    <Input
                      type="date"
                      value={step.deadline}
                      onChange={event => handleUpdateStep(step.key, { deadline: event.target.value })}
                      className="rounded-xl"
                      aria-label={`Step ${index + 1} deadline`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(step.key)}
                    className="pressable mt-1.5 rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove step ${index + 1}`}
                    tabIndex={0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={handleAddStep}
            >
              <Plus className="h-3.5 w-3.5" />
              Add step
            </Button>
          </section>
        )}

        {(validationError || error) && (
          <p className="text-sm text-destructive" role="alert">
            {validationError || error}
          </p>
        )}

        <Button
          type="button"
          className="pressable h-12 w-full rounded-2xl"
          disabled={!canSave || loading}
          onClick={() => void handleSave()}
        >
          {loading ? 'Saving…' : saveLabel}
        </Button>
      </main>
    </Layout>
  )
}
