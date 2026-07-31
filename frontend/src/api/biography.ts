import { request } from './client'

export type DayQuality = 'great' | 'good' | 'neutral' | 'poor' | 'no_data'

export interface BiographyHabitRecord {
  title: string
  icon: string
  completed: boolean
}

export interface BiographyDay {
  date: string
  mood: number | null
  energy: number | null
  sleepHours: number | null
  focusText: string | null
  eveningRating: number | null
  eveningTags: string[]
  wins: string | null
  failures: string | null
  habits: BiographyHabitRecord[]
  habitsCompleted: number
  habitsTotal: number
  journalTitle: string | null
  journalContent: string | null
  journalMood: number | null
  journalTags: string[]
  score: number
  quality: DayQuality
}

export const biographyApi = {
  getAll: () => request<BiographyDay[]>('/api/biography'),
}
