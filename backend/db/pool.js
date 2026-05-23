import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL is not set. Set it in backend/.env');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});
