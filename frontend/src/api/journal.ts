import type { JournalEntry } from '../lib/types'
import { request } from './client'

export interface GetJournalEntriesPayload {
  limit?: number
  offset?: number
}

export interface CreateJournalEntryPayload {
  title: string
  content: string
  mood: number
  energy: number
  tags: string[]
  entryDate?: string
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
    '/api/journal',
    { query: { ...payload } },
  ),
  create: (payload: CreateJournalEntryPayload) => request<JournalEntry>('/api/journal', {
    method: 'POST',
    body: payload,
  }),
  delete: ({ id }: DeleteJournalEntryPayload) => request<DeleteJournalEntryResponse>(
    `/api/journal/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  ),
}
