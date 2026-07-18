# D1 Migrations

Managed by `wrangler d1 migrations`, applied automatically by `.github/workflows/d1-migrate.yml` on push to `main` when this directory changes.

This directory starts empty as of the cutover to automation (see `docs/migrations.md`). Everything that came before — the base schema and two hand-applied patches — lives in `apps/web/d1/` as a frozen historical record and isn't tracked by wrangler's bookkeeping. Don't add new files there; new schema changes go here instead.

To add a migration:

```bash
bunx wrangler d1 migrations create brysonbenjamin-public <description>
```

That creates a numbered `.sql` file in this directory. Edit it, commit it, and push to `main` — the workflow applies it automatically. To apply locally instead:

```bash
bunx wrangler d1 migrations apply brysonbenjamin-public --remote
```
