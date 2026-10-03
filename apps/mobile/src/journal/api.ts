import type { CreateJournalEntryPayload, JournalEntry } from '@life-os/contracts'
import {
  journalRepository,
  type GetJournalEntriesPayload,
} from '../data/journalRepository'

export type { GetJournalEntriesPayload }

export const journalApi = {
  getAll: (payload: GetJournalEntriesPayload = {}): Promise<JournalEntry[]> => (
    journalRepository.getAll(payload)
  ),
  create: (payload: CreateJournalEntryPayload): Promise<JournalEntry> => (
    journalRepository.create(payload)
  ),
  delete: (id: string): Promise<{ success: boolean; id: string }> => journalRepository.delete(id),
}
