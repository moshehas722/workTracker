import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL, { fullResults: true });

function toPositionalParams(text) {
  let i = 0;
  return text.replace(/\?/g, () => `$${++i}`);
}

export const db = {
  execute(query) {
    if (typeof query === 'string') {
      return sql.query(query, []);
    }
    const { sql: text, args = [] } = query;
    return sql.query(toPositionalParams(text), args);
  },
};

export async function migrate() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name TEXT NOT NULL,
      hourly_rate REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ,
      duration_seconds INTEGER,
      note TEXT,
      is_manual INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}
