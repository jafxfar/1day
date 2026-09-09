import {
  apiRoutes,
  type CreateJournalEntryPayload,
  type JournalEntry,
} from '@life-os/contracts'
import { request } from '../api/client'

export type GetJournalEntriesPayload = {
  limit?: number
  offset?: number
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
  delete: (id: string) => request<{ success: boolean; id: string }>(
    `${apiRoutes.journal}/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  ),
}
