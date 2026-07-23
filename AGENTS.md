# Agent Guide

## Repo Shape

This is a Bun monorepo for `brysonbenjamin.com`.

- `apps/web`: Vite, React, TypeScript frontend for Cloudflare Pages
- `apps/api`: Hono API running on Bun for Render
- `packages/db`: Drizzle schema, Neon client, migrations
- `packages/portfolio-content`: shared portfolio content
- `packages/sa-sa-contracts`: shared Sa-Sa types and contracts
- `docs/sa-sa`: Sa-Sa architecture, runbook, and authoring guidance

## Setup

Use Bun from the root:

```bash
bun install --frozen-lockfile
```

For a fresh Codex cloud container, also bootstrap Jujutsu:

```bash
bash scripts/setup-jj.sh
jj status
```

## Common Commands

```bash
bun run typecheck
bun run build
bun run --cwd apps/web test
bun run --cwd apps/api test
```

Use narrower package commands when the change is tightly scoped, but run the full relevant checks before calling larger work complete.

## Environment

Normal typecheck, build, and unit-test work should not require production secrets.

Use `.env.example`, `apps/web/.env.example`, `apps/api/.env.example`, and `packages/db/.env.example` as the source of truth for local variables. Do not commit real `.env` files, API keys, database URLs, or Cloudflare tokens.

Only run database migrations, deploy commands, Linear sync jobs, or Cloudflare D1 commands when explicitly asked. Those paths may require `DATABASE_URL`, `LINEAR_API_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, or `CLOUDFLARE_D1_DATABASE_ID`.

## Development Conventions

- Keep changes scoped to the requested feature or fix.
- Prefer existing package boundaries and shared contracts over duplicating types.
- Update tests or docs when behavior, Sa-Sa contracts, or public content rules change.
- For UI work, preserve the polished portfolio feel and verify responsive behavior.
- Treat `docs/sa-sa/agent-runbook.md` and `docs/sa-sa/page-author-guide.md` as authoritative for Sa-Sa behavior.

## Git/Jujutsu

This repo uses colocated Jujutsu and Git. Prefer `jj status`, `jj diff`, and `jj log` for inspection. Do not use destructive Git commands to manage WIP.
