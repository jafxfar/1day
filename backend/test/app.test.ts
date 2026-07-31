import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { createDatabaseStub, testConfig } from './helpers.js'

describe('application infrastructure', () => {
  it('reports liveness without touching the database', async () => {
    const database = createDatabaseStub()
    const app = createApp(testConfig, {
      database,
      isDatabaseReady: async () => true,
    })
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ ok: true })
    expect(database.query).not.toHaveBeenCalled()
  })

  it('reports readiness failures with 503', async () => {
    const app = createApp(testConfig, {
      database: createDatabaseStub(),
      isDatabaseReady: async () => false,
    })
    const response = await request(app).get('/api/readiness')
    expect(response.status).toBe(503)
    expect(response.body).toEqual({ ok: false })
  })

  it('guards authenticated endpoints', async () => {
    const app = createApp(testConfig, {
      database: createDatabaseStub(),
      isDatabaseReady: async () => true,
    })
    const response = await request(app).get('/api/auth/me')
    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: 'Authentication required' })
  })

  it('returns contract validation errors before repository access', async () => {
    const database = createDatabaseStub()
    const app = createApp(testConfig, {
      database,
      isDatabaseReady: async () => true,
    })
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
    expect(response.status).toBe(400)
    expect(response.body.error).toBe('Validation failed')
    expect(database.query).not.toHaveBeenCalled()
  })
})
