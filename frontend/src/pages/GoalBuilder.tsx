import { useMemo, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type {
  CreateGoalTreePayload,
  GoalCategory,
  TaskType,
} from '@life-os/contracts'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useCreateGoalTree } from '../entities/goals/model/useGoals'
import { Layout } from '../shared/ui/Layout'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shared/ui/select'
import { Textarea } from '../shared/ui/textarea'

type LocalTask = {
  key: string
  title: string
  description: string
  deadline: string
  taskType: TaskType
}

type LocalProject = {
  key: string
  title: string
  description: string
  deadline: string
  tasks: LocalTask[]
}

type LocalMilestone = {
  key: string
  title: string
  description: string
  deadline: string
  projects: LocalProject[]
}

const CATEGORIES: Array<{ value: GoalCategory; label: string }> = [
  { value: 'career', label: 'Career' },
  { value: 'learning', label: 'Learning' },
  { value: 'health', label: 'Health' },
  { value: 'finance', label: 'Finance' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'personal', label: 'Personal' },
]

const TASK_TYPES: Array<{ value: TaskType; label: string }> = [
  { value: 'learning', label: 'Learning' },
  { value: 'research', label: 'Research' },
  { value: 'practice', label: 'Practice' },
  { value: 'review', label: 'Review' },
  { value: 'other', label: 'Other' },
]

const createKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const createTask = (): LocalTask => ({
  key: createKey(),
  title: '',
  description: '',
  deadline: '',
  taskType: 'learning',
})

const createProject = (): LocalProject => ({
  key: createKey(),
  title: '',
  description: '',
  deadline: '',
  tasks: [createTask()],
})

const createMilestone = (): LocalMilestone => ({
  key: createKey(),
  title: '',
  description: '',
  deadline: '',
  projects: [createProject()],
})

const toNullableDate = (value: string) => (value.trim() ? value : null)

export default function GoalBuilder() {
  const navigate = useNavigate()
  const { trigger: createTree, loading, error } = useCreateGoalTree()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GoalCategory>('career')
  const [deadline, setDeadline] = useState('')
  const [milestones, setMilestones] = useState<LocalMilestone[]>([createMilestone()])

  const canSave = useMemo(() => Boolean(title.trim()), [title])

  const handleAddMilestone = () => {
    setMilestones(prev => [...prev, createMilestone()])
  }

  const handleRemoveMilestone = (milestoneKey: string) => {
    setMilestones(prev => prev.filter(item => item.key !== milestoneKey))
  }

  const handleUpdateMilestone = (
    milestoneKey: string,
    patch: Partial<Omit<LocalMilestone, 'key' | 'projects'>>,
  ) => {
    setMilestones(prev => prev.map(item => (
      item.key === milestoneKey ? { ...item, ...patch } : item
    )))
  }

  const handleAddProject = (milestoneKey: string) => {
    setMilestones(prev => prev.map(item => (
      item.key === milestoneKey
        ? { ...item, projects: [...item.projects, createProject()] }
        : item
    )))
  }

  const handleRemoveProject = (milestoneKey: string, projectKey: string) => {
    setMilestones(prev => prev.map(item => (
      item.key === milestoneKey
        ? { ...item, projects: item.projects.filter(project => project.key !== projectKey) }
        : item
    )))
  }

  const handleUpdateProject = (
    milestoneKey: string,
    projectKey: string,
    patch: Partial<Omit<LocalProject, 'key' | 'tasks'>>,
  ) => {
    setMilestones(prev => prev.map(item => {
      if (item.key !== milestoneKey) return item
      return {
        ...item,
        projects: item.projects.map(project => (
          project.key === projectKey ? { ...project, ...patch } : project
        )),
      }
    }))
  }

  const handleAddTask = (milestoneKey: string, projectKey: string) => {
    setMilestones(prev => prev.map(item => {
      if (item.key !== milestoneKey) return item
      return {
        ...item,
        projects: item.projects.map(project => (
          project.key === projectKey
            ? { ...project, tasks: [...project.tasks, createTask()] }
            : project
        )),
      }
    }))
  }

  const handleRemoveTask = (milestoneKey: string, projectKey: string, taskKey: string) => {
    setMilestones(prev => prev.map(item => {
      if (item.key !== milestoneKey) return item
      return {
        ...item,
        projects: item.projects.map(project => (
          project.key === projectKey
            ? { ...project, tasks: project.tasks.filter(task => task.key !== taskKey) }
            : project
        )),
      }
    }))
  }

  const handleUpdateTask = (
    milestoneKey: string,
    projectKey: string,
    taskKey: string,
    patch: Partial<Omit<LocalTask, 'key'>>,
  ) => {
    setMilestones(prev => prev.map(item => {
      if (item.key !== milestoneKey) return item
      return {
        ...item,
        projects: item.projects.map(project => {
          if (project.key !== projectKey) return project
          return {
            ...project,
            tasks: project.tasks.map(task => (
              task.key === taskKey ? { ...task, ...patch } : task
            )),
          }
        }),
      }
    }))
  }

  const handleSave = async () => {
    if (!canSave || loading) return

    const treeError = milestones.some(milestone => {
      if (!milestone.title.trim()) {
        return milestone.projects.some(project => (
          project.title.trim()
          || project.tasks.some(task => task.title.trim())
        ))
      }
      return milestone.projects.some(project => {
        if (!project.title.trim()) {
          return project.tasks.some(task => task.title.trim())
        }
        return project.tasks.some(task => task.title.trim() && !task.deadline)
      })
    })

    if (treeError) return

    const payload: CreateGoalTreePayload = {
      title: title.trim(),
      description: description.trim(),
      category,
      deadline: toNullableDate(deadline),
      milestones: milestones
        .filter(milestone => milestone.title.trim())
        .map(milestone => ({
          title: milestone.title.trim(),
          description: milestone.description.trim(),
          deadline: toNullableDate(milestone.deadline),
          projects: milestone.projects
            .filter(project => project.title.trim())
            .map(project => ({
              title: project.title.trim(),
              description: project.description.trim(),
              deadline: toNullableDate(project.deadline),
              tasks: project.tasks
                .filter(task => task.title.trim())
                .map(task => ({
                  title: task.title.trim(),
                  description: task.description.trim(),
                  deadline: toNullableDate(task.deadline),
                  taskType: task.taskType,
                })),
            })),
        })),
    }

    const created = await createTree(payload)
    if (created) navigate('/goals')
  }

  const handleKeyDownSave = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && canSave) {
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
            <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground">Manual builder</p>
            <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground">Goal Builder</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Goal → Milestone → Project → Task. Add dates and task types yourself.
            </p>
          </div>
        </header>

        <section className="space-y-3 rounded-[24px] bg-foreground p-4 text-background" aria-label="Goal details">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-background/55">Goal</p>
          <Input
            placeholder="Become Senior DevOps"
            value={title}
            onChange={event => setTitle(event.target.value)}
            className="rounded-2xl border-background/15 bg-background/10 text-background placeholder:text-background/40"
            aria-label="Goal title"
          />
          <Textarea
            placeholder="What does success look like?"
            value={description}
            onChange={event => setDescription(event.target.value)}
            className="min-h-20 rounded-2xl border-background/15 bg-background/10 text-background placeholder:text-background/40"
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

        <section className="space-y-4" aria-label="Goal tree">
          {milestones.map((milestone, milestoneIndex) => (
            <article key={milestone.key} className="space-y-3 rounded-[24px] border border-border bg-card/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Milestone {milestoneIndex + 1}
                </p>
                <button
                  type="button"
                  onClick={() => handleRemoveMilestone(milestone.key)}
                  className="pressable rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove milestone ${milestoneIndex + 1}`}
                  tabIndex={0}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <Input
                placeholder="e.g. Linux fundamentals"
                value={milestone.title}
                onChange={event => handleUpdateMilestone(milestone.key, { title: event.target.value })}
                className="rounded-2xl"
                aria-label={`Milestone ${milestoneIndex + 1} title`}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Description"
                  value={milestone.description}
                  onChange={event => handleUpdateMilestone(milestone.key, { description: event.target.value })}
                  className="rounded-2xl"
                  aria-label={`Milestone ${milestoneIndex + 1} description`}
                />
                <Input
                  type="date"
                  value={milestone.deadline}
                  onChange={event => handleUpdateMilestone(milestone.key, { deadline: event.target.value })}
                  className="rounded-2xl"
                  aria-label={`Milestone ${milestoneIndex + 1} deadline`}
                />
              </div>

              <div className="space-y-3 pl-2 border-l border-primary/30">
                {milestone.projects.map((project, projectIndex) => (
                  <div key={project.key} className="space-y-2 rounded-2xl bg-muted/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Project {projectIndex + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRemoveProject(milestone.key, project.key)}
                        className="pressable rounded-lg p-1 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove project ${projectIndex + 1}`}
                        tabIndex={0}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Input
                      placeholder="Project title"
                      value={project.title}
                      onChange={event => handleUpdateProject(milestone.key, project.key, { title: event.target.value })}
                      className="rounded-xl"
                      aria-label={`Project ${projectIndex + 1} title`}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Description"
                        value={project.description}
                        onChange={event => handleUpdateProject(milestone.key, project.key, { description: event.target.value })}
                        className="rounded-xl"
                        aria-label={`Project ${projectIndex + 1} description`}
                      />
                      <Input
                        type="date"
                        value={project.deadline}
                        onChange={event => handleUpdateProject(milestone.key, project.key, { deadline: event.target.value })}
                        className="rounded-xl"
                        aria-label={`Project ${projectIndex + 1} deadline`}
                      />
                    </div>

                    <div className="space-y-2">
                      {project.tasks.map((task, taskIndex) => (
                        <div key={task.key} className="space-y-2 rounded-xl border border-border/70 bg-background/40 p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                              Task {taskIndex + 1}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRemoveTask(milestone.key, project.key, task.key)}
                              className="pressable rounded-lg p-1 text-muted-foreground hover:text-destructive"
                              aria-label={`Remove task ${taskIndex + 1}`}
                              tabIndex={0}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <Input
                            placeholder="Task title"
                            value={task.title}
                            onChange={event => handleUpdateTask(milestone.key, project.key, task.key, { title: event.target.value })}
                            className="rounded-xl"
                            aria-label={`Task ${taskIndex + 1} title`}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Select
                              value={task.taskType}
                              onValueChange={value => handleUpdateTask(
                                milestone.key,
                                project.key,
                                task.key,
                                { taskType: value as TaskType },
                              )}
                            >
                              <SelectTrigger className="rounded-xl" aria-label={`Task ${taskIndex + 1} type`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TASK_TYPES.map(item => (
                                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="date"
                              value={task.deadline}
                              onChange={event => handleUpdateTask(
                                milestone.key,
                                project.key,
                                task.key,
                                { deadline: event.target.value },
                              )}
                              className="rounded-xl"
                              aria-label={`Task ${taskIndex + 1} deadline`}
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => handleAddTask(milestone.key, project.key)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add task
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => handleAddProject(milestone.key)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add project
                </Button>
              </div>
            </article>
          ))}

          <Button type="button" variant="outline" className="w-full rounded-2xl" onClick={handleAddMilestone}>
            <Plus className="h-4 w-4" />
            Add milestone
          </Button>
        </section>

        {error && (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        )}

        <Button
          type="button"
          className="pressable h-12 w-full rounded-2xl"
          disabled={!canSave || loading}
          onClick={() => void handleSave()}
        >
          {loading ? 'Saving tree…' : 'Create goal tree'}
        </Button>
      </main>
    </Layout>
  )
}
