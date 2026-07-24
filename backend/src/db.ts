import 'dotenv/config';
import { Pool } from 'pg';

// Подключение берется из переменных окружения (.env)
const rawUrl = process.env.DATABASE_URL;
const connectionString = rawUrl ? rawUrl.replace('@hostname', '@localhost') : undefined;

export const pool = new Pool({
  connectionString,
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