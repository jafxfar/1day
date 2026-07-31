import { describe, expect, it } from 'vitest'
import { parseConfig } from '../src/config/env.js'

const validEnvironment = {
  DATABASE_URL: 'postgres://user:password@localhost:5432/life_os',
  DATABASE_SSL: 'false',
  JWT_SECRET: 'a-secret-that-is-at-least-32-characters',
  CORS_ORIGINS: 'http://localhost:5173, https://life.example.com',
}

describe('parseConfig', () => {
  it('parses and normalizes a valid environment', () => {
    const config = parseConfig(validEnvironment)
    expect(config.port).toBe(3000)
    expect(config.databaseSsl).toBe(false)
    expect(config.corsOrigins).toEqual([
      'http://localhost:5173',
      'https://life.example.com',
    ])
  })

  it('rejects missing secrets and database settings', () => {
    expect(() => parseConfig({ CORS_ORIGINS: 'http://localhost' })).toThrow(
      'Invalid environment configuration',
    )
  })

  it('rejects insecure SameSite=None cookies', () => {
    expect(() => parseConfig({
      ...validEnvironment,
      COOKIE_SAME_SITE: 'none',
      COOKIE_SECURE: 'false',
    })).toThrow('SameSite=None requires secure cookies')
  })
})
