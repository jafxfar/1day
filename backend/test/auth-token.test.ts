import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@life-os/contracts'
import { createAuthController } from '../src/modules/auth/auth.controller.js'
import { createAuthTools } from '../src/lib/auth.js'
import { testConfig } from './helpers.js'

const testUser: AuthUser = {
  id: 1,
  email: 'mobile@example.com',
  firstName: 'Mobile',
  lastName: 'User',
  fullName: 'Mobile User',
  profilePhotoUrl: null,
  groups: [],
  metadata: {},
  sid: 'sid-1',
  externalIdentifier: null,
  locale: 'en',
}

const createMockResponse = () => {
  const response = {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
  }
  response.status.mockReturnValue(response)
  response.json.mockReturnValue(response)
  return response as unknown as Response & {
    cookie: ReturnType<typeof vi.fn>
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
  }
}

describe('auth session token', () => {
  it('returns JWT in login body while still setting cookie', async () => {
    const authTools = createAuthTools(testConfig)
    const service = {
      register: vi.fn(),
      login: vi.fn().mockResolvedValue(testUser),
    }
    const controller = createAuthController(service as never, authTools, testConfig)
    const response = createMockResponse()

    await controller.login(
      { body: { email: testUser.email, password: 'password123' } } as Request,
      response,
      vi.fn(),
    )

    expect(response.cookie).toHaveBeenCalledWith(
      'token',
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    )
    expect(response.json).toHaveBeenCalledWith({
      user: testUser,
      token: expect.any(String),
    })

    const payload = response.json.mock.calls[0][0] as { token: string }
    const meResponse = createMockResponse()
    const next = vi.fn()
    authTools.requireAuth(
      {
        cookies: {},
        header: (name: string) => (
          name.toLowerCase() === 'authorization' ? `Bearer ${payload.token}` : undefined
        ),
      } as never,
      meResponse,
      next,
    )
    expect(next).toHaveBeenCalledWith()
  })

  it('returns JWT in register body', async () => {
    const authTools = createAuthTools(testConfig)
    const service = {
      register: vi.fn().mockResolvedValue(testUser),
      login: vi.fn(),
    }
    const controller = createAuthController(service as never, authTools, testConfig)
    const response = createMockResponse()

    await controller.register(
      { body: { email: testUser.email, password: 'password123', firstName: 'Mobile' } } as Request,
      response,
      vi.fn(),
    )

    expect(response.status).toHaveBeenCalledWith(201)
    expect(response.json).toHaveBeenCalledWith({
      user: testUser,
      token: expect.any(String),
    })
  })
})
