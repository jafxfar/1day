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
  ai: {
    enabled: true,
    ollamaBaseUrl: 'http://127.0.0.1:11434',
    ollamaModel: 'qwen3:8b',
  },
}

export const createDatabaseStub = (): Database => ({
  query: vi.fn(),
  connect: vi.fn(),
})
