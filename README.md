# Bryson Benjamin Portfolio

A full-stack portfolio workspace for [brysonbenjamin.com](https://brysonbenjamin.com).

## Stack

- Frontend: Vite SPA, React, TypeScript
- Runtime and package manager: Bun
- API: Hono on Bun
- Database: Drizzle ORM with Neon Postgres
- Frontend hosting: Cloudflare Pages
- Backend hosting: Railway

## Workspace

```text
apps/
  web/      Vite SPA for Cloudflare Pages
  api/      Hono API for Railway
packages/
  db/       Drizzle schema, Neon client, migrations
```

## Local Development

Install dependencies:

```bash
bun install
```

Run the frontend:

```bash
bun run dev:web
```

Run the API:

```bash
bun run dev:api
```

Create local env files from the examples:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
cp packages/db/.env.example packages/db/.env
```

## Database

Set `DATABASE_URL` to the Neon connection string, then generate and run migrations:

```bash
bun run db:generate
bun run db:migrate
```

## Deployment Notes

Cloudflare Pages should build `apps/web` with:

- Build command: `bun install --frozen-lockfile && bun run --cwd apps/web build`
- Build output directory: `apps/web/dist`
- Production env: `VITE_API_URL=https://api.brysonbenjamin.com`

Railway should deploy the API from the repository root. The included `railway.json` starts `apps/api` with Bun and checks `/health`.

Recommended production domains:

- `brysonbenjamin.com` and `www.brysonbenjamin.com` for Cloudflare Pages
- `api.brysonbenjamin.com` for Railway
