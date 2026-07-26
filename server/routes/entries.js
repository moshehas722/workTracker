import { Router } from 'express';
import { db } from '../db.js';
import { durationSeconds, asyncHandler } from '../util.js';

export const entriesRouter = Router();

async function getProjectStatus(projectId) {
  const result = await db.execute({ sql: 'SELECT status FROM projects WHERE id = ?', args: [projectId] });
  return result.rows[0]?.status ?? null;
}

entriesRouter.post('/', asyncHandler(async (req, res) => {
  const { project_id, start_time, end_time, note = null } = req.body;

  if (!project_id || !start_time || !end_time) {
    return res.status(400).json({ error: 'project_id, start_time and end_time are required' });
  }

  if (new Date(end_time) <= new Date(start_time)) {
    return res.status(400).json({ error: 'end_time must be after start_time' });
  }

  const projectStatus = await getProjectStatus(project_id);
  if (projectStatus === null) {
    return res.status(404).json({ error: 'project not found' });
  }
  if (projectStatus === 'completed') {
    return res.status(409).json({ error: 'cannot add entries to a completed project' });
  }

  const result = await db.execute({
    sql: `INSERT INTO time_entries (project_id, start_time, end_time, duration_seconds, note, is_manual)
          VALUES (?, ?, ?, ?, ?, 1)
          RETURNING *`,
    args: [project_id, start_time, end_time, durationSeconds(start_time, end_time), note],
  });

  res.status(201).json(result.rows[0]);
}));

entriesRouter.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await db.execute({ sql: 'SELECT * FROM time_entries WHERE id = ?', args: [id] });
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'entry not found' });
  }

  const current = existing.rows[0];

  const projectStatus = await getProjectStatus(current.project_id);
  if (projectStatus === 'completed') {
    return res.status(409).json({ error: 'cannot edit entries on a completed project' });
  }

  const { start_time, end_time, note } = req.body;
  const nextStart = start_time !== undefined ? start_time : current.start_time;
  const nextEnd = end_time !== undefined ? end_time : current.end_time;
  const nextNote = note !== undefined ? note : current.note;

  if (nextEnd && new Date(nextEnd) <= new Date(nextStart)) {
    return res.status(400).json({ error: 'end_time must be after start_time' });
  }

  const nextDuration = nextEnd ? durationSeconds(nextStart, nextEnd) : current.duration_seconds;

  const result = await db.execute({
    sql: `UPDATE time_entries SET start_time = ?, end_time = ?, duration_seconds = ?, note = ?
          WHERE id = ? RETURNING *`,
    args: [nextStart, nextEnd, nextDuration, nextNote, id],
  });

  res.json(result.rows[0]);
}));

entriesRouter.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await db.execute({ sql: 'SELECT project_id FROM time_entries WHERE id = ?', args: [id] });
  if (existing.rows.length === 0) {
    return res.status(204).end();
  }

  const projectStatus = await getProjectStatus(existing.rows[0].project_id);
  if (projectStatus === 'completed') {
    return res.status(409).json({ error: 'cannot delete entries on a completed project' });
  }

  await db.execute({ sql: 'DELETE FROM time_entries WHERE id = ?', args: [id] });
  res.status(204).end();
}));
