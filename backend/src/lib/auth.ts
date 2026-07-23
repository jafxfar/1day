
/**
 * Simple JWT authentication for standalone deployment.
 * Users are stored in the `users` table (created in migration.sql).
 */
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { Request, Response, NextFunction } from 'express'

const JWT_SECRET  = process.env['JWT_SECRET'] ?? 'change-this-secret-in-production'
const JWT_EXPIRES = process.env['JWT_EXPIRES'] ?? '30d'
const SALT_ROUNDS = 10

// ─── Minimal User shape (matches /backend/user.d.ts) ─────────────────────────

export interface AppUser {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
  profilePhotoUrl: string | null
  groups: Array<{ id: number; name: string }>
  metadata: Record<string, unknown>
  sid: string
  externalIdentifier: string | null
  locale: string
}

// ─── Token ───────────────────────────────────────────────────────────────────

export function signToken(user: AppUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES } as jwt.SignOptions)
}

export function verifyToken(token: string): AppUser {
  return jwt.verify(token, JWT_SECRET) as AppUser
}

// ─── Password ────────────────────────────────────────────────────────────────

export const hashPassword   = (plain: string) => bcrypt.hash(plain, SALT_ROUNDS)
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash)

// ─── Express middleware ───────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request { user: AppUser }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token =
    req.cookies?.['token'] ??
    req.headers['authorization']?.replace('Bearer ', '')

  if (!token) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  try {
    req.user = verifyToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
