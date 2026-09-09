import {
  apiRoutes,
  type EveningReflection,
  type MorningCheckin,
  type SaveEveningReflectionPayload,
  type SaveMorningCheckinPayload,
  type TodayCheckins,
} from '@life-os/contracts'
import { request } from '../api/client'

export const checkinsApi = {
  getToday: () => request<TodayCheckins>(apiRoutes.checkins.today),
  saveMorning: (payload: SaveMorningCheckinPayload) => request<MorningCheckin>(
    apiRoutes.checkins.morning,
    {
      method: 'POST',
      body: payload,
    },
  ),
  saveEvening: (payload: SaveEveningReflectionPayload) => request<EveningReflection>(
    apiRoutes.checkins.evening,
    {
      method: 'POST',
      body: payload,
    },
  ),
}
