import { useBackendFunction } from '../useBackendFunction'

export function useCreateJournalEntry() {
  return useBackendFunction('/backend/journal/createJournalEntry.ts')
}
export function useDeleteJournalEntry() {
  return useBackendFunction('/backend/journal/deleteJournalEntry.ts')
}
export function useGetJournalEntries() {
  return useBackendFunction('/backend/journal/getJournalEntries.ts')
}
