import { describe, expect, it, vi } from "vitest";
import { createSaSaPageActionRegistry, isEmptySaSaPageActionInput } from "./pageActions";

const scrollAction = "scroll-to-section";
const activeActions = [scrollAction];

function isSectionInput(input: Record<string, string>) {
  return Object.keys(input).length === 1 && (input.sectionId === "work" || input.sectionId === "about");
}

describe("Sa-Sa page action registry", () => {
  it("runs a registered action with page-owned semantic input", async () => {
    const registry = createSaSaPageActionRegistry();
    const handler = vi.fn();
    registry.register(scrollAction, handler, isSectionInput);

    await expect(registry.run(scrollAction, { sectionId: "work" }, activeActions)).resolves.toMatchObject({
      outcome: "completed"
    });
    expect(handler).toHaveBeenCalledWith({ sectionId: "work" }, expect.any(AbortSignal));
  });

  it("returns unavailable results for fabricated or unmounted actions", async () => {
    const registry = createSaSaPageActionRegistry();
    const cleanup = registry.register(scrollAction, vi.fn(), isSectionInput);

    await expect(registry.run("open-arbitrary-url", {}, activeActions)).resolves.toMatchObject({ outcome: "unavailable" });
    cleanup();
    await expect(registry.run(scrollAction, { sectionId: "work" }, activeActions)).resolves.toMatchObject({
      outcome: "unavailable"
    });
  });

  it("denies selectors, assets, and extra fields before the handler can run", async () => {
    const registry = createSaSaPageActionRegistry();
    const handler = vi.fn();
    registry.register(scrollAction, handler, isSectionInput);

    await expect(registry.run(scrollAction, { selector: "#work" }, activeActions)).resolves.toMatchObject({ outcome: "denied" });
    await expect(
      registry.run(scrollAction, { sectionId: "work", assetId: "sa-sa-spin" }, activeActions)
    ).resolves.toMatchObject({ outcome: "denied" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns typed failure and timeout results without throwing", async () => {
    const registry = createSaSaPageActionRegistry({ timeoutMs: 1 });
    registry.register(scrollAction, () => {
      throw new Error("section missing");
    }, isSectionInput);

    await expect(registry.run(scrollAction, { sectionId: "work" }, activeActions)).resolves.toMatchObject({ outcome: "failed" });

    const pending = new Promise<void>(() => undefined);
    registry.register(scrollAction, () => pending, isSectionInput);
    await expect(registry.run(scrollAction, { sectionId: "work" }, activeActions)).resolves.toMatchObject({ outcome: "timed-out" });
  });

  it("keeps no-argument actions closed to model-supplied fields", async () => {
    const registry = createSaSaPageActionRegistry();
    registry.register("return-to-log", vi.fn(), isEmptySaSaPageActionInput);

    await expect(registry.run("return-to-log", {}, ["return-to-log"])).resolves.toMatchObject({ outcome: "completed" });
    await expect(registry.run("return-to-log", { url: "/admin" }, ["return-to-log"])).resolves.toMatchObject({
      outcome: "denied"
    });
  });
});
