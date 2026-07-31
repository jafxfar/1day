import {
  apiRoutes,
  type CreateJournalEntryPayload,
  type JournalEntry,
  type JournalQuery,
} from '@life-os/contracts'
import { request } from '../../../shared/api/client'

export type GetJournalEntriesPayload = {
  [Key in keyof JournalQuery]?: number
}

export interface DeleteJournalEntryPayload {
  id: string
}

type DeleteJournalEntryResponse = {
  success: boolean
  id: string
}

export const journalApi = {
  getAll: (payload: GetJournalEntriesPayload = {}) => request<JournalEntry[]>(
    apiRoutes.journal,
    { query: { ...payload } },
  ),
  create: (payload: CreateJournalEntryPayload) => request<JournalEntry>(apiRoutes.journal, {
    method: 'POST',
    body: payload,
  }),
  delete: ({ id }: DeleteJournalEntryPayload) => request<DeleteJournalEntryResponse>(
    `${apiRoutes.journal}/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  ),
}
