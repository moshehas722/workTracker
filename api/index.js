import { app } from '../server/app.js';
import { migrate } from '../server/db.js';

let migrated = null;

export default async function handler(req, res) {
  if (!migrated) {
    migrated = migrate();
  }
  await migrated;

  app(req, res);
}
