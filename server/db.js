import { createClient } from '@libsql/client';
import 'dotenv/config';

export const db = createClient({
  url: process.env.LIBSQL_URL || 'file:./data/tracker.db',
  authToken: process.env.LIBSQL_AUTH_TOKEN,
});

export async function migrate() {
  await db.execute('PRAGMA foreign_keys = ON');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      hourly_rate REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_seconds INTEGER,
      note TEXT,
      is_manual INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const projectColumns = await db.execute('PRAGMA table_info(projects)');
  const hasStatusColumn = projectColumns.rows.some((row) => row.name === 'status');
  if (!hasStatusColumn) {
    await db.execute("ALTER TABLE projects ADD COLUMN status TEXT NOT NULL DEFAULT 'new'");
  }
}
