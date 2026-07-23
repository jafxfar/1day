
export type GoalCategory = 'health' | 'career' | 'learning' | 'relationships' | 'finance' | 'personal'

export interface Goal {
  id: string
  title: string
  description: string
  category: GoalCategory
  progress: number
  deadline: string
}

export interface Habit {
  id: string
  title: string
  type: 'positive' | 'negative'
  icon: string
  streak: number
  completedToday: boolean
  category: string
}

export interface JournalEntry {
  id: string
  date: string
  title: string
  content: string
  mood: number
  energy: number
  tags: string[]
}

export interface DayCheckin {
  date: string
  sleepHours: number
  energy: number
  mood: number
  focus: string
  completed: boolean
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export const INITIAL_GOALS: Goal[] = [
  {
    id: '1',
    title: 'Launch MVP',
    description: 'Build and launch the Life OS MVP',
    category: 'career',
    progress: 35,
    deadline: '2024-09-30',
  },
  {
    id: '2',
    title: 'Run a Marathon',
    description: 'Complete a full marathon',
    category: 'health',
    progress: 62,
    deadline: '2024-10-15',
  },
  {
    id: '3',
    title: 'Learn Spanish',
    description: 'Reach B2 level in Spanish',
    category: 'learning',
    progress: 20,
    deadline: '2024-12-31',
  },
  {
    id: '4',
    title: 'Save $10,000',
    description: 'Build emergency fund',
    category: 'finance',
    progress: 48,
    deadline: '2024-12-31',
  },
]

export const INITIAL_HABITS: Habit[] = [
  { id: '1', title: 'Morning Meditation', type: 'positive', icon: '🧘', streak: 7,  completedToday: false, category: 'mind' },
  { id: '2', title: 'Exercise 30 min',    type: 'positive', icon: '💪', streak: 3,  completedToday: false, category: 'body' },
  { id: '3', title: 'Read 20 pages',      type: 'positive', icon: '📚', streak: 12, completedToday: false, category: 'learning' },
  { id: '4', title: 'Cold Shower',        type: 'positive', icon: '🚿', streak: 5,  completedToday: false, category: 'body' },
  { id: '5', title: 'No social media before 10am', type: 'negative', icon: '📵', streak: 2, completedToday: false, category: 'focus' },
  { id: '6', title: 'Drink 2L water',     type: 'positive', icon: '💧', streak: 8,  completedToday: false, category: 'health' },
]

const fmt = (d: Date) => d.toISOString().split('T')[0] ?? ''
const today = new Date()
const d1 = new Date(today); d1.setDate(d1.getDate() - 1)
const d2 = new Date(today); d2.setDate(d2.getDate() - 2)
const d3 = new Date(today); d3.setDate(d3.getDate() - 4)

export const INITIAL_JOURNAL: JournalEntry[] = [
  {
    id: '1',
    date: fmt(today),
    title: 'Great productive morning',
    content: 'Woke up feeling energized. Completed my morning routine without any distractions. Ready to tackle the big tasks today.',
    mood: 8, energy: 7,
    tags: ['productive', 'morning', 'focus'],
  },
  {
    id: '2',
    date: fmt(d1),
    title: 'Challenging but rewarding',
    content: "Had a tough day at work but pushed through. Completed the feature I've been working on for a week. Proud of myself.",
    mood: 6, energy: 5,
    tags: ['work', 'challenge', 'growth'],
  },
  {
    id: '3',
    date: fmt(d2),
    title: 'Rest day reflections',
    content: 'Took a much needed rest day. Read for 2 hours and went for a long walk in the park. Feeling recharged.',
    mood: 9, energy: 8,
    tags: ['rest', 'nature', 'reading'],
  },
  {
    id: '4',
    date: fmt(d3),
    title: 'Planning the week ahead',
    content: 'Spent the morning planning. Set clear priorities and feel confident about the week. Alignment with goals feels good.',
    mood: 7, energy: 6,
    tags: ['planning', 'productive', 'focus'],
  },
]

export const INITIAL_MESSAGES: AIMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hey! I'm your AI Coach 🧠 I'm here to help you stay focused, reflect, and grow. How are you feeling today?",
    timestamp: new Date().toISOString(),
  },
]
