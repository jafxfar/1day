import 'dotenv/config'
import { createApp } from './app.js'
import { createDatabase } from './db.js'
import { parseConfig } from './config/env.js'

const config = parseConfig(process.env)
const database = createDatabase(config)
const app = createApp(config, {
  database: database.pool,
  isDatabaseReady: database.isReady,
})

const server = app.listen(config.port, () => {
  console.log(`Life OS backend listening on http://localhost:${config.port}`)
})

let shuttingDown = false
const shutdown = async (signal: string) => {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`${signal} received, shutting down`)

  server.close(async error => {
    try {
      await database.close()
      if (error) {
        console.error(error)
        process.exitCode = 1
      }
    } finally {
      process.exit()
    }
  })

  setTimeout(() => {
    console.error('Graceful shutdown timed out')
    process.exit(1)
  }, 10_000).unref()
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
