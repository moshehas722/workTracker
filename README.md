# Work Tracker

Track time spent on projects: start/stop a timer, log manual entries, and see accumulated hours and billed amount per project.

- **Client**: React + Vite (`client/`)
- **Server**: Node + Express (`server/`), REST API under `/api`
- **Database**: SQLite dialect via [libSQL](https://github.com/tursodatabase/libsql-client-ts) — a local file for dev, [Turso](https://turso.tech) for production. Same client/SQL either way.

## Local development

```
npm install
npm run dev
```

This runs the Express API on `http://localhost:4000` and the Vite dev server on `http://localhost:5173` (which proxies `/api` to the backend). The SQLite file is created at `server/data/tracker.db` on first run.

Copy `.env.example` to `.env` in the repo root (and/or `server/.env`) if you want to override `PORT` or point at a remote database.

## Deploying to Vercel

1. Create a database at [turso.tech](https://turso.tech) and grab its `libsql://...` URL and an auth token.
2. In the Vercel project's environment variables, set `LIBSQL_URL` and `LIBSQL_AUTH_TOKEN` to those values.
3. Deploy — `vercel.json` builds the client (`client/dist`) as the static site and routes `/api/*` to the serverless function in `api/index.js`, which reuses the same Express app and routes as local dev.
