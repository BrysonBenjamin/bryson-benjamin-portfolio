import { describe, expect, it } from "vitest";
import { runSaSaDeterministicEvaluations, runSaSaLiveEvaluation } from "./evaluations";

describe("Sa-Sa deterministic evaluation gate", () => {
  it("passes every named MVP and threat-model fixture without network credentials", async () => {
    const results = await runSaSaDeterministicEvaluations();

    expect(results).toHaveLength(7);
    expect(results.filter((result) => !result.passed)).toEqual([]);
  });

  it("keeps live evaluation opt-in and credential-free by default", async () => {
    await expect(runSaSaLiveEvaluation({ SA_SA_LIVE_EVAL: "false" })).resolves.toMatchObject({ mode: "skipped", passed: true });
  });
});
