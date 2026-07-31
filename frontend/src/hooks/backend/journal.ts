import {
  journalApi,
  type CreateJournalEntryPayload,
  type DeleteJournalEntryPayload,
  type GetJournalEntriesPayload,
} from '../../api/journal'
import { useApiAction } from '../useApiAction'

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
