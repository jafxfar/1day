import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'
import type { AppConfig } from '../config/env.js'

const getMigrationPath = () => {
  const moduleDirectory = path.dirname(fileURLToPath(import.meta.url))
  return path.join(moduleDirectory, '../../migrations/migration.sql')
}

export const runMigrations = async (config: AppConfig) => {
  const migrationPath = getMigrationPath()
  const sql = fs.readFileSync(migrationPath, 'utf8')

  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  })

  try {
    await pool.query(sql)
    console.log('Database migration completed successfully')
  } finally {
    await pool.end()
  }
}
