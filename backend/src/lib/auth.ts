
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { Request, Response, NextFunction } from 'express'
import type { AuthUser } from '@life-os/contracts'
import type { AppConfig } from '../config/env.js'
import { AppError } from './errors.js'

const SALT_ROUNDS = 10

export type AuthenticatedUser = AuthUser

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser
}

export interface AuthTools {
  signToken: (user: AuthUser) => string
  requireAuth: (request: Request, response: Response, next: NextFunction) => void
}

export const createAuthTools = (config: AppConfig): AuthTools => {
  const signToken = (user: AuthUser): string => jwt.sign(
    user,
    config.jwtSecret,
    { expiresIn: config.jwtExpires } as jwt.SignOptions,
  )

  const requireAuth = (request: Request, _response: Response, next: NextFunction): void => {
    const cookieToken = request.cookies?.[config.cookie.name]
    const authorization = request.header('authorization')
    const bearerToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : undefined
    const token = cookieToken ?? bearerToken

    if (!token) {
      next(new AppError(401, 'Authentication required'))
      return
    }

    try {
      const user = jwt.verify(token, config.jwtSecret) as AuthUser
      ;(request as AuthenticatedRequest).user = user
      next()
    } catch {
      next(new AppError(401, 'Invalid or expired token'))
    }
  }

  return { signToken, requireAuth }
}

export const hashPassword = (plain: string) => bcrypt.hash(plain, SALT_ROUNDS)
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash)
