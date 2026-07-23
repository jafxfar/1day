
/**
 * Standalone replacement for /frontend/hooks/useBackendFunction.ts
 *
 * HOW TO USE:
 *   Copy this file to /frontend/hooks/useBackendFunction.ts
 *   (replace the original Retool version)
 *
 * Maps Retool backend function paths → REST API calls to the Express server.
 * The API surface is identical to the Retool version:
 *   const { data, loading, error, trigger } = useGetGoals()
 */
import { useState, useCallback } from 'react'

const API_BASE = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000'

// ─── Path → endpoint mapping ──────────────────────────────────────────────
// Mirrors the Express routes defined in server.ts

const ROUTE_MAP: Record<string, { method: string; path: string }> = {
  '/backend/goals/getGoals.ts':               { method: 'GET',    path: '/api/goals' },
  '/backend/goals/createGoal.ts':             { method: 'POST',   path: '/api/goals' },
  '/backend/goals/updateGoal.ts':             { method: 'PATCH',  path: '/api/goals/{id}' },
  '/backend/goals/deleteGoal.ts':             { method: 'DELETE', path: '/api/goals/{id}' },

  '/backend/habits/getHabits.ts':             { method: 'GET',    path: '/api/habits' },
  '/backend/habits/createHabit.ts':           { method: 'POST',   path: '/api/habits' },
  '/backend/habits/toggleHabit.ts':           { method: 'POST',   path: '/api/habits/{habitId}/toggle' },
  '/backend/habits/deleteHabit.ts':           { method: 'DELETE', path: '/api/habits/{id}' },

  '/backend/journal/getJournalEntries.ts':    { method: 'GET',    path: '/api/journal' },
  '/backend/journal/createJournalEntry.ts':   { method: 'POST',   path: '/api/journal' },
  '/backend/journal/deleteJournalEntry.ts':   { method: 'DELETE', path: '/api/journal/{id}' },

  '/backend/checkins/getTodayCheckins.ts':    { method: 'GET',    path: '/api/checkins/today' },
  '/backend/checkins/saveMorningCheckin.ts':  { method: 'POST',   path: '/api/checkins/morning' },
  '/backend/checkins/saveEveningReflection.ts': { method: 'POST', path: '/api/checkins/evening' },

  '/backend/biography/getBiography.ts':       { method: 'GET',    path: '/api/biography' },
}

function buildUrl(template: string, params: Record<string, unknown>): string {
  let url = API_BASE + template
  // Replace path params like {id}, {habitId}
  return url.replace(/\{(\w+)\}/g, (_, key) => {
    const val = params[key]
    if (val !== undefined) return String(val)
    return `{${key}}`
  })
}

async function callApi(
  functionPath: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  const route = ROUTE_MAP[functionPath]
  if (!route) throw new Error(`No route mapping for: ${functionPath}`)

  const url = buildUrl(route.path, params)
  const isGet = route.method === 'GET'

  const response = await fetch(
    isGet
      ? url + (Object.keys(params).length ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '')
      : url,
    {
      method:      route.method,
      credentials: 'include',
      headers:     isGet ? undefined : { 'Content-Type': 'application/json' },
      body:        isGet ? undefined : JSON.stringify(params),
    },
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText })) as { error?: string }
    throw new Error(err.error ?? response.statusText)
  }

  return response.json()
}

// ─── Hook (same interface as the Retool version) ───────────────────────────

export function useBackendFunction(functionPath: string) {
  const [data,    setData]    = useState<unknown>(undefined)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const trigger = useCallback(
    async (
      params?: Record<string, unknown>,
      _options?: { skipCache?: boolean },
    ): Promise<unknown> => {
      setLoading(true)
      setError(null)

      try {
        const result = await callApi(functionPath, params ?? {})
        setData(result)
        setLoading(false)
        return result
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        setError(msg)
        setLoading(false)
        return null
      }
    },
    [functionPath],
  )

  return { data, loading, error, trigger }
}
