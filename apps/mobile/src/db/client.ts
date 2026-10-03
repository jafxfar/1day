import * as SQLite from 'expo-sqlite'
import { SCHEMA_SQL, SCHEMA_VERSION } from './schema'

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null

const migrate = async (db: SQLite.SQLiteDatabase) => {
  await db.execAsync(SCHEMA_SQL)

  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    ['schema_version'],
  )

  const currentVersion = row ? Number(row.value) : 0
  if (currentVersion < SCHEMA_VERSION) {
    await db.runAsync(
      `INSERT INTO meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ['schema_version', String(SCHEMA_VERSION)],
    )
  }
}

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync('lifeos-offline.db')
      await db.execAsync('PRAGMA foreign_keys = ON')
      await migrate(db)
      return db
    })().catch((error) => {
      databasePromise = null
      throw error
    })
  }

  return databasePromise
}

export const resetDatabaseForTests = async () => {
  if (databasePromise) {
    const db = await databasePromise
    await db.closeAsync()
    databasePromise = null
  }
}
