import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'
import type { AppConfig } from './config/env.js'

export interface Database {
  query<Row extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<Row>>
  connect(): Promise<PoolClient>
}

export interface DatabaseManager {
  pool: Pool
  isReady: () => Promise<boolean>
  close: () => Promise<void>
}

export const createDatabase = (config: AppConfig): DatabaseManager => {
  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  })

  pool.on('error', error => {
    console.error('Unexpected PostgreSQL pool error', error)
  })

  return {
    pool,
    isReady: async () => {
      try {
        await pool.query('SELECT 1')
        return true
      } catch {
        return false
      }
    },
    close: () => pool.end(),
  }
}