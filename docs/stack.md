# Technology Stack

Why each piece of this stack was chosen, and why that reasoning is different for a personal portfolio than it would be for a funded product.

## Principle

For a portfolio site, the stack *is* part of the pitch. Anyone technical enough to be evaluating this — a hiring manager, a fellow engineer — is going to read the code, not just look at the page. So every choice below is judged on two axes at once: is it defensible at this project's real scale, and does it demonstrate something worth demonstrating. Where those two pull in different directions, that's called out explicitly rather than papered over — see [Restraint as the actual signal](#restraint-as-the-actual-signal).

This is the same posture already stated for the docs site in [BRY-6](https://linear.app/brysonbenjamin/issue/BRY-6): *"a portfolio piece, not a maintenance-efficiency play... the point is to deliberately build the specialized version and have it read as intentional, not cargo-culted."* That framing applies to the whole system, not just the docs pipeline.

## At a glance

| Layer | Choice | Why (short) |
|---|---|---|
| Runtime / package manager | Bun | one tool for install, run, build, and workspaces; native TS execution |
| Frontend | Vite + React + TypeScript, client-routed SPA | static output, zero server, matches the site's actual interactivity needs |
| API framework | Hono on Bun | OpenAPI-first via `@hono/zod-openapi`, powers the generated docs pipeline |
| App database | Neon Postgres + Drizzle ORM | real relational data, serverless/scale-to-zero, schema-as-code |
| Edge data | Cloudflare D1 | colocated read-mostly cache for the public feed widget, not shared with app data |
| Frontend hosting | Cloudflare Pages | free global CDN, native Git deploy, Pages Functions for the feed reads |
| API hosting | Render | free web service, `render.yaml` Blueprint checked into the repo |
| CI/CD | GitHub Actions | free on this repo, keeps secrets scoped to where each job actually runs |

## Runtime and package manager: Bun

`.bun-version` pins `1.3.9`; the workspace root uses `"workspaces": ["apps/*", "packages/*"]`. One tool handles install, dev servers, builds, and running TypeScript scripts directly (`apps/api/src/jobs/syncLinearFeed.ts` runs as `bun src/jobs/syncLinearFeed.ts`, no `ts-node`/`tsx` needed). Against Node + npm/pnpm, that's a smaller toolchain for the same monorepo shape, at the cost of a less battle-tested ecosystem — a reasonable trade for a project with no legacy dependency constraints, and current enough to be worth putting in front of someone evaluating the code.

## Frontend: Vite + React SPA, not Next.js

`apps/web` is a client-routed SPA (`react-router-dom`), built by Vite to static `dist/`, deployed straight to Cloudflare Pages with no adapter. That's a deliberate contrast with the *docs* site, which explicitly runs Next.js/Fumadocs (`BRY-14`–`BRY-17`) for its MDX-heavy, SSG content. Using an SPA here and a static-generated content framework there — instead of forcing one framework to do both jobs — is itself a legible decision: the main site is an interactive shell (a feed panel, task detail routes) with no per-request personalization or SEO-critical dynamic rendering, so a build-time static bundle is the honest fit; the docs site is a content site, so a docs-oriented SSG framework is the honest fit.

UI dependencies are intentionally small: `lucide-react` for icons, `framer-motion` for motion — both tree-shakeable, neither a full component-kit dependency. Styling is hand-authored CSS (`apps/web/src/styles.css`, ~765 lines) rather than a utility framework like Tailwind; that keeps the dependency surface minimal for a single-page site, though it's worth flagging that this doc is inferring that rationale from the code rather than restating a documented decision — worth confirming if it should read differently.

## API: Hono on Bun, OpenAPI-first

`apps/api/src/app.ts` builds routes with `@hono/zod-openapi`'s `createRoute`, so every endpoint's request/response schema is defined once, in code, and both validates requests *and* generates `/openapi.json`. That single fact is load-bearing for the rest of the system: `openapi-sync.yml` generates that spec from the live route definitions and dispatches it to `docs-bryson-benjamin` on every relevant merge — there is no hand-maintained API reference to drift out of sync. Against Express (no built-in TS-first schema validation) or a hand-written Postman/Swagger doc, this is the difference between demonstrating an OpenAPI-driven API design pattern end-to-end versus just claiming familiarity with one.

## App database: Neon Postgres + Drizzle

`contact_messages` and `projects` (`packages/db/src/schema.ts`) are genuinely relational — uniqueness constraints, timestamps, room for foreign keys as the schema grows — so a real SQL database earns its place here, unlike the feed data below. Neon's serverless Postgres scales to zero, which matters for a project with near-zero baseline traffic and a free-tier budget. Drizzle is schema-as-code with migrations generated from schema diffs (`drizzle-kit generate`), and — unlike Prisma — has no separate query-engine binary, which fits a Bun-first toolchain more naturally.

Worth citing as the opposite instinct from over-engineering: [`docs/linear-sync.md`](./linear-sync.md#architecture-decision-d1-direct-no-postgres-detour) records that a Postgres-backed mirror for the Linear feed sync was explicitly scoped and then rejected as *"more infrastructure than a personal portfolio's issue volume justifies."* Restraint about *not* adding a database is as much a stack decision as choosing one.

## Edge data: Cloudflare D1 for the public feed

`public_feed_items` lives in its own D1 database (`brysonbenjamin-public`), read directly by Pages Functions colocated with the static site (`apps/web/functions/api/feed.ts`) — no network hop to Render or Neon for a widget that renders on every page load. This is a different access pattern than the contact form (write-once, low volume, needs real relational guarantees) and a different one than the feed (read-heavy, cache-friendly, tolerant of eventual consistency since it's synced once a day). Using one database engine for both would have been simpler to reason about; using the right engine per access pattern is the more defensible — and more demonstrable — choice.

## Hosting split: Cloudflare Pages + Render

Cloudflare Pages deploys `apps/web` via native Git integration (no GitHub Actions deploy step — see [`docs/architecture.md`](./architecture.md#cloudflare-pages--appsweb)), which is free, globally distributed, and gives Pages Functions for the feed reads at no extra infrastructure. `apps/api` runs on Render instead, with its deploy config as code in `render.yaml` rather than hand-configured in a dashboard.

Being direct about a gap here rather than inventing a tidy answer for it: `apps/api`'s Hono app and Neon's `@neondatabase/serverless` driver are both capable of running on Cloudflare Workers, so this split isn't forced by a technical limitation — Workers was a real option for the API too, the way [`BRY-17`](https://linear.app/brysonbenjamin/issue/BRY-17) considered it for the docs site. Whether keeping the API on Render was a deliberate choice (e.g. wanting a conventional long-lived process instead of stateless edge isolates) or simply how it was first stood up is worth confirming — that's the one item in this doc that's a question rather than a documented decision.

## CI/CD: GitHub Actions as the glue

Free on this repo, and — per the rationale already recorded in [`docs/migrations.md`](./migrations.md#why-github-actions-instead-of-a-render-pre-deploy-command) — keeps each job's secrets scoped to where the job actually executes rather than centralizing them in one platform's dashboard. Four workflows (`neon-migrate`, `d1-migrate`, `linear-feed-sync`, `openapi-sync`) plus a `ci.yml` gate demonstrate migration discipline and scheduled job orchestration, patterns that read as production engineering rather than a static resume page.

## Restraint as the actual signal

The stack has more moving parts than a personal site strictly needs — two databases, two hosting platforms, a cross-repo dispatch pipeline, four scheduled/triggered workflows. That's only a good signal if it's paired with visible restraint about where *not* to add more: no Postgres mirror for the feed sync, no incremental/watermark sync logic at this issue volume, D1 migrations deliberately left unreconciled with their pre-automation history rather than risking a corrupted bookkeeping table (see [`docs/migrations.md`](./migrations.md#cutover-from-ad-hoc-files)), no versioning on the docs site "until there's a real second version to document." The pitch isn't "this is complex" — it's "each piece of complexity maps to a real pattern worth knowing, and the rest was deliberately left out."

## Compared to the obvious alternatives

- **A site builder / CMS (Squarespace, WordPress):** faster to ship, but demonstrates content authoring, not engineering. Wrong audience for a technical portfolio.
- **One framework, one platform (e.g. all-in Next.js on Vercel):** simpler to operate and to explain, but a single deploy button is a smaller surface to talk through in an interview than a system with two databases, two hosts, and a real CI-driven cross-repo pipeline.
- **All-in Cloudflare (Workers for the API too, D1 for everything):** legitimately simpler and cheaper to run than the current split, and — per the open question above — may be the more consistent end state. Not adopting it yet is either a deliberate "right tool per workload" stance or unresolved technical debt; this doc doesn't resolve which.
- **Cost:** every piece in use today sits on a free tier — Cloudflare Pages and D1, Render's free web service, Neon's free tier, GitHub Actions' free minutes. Meaningful for a project with no revenue behind it.

## Open questions

- Was Render (vs. a Cloudflare Workers API) a deliberate choice, and if so, why? Right now this doc can only confirm it *isn't* a technical necessity.
- Is hand-rolled CSS over a utility framework a deliberate choice, or just how the site started?
