import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'
import { parseConfig } from '../config/env.js'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const migrationPath = path.join(scriptDirectory, '../../migrations/migration.sql')

const runMigration = async () => {
  const config = parseConfig(process.env)
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

runMigration().catch(error => {
  console.error('Database migration failed:', error)
  process.exit(1)
})
