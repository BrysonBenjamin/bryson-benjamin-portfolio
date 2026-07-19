# Bryson Benjamin Portfolio

A full-stack portfolio workspace for [brysonbenjamin.com](https://brysonbenjamin.com).

## Stack

- Frontend: Vite SPA, React, TypeScript
- Runtime and package manager: Bun
- API: Hono on Bun
- Database: Drizzle ORM with Neon Postgres
- Frontend hosting: Cloudflare Pages
- Backend hosting: Render

## Workspace

```text
apps/
  web/      Vite SPA for Cloudflare Pages
  api/      Hono API for Render
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

Both the Neon (Postgres) and D1 databases apply pending migrations automatically via GitHub Actions on push to `main`. See [docs/migrations.md](docs/migrations.md).

## Deployment Notes

`apps/web` deploys via `.github/workflows/deploy-pages.yml`: builds the SPA and runs `wrangler pages deploy` on every push to `main` (production) and on every PR (a branch preview, findable in the Cloudflare Pages dashboard's Deployments tab or at a predictable `<branch-slug>.bryson-benjamin-portfolio.pages.dev` URL). This is deliberately CI-driven rather than Cloudflare's dashboard-only GitHub App connection — the Pages project isn't (and doesn't need to be) connected to GitHub natively. Requires `CLOUDFLARE_PAGES_API_TOKEN` (scoped to `Account > Cloudflare Pages > Edit`) and `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions secrets.

Render should deploy the API from the repository root using the included `render.yaml` Blueprint.
The Blueprint builds the shared database package, builds the API, starts `apps/api` with Bun, and checks `/health`.

Blueprint deeplink:

```text
https://dashboard.render.com/blueprint/new?repo=https://github.com/BrysonBenjamin/bryson-benjamin-portfolio
```

Recommended production domains:

- `brysonbenjamin.com` and `www.brysonbenjamin.com` for Cloudflare Pages
- `api.brysonbenjamin.com` for Render

## Linear Sync

The public feed is database-backed and syncs daily from Linear via a GitHub Actions workflow, mirroring only issues explicitly labeled `public-feed`.
See [docs/linear-sync.md](docs/linear-sync.md) for the schedule, public gate, storage model, and required env vars.
