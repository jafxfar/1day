
/**
 * Retool DB compatibility layer for standalone deployment.
 *
 * Replaces the Retool-injected `retoolDb` global with a real pg Pool.
 * Import this module FIRST in server.ts (before any backend functions).
 */
import 'dotenv/config'
import { Pool, QueryResult, QueryResultRow } from 'pg'

const rawUrl = process.env['DATABASE_URL']
const connectionString = rawUrl ? rawUrl.replace('@hostname', '@localhost') : undefined

const pool = new Pool({
  connectionString,
  ssl: process.env['DATABASE_SSL'] === 'true'
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error:', err)
})

export const retoolDbClient = {
  __type: 'retoolDb' as const,

  async query<T extends QueryResultRow = Record<string, any>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ data: T[] }> {
    const result: QueryResult<T> = await pool.query<T>(sql, params ?? [])
    return { data: result.rows }
  },

  async getSchema(): Promise<{ data: Record<string, unknown> }> {
    return { data: {} }
  },
}

  // Set as global so existing backend functions work without modification
  ; (globalThis as Record<string, unknown>)['retoolDb'] = retoolDbClient
