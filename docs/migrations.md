# Database Migrations

Both databases apply pending migrations automatically via GitHub Actions on push to `main`. Before this existed, migrations required someone to remember to run them by hand — that gap caused a real production failure (BRY-7's Linear sync broke because a merged D1 migration was never applied).

## Principle

A migration step should fail loudly, not silently skip. This is the opposite of the Linear feed sync's "missing config → safe no-op" convention — a broken or missing migration should visibly fail the workflow, not degrade quietly.

## D1

`.github/workflows/d1-migrate.yml` runs `wrangler d1 migrations apply brysonbenjamin-public --remote` whenever `apps/web/migrations/**` changes on `main` (or via manual `workflow_dispatch`). Wrangler tracks which migrations have already run in its own bookkeeping table inside the D1 database itself, so re-running the workflow is safe — only new, unapplied files execute.

To add a schema change:

```bash
bunx wrangler d1 migrations create brysonbenjamin-public <description>
```

Edit the generated file, commit it, push to `main`. The workflow does the rest.

Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions secrets — the same ones already used by `linear-feed-sync.yml`.

### Cutover from ad hoc files

Before this automation, D1 schema changes lived as informally-numbered files in `apps/web/d1/` (`0001-add-detail-columns.sql`, `0002-add-parent-id.sql`), applied by hand via `wrangler d1 execute --remote --file=...`. Those files are frozen as a historical record — they predate wrangler's migration bookkeeping and reconciling them retroactively would mean either re-running already-applied `ALTER TABLE` statements (which errors on a column that already exists) or hand-writing rows into wrangler's internal tracking table, which isn't worth the risk of getting its schema wrong.

Instead, the cutover was: apply the one remaining pending change (`0002-add-parent-id.sql`) manually one last time so production was fully caught up, then start `apps/web/migrations/` **empty**. Every schema change from that point forward is new territory for wrangler's tracked system. `apps/web/d1/public-feed.sql` remains the fresh-install baseline schema for spinning up a brand new database from scratch (local dev, a new environment) — it is not part of the incremental migration history.

## Neon / Postgres

`.github/workflows/neon-migrate.yml` runs `bun run --cwd packages/db db:migrate` (Drizzle Kit) whenever `packages/db/drizzle/**` changes on `main` (or via manual `workflow_dispatch`). Drizzle already tracks applied migrations in its own bookkeeping table in the database — no cutover concerns here, since this tooling already existed and just wasn't wired into anything automated before.

To add a schema change: edit `packages/db/src/schema.ts`, then `bun run --cwd packages/db db:generate` to produce the migration file, commit it, push to `main`.

Requires `DATABASE_URL` as a GitHub Actions secret (separate from the same-named Render env var — GitHub Actions doesn't share Render's environment).

### Why GitHub Actions instead of a Render pre-deploy command

Render supports running a command before a new instance starts, which would be a reasonable place for this too. Went with GitHub Actions instead, for two reasons: consistency with the D1 approach (same place to look for both), and because Render Cron Jobs already turned out to be gated behind a paid plan — with no way to confirm pre-deploy commands are available on the free plan without hitting the same wall again, GitHub Actions was the option already proven to work.
