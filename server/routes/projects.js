import { Router } from 'express';
import { db } from '../db.js';
import { asyncHandler } from '../util.js';

export const projectsRouter = Router();

function toProjectResponse(row) {
  const accumulatedSeconds = Number(row.accumulated_seconds);
  const hourlyRate = Number(row.hourly_rate);
  return {
    id: row.id,
    name: row.name,
    customer_name: row.customer_name,
    hourly_rate: hourlyRate,
    currency: row.currency,
    status: row.status,
    created_at: row.created_at,
    accumulated_seconds: accumulatedSeconds,
    accumulated_amount: Number(((accumulatedSeconds / 3600) * hourlyRate).toFixed(2)),
  };
}

const PROJECT_WITH_TOTALS_SQL = `
  SELECT
    p.id, p.name, p.customer_name, p.hourly_rate, p.currency, p.status, p.created_at,
    COALESCE(SUM(t.duration_seconds), 0) AS accumulated_seconds
  FROM projects p
  LEFT JOIN time_entries t ON t.project_id = p.id AND t.end_time IS NOT NULL
`;

projectsRouter.get('/', asyncHandler(async (req, res) => {
  const result = await db.execute(`${PROJECT_WITH_TOTALS_SQL} GROUP BY p.id ORDER BY p.created_at ASC`);
  res.json(result.rows.map(toProjectResponse));
}));

projectsRouter.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await db.execute({
    sql: `${PROJECT_WITH_TOTALS_SQL} WHERE p.id = ? GROUP BY p.id`,
    args: [id],
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'project not found' });
  }

  res.json(toProjectResponse(result.rows[0]));
}));

projectsRouter.post('/', asyncHandler(async (req, res) => {
  const { name, customer_name = null, hourly_rate = 0, currency = 'USD' } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  const trimmedCustomer = typeof customer_name === 'string' ? customer_name.trim() : null;

  const result = await db.execute({
    sql: `INSERT INTO projects (name, customer_name, hourly_rate, currency, status)
          VALUES (?, ?, ?, ?, 'new')
          RETURNING id, name, customer_name, hourly_rate, currency, status, created_at`,
    args: [name.trim(), trimmedCustomer || null, Number(hourly_rate) || 0, currency],
  });

  res.status(201).json(result.rows[0]);
}));

projectsRouter.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, customer_name, hourly_rate, currency } = req.body;

  const existing = await db.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [id] });
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'project not found' });
  }

  const current = existing.rows[0];

  if (current.status === 'completed') {
    return res.status(409).json({ error: 'completed projects cannot be edited' });
  }

  const nextName = name !== undefined ? name : current.name;
  const nextCustomer = customer_name !== undefined
    ? (typeof customer_name === 'string' ? customer_name.trim() || null : null)
    : current.customer_name;
  const nextRate = hourly_rate !== undefined ? Number(hourly_rate) : current.hourly_rate;
  const nextCurrency = currency !== undefined ? currency : current.currency;

  const result = await db.execute({
    sql: `UPDATE projects SET name = ?, customer_name = ?, hourly_rate = ?, currency = ?
          WHERE id = ? RETURNING id, name, customer_name, hourly_rate, currency, status, created_at`,
    args: [nextName, nextCustomer, nextRate, nextCurrency, id],
  });

  res.json(result.rows[0]);
}));

projectsRouter.post('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'new' && status !== 'completed') {
    return res.status(400).json({ error: "status must be 'new' or 'completed'" });
  }

  const existing = await db.execute({ sql: 'SELECT id FROM projects WHERE id = ?', args: [id] });
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'project not found' });
  }

  const result = await db.execute({
    sql: `UPDATE projects SET status = ?
          WHERE id = ? RETURNING id, name, hourly_rate, currency, status, created_at`,
    args: [status, id],
  });

  res.json(result.rows[0]);
}));

projectsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await db.execute({ sql: 'SELECT status FROM projects WHERE id = ?', args: [id] });
  if (existing.rows.length === 0) {
    return res.status(204).end();
  }

  if (existing.rows[0].status === 'completed') {
    return res.status(409).json({ error: 'completed projects cannot be deleted' });
  }

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
