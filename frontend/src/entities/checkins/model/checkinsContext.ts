import type {
  EveningReflection,
  MorningCheckin,
} from '@life-os/contracts'
import { createContext } from 'react'

export interface CheckinsContextValue {
  morningCheckin: MorningCheckin | null
  eveningReflection: EveningReflection | null
  hasCompletedMorning: boolean
  hasCompletedEvening: boolean
  isLoading: boolean
  refetch: () => void
}

export const CheckinsContext = createContext<CheckinsContextValue | null>(null)
