import type { Database } from '../../db.js'

export interface UserRow {
  id: number
  email: string
  password_hash: string
  first_name: string
  last_name: string
}

export const createAuthRepository = (database: Database) => ({
  findByEmail: async (email: string) => {
    const result = await database.query<UserRow>(
      `SELECT id, email, password_hash, first_name, last_name
       FROM lifeos_users WHERE email = $1`,
      [email],
    )
    return result.rows[0] ?? null
  },
  create: async (email: string, passwordHash: string, firstName: string, lastName: string) => {
    const result = await database.query<UserRow>(
      `INSERT INTO lifeos_users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, password_hash, first_name, last_name`,
      [email, passwordHash, firstName, lastName],
    )
    return result.rows[0] ?? null
  },
})

export type AuthRepository = ReturnType<typeof createAuthRepository>
