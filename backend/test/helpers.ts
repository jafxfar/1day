import { vi } from 'vitest'
import type { AppConfig } from '../src/config/env.js'
import type { Database } from '../src/db.js'

export const testConfig: AppConfig = {
  nodeEnv: 'test',
  port: 3000,
  databaseUrl: 'postgres://user:password@localhost:5432/life_os_test',
  databaseSsl: false,
  jwtSecret: 'test-secret-that-is-at-least-32-characters-long',
  jwtExpires: '30d',
  corsOrigins: ['http://localhost:5173'],
  cookie: {
    name: 'token',
    secure: false,
    sameSite: 'lax',
    maxAgeMs: 2_592_000_000,
  },
}

export const createDatabaseStub = (): Database => ({
  query: vi.fn(),
  connect: vi.fn(),
})
