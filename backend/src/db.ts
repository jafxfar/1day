// src/db.ts
import { Pool } from 'pg';

// Подключение берется из переменных окружения (.env)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const retoolDb = {
  query: async <T>(text: string, params?: any[]): Promise<{ data: T[] }> => {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return { data: result.rows };
    } finally {
      client.release();
    }
  },
};