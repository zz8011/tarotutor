import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // CVM 内存紧，调低
  max: 5,
  idleTimeoutMillis: 30000,
});

export interface QueryRow { [key: string]: unknown }

export async function query(text: string, params: unknown[] = []): Promise<QueryRow[]> {
  const res = await pool.query(text, params);
  return res.rows;
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
