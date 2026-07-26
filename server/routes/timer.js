import { Router } from 'express';
import { db } from '../db.js';
import { durationSeconds, asyncHandler } from '../util.js';

export const timerRouter = Router();

async function getActiveEntry() {
  const result = await db.execute(`
    SELECT t.*, p.name AS project_name, p.hourly_rate, p.currency
    FROM time_entries t
    JOIN projects p ON p.id = t.project_id
    WHERE t.end_time IS NULL
    LIMIT 1
  `);
  return result.rows[0] || null;
}

timerRouter.get('/active', asyncHandler(async (req, res) => {
  res.json(await getActiveEntry());
}));

timerRouter.post('/start', asyncHandler(async (req, res) => {
  const { project_id, start_time } = req.body;
  if (!project_id) {
    return res.status(400).json({ error: 'project_id is required' });
  }

  let startTime = new Date().toISOString();
  if (start_time !== undefined) {
    const parsed = new Date(start_time);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ error: 'invalid start_time' });
    }
    startTime = parsed.toISOString();
  }

  const active = await getActiveEntry();
  if (active) {
    return res.status(409).json({ error: 'a timer is already running', active });
  }

  const project = await db.execute({ sql: 'SELECT id, status FROM projects WHERE id = ?', args: [project_id] });
  if (project.rows.length === 0) {
    return res.status(404).json({ error: 'project not found' });
  }
  if (project.rows[0].status === 'completed') {
    return res.status(409).json({ error: 'cannot start a timer on a completed project' });
  }

  const result = await db.execute({
    sql: `INSERT INTO time_entries (project_id, start_time, end_time, duration_seconds, is_manual)
          VALUES (?, ?, NULL, NULL, 0)
          RETURNING *`,
    args: [project_id, startTime],
  });

  res.status(201).json(result.rows[0]);
}));

timerRouter.post('/stop', asyncHandler(async (req, res) => {
  const active = await getActiveEntry();
  if (!active) {
    return res.status(409).json({ error: 'no timer is running' });
  }

  const { end_time } = req.body;
  let endTime = new Date().toISOString();
  if (end_time !== undefined) {
    const parsed = new Date(end_time);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ error: 'invalid end_time' });
    }
    if (parsed <= new Date(active.start_time)) {
      return res.status(400).json({ error: 'end_time must be after start_time' });
    }
    endTime = parsed.toISOString();
  }

  const result = await db.execute({
    sql: `UPDATE time_entries SET end_time = ?, duration_seconds = ?
          WHERE id = ? RETURNING *`,
    args: [endTime, durationSeconds(active.start_time, endTime), active.id],
  });

  res.json(result.rows[0]);
}));
