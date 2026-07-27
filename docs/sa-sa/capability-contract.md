# Sa-Sa capability contract

The shared `@bryson-benjamin/sa-sa-contracts` package defines versioned, provider-free schemas for turn requests, page context, public source references, tool calls/results, page-action proposals/results, behavior cues, and stream failures.

| Capability | Executor | Risk | Boundary |
| --- | --- | --- | --- |
| Public knowledge tool | Render Hono API | Read public facts | [knowledge.ts](../../apps/api/src/sa-sa/knowledge.ts) accepts only allowlisted tool IDs and public content. |
| Page action | Active web scene | Reversible local navigation | [page-author guide](./page-author-guide.md) requires a page-owned semantic input validator. |
| Body cue | Sa-Sa runtime | Bounded presentation | The gateway validates the cue enum; the runtime chooses the visual clip. |

The model adapter may propose only these semantic values. The gateway validates every proposal before executing a server tool or emitting a browser event; it has no DOM, URL-fetch, filesystem, database, code-execution, messaging, or account-changing capability. The browser repeats the final page-action validation at its registry boundary.

The deterministic fixtures in [evaluation.md](./evaluation.md) cover the public MVP journey, unavailable actions, provider malformed output, and policy refusals. The safety and budget envelope is defined in [guardrails.md](./guardrails.md).
