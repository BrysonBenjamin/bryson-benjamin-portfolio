# Sa-Sa agent gateway runbook

## Current operating mode

The deployed gateway supports a **deterministic grounded guide** (`SA_SA_AGENT_MODE=deterministic`) and a hard-off mode (`SA_SA_AGENT_MODE=disabled`). The deterministic guide calls only the approved in-process portfolio tools and streams typed SSE events. It is deliberately disclosed in the UI as a public-portfolio guide; it is not represented as a live language-model answer.

A real model provider is not configured in this repository because that requires a server-side provider credential and an explicit spend limit. The provider-neutral contract and gateway boundary are in place; adding a live adapter must preserve the policy below and add the live evaluation evidence before changing this mode’s user-facing disclosure.

## Production route

The browser always calls same-origin `/api/sa-sa/*`.

```text
Browser → Cloudflare Pages Function (/api/sa-sa/*) → Render Hono API → bounded tools
```

Set the Pages runtime secret `SA_SA_API_URL` to the Render API base URL (for example `https://api.brysonbenjamin.com`). The relay has a fixed path and forwards the original site origin; it cannot proxy a visitor-supplied URL. Render must allow the production Pages origins through `CORS_ORIGIN`.

Local Vite development continues to proxy `/api/*` to `VITE_API_URL`, normally `http://localhost:8787`.

## Endpoints

- `POST /api/sa-sa/session` creates a 24-hour opaque in-memory session.
- `POST /api/sa-sa/turn` accepts a versioned, bounded turn request and streams `sa-sa` SSE events.
- `DELETE /api/sa-sa/session/:sessionId` clears the local session record.

The web app stores only the opaque session id and completed transcript in `sessionStorage`; Clear removes both. The current server store is process-local, so a restart produces an honest retryable session error rather than restoring private data.

## Safety envelope

- Non-empty `Origin` headers must match `CORS_ORIGIN`; there are no browser-held provider credentials.
- Request body, message, context, tool-call count, action IDs, and source URLs are bounded and validated by `@bryson-benjamin/sa-sa-contracts`.
- The guide has no HTTP, DOM, filesystem, database, code-execution, external-message, or arbitrary URL tool.
- Private-data and prompt-injection-shaped requests fail closed with an explicit policy message.
- Tool facts come only from `@bryson-benjamin/portfolio-content`; public feed lookup is intentionally unavailable until it can use the same public-only source.
- No conversation content is logged by the gateway.

## Verification

Run the deterministic checks without provider credentials:

```bash
# Node 20+
npm run test --workspace @bryson-benjamin/api
npm run test --workspace @bryson-benjamin/web
```

Then run the local API and web app, open Sa-Sa, ask “What are you building?”, confirm source links, then ask “Open the second one.” The latter must produce the registered `scroll-to-section` action with a bounded `sectionId` input, not a route, selector, or URL supplied by the guide. Confirm that the action result is visible in the conversation; stale, denied, failed, and timed-out actions must leave Sa-Sa recoverable.
