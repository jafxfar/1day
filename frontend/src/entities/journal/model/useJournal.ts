import type { CreateJournalEntryPayload } from '@life-os/contracts'
import {
  journalApi,
  type DeleteJournalEntryPayload,
  type GetJournalEntriesPayload,
} from '../api/journal'
import { useApiAction } from '../../../shared/api/useApiAction'

export const useCreateJournalEntry = () =>
  useApiAction<
    CreateJournalEntryPayload,
    Awaited<ReturnType<typeof journalApi.create>>
  >(journalApi.create)

export const useDeleteJournalEntry = () =>
  useApiAction<
    DeleteJournalEntryPayload,
    Awaited<ReturnType<typeof journalApi.delete>>
  >(journalApi.delete)

export const useGetJournalEntries = () =>
  useApiAction<
    GetJournalEntriesPayload,
    Awaited<ReturnType<typeof journalApi.getAll>>
  >(journalApi.getAll)
