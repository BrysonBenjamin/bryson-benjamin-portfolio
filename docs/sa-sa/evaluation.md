# Sa-Sa evaluation gate

`bun run --cwd apps/api eval:sa-sa` runs the no-network release gate used by CI. Its fixtures contain only approved public-portfolio facts and classify failures as `knowledge`, `action`, `policy`, `stream`, or `provider`.

The gate covers the sourced MVP answer, the follow-up page action, unavailable action handling, prompt-injection and private-data refusal, malformed provider output, and monotonic streaming before completion. Browser action and lifecycle coverage remains beside the web feature tests.

Live-provider evaluation is deliberately opt-in. Set `SA_SA_AGENT_MODE=openai`, `OPENAI_API_KEY`, `SA_SA_OPENAI_MODEL`, `SA_SA_DAILY_SPEND_LIMIT_USD`, `SA_SA_RESERVED_TURN_COST_USD`, and `SA_SA_LIVE_EVAL=true` on Render only after reviewing the current budget, then run `bun run --cwd apps/api eval:sa-sa:live`. The command emits a JSON record with the model, prompt revision, and capability-contract version. The gateway reserves the configured maximum turn cost before each provider call, so it cannot exceed the configured daily allowance.
