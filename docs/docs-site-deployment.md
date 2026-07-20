# docs.brysonbenjamin.com Deployment

How `docs-bryson-benjamin` actually builds and ships, since nothing documented that anywhere before this.

## Principle

Same pattern as `apps/web`, in a separate repo: Cloudflare Pages' native Git integration builds and deploys on every push, with no GitHub Actions deploy step. Dashboard build settings — not anything in the repo — are the actual source of truth for the build command and output directory; what's below is what those are set to.

## Build

- Build command: `bun install --frozen-lockfile && bun run build`
  - `prebuild` runs `generate:api-docs` first, regenerating `content/docs/api/*.mdx` from `content/api/openapi.json` — this output isn't committed, it's produced fresh on every build.
  - `build` runs `next build`. `next.config.mjs` sets `output: "export"`, so this produces a static site, not a server.
- Output directory: `out`, matching `pages_build_output_dir = "out"` in `wrangler.toml`.
- Production branch: `main`.

## Custom domain

`docs.brysonbenjamin.com`, set up per [BRY-18](https://linear.app/brysonbenjamin/issue/BRY-18). Confirmed working end to end for PR previews — every PR in this repo gets a green "Cloudflare Pages" check and a `*.pages.dev` preview URL. Whether the production-branch build is correctly mapped to the custom domain in the Cloudflare dashboard is dashboard-only state that can't be verified from either repo, same caveat as `api.brysonbenjamin.com` in [`docs/stack.md`](./stack.md#hosting-split-cloudflare-pages--render). If a merged change doesn't show up live after a few minutes, check Cloudflare Pages → `docs-bryson-benjamin` → Deployments → confirm the latest **Production** deployment's commit matches the latest commit on `main` before assuming the code is wrong.

## Content sources at build time

Three of `docs-bryson-benjamin`'s four content sections are fed from this repo, none of them hand-authored there:

- `content/docs/guides/*.mdx` — synced from this repo's `docs/*.md` via `docs-sync.yml`, see [`docs/docs-sync.md`](./docs-sync.md).
- `content/api/openapi.json` (and the `content/docs/api/*.mdx` generated from it at build time) — synced from `apps/api`'s live routes via `openapi-sync.yml`, see [`docs/architecture.md`](./architecture.md#apps-api--docs-bryson-benjamin-openapi-dispatch).
- `content/docs/decisions/*` — placeholder only; no ADR system exists yet to feed it, per BRY-14.
