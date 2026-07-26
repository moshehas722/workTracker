import express from 'express';
import cors from 'cors';
import { projectsRouter } from './routes/projects.js';
import { entriesRouter } from './routes/entries.js';
import { timerRouter } from './routes/timer.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/timer', timerRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});
