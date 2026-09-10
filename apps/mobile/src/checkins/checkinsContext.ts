import type {
  EveningReflection,
  MorningCheckin,
  SaveEveningReflectionPayload,
  SaveMorningCheckinPayload,
} from '@life-os/contracts'
import { createContext } from 'react'

export type CheckinsContextValue = {
  morningCheckin: MorningCheckin | null
  eveningReflection: EveningReflection | null
  hasCompletedMorning: boolean
  hasCompletedEvening: boolean
  isLoading: boolean
  refetch: () => void
  saveMorning: (payload: SaveMorningCheckinPayload) => Promise<MorningCheckin>
  saveEvening: (payload: SaveEveningReflectionPayload) => Promise<EveningReflection>
}

export const CheckinsContext = createContext<CheckinsContextValue | null>(null)
