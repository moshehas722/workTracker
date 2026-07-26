import 'dotenv/config';
import { app } from './app.js';
import { migrate } from './db.js';

const PORT = process.env.PORT || 4000;

await migrate();

app.listen(PORT, () => {
  console.log(`work-tracker server listening on http://localhost:${PORT}`);
});
