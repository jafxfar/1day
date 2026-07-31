
import 'dotenv/config'

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('@hostname', '@localhost')
}

/**
 * Life OS — Standalone Express Server
 *
 * IMPORTANT: retoolDbCompat MUST be imported first — it sets the
 * global `retoolDb` that all backend functions reference.
 */
import './lib/retoolDbCompat'          // ← sets global.retoolDb

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { requireAuth, signToken, hashPassword, verifyPassword } from './lib/auth'
import type { AppUser } from './lib/auth'

// ── Backend functions (same files you copied from Retool) ──────────────────
import getGoals from './goals/getGoals'
import createGoal from './goals/createGoal'
import updateGoal from './goals/updateGoal'
import deleteGoal from './goals/deleteGoal'

import getHabits from './habits/getHabits'
import createHabit from './habits/createHabit'
import toggleHabit from './habits/toggleHabit'
import deleteHabit from './habits/deleteHabit'

import getJournalEntries from './journal/getJournalEntries'
import createJournalEntry from './journal/createJournalEntry'
import deleteJournalEntry from './journal/deleteJournalEntry'

import getTodayCheckins from './checkins/getTodayCheckins'
import saveMorningCheckin from './checkins/saveMorningCheckin'
import saveEveningReflection from './checkins/saveEveningReflection'

import getBiography from './biography/getBiography'

// ─── Also need pg for auth routes ─────────────────────────────────────────
import { Pool } from 'pg'

const rawUrl = process.env['DATABASE_URL']
const connectionString = rawUrl ? rawUrl.replace('@hostname', '@localhost') : undefined
const db = new Pool({ connectionString })

// ─── App ──────────────────────────────────────────────────────────────────

const app = express()
const PORT = Number(process.env['PORT'] ?? 3000)

app.use(cors({
  origin: process.env['VITE_FRONTEND_URL'] ? [process.env['VITE_FRONTEND_URL']] : ['http://localhost', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// ─── Health ───────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// ─── Auth ─────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName = 'User', lastName = '' } = req.body as Record<string, string>
    if (!email || !password) { res.status(400).json({ error: 'email and password required' }); return }

    const exists = await db.query('SELECT id FROM lifeos_users WHERE email = $1', [email])
    if (exists.rows.length > 0) { res.status(409).json({ error: 'Email already registered' }); return }

    const hash = await hashPassword(password)
    const { rows } = await db.query<{ id: number }>(
      `INSERT INTO lifeos_users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [email, hash, firstName, lastName],
    )
    const userId = rows[0]!.id

    const user: AppUser = {
      id: userId, email, firstName, lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      profilePhotoUrl: null, groups: [], metadata: {},
      sid: String(userId), externalIdentifier: null, locale: 'en',
    }
    const token = signToken(user)
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 3600 * 1000 })
    res.json({ user })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body as Record<string, string>
    if (!email || !password) { res.status(400).json({ error: 'email and password required' }); return }

    const { rows } = await db.query<{ id: number; password_hash: string; first_name: string; last_name: string }>(
      'SELECT id, password_hash, first_name, last_name FROM lifeos_users WHERE email = $1',
      [email],
    )
    const row = rows[0]
    if (!row) { res.status(401).json({ error: 'Invalid credentials' }); return }

    const ok = await verifyPassword(password, row.password_hash)
    if (!ok) { res.status(401).json({ error: 'Invalid credentials' }); return }

    const user: AppUser = {
      id: row.id, email,
      firstName: row.first_name, lastName: row.last_name,
      fullName: `${row.first_name} ${row.last_name}`.trim(),
      profilePhotoUrl: null, groups: [], metadata: {},
      sid: String(row.id), externalIdentifier: null, locale: 'en',
    }
    const token = signToken(user)
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 3600 * 1000 })
    res.json({ user })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('token')
  res.json({ ok: true })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(req.user)
})

// ─── Helper: wrap backend function call ───────────────────────────────────

type BFn<P, R> = (req: { params: P; user: AppUser }) => Promise<R>

function handle<P, R>(fn: BFn<P, R>) {
  return async (req: express.Request, res: express.Response) => {
    try {
      const params = { ...req.body, ...req.params, ...req.query } as P
      const result = await fn({ params, user: req.user })
      res.json(result)
    } catch (e) {
      res.status(400).json({ error: String(e) })
    }
  }
}

// ─── Protected routes (all require auth) ──────────────────────────────────

const api = express.Router()
api.use(requireAuth)

// Goals
api.get('/goals', handle(getGoals))
api.post('/goals', handle(createGoal))
api.patch('/goals/:id', handle(updateGoal))
api.delete('/goals/:id', handle(deleteGoal))

// Habits
api.get('/habits', handle(getHabits))
api.post('/habits', handle(createHabit))
api.post('/habits/:habitId/toggle', handle(toggleHabit))
api.delete('/habits/:id', handle(deleteHabit))

// Journal
api.get('/journal', handle(getJournalEntries))
api.post('/journal', handle(createJournalEntry))
api.delete('/journal/:id', handle(deleteJournalEntry))

// Checkins
api.get('/checkins/today', handle(getTodayCheckins))
api.post('/checkins/morning', handle(saveMorningCheckin))
api.post('/checkins/evening', handle(saveEveningReflection))

// Biography
api.get('/biography', handle(getBiography))

app.use('/api', api)

// ─── Start ────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Life OS backend running on http://localhost:${PORT}`)
})
