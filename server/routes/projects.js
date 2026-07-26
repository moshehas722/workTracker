import { Router } from 'express';
import { db } from '../db.js';
import { asyncHandler } from '../util.js';

export const projectsRouter = Router();

projectsRouter.get('/', asyncHandler(async (req, res) => {
  const result = await db.execute(`
    SELECT
      p.id, p.name, p.hourly_rate, p.currency, p.created_at,
      COALESCE(SUM(t.duration_seconds), 0) AS accumulated_seconds
    FROM projects p
    LEFT JOIN time_entries t ON t.project_id = p.id AND t.end_time IS NOT NULL
    GROUP BY p.id
    ORDER BY p.created_at ASC
  `);

  const projects = result.rows.map((row) => {
    const accumulatedSeconds = Number(row.accumulated_seconds);
    const hourlyRate = Number(row.hourly_rate);
    return {
      id: row.id,
      name: row.name,
      hourly_rate: hourlyRate,
      currency: row.currency,
      created_at: row.created_at,
      accumulated_seconds: accumulatedSeconds,
      accumulated_amount: Number(((accumulatedSeconds / 3600) * hourlyRate).toFixed(2)),
    };
  });

  res.json(projects);
}));

projectsRouter.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await db.execute({
    sql: `
      SELECT
        p.id, p.name, p.hourly_rate, p.currency, p.created_at,
        COALESCE(SUM(t.duration_seconds), 0) AS accumulated_seconds
      FROM projects p
      LEFT JOIN time_entries t ON t.project_id = p.id AND t.end_time IS NOT NULL
      WHERE p.id = ?
      GROUP BY p.id
    `,
    args: [id],
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'project not found' });
  }

  const row = result.rows[0];
  const accumulatedSeconds = Number(row.accumulated_seconds);
  const hourlyRate = Number(row.hourly_rate);

  res.json({
    id: row.id,
    name: row.name,
    hourly_rate: hourlyRate,
    currency: row.currency,
    created_at: row.created_at,
    accumulated_seconds: accumulatedSeconds,
    accumulated_amount: Number(((accumulatedSeconds / 3600) * hourlyRate).toFixed(2)),
  });
}));

projectsRouter.post('/', asyncHandler(async (req, res) => {
  const { name, hourly_rate = 0, currency = 'USD' } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  const result = await db.execute({
    sql: 'INSERT INTO projects (name, hourly_rate, currency) VALUES (?, ?, ?) RETURNING id, name, hourly_rate, currency, created_at',
    args: [name.trim(), Number(hourly_rate) || 0, currency],
  });

  res.status(201).json(result.rows[0]);
}));

projectsRouter.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, hourly_rate, currency } = req.body;

  const existing = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [id] });
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'project not found' });
  }

  const current = existing.rows[0];
  const nextName = name !== undefined ? name : current.name;
  const nextRate = hourly_rate !== undefined ? Number(hourly_rate) : current.hourly_rate;
  const nextCurrency = currency !== undefined ? currency : current.currency;

  const result = await db.execute({
    sql: 'UPDATE projects SET name = ?, hourly_rate = ?, currency = ? WHERE id = ? RETURNING id, name, hourly_rate, currency, created_at',
    args: [nextName, nextRate, nextCurrency, id],
  });

  res.json(result.rows[0]);
}));

projectsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await db.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [id] });
  res.status(204).end();
}));

projectsRouter.get('/:id/entries', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await db.execute({
    sql: `
      SELECT t.*, p.hourly_rate, p.currency
      FROM time_entries t
      JOIN projects p ON p.id = t.project_id
      WHERE t.project_id = ?
      ORDER BY t.start_time DESC
    `,
    args: [id],
  });

  const entries = result.rows.map((row) => {
    const durationSeconds = row.duration_seconds != null ? Number(row.duration_seconds) : null;
    const hourlyRate = Number(row.hourly_rate);
    return {
      id: row.id,
      project_id: row.project_id,
      start_time: row.start_time,
      end_time: row.end_time,
      duration_seconds: durationSeconds,
      note: row.note,
      is_manual: row.is_manual,
      created_at: row.created_at,
      amount: durationSeconds != null ? Number(((durationSeconds / 3600) * hourlyRate).toFixed(2)) : null,
      currency: row.currency,
    };
  });

  res.json(entries);
}));
