import type {
  SaveEveningReflectionPayload,
  SaveMorningCheckinPayload,
} from '@life-os/contracts'
import { checkinsApi } from '../api/checkins'
import { useApiAction } from '../../../shared/api/useApiAction'

export const useGetTodayCheckins = () =>
  useApiAction<void, Awaited<ReturnType<typeof checkinsApi.getToday>>>(checkinsApi.getToday)

export const useSaveEveningReflection = () =>
  useApiAction<
    SaveEveningReflectionPayload,
    Awaited<ReturnType<typeof checkinsApi.saveEvening>>
  >(checkinsApi.saveEvening)

export const useSaveMorningCheckin = () =>
  useApiAction<
    SaveMorningCheckinPayload,
    Awaited<ReturnType<typeof checkinsApi.saveMorning>>
  >(checkinsApi.saveMorning)
