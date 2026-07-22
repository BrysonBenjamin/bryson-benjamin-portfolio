import { describe, expect, it } from "vitest";
import { pixelAssetRenderer, type SaSaRendererAdapter } from "./renderer";

describe("Sa-Sa renderer adapter", () => {
  it("resolves semantic behavior and falls back to stable idle on asset failure", () => {
    expect(pixelAssetRenderer.resolve({ behavior: "thinking", failed: false }).behavior).toBe("thinking");
    expect(pixelAssetRenderer.resolve({ behavior: "thinking", failed: true }).behavior).toBe("idle");
  });

  it("allows a mock renderer without changing the behavior contract", () => {
    const mock: SaSaRendererAdapter<string> = {
      resolve: ({ behavior, failed }) => `${failed ? "fallback" : "render"}:${behavior}`,
      fallback: () => "fallback:idle"
    };

    expect(mock.resolve({ behavior: "success", failed: false })).toBe("render:success");
    expect(mock.fallback()).toBe("fallback:idle");
  });
});
