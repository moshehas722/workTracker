# Work Tracker

Track time spent on projects: start/stop a timer, log manual entries, and see accumulated hours and billed amount per project.

- **Client**: React + Vite (`client/`)
- **Server**: Node + Express (`server/`), REST API under `/api`
- **Database**: Postgres via [Neon](https://neon.tech), using the [`@neondatabase/serverless`](https://github.com/neondatabase/serverless) driver (HTTP-based, no persistent connections — a good fit for Vercel's serverless functions).

## Local development

```
npm install
npm run dev
```

This runs the Express API on `http://localhost:4000` and the Vite dev server on `http://localhost:5173` (which proxies `/api` to the backend).

You need a reachable Postgres database and a `DATABASE_URL` env var pointing at it — there's no local file fallback. Either:

- Pull the real env vars from your linked Vercel project: `npx vercel link` once, then `npx vercel env pull .env.development.local` — this grabs the same `DATABASE_URL` Vercel injects (ideally a separate Neon branch, not production), or
- Point `DATABASE_URL` (in a `.env` file, see `.env.example`) at any local Postgres instance, e.g. a throwaway Docker container: `docker run -d -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine`.

The schema (`projects`, `time_entries` tables) is created automatically on startup if it doesn't exist yet.

## Deploying to Vercel

1. In the Vercel project dashboard, go to **Storage** → **Create Database** → **Neon (Postgres)**, or add it from the **Marketplace**. This auto-provisions a free Neon database and injects `DATABASE_URL` (plus a few legacy-named variants) into your project's environment — no manual copying of connection strings needed.
2. Deploy — `vercel.json` builds the client (`client/dist`) as the static site and routes `/api/*` to the serverless function in `api/index.js`, which reuses the same Express app and routes as local dev, and reads `DATABASE_URL` the same way.
