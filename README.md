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
research/
  nfl-field-goal-pressure/   standalone Python project, not part of the Bun workspace
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

`apps/web` deploys via Cloudflare Pages' native GitHub integration: connected directly to this repo, building automatically on every push to `main` (production) and posting a preview URL on every PR. Build settings live in the Cloudflare Pages dashboard (Settings → Builds & deployments), not in this repo — confirm the build command builds `apps/web` specifically (e.g. `bun install --frozen-lockfile && bun run --cwd apps/web build`) and the output/root directory account for the monorepo layout.

For a one-off manual deploy without waiting on Cloudflare's build, `bun run --cwd apps/web deploy` runs `wrangler pages deploy dist` against a local build.

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

## Research recreation (Python)

`research/nfl-field-goal-pressure/` is a standalone `uv`-managed Python project recreating the NFL field goal thesis hosted on the site (`apps/web/public/papers/`) on refreshed nflverse data. It's intentionally outside the Bun workspace — its own venv, its own lockfile — and isn't built, deployed, or typechecked by anything above. See its own [README](research/nfl-field-goal-pressure/README.md) for setup and the working roadmap.

## Sa-Sa framework

The delivery contract, character guide, rendering decision, safety policy, architecture ADR, asset workflow, [page-author guide](docs/sa-sa/page-author-guide.md), and [agent gateway runbook](docs/sa-sa/agent-runbook.md) live in [docs/sa-sa](docs/sa-sa/). The web build validates the 100×100 Sa-Sa asset pack before bundling.
