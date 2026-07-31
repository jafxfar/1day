import type { CreateJournalEntryPayload, JournalQuery } from '@life-os/contracts'
import { AppError } from '../../lib/errors.js'
import { mapJournalEntry } from '../../lib/mappers.js'
import type { JournalRepository } from './journal.repository.js'

export const createJournalService = (repository: JournalRepository) => ({
  list: async (userId: number, query: JournalQuery) => (
    await repository.list(userId, query)
  ).map(mapJournalEntry),
  create: async (userId: number, payload: CreateJournalEntryPayload) => {
    const row = await repository.create(userId, payload)
    if (!row) throw new AppError(500, 'Journal entry creation failed')
    return mapJournalEntry(row)
  },
  remove: async (id: string, userId: number) => {
    if (!await repository.softDelete(id, userId)) {
      throw new AppError(404, 'Journal entry not found')
    }
    return { success: true, id }
  },
})

export type JournalService = ReturnType<typeof createJournalService>
