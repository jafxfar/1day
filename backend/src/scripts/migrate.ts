import 'dotenv/config'
import { parseConfig } from '../config/env.js'
import { runMigrations } from '../lib/migrate.js'

const config = parseConfig(process.env)

runMigrations(config).catch(error => {
  console.error('Database migration failed:', error)
  process.exit(1)
})
