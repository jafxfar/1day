import {
  checkinsApi,
  type SaveEveningReflectionPayload,
  type SaveMorningCheckinPayload,
} from '../../api/checkins'
import { useApiAction } from '../useApiAction'

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
