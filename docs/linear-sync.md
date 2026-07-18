# Linear Public Feed Sync

This is the intended shape for pulling Linear into the public build feed without turning the private workspace into public content by accident.

## Principle

Linear is the private operating system. The website should only receive a deliberate public projection of that work.

That means the sync should never publish raw descriptions, comments, attachments, private project names, or arbitrary issue titles by default. The public feed should be label-gated, allowlisted, and idempotently mirrored into our database.

## Source

- API: Linear GraphQL API at `https://api.linear.app/graphql`
- Auth for the first version: personal API key in `LINEAR_API_KEY`
- Auth later, if other people need to connect their workspaces: OAuth 2.0
- Scope: read-only key, limited to the intended team(s) where Linear allows it

## Public Gate

Only sync issues that match all of these:

- Team key is in `LINEAR_TEAM_KEYS`; leave this blank until the intended Linear team is confirmed
- Issue has a public label from `LINEAR_PUBLIC_LABELS`, defaulting to `public-feed`
- Issue is not archived or canceled

The sync should map Linear records into public fields:

- `id`: stable Linear issue UUID
- `identifier`: display-safe issue key, such as `BB-12`
- `state`: public state label
- `title`: curated title or Linear title only after the issue is marked public
- `detail`: short curated summary
- `tone`: one of the existing feed tones: `mint`, `amber`, `white`, `blue`
- `url`: optional public Linear URL if we decide those are useful
- `updatedAt`: Linear `updatedAt`

## Predictable Pull Model

Use a Render Cron Job once the sync script exists.

Recommended first schedule:

```cron
*/30 * * * *
```

The job should:

1. Read the previous `last_seen_updated_at` watermark from the database.
2. Query Linear for issues updated since `last_seen_updated_at - 5 minutes`.
3. Page through results with `pageInfo.hasNextPage` and `endCursor`.
4. Upsert rows by Linear issue UUID.
5. Advance the watermark only after every page in the run succeeds.
6. Preserve old rows if Linear is temporarily unavailable.

The five-minute overlap makes the pull resilient to clock drift, late writes, and failed runs. Upserts make that overlap harmless.

## Storage Shape

The backend database should eventually own these tables:

- `linear_sync_runs`: one row per job run with start time, finish time, status, item count, and error text.
- `linear_sync_state`: one row per source namespace, storing the last successful `updatedAt` watermark and cursor metadata.
- `linear_issue_mirror`: private mirror of the small Linear fields needed for review and debugging.
- `public_feed_items`: the public projection consumed by the frontend.

Right now the live frontend reads a Cloudflare D1-backed public feed. When Render becomes the backend source of truth, either:

- the frontend calls `https://api.brysonbenjamin.com/api/feed`, or
- a Render cron writes the curated projection into Cloudflare D1 as an edge cache.

Prefer the first path unless we need the D1 edge cache for latency or resilience.

## Rate Limits And Reliability

Every Linear response should be inspected for:

- `X-RateLimit-Requests-Remaining`
- `X-RateLimit-Requests-Reset`
- `X-Complexity`
- `X-RateLimit-Complexity-Remaining`

If remaining budget is low or Linear returns `429`, the job should stop cleanly, record a partial run, and retry on the next cron tick. No public rows should be deleted just because a pull failed.

## Render Environment

These should be secrets or environment variables on the cron service:

```text
DATABASE_URL=
PUBLIC_WORKSPACE_KEY=brysonbenjamin
LINEAR_API_KEY=
LINEAR_TEAM_KEYS=
LINEAR_PUBLIC_LABELS=public-feed
LINEAR_SYNC_LOOKBACK_MINUTES=5
```

Do not add the cron service to `render.yaml` until the sync script exists and has a safe no-op path for missing credentials.

Before enabling the cron, create or confirm the Linear team that should feed the public `brysonbenjamin` workspace. The sync should do nothing if `LINEAR_TEAM_KEYS` is empty.
