# Linear Public Feed Sync

This is the shape for pulling Linear into the public build feed without turning the private workspace into public content by accident.

## Principle

Linear is the private operating system. The website should only receive a deliberate public projection of that work.

That means the sync never publishes raw descriptions, comments, or private project names by default. The public feed is label-gated, allowlisted, and idempotently mirrored into the site's D1 database. Attachments on a gated issue (GitHub PRs, design docs, external links) are treated as intentionally-curated "documentation links" and are mirrored too, since adding them to an already-public issue is itself a deliberate act.

## Source

- API: Linear GraphQL API at `https://api.linear.app/graphql`
- Auth: personal API key in `LINEAR_API_KEY` (read-only scope where Linear allows it)
- Scope: `LINEAR_TEAM_KEYS=BRY` (the Brysonbenjamin team)

## Public Gate

Only sync issues that match all of these:

- Team key is in `LINEAR_TEAM_KEYS`
- Issue has a public label from `LINEAR_PUBLIC_LABELS`, defaulting to `public-feed`
- Issue is not canceled

The sync maps Linear records into the public projection:

- `id`: the issue identifier (e.g. `BRY-5`), used as the D1 primary key
- `state`: the Linear workflow state name
- `title`: the Linear issue title
- `detail`: first paragraph of the description, truncated to a card-sized teaser
- `body`: the full description, shown on the task's detail page
- `links`: `{ label, url }` pairs pulled from the issue's attachments
- `tone`: derived from the Linear state type (`backlog`/`unstarted` → `blue`, `started` → `amber`, `completed` → `mint`)
- `updatedAt`: Linear's `updatedAt`

## Architecture Decision: D1-Direct, No Postgres Detour

An earlier draft of this doc proposed a Postgres-backed mirror (`linear_sync_runs`, `linear_sync_state`, `linear_issue_mirror`) with a watermark-based incremental pull, written by a Render cron job, with `/api/feed` either reading Postgres directly or a D1 edge cache kept in sync with it.

That's more infrastructure than a personal portfolio's issue volume justifies. The implemented version simplifies to:

- A single Bun script (`apps/api/src/jobs/syncLinearFeed.ts`) queries all non-canceled, `public-feed`-labeled issues on the `BRY` team in one page (issue volume here is in the dozens, not thousands — no pagination or watermark needed for now).
- It upserts directly into the same Cloudflare D1 database (`brysonbenjamin-public`) that `/api/feed` already reads, via the Cloudflare D1 REST API (`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_D1_DATABASE_ID`).
- No private Postgres mirror exists yet. If issue volume or audit needs grow, add `linear_issue_mirror` and a watermark then — not before.

## Predictable Pull Model

Scheduled as a GitHub Actions workflow (`.github/workflows/linear-feed-sync.yml`), daily at `0 13 * * *` (UTC), plus `workflow_dispatch` for manual runs from the Actions tab.

Render Cron Jobs would have been the natural home (this repo's backend already lives on Render), but Cron Jobs require a paid Render plan. GitHub Actions' free tier comfortably covers a once-a-day job, and it's where the secrets should live anyway, per the "secrets live where the code executes" rule — see [Secrets](#secrets) below.

The job:

1. Reads `LINEAR_API_KEY`, `LINEAR_TEAM_KEYS`, `LINEAR_PUBLIC_LABELS` from env. If any required var (including the Cloudflare ones) is missing, it logs and exits 0 — a safe no-op, matching the existing convention on `apps/api`.
2. Queries Linear for matching issues.
3. Upserts each into `public_feed_items` by id. Old rows are left alone if a run fails partway.

The five-minute overlap / watermark logic from the original draft doesn't apply here since there's no incremental pull — every run re-fetches the full gated set, which is cheap at this scale.

## Rate Limits And Reliability

The script inspects `X-RateLimit-Requests-Remaining` and logs a warning if it drops below 50. A `429` response stops the run cleanly without deleting any existing rows.

## Secrets

Set as **GitHub Actions repository secrets** (Settings → Secrets and variables → Actions), not Render — the workflow is what executes the sync, so that's where the credentials need to live:

```text
LINEAR_API_KEY=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
```

`LINEAR_TEAM_KEYS`, `LINEAR_PUBLIC_LABELS`, `PUBLIC_WORKSPACE_KEY`, and `CLOUDFLARE_D1_DATABASE_ID` aren't secret and are set directly in the workflow file's `env:` block.

`CLOUDFLARE_API_TOKEN` needs D1 edit permission on the `brysonbenjamin-public` database (a Custom Token, scoped to `Account > D1 > Edit` on that one account — see the token creation notes for exact steps). Until `LINEAR_API_KEY` and the Cloudflare secrets are set, the workflow runs and no-ops harmlessly.

## D1 Schema Migration

The `brysonbenjamin-public` database predates the `body` and `links_json` columns. Run once against the live database:

```bash
wrangler d1 execute brysonbenjamin-public --remote --file=apps/web/d1/0001-add-detail-columns.sql
```

Fresh installs get these columns automatically from `apps/web/d1/public-feed.sql`.
