import type {
  EveningReflection,
  MorningCheckin,
  TodayCheckins,
} from '../lib/types'
import { request } from './client'

export interface SaveMorningCheckinPayload {
  sleepHours: number
  energy: number
  mood: number
  focusText: string
  checkinDate?: string
}

export interface SaveEveningReflectionPayload {
  rating: number
  wins: string
  failures: string
  reasons: string
  tags: string[]
  checkinDate?: string
}

export const checkinsApi = {
  getToday: () => request<TodayCheckins>('/api/checkins/today'),
  saveMorning: (payload: SaveMorningCheckinPayload) => request<MorningCheckin>(
    '/api/checkins/morning',
    {
      method: 'POST',
      body: payload,
    },
  ),
  saveEvening: (payload: SaveEveningReflectionPayload) => request<EveningReflection>(
    '/api/checkins/evening',
    {
      method: 'POST',
      body: payload,
    },
  ),
}
