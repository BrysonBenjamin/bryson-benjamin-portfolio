# Docs Sync

How this repo's `docs/*.md` files become guide pages on docs.brysonbenjamin.com.

## Principle

Same one-way-pipeline shape as [`docs/architecture.md`](./architecture.md#apps-api--docs-bryson-benjamin-openapi-dispatch)'s OpenAPI sync: this repo stays the source of truth and authoring surface, `docs-bryson-benjamin` stays a generated/received copy, and nothing round-trips back. There is no gate on *which* docs forward — everything directly in `docs/` is treated as fit for public reading, matching this repo's existing practice of writing these docs without secrets or internal-only detail in the first place.

## Source shape vs. destination shape

This repo's `docs/*.md` files are plain Markdown: an `# H1` title, then prose. `docs-bryson-benjamin`'s Fumadocs setup needs `.mdx` files under `content/docs/guides/` with `title`/`description` frontmatter and no duplicate H1 in the body (the page chrome renders the title from frontmatter). Rather than hand-maintain two formats, `scripts/prepareDocsSync.ts` converts one into the other on every sync:

- The `# H1` line becomes frontmatter `title`, and is removed from the body.
- The first sentence of the first paragraph becomes frontmatter `description`, with inline markdown (links, code spans, bold/italic) stripped to plain text — frontmatter is YAML, not compiled MDX, so it can't render markdown syntax.
- Relative links to sibling docs (`./stack.md`, optionally with a `#fragment`) are rewritten to `/docs/guides/stack` — same-repo relative paths only make sense before the forward; after it, siblings are separate pages under a fixed base path.

Run it locally with `bun run docs:prepare-sync`; it writes `docs-sync-payload.json` at the repo root (gitignored — it's a build artifact of the sync, not something to commit).

## Pipeline

`.github/workflows/docs-sync.yml` runs on push to `main` when `docs/**` changes, plus manual `workflow_dispatch`:

1. Runs `scripts/prepareDocsSync.ts` to produce `docs-sync-payload.json`.
2. Wraps it with the triggering commit's SHA and fires a `repository_dispatch` (`event_type: guides-sync`) at `docs-bryson-benjamin`, reusing the same `DOCS_REPO_DISPATCH_TOKEN` secret the OpenAPI sync already uses — same target repo, same permission needs, no reason for a second token.

`docs-bryson-benjamin/.github/workflows/receive-guides.yml` listens for that dispatch, writes each file under `content/docs/guides/`, and commits straight to `main` if anything changed — no PR gate, matching every other automated pipeline in this system (migrations, the Linear feed sync, the OpenAPI sync). Cloudflare Pages' native Git integration then rebuilds and deploys the docs site from that commit like any other push.

## Mermaid diagrams

`docs-bryson-benjamin` doesn't render Mermaid out of the box — Fumadocs recommends wiring it up yourself rather than shipping a built-in wrapper. Three pieces make it work there:

- `remarkMdxMermaid` from `fumadocs-core/mdx-plugins` (already available, no extra package) is registered in `source.config.ts`'s `mdxOptions.remarkPlugins`, converting ` ```mermaid ` fences into `<Mermaid chart="...">` calls at MDX-compile time.
- `mermaid` and `next-themes` are installed as real dependencies — `lib/mermaid.tsx` is a client component that dynamically imports `mermaid` and calls `mermaid.render()` in the browser, theming it off `next-themes`' `resolvedTheme` (already available app-wide via `RootProvider`).
- `Mermaid` is registered in the MDX components map passed to `<MDXContent>` in `app/docs/[[...slug]]/page.tsx`, alongside `OpenAPIPage`.

Rendering is client-side only: `next build`'s static export prerenders the raw chart text in a `<pre>` fallback (mermaid.js needs a real browser, there's no server-side rendering path for it here), and the actual SVG replaces that fallback after hydration. Verified with a real headless-browser check against the static output, not just a successful build — the SVG renders and the fallback disappears once the page loads.

## Known gaps

- **No pruning.** Renaming or deleting a `docs/*.md` file doesn't remove its old counterpart from `content/docs/guides/` — the receiving workflow only ever writes, it never diffs against what should no longer exist. Fine at four files; worth revisiting if churn picks up.
- **`content/docs/guides/meta.json` isn't managed by this pipeline.** Fumadocs' default page ordering applies; if a specific guide order is ever wanted, that file needs a manually-maintained `pages` array.
