import type { RequestHandler } from 'express'
import type { LoginPayload, RegisterPayload } from '@life-os/contracts'
import type { AppConfig } from '../../config/env.js'
import type { AuthenticatedRequest, AuthTools } from '../../lib/auth.js'
import type { AuthService } from './auth.service.js'

export const createAuthController = (
  service: AuthService,
  authTools: AuthTools,
  config: AppConfig,
) => {
  const setSession = (response: Parameters<RequestHandler>[1], user: Awaited<ReturnType<AuthService['login']>>) => {
    const token = authTools.signToken(user)
    response.cookie(config.cookie.name, token, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: config.cookie.maxAgeMs,
    })
    return token
  }

  const register: RequestHandler = async (request, response) => {
    const user = await service.register(request.body as RegisterPayload)
    const token = setSession(response, user)
    response.status(201).json({ user, token })
  }

  const login: RequestHandler = async (request, response) => {
    const user = await service.login(request.body as LoginPayload)
    const token = setSession(response, user)
    response.json({ user, token })
  }

  const logout: RequestHandler = (_request, response) => {
    response.clearCookie(config.cookie.name, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
    })
    response.json({ ok: true })
  }

  const me: RequestHandler = (request, response) => {
    response.json((request as AuthenticatedRequest).user)
  }

  return { register, login, logout, me }
}
